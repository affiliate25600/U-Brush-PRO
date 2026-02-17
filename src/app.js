import express from "express";
import admin from "firebase-admin";
import dotenv from "dotenv";
import stripe from "stripe";
import { isValidContactInputs, isValidOrderInputs } from "./order-validation.js";
import { notificationEmail, orderEmail, contactEmail } from "./emails.js";

dotenv.config();

// Initialize Firebase Admin SDK securely from env vars
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();
const app = express();

const stripeConfig = stripe(process.env.STRIPE_SECRET_KEY);

const allOrdersSnap = await db.ref("orders").get();
let allOrders = [];
if (allOrdersSnap.exists()) {
    allOrders = Object.keys(allOrdersSnap.val());
}

console.log(`All Orders: ${allOrders.join(", ")}`);

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));

async function addOrderFb(orderData) {
    function generateTrackingId({
        prefix = '',
        length = 16
    } = {}) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const bytes = crypto.getRandomValues(new Uint8Array(length));
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars[bytes[i] % chars.length];
        }

        return prefix + result;
    }

    const orderId = generateTrackingId();
    const stockSnap = await db.ref("stock").get();

    orderData.orderStatus = 0;
    orderData.orderArrival = "-";

    db.ref(`orders/${orderId}`).set(orderData);

    allOrders.push(orderId);

    await db.ref("stock").set(stockSnap.val() - orderData.orderQuantity);

    orderData.orderId = orderId;

    orderEmail(orderData);

    notificationEmail(orderData);

    return orderId;
}

async function eventAlreadyProcessed(eventId) {
    const snap = await db.ref(`stripe_events/${eventId}`).get();
    return snap.exists();
}

async function markEventProcessed(eventId) {
    await db.ref(`stripe_events/${eventId}`).set(true);
}

// FOR SANDBOX: stripe listen --forward-to http://localhost:3000/webhook
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];

        let event;

        try {
            event = stripeConfig.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // ✅ ACKNOWLEDGE STRIPE IMMEDIATELY
        res.json({ received: true });

        // ✅ Idempotency guard
        if (await eventAlreadyProcessed(event.id)) {
            console.log("🔁 Duplicate event ignored:", event.id);
            return;
        }

        await markEventProcessed(event.id);

        // ✅ Handle event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            const orderId = await addOrderFb(session.metadata);

            await db.ref(`/stripe-sessions/${session.id}`).set({
                paid: true,
                orderId: orderId,
            });

            console.log("✅ Payment confirmed:", session.id);
        }
    }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/U-Brush-PRO", async (req, res) => {

    const stockLevel = await db.ref(`stock`).get();

    res.render("buy", {
        stock: stockLevel.val()
    });
});

app.get("/success", (req, res) => {
    res.render("success", {
        sessionId: req.query.session_id,
    });
});

app.get("/payment-status", async (req, res) => {
    const { session_id } = req.query;

    const dataSnap = await db.ref(`/stripe-sessions/${session_id}`).get();

    if (!dataSnap.exists()) {
        return res.json({ paid: false });
    }

    const data = dataSnap.val();

    res.json({
        paid: data.paid,
        orderId: data.orderId
    });
});

app.post("/buy-u-brush-pro", async (req, res) => {
    const orderData = req.body;

    const stockLevel = await db.ref("stock").get();

    const orderValidation = isValidOrderInputs(orderData, stockLevel.val());

    if (!orderValidation[0]) {
        res.send(orderValidation);
    } else {
        const session = await stripeConfig.checkout.sessions.create({
            customer_email: orderData.email,
            line_items: [
                {
                    price_data: {
                        currency: "aud",
                        product_data: {
                            name: "U Brush PRO"
                        },
                        unit_amount: Math.floor(((50 * orderData.quantity) * 1.017 + 0.30) * 100)
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/U-Brush-PRO`,
            metadata: {
                orderQuantity: orderData.quantity,
                orderName: orderData.name,
                orderEmail: orderData.email,
                orderCountry: orderData.country,
                orderAddress: orderData.address,
                orderPostcode: orderData.postcode,
                orderCity: orderData.city,
                orderState: orderData.state
            }
        });

        res.send([true, session.url]);
    }
});

app.get("/track", async (req,res) => {
    res.render("order-search", {
        errorMsg: ``
    });
});

app.get("/track/:id", async (req, res) => {
    const orderId = req.params.id;

    if (allOrders.indexOf(orderId) === -1) {
        res.render("order-search", {
            errorMsg: `
                <div class="error-msg">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--text)"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm330.5-51.5Q520-263 520-280t-11.5-28.5Q497-320 480-320t-28.5 11.5Q440-297 440-280t11.5 28.5Q463-240 480-240t28.5-11.5ZM440-360h80v-200h-80v200Zm40-100Z"/></svg>
                    <b>We couldn't find that order</b>
                    <p>Order <b>'${orderId}'</b> might be incorrect or not in our system yet.</p>
                </div>
            `
        });
    }

    const orderSnap = await db.ref(`orders/${orderId}`).get();
    const orderData = orderSnap.val();

    res.render("track", {
        orderId: orderId,
        orderStatus: orderData.orderStatus,
        orderArrival: orderData.orderArrival,
        orderQuantity: orderData.orderQuantity,
        orderState: orderData.orderState,
        orderCity: orderData.orderCity
    });
});

app.get("/contact", (req, res) => {
    res.render("contact", {
        serverMsg: ``
    });
});

app.post("/contact", (req, res) => {
    const messageData = req.body;

    const validInputResult = isValidContactInputs(messageData);

    if (!validInputResult[0]) {
        res.render("contact", {
            serverMsg: `<p class="server-msg error">${validInputResult[1]}</p>`
        });
    } else {
        contactEmail(messageData);
    
        res.render("contact", {
            serverMsg: `<p class="server-msg">Email Sent!</p>`
        });
    }
});

app.get("/admin", (req, res) => {
    res.render("admin", {
        allOrders: JSON.stringify(allOrders)
    });
});

app.use((req, res, next) => {
  res.status(404).send("Sorry, the requested page cannot be found!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));