// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.loginUserHandler = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Logged in!", userCredential.user);
      alert("Login successful!");
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
};

// Expose functions to global window so HTML inline onclick works
window.registerUser = function (email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Registered!", userCredential.user);
      alert("Registration successful!");
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
};

window.loginUser = function (email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("Logged in!", userCredential.user);
      alert("Login successful!");
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
};

window.logoutUser = function () {
  signOut(auth)
    .then(() => {
      console.log("Logged out!");
      alert("Logged out successfully!");
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
};

// Optional: Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
  } else {
    console.log("No user logged in");
  }
});

// auth.js
import { loginUser, logoutUser } from "./api.js"; // or wherever your functions are

const loginBtn = document.getElementById("loginPromptBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userNameSpan = document.querySelector(".user-name");

loginBtn.addEventListener("click", async () => {
  try {
    const email = prompt("Enter your email:"); // simple login prompt
    const password = prompt("Enter your password:");
    if (!email || !password) return;

    const user = await loginUser(email, password); // your API call
    userNameSpan.textContent = user.name || "User";
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await logoutUser();
  userNameSpan.textContent = "Guest";
  loginBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
});
