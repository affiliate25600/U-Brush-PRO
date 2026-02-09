import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { getInvoicePdf, deleteInvoice } from "./invoices.js";

dotenv.config();

export async function notificationEmail(orderData) {
    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "affiliate25600@gmail.com",
            pass: process.env.GOOGLE_APP_PASSWORD,
        },
    });

    let mailOptions = {
        from: "U Brush PRO",
        to: "noahgallaghersummers@icloud.com",
        subject: `New Order from ${orderData.orderName}`,
        html: `
            <h1>Order:</h1>
            <p>U Brush PRO x ${orderData.orderQuantity}</p>
        `
    };

    transport.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log("Notification email sent");
        }
    });
};

export async function orderEmail(orderData) {
    getInvoicePdf(orderData);

    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "affiliate25600@gmail.com",
            pass: process.env.GOOGLE_APP_PASSWORD,
        },
    });

    let mailOptions = {
        from: "U Brush PRO",
        to: orderData.orderEmail,
        subject: `Thank you for your order!`,
        html: `
            <p>Hello <b>${orderData.orderName}</b>,</p>
            <p>Thank you for your order of:</p>
            <p><b>${orderData.orderQuantity} x U Brush PRO</b></p>
            <p>To track your order (${orderData.orderId}) click <a href="http://localhost:3000/track/${orderData.orderId}">here</a>.</p>
            <p>Please find attached your order invoice.</p>
            <p>Best,</p>
            <p><b>U Brush PRO</b></p>
        `,
        attachments: [
            {
                filename: "invoice.pdf",
                path: `invoices/invoice-${orderData.orderId}.pdf`,
            }
        ]
    };

    console.log("Sending order email...")

    transport.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log("Order email sent");

            deleteInvoice(orderData.orderId);
        }
    });
};

//orderEmail({ orderName: "Noah Gallagher-Summers", orderEmail: "noahgallaghersummers@icloud.com", orderQuantity: "3", id: "256" });