import { db } from "./firebaseconfig.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const menu = [];
const menuContainer = document.getElementById("menuContainer");

// Always start by reading the current cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

document.getElementById("cartCount").innerText = cart.length;

async function loadMenu() {

    menu.length = 0;

    const querySnapshot = await getDocs(collection(db, "menu"));

    querySnapshot.forEach((doc) => {

        menu.push({
            id: doc.id,
            ...doc.data()
        });

    });

    displayMenu();
}

function displayMenu() {

    menuContainer.innerHTML = "";

    menu.forEach(item => {

        menuContainer.innerHTML += `

        <div class="menu-item">

            <img
                src="${item.image}"
                class="menu-image"
                alt="${item.name}"
            >

            <div class="menu-details">

                <h3 class="menu-name">
                    ${item.name}
                </h3>

                <p>
                    ${item.description}
                </p>

                <h4 class="menu-price">
                    ₹${item.price}
                </h4>

                <button
                    class="add-to-cart-btn"
                    onclick="addToCart('${item.id}')">

                    Add to Cart

                </button>

            </div>

        </div>

        `;

    });

}

window.addToCart = function(id){

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const item = menu.find(food => food.id === id);

    const existing = cart.find(x => x.id === id);

    if(existing){

        existing.quantity++;

    }else{

        item.quantity = 1;

        cart.push(item);

    }

    localStorage.setItem("cart",JSON.stringify(cart));

    document.getElementById("cartCount").innerText = cart.length;

    alert(item.name + " added to cart");

};

document.getElementById("cartBtn").addEventListener("click", () => {

    window.location.href = "cart.html";

});

loadMenu();