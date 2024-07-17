import express from "express";
import cors from "cors";
import cache from "./cache/index.js";
import compression from "compression";

const app = express();
const port = 3000;

app.use(compression());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/cache", cache);

app.use("/panels", express.static("panels"));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
