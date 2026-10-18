import { db } from "./firebaseconfig.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("Checkout JS Loaded");

const vehicleInput = document.getElementById("vehicleNumber");
const arrivalInput = document.getElementById("arrivalTime");

const subtotalDisplay = document.getElementById("subtotal-display");
const grandTotal = document.getElementById("grand-total");

const placeOrderBtn = document.getElementById("placeOrderBtn");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let subtotal = 0;

cart.forEach(item=>{

    subtotal += Number(item.price) * Number(item.quantity || 1);

});

let addonsTotal = 0;

const addonCheckboxes =
document.querySelectorAll(".premium-addon");

function updateGrandTotal(){

    addonsTotal = 0;

    addonCheckboxes.forEach(box=>{

        if(box.checked){

            addonsTotal += Number(box.dataset.price);

        }

    });

    subtotalDisplay.innerText =
        "₹"+subtotal.toFixed(2);

    grandTotal.innerText =
        "₹"+(subtotal+addonsTotal).toFixed(2);

}

addonCheckboxes.forEach(box=>{

    box.addEventListener("change",updateGrandTotal);

});

updateGrandTotal();



placeOrderBtn.addEventListener("click", async () => {

    const vehicleNumber = vehicleInput.value.trim().toUpperCase();
    const arrivalTime = arrivalInput.value;

if (!arrivalTime) {

    alert("Select arrival time");

    return;

}

let maxCookTime = 0;

cart.forEach(item => {

    if (item.cookTime && Number(item.cookTime) > maxCookTime) {

        maxCookTime = Number(item.cookTime);

    }

});

// Convert HH:MM to minutes
const [hours, minutes] = arrivalTime.split(":").map(Number);

const arrivalMinutes = (hours * 60) + minutes;

let recommendedStart = arrivalMinutes - maxCookTime;

if (recommendedStart < 0) {

    recommendedStart = 0;

}
    

    const selectedAddons = [];

addonCheckboxes.forEach(box => {

    if (box.checked) {

        selectedAddons.push({
            name: box.parentElement.innerText.trim(),
            price: Number(box.dataset.price)
        });

    }

});

    const order = {

    vehicleNumber,

    items: cart,

    total: subtotal + addonsTotal,

    addons: selectedAddons,

    arrivalTime,

    maxCookTime,

    recommendedStart,

    status: "Pending",

    locker: null,

    createdAt: new Date().toISOString()

};

    console.log(order);

    try{

        const docRef=await addDoc(
            collection(db,"orders"),
            order
        );
        console.log("Order Saved");

        console.log("Order Saved:",docRef.id);

        localStorage.setItem(
            "userLicensePlate",
            vehicleNumber
        );

        localStorage.setItem(
            "currentOrderId",
            docRef.id
        );

        // Empty the cart completely
// Clear cart after successful order
cart = [];

localStorage.removeItem("cart");
localStorage.removeItem("cartItems");

console.log("Cart Cleared");

alert("Order Placed Successfully");

window.location.href = "track.html";

    }

    catch(err){

        console.error(err);

        alert(err.message);

    }

});