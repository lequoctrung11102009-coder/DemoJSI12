import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsl5Xj-J-A8b8Vu2A-yJw0U0KREXJgbcs",
    authDomain: "weather-4f0fa.firebaseapp.com",
    projectId: "weather-4f0fa",
    storageBucket: "weather-4f0fa.firebasestorage.app",
    messagingSenderId: "1011941555484",
    appId: "1:1011941555484:web:e5cd0eacd6685747528ed9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };