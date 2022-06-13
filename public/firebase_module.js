// ----------------Firebase-Start-------------------- //
const firebase = require("firebase/app");
const { getDatabase, ref, set, onValue } = require("firebase/database");
const {   
  getAuth,
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  connectAuthEmulator,
  AuthErrorCodes
} = require("firebase/auth");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1gFGIvjbUrjS97OVtGSWzXtIogQ8GwHc",
  authDomain: "dictionaryappjs.firebaseapp.com",
  databaseURL:
    "https://dictionaryappjs-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dictionaryappjs",
  storageBucket: "dictionaryappjs.appspot.com",
  messagingSenderId: "272811608982",
  appId: "1:272811608982:web:6ffa0109ff5be11481abb7",
  measurementId: "G-5F6LKMDWQH",
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);
module.exports = { 
  db, ref, set, onValue, 
  auth, onAuthStateChanged, AuthErrorCodes, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword 
};

// ----------------Firebase-End---------------------- //
