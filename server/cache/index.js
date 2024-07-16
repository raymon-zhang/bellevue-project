import express from "express";
import multer from "multer";
import { writeFile } from "node:fs/promises";
import BuildingCache from "./buildings_cache.js";

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
    const { panelId } = req.body;
    const file = req.file;

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

    const filePath = `./panels/${panelId}`;
    console.log(filePath);

    await writeFile(filePath, file.buffer, { flag: "w" });

    if (buildingCache.setPanel(panelId)) {
        await buildingCache.writeCache();
    }

    res.send("OK");
});

export default router;
