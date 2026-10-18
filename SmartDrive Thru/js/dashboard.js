import { db } from "./firebaseconfig.js";

import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

console.log("Dashboard Loaded");

const container = document.getElementById("dashboardOrdersContainer");

onSnapshot(collection(db, "orders"), (snapshot) => {

    container.innerHTML = "";

    // Statistics
    let pending = 0;
    let preparing = 0;
    let ready = 0;
    let completed = 0;

    if (snapshot.empty) {

        container.innerHTML =
            "<h2 style='color:white;text-align:center;'>No Orders Yet</h2>";

        document.getElementById("pendingCount").innerText = 0;
        document.getElementById("preparingCount").innerText = 0;
        document.getElementById("readyCount").innerText = 0;
        document.getElementById("completedCount").innerText = 0;

        return;
    }

    snapshot.forEach((document) => {

        const order = document.data();
        const orderId = document.id;

        // Count statistics
        switch (order.status) {

            case "Pending":
                pending++;
                break;

            case "Preparing":
                preparing++;
                break;

            case "Ready":
                ready++;
                break;

            case "Collected":
                completed++;
                break;
        }

        let actionButton = "";

        if (order.status === "Pending") {

            actionButton = `
                <button class="action-btn"
                    onclick="updateStatus('${orderId}','Preparing')">
                    Start Preparing
                </button>
            `;

        }

        else if (order.status === "Preparing") {

            actionButton = `
                <button class="action-btn"
                    onclick="updateStatus('${orderId}','Ready')">
                    Mark Ready
                </button>
            `;

        }

        else if (order.status === "Ready") {

            actionButton = `
                <div style="color:#FFD700;font-weight:bold;text-align:center;">
                    🚗 Waiting for Vehicle...
                </div>
            `;

        }

        else if (order.status === "Arrived") {

            actionButton = `
                <div style="color:#00ff66;font-weight:bold;text-align:center;">
                    🔓 Locker Opening...
                    <br>
                    Waiting for Servo...
                </div>
            `;

        }

        else {

            actionButton = `
                <div style="color:lime;font-weight:bold;text-align:center;">
                    ✅ Order Completed
                </div>
            `;

        }

        let itemsHTML = "";

        if (Array.isArray(order.items)) {

            order.items.forEach(item => {

                itemsHTML += `
                    <li>${item.name} - ₹${item.price}</li>
                `;

            });

        }

        container.innerHTML += `

        <div class="order-card">

            <h2>🚗 ${order.vehicleNumber}</h2>

            <p><strong>Status:</strong> ${order.status}</p>

            <p><strong>Arrival:</strong> ${order.arrivalTime}</p>

            <p><strong>Recommended Start:</strong>
            ${order.recommendedStart} min</p>

            <p><strong>Locker:</strong>
            ${order.locker || "Locker 1"}</p>

            <ul>
                ${itemsHTML}
            </ul>

            <h3>Total ₹${order.total}</h3>

            ${actionButton}

<button
class="action-btn"
style="
margin-top:10px;
background:#d32f2f;
"
onclick="deleteOrder('${orderId}')">

🗑 Remove Order

</button>

        </div>

        `;

    });

    // Update statistics
    document.getElementById("pendingCount").innerText = pending;
    document.getElementById("preparingCount").innerText = preparing;
    document.getElementById("readyCount").innerText = ready;
    document.getElementById("completedCount").innerText = completed;

});

window.updateStatus = async function(orderId, newStatus) {

    try {

        let updateData = {
            status: newStatus
        };

        if (newStatus === "Ready") {
            updateData.locker = "Locker 1";
        }

        await updateDoc(
            doc(db, "orders", orderId),
            updateData
        );

        console.log("Updated to", newStatus);

    }

    catch (err) {

        console.error(err);

    }

};
window.deleteOrder = async function(orderId){

    const confirmDelete = confirm(
        "Delete this order?"
    );

    if(!confirmDelete) return;

    try{

        await deleteDoc(
            doc(db,"orders",orderId)
        );

        console.log("Order deleted");

    }

    catch(err){

        console.error(err);

    }

}