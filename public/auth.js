// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFj_vh3z0Yaf1oB09On3NP5tZsxRPZwO8",
  authDomain: "personal-dashboard-7c9a6.firebaseapp.com",
  projectId: "personal-dashboard-7c9a6",
  storageBucket: "personal-dashboard-7c9a6.firebasestorage.app",
  messagingSenderId: "475946641997",
  appId: "1:475946641997:web:d48933a3317eab632dca04",
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM elements
const modal = document.getElementById("auth-modal");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const closeAuth = document.getElementById("closeAuth");
const userNameSpan = document.querySelector(".user-name");
const loginPromptBtn = document.getElementById("loginPromptBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Show/hide modal based on login state
onAuthStateChanged(auth, (user) => {
  if (user) {
    userNameSpan.textContent = user.displayName || "User";
    modal.classList.add("hidden");
    loginPromptBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    userNameSpan.textContent = "Guest";
    modal.classList.remove("hidden");
    loginPromptBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
});

// Login
loginBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      modal.classList.add("hidden");
    })
    .catch((err) => alert(err.message));
});

// Sign Up
const displayNameInput = document.getElementById("displayName");

// Sign Up
signupBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim();

  if (!displayName) {
    alert("Please enter your name");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Set the user's display name
      return updateProfile(userCredential.user, { displayName });
    })
    .then(() => {
      modal.classList.add("hidden");
    })
    .catch((err) => alert(err.message));
});

// Close modal manually
closeAuth.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Manual login button in header
loginPromptBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});
