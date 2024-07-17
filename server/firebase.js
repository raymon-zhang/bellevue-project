import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const app = initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_KEY)),
    storageBucket: "bellevue-9b030.appspot.com",
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const bucket = getStorage(app).bucket();
