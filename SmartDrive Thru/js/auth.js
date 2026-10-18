import { app, db } from "./firebaseconfig.js";

import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const auth = getAuth(app);

const signupButton = document.getElementById("signupBtn");

signupButton.addEventListener("click", signup);

async function signup() {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;

    // Simple validation
    if (!name || !email || !phone || !password) {
        alert("Please fill in all fields.");
        return;
    }

   try {

    console.log("Step 1");

    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    console.log("Step 2");

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        phone: phone,
        role: "customer",
        createdAt: new Date().toISOString()
    });

    console.log("Step 3");

    alert("Account Created Successfully!");

    console.log("Step 4");

} catch (error) {

    console.error("ERROR:", error);
    alert(error.message);

}
}