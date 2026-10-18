import { db } from "./firebaseconfig.js";

import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Get vehicle number stored during checkout
const plate = localStorage.getItem("userLicensePlate");

console.log("Customer Plate:", plate);

if (!plate) {
    alert("Vehicle number not found.");
    throw new Error("No vehicle number found.");
}

// Listen for this customer's latest order
const q = query(
    collection(db, "orders"),
    where("vehicleNumber", "==", plate)
);

onSnapshot(q, (snapshot) => {

    console.log("Snapshot Size:", snapshot.size);

    if (snapshot.empty) {
        console.log("No order found.");
        return;
    }

    snapshot.forEach((document) => {

        const order = document.data();

        console.log("Realtime Order:", order);

        updateTrackingUI(order);

    });

}, (error) => {

    console.error("Firestore Error:", error);

});

function updateTrackingUI(order) {

    document.getElementById("display-plate").innerText = order.vehicleNumber;
    document.getElementById("display-id").innerText = "#" + order.vehicleNumber;

    const progressBar = document.getElementById("progressBar");

    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");
    const step4 = document.getElementById("step4");
    const step5 = document.getElementById("step5");

    const statusTitle = document.getElementById("statusTitle");
    const statusSubtitle = document.getElementById("statusSubtitle");

    const lockerBox = document.getElementById("lockerBox");
    const lockerText = document.getElementById("lockerText");

    // Reset
    progressBar.style.width = "0%";

    step2.className = "timeline-step";
    step3.className = "timeline-step";
    step4.className = "timeline-step";
    step5.className = "timeline-step";

    document.getElementById("step2Icon").innerText = "2";
    document.getElementById("step3Icon").innerText = "3";
    document.getElementById("step4Icon").innerText = "4";
    document.getElementById("step5Icon").innerText = "5";

    lockerBox.style.display = "none";

    switch (order.status) {

        case "Pending":

            progressBar.style.width = "0%";

            statusTitle.innerText = "📝 Order Received";
            statusSubtitle.innerText =
                "Your order has been placed successfully and is waiting for the kitchen.";

            break;

        case "Preparing":

            progressBar.style.width = "25%";

            step2.className = "timeline-step active";

            statusTitle.innerText = "👨‍🍳 Preparing Your Food";
            statusSubtitle.innerText =
                "Our chefs are preparing your order.";

            break;

        case "Ready":

            progressBar.style.width = "50%";

            step2.className = "timeline-step completed";
            step3.className = "timeline-step active";

            document.getElementById("step2Icon").innerText = "✔";

            statusTitle.innerText = "🍔 Order Ready";
            statusSubtitle.innerText =
                "Your food is ready. Please drive to the pickup lane.";

            lockerBox.style.display = "block";
            lockerText.innerText =
                "Pickup Locker : " + (order.locker || "Locker 1");

            break;

        case "Arrived":

            progressBar.style.width = "75%";

            step2.className = "timeline-step completed";
            step3.className = "timeline-step completed";
            step4.className = "timeline-step active";

            document.getElementById("step2Icon").innerText = "✔";
            document.getElementById("step3Icon").innerText = "✔";

            statusTitle.innerText = "🚗 Vehicle Detected";
            statusSubtitle.innerText =
                "Welcome! Your vehicle has been detected.";

            lockerBox.style.display = "block";
            lockerText.innerText =
                "Locker " + (order.locker || "1") + " Opening...";

            break;

        case "Collected":

            progressBar.style.width = "100%";

            step2.className = "timeline-step completed";
            step3.className = "timeline-step completed";
            step4.className = "timeline-step completed";
            step5.className = "timeline-step active";

            document.getElementById("step2Icon").innerText = "✔";
            document.getElementById("step3Icon").innerText = "✔";
            document.getElementById("step4Icon").innerText = "✔";

            statusTitle.innerText = "✅ Order Collected";
            statusSubtitle.innerText =
                "Thank you for using Smart Drive-Thru.";

            break;

        default:

            statusTitle.innerText = order.status;
            statusSubtitle.innerText = "";

    }

}