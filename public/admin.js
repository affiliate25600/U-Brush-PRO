// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getDatabase, ref, child, get, set, update, remove, query, orderByChild, orderByKey, limitToFirst, equalTo } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js"

const firebaseConfig = {
    apiKey: "AIzaSyBce8ugTm65YnYHX5nqZT0cfh_dM-lPRG4",
    authDomain: "u-brush-pro.firebaseapp.com",
    databaseURL: "https://u-brush-pro-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "u-brush-pro",
    storageBucket: "u-brush-pro.firebasestorage.app",
    messagingSenderId: "569265210873",
    appId: "1:569265210873:web:70dba0220cef59c0bca928"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();

const formContainerEl = document.getElementById("login-form-container");
const formEl = document.getElementById("login-form");
const errorMsgEl = document.getElementById("error-msg");
const emailEl = document.getElementById("login-email");
const passwordEl = document.getElementById("login-password");

const adminContainerEl = document.getElementById("admin-container");
const ordersEl = document.getElementById("orders");
const orderViewEl = document.getElementById("order-view");
const orderViewBgEl = document.getElementById("order-view-backdrop");

let allOrderIds = window.allOrderIds;
let allOrders = {};

formEl.addEventListener("submit", (event) => {
    event.preventDefault();

    signInWithEmailAndPassword(auth, emailEl.value, passwordEl.value)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;

            formContainerEl.classList.add("hidden");
        })
        .catch((error) => {
            // Error signing in
            const errorCode = error.code;
            const errorMessage = error.message;

            if (errorCode == "auth/invalid-credential") {
                errorMsgEl.innerText = "Invalid Email or Password";
            } else {
                errorMsgEl.innerText = "Error Logging In";
            }

            errorMsgEl.style.display = "inline-block";
        });
});

function logOut() {
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log("User signed out successfully.");
    }).catch((error) => {
        // An error happened.
        console.error("Error signing out:", error);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        formContainerEl.classList.remove("show");
        adminContainerEl.classList.add("show");

        document.title = "Orders | U Brush PRO";

        getAllOrders();
    } else {
        emailEl.value = "";
        passwordEl.value = "";

        adminContainerEl.classList.remove("show");
        formContainerEl.classList.add("show");

        document.title = "Admin Login | U Brush PRO";
    }
});

async function getAllOrders() {
    for (let i = 0; i < allOrderIds.length; i += 1) {
        const orderId = allOrderIds[i];

        const orderDataSnap = await get(ref(db, `/orders/${orderId}`));
        const orderDataVal = orderDataSnap.val();
        allOrders[orderId] = orderDataVal;

        const orderEl = document.createElement("div");
        orderEl.classList.add("order");

        orderEl.innerHTML = `
            <p>${orderId}</p>
            <p>${orderDataVal.orderName}</p>
            <p>${orderDataVal.orderQuantity}</p>
            <p>${orderDataVal.orderCity}, ${orderDataVal.orderState}</p>
        `;

        orderEl.addEventListener("click", (event) => {
            const orderStatus = orderDataVal.orderStatus

            adminContainerEl.classList.add("view-active");

            orderViewEl.innerHTML = `
                <h2>${orderId}</h2>
                <span>Status: ${orderStatus == 0 ? "Order Created" : orderStatus == 1 ? "It's on its way" : orderStatus == 2 ? "It's coming today" : orderStatus == 3 ? "Delivered" : "Unknown"}</span>
                <h3>Name</h3>
                <p>${orderDataVal.orderName}</p>
                <h3>Email</h3>
                <p>${orderDataVal.orderEmail}</p>
                <h3>Full Address</h3>
                <p>${orderDataVal.orderAddress}, ${orderDataVal.orderCity}, ${orderDataVal.orderState}, ${orderDataVal.orderCountry}</p>
                <h3>Order</h3>
                <p>${orderDataVal.orderQuantity} x U Brush PRO</p>
            `;
        });

        ordersEl.append(orderEl);
    }
}

orderViewBgEl.addEventListener("click", (event) => {
    adminContainerEl.classList.remove("view-active");
});

window.logOut = logOut;