import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const app = initializeApp({
    credential: cert("./server/admin-key.json"),
    storageBucket: "bellevue-9b030.appspot.com",
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const bucket = getStorage(app).bucket();
