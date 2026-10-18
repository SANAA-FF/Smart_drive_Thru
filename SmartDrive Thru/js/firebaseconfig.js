import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseconfig = {
    apiKey: "AIzaSyD7CJF3yVa9BG3Vg1qLxprrAym8_EQwkH8",
    authDomain: "drive-thru-eb0a1.firebaseapp.com",
    projectId: "drive-thru-eb0a1",
    storageBucket: "drive-thru-eb0a1.firebasestorage.app",
    messagingSenderId: "849831589482",
    appId: "1:849831589482:web:3e7e3648fd58fe398c7c13"
};

const app = initializeApp(firebaseconfig);

const db = getFirestore(app);

export { app, db };