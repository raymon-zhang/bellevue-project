import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAHgu32G_wFZs6p4QLizqoI_u1oyhdwkFo",
    authDomain: "bellevue-9b030.firebaseapp.com",
    projectId: "bellevue-9b030",
    storageBucket: "bellevue-9b030.appspot.com",
    messagingSenderId: "286266666402",
    appId: "1:286266666402:web:6a2e7a044bd67968d856fb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export function onUser(callback) {
    onAuthStateChanged(auth, callback);
}
