// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Config (your Firebase config here)
const firebaseConfig = {
  apiKey: "AIzaSyBFj_vh3z0Yaf1oB09On3NP5tZsxRPZwO8",
  authDomain: "personal-dashboard-7c9a6.firebaseapp.com",
  projectId: "personal-dashboard-7c9a6",
  storageBucket: "personal-dashboard-7c9a6.firebasestorage.app",
  messagingSenderId: "475946641997",
  appId: "1:475946641997:web:d48933a3317eab632dca04",
  measurementId: "G-NK1Q8BM0H4",
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM
const modal = document.getElementById("auth-modal");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const closeAuth = document.getElementById("closeAuth");

// Show modal if not logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.querySelectorAll(".user-name").forEach((el) => {
      el.textContent = user.email;
    });
    modal.classList.add("hidden");
  } else {
    modal.classList.remove("hidden");
  }
});

// Sign Up
signupBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password).catch((err) =>
    alert(err.message)
  );
});

// Login
loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password).catch((err) =>
    alert(err.message)
  );
});

// Close modal (if needed)
closeAuth.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Logout (add this button somewhere in your header later)
document.addEventListener("click", (e) => {
  if (e.target.id === "logoutBtn") {
    signOut(auth);
  }
});
