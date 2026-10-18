import { app } from "./firebaseconfig.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const auth = getAuth(app);

const loginButton = document.getElementById("loginBtn");

loginButton.addEventListener("click", login);

async function login() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    try {

        await signInWithEmailAndPassword(auth, email, password);

        // Clear previous user's session data
        localStorage.clear();

        alert("Login Successful!");

        window.location.href = "menu.html";

    } catch (error) {

        console.error(error);
        alert(error.message);

    }

}