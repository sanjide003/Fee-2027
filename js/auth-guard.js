// ============================================================
// js/auth-guard.js
// 🔐 SECURITY FIX: Firebase-based authentication guards
//    Replaces the old localStorage-only checks which were
//    trivially bypassable via browser console.
// ============================================================

import { onAuthStateChanged }    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs }
                                  from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db, BASE_PATH }   from "./firebase-config.js";

// ── Helper: wait for Firebase auth to settle ─────────────────
function waitForUser() {
    return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
            unsub();
            resolve(user);
        });
    });
}

// ── ADMIN GUARD ───────────────────────────────────────────────
// Verifies logged-in user is the admin by checking Firestore,
// NOT just a localStorage value.
export async function guardAdmin() {
    const user = await waitForUser();

    // Not logged in or anonymous → redirect
    if (!user || user.isAnonymous) {
        window.location.replace('index.html');
        return null;
    }

    try {
        const adminRef  = doc(db, `${BASE_PATH}/settings`, 'adminAuth');
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists() && adminSnap.data().email === user.email) {
            // ✅ Confirmed admin
            localStorage.setItem('admin_logged_in', 'true'); // keep for legacy reads
            return user;
        }
    } catch (e) {
        console.error("Admin guard error:", e);
    }

    // Failed verification → redirect
    window.location.replace('index.html');
    return null;
}

// ── STAFF GUARD ───────────────────────────────────────────────
// Verifies logged-in user is an active staff member.
// Also accepts admin (so admin can view collection panel).
export async function guardStaff() {
    const user = await waitForUser();

    if (!user || user.isAnonymous) {
        window.location.replace('index.html');
        return null;
    }

    try {
        // 1. Check if admin first
        const adminSnap = await getDoc(doc(db, `${BASE_PATH}/settings`, 'adminAuth'));
        if (adminSnap.exists() && adminSnap.data().email === user.email) {
            localStorage.setItem('admin_logged_in', 'true');
            return { user, role: 'admin' };
        }

        // 2. Check active staff
        const staffQ    = query(
            collection(db, `${BASE_PATH}/staff`),
            where("email",    "==", user.email),
            where("isActive", "==", true)
        );
        const staffSnap = await getDocs(staffQ);

        if (!staffSnap.empty) {
            localStorage.setItem('staff_logged_in', 'true');
            return { user, role: 'staff', staffData: staffSnap.docs[0].data() };
        }
    } catch (e) {
        console.error("Staff guard error:", e);
    }

    window.location.replace('index.html');
    return null;
}

// ── STUDENT GUARD ─────────────────────────────────────────────
// Lightweight check — student uses anonymous Firebase auth.
// Real identity is the Firestore student document.
export async function guardStudent() {
    const studentId = localStorage.getItem('student_logged_in_id');
    if (!studentId) {
        window.location.replace('index.html');
        return null;
    }

    const user = await waitForUser();
    // Student pages use anonymous auth — just ensure Firebase is ready
    if (!user) {
        window.location.replace('index.html');
        return null;
    }

    // Verify the student document actually exists
    try {
        const stuSnap = await getDoc(doc(db, `${BASE_PATH}/students`, studentId));
        if (stuSnap.exists()) return studentId;
    } catch (e) {
        console.error("Student guard error:", e);
    }

    localStorage.removeItem('student_logged_in_id');
    window.location.replace('index.html');
    return null;
}
