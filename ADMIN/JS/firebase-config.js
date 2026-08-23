// ======================================================
// FIREBASE CONFIG — Cấu hình & khởi tạo Firebase
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

// ── Thay thông tin bên dưới bằng firebaseConfig ──
    const firebaseConfig = {
    apiKey: "AIzaSyAsl5Xj-J-A8b8Vu2A-yJw0U0KREXJgbcs",
    authDomain: "weather-4f0fa.firebaseapp.com",
    projectId: "weather-4f0fa",
    storageBucket: "weather-4f0fa.firebasestorage.app",
    messagingSenderId: "1011941555484",
    appId: "1:1011941555484:web:e5cd0eacd6685747528ed9"
};

// Khởi động Firebase
const app = initializeApp(firebaseConfig);

// Kết nối đến Firestore
const db = getFirestore(app);

// Các collection chính
const cropsCollection    = collection(db, "crops");
const diseasesCollection = collection(db, "diseases");

export {
    db,
    cropsCollection,
    diseasesCollection,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
};
