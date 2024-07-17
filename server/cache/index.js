import express from "express";
import multer from "multer";
import { writeFile } from "node:fs/promises";
import BuildingCache from "./buildings_cache.js";
import { auth, bucket, firestore } from "../firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import { getDownloadURL } from "firebase-admin/storage";

const router = express.Router();

const buildingCache = new BuildingCache();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", async (req, res) => {
    // const { chunkId } = req.query;
    // console.log(chunkId);

    const buildings = await buildingCache.getBuildings();

    res.send(buildings);
});

router.post("/uploadPanel", upload.single("panel"), async (req, res) => {
    const { panelId, idToken } = req.body;
    const file = req.file;

    const decodedToken = await auth.verifyIdToken(idToken).catch((err) => {
        res.status(401).send("Invalid token");
        return;
    });

    if (!panelId || buildingCache.getPanel(panelId) !== false) {
        res.status(400).send("Invalid panel ID");
        return;
    }

    if (
        !file ||
        !(file.mimetype === "image/jpeg" || file.mimetype === "image/png") ||
        file.size > 10 * 1024 * 1024
    ) {
        res.status(400).send("Invalid file");
        return;
    }

    const docData = {
        panelId,
        uid: decodedToken?.uid,
        email: decodedToken?.email,
        votes: 0,
        timestamp: FieldValue.serverTimestamp(),
    };
    firestore.collection("panels").doc(panelId).set(docData);

    const filePath = `panels/${panelId}`;
    console.log(filePath);

    await bucket.file(filePath).save(file.buffer, {
        metadata: {
            contentType: file.mimetype,
        },
    });

    // await bucket.setCorsConfiguration([
    //     {
    //         origin: ["*"],
    //         method: ["GET"],
    //         responseHeader: ["*"],
    //         maxAgeSeconds: 3600,
    //     },
    // ]);

    // bucket.upload()

    // await writeFile(filePath, file.buffer, { flag: "w" });

    if (buildingCache.setPanel(panelId)) {
        await buildingCache.writeCache();
    }

    res.send("OK");
});

router.get("/panelInfo/:panelId", async (req, res) => {
    const { panelId } = req.params;

    let regex = /[0-9]+_[0-9]+/i;
    if (!regex.test(panelId)) {
        res.status(400).send("Invalid panel ID");
        return;
    }

    const doc = await firestore.collection("panels").doc(panelId).get();

    if (!doc.exists) {
        res.status(202).send("Panel not taken");
        return;
    }

    res.send(doc.data());
});

export default router;
