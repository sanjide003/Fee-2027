// ============================================================
// js/firebase-config.js
// Central Firebase configuration — import this in all pages
// ============================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey:            "AIzaSyB9f48oJP6e_HkkyD8mgXLofq0S8TMfih0",
    authDomain:        "result-aistudio.firebaseapp.com",
    projectId:         "result-aistudio",
    storageBucket:     "result-aistudio.firebasestorage.app",
    messagingSenderId: "515968357351",
    appId:             "1:515968357351:web:abed438db3e752375fe342",
    measurementId:     "G-F31CJQC8T7"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ⚠️  Change this to your real institution document ID
const BASE_PATH = 'institutions/TEST_INSTITUTE_01';

export { db, auth, BASE_PATH };
