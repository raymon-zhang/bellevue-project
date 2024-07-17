import { readFile, writeFile } from "node:fs/promises";
import { encode, decode } from "@msgpack/msgpack";
import { fromUrl } from "geotiff";

import { convertFromOSM, convertToOSM } from "../geoUtils.js";

export default class BuildingCache {
    static levelHeight = 11;
    static defaultHeight = 30;
    static heightRandomness = 10;
    static bitmaskOffset = 32;
    static chunks = [2363];

    constructor(filePath) {
        this.filePath = filePath || "./cache/buildings.mpk";
        this.cache = {};
        console.log("Building cache initialized");

        this.readCache();
    }

    async readCache() {
        try {
            this.cache = decode(await readFile(this.filePath));
        } catch (err) {
            console.log("Error loading building cache: " + err);
            for (const chunkId of BuildingCache.chunks) {
                console.log("Creating new chunk " + chunkId);
                await this.genChunk(chunkId);
            }
            await this.writeCache();
        }
    }

    async writeCache() {
        try {
            const encoded = encode(this.cache);
            const buffer = Buffer.from(
                encoded.buffer,
                encoded.byteOffset,
                encoded.byteLength
            );

            await writeFile(this.filePath, buffer, {
                flag: "w",
            });
        } catch (err) {
            console.log("Error saving building cache: " + err);
        }
    }

    async getBuildings() {
        return this.cache;
    }

    // async getBuildingsinBB(gx1, gy1, gx2, gy2) {
    //     const [ox1, oy1] = convertToOSM(gx1, gy1);
    //     const [ox2, oy2] = convertToOSM(gx2, gy2);
    //     const bbString = `${oy1}, ${ox1}, ${oy2}, ${ox2}`;
    //     const queryString = `[bbox:${bbString}][out:json][timeout:25];(nwr["building"];nwr["building:part"];);out geom;`;

    //     const result = await fetch("https://overpass-api.de/api/interpreter", {
    //         method: "POST",
    //         body: "data=" + encodeURIComponent(queryString),
    //     }).then((data) => data.json());

    //     const outputBuildings = [];

    //     result.elements.forEach((building) => {
    //         if (building.type === "relation") return;

    //         let additionalTags = {};
    //         if (building.id in this.cache) {
    //             additionalTags = this.cache[building.id];
    //         } else {
    //             if ("building:levels" in building?.tags) {
    //                 additionalTags.height =
    //                     building.tags["building:levels"] *
    //                     BuildingCache.levelHeight;
    //             } else if ("height" in building?.tags) {
    //                 try {
    //                     additionalTags.height =
    //                         3.28 *
    //                         parseFloat(
    //                             building.tags["height"].replace(",", ".")
    //                         );
    //                 } catch (err) {
    //                     console.log("Error parsing height: " + err);
    //                 }
    //                 // building.tags["height"].replace(",", ".") ;
    //                 // TODO: parse this
    //             } else {
    //                 additionalTags.height =
    //                     BuildingCache.defaultHeight +
    //                     Math.random() * BuildingCache.heightRandomness;
    //             }

    //             additionalTags.floorHeight = "unknown";

    //             additionalTags.panels = [];
    //             for (let i = 0; i < building.geometry.length - 1; i++) {
    //                 additionalTags.panels.push(false);
    //             }

    //             this.cache[building.id] = additionalTags;
    //         }
    //         outputBuildings.push({ ...building, ...additionalTags });
    //     });

    //     // await this.writeCache();

    //     return outputBuildings;
    // }

    // setBuildingData(buildingId, data) {
    //     this.cache[buildingId] = data;
    //     this.writeCache();
    // }

    setPanel(panelId, value = true) {
        const buildingId = panelId.split("_")[0];
        const idx = parseInt(panelId.split("_")[1]);

        if (buildingId in this.cache) {
            if (idx >= 0 && idx < this.cache[buildingId].panels.length) {
                this.cache[buildingId].panels[idx] = value;
                return true;
            }
        }

        return new Error("Building not found in cache");
    }

    getPanel(panelId) {
        const buildingId = panelId.split("_")[0];
        const idx = parseInt(panelId.split("_")[1]);

        if (buildingId in this.cache) {
            if (idx >= 0 && idx < this.cache[buildingId].panels.length) {
                return this.cache[buildingId].panels[idx];
            }
        }

        return new Error("Building not found in cache");
    }

    async genChunk(chunkId) {
        const tiff = await fromUrl(
            `https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/OPR/Projects/WA_KingCounty_2021_B21/WA_KingCo_1_2021/TIFF/USGS_OPR_WA_KingCounty_2021_B21_be_King_${chunkId}.tif`
        );
        // 2363
        const image = await tiff.getImage();
        const data = await image.readRasters({ interleave: true });
        const [gx1, gy1, gx2, gy2] = image.getBoundingBox();
        const gw = gx2 - gx1;
        const gh = gy2 - gy1;

        const [ox1, oy1] = convertToOSM(gx1, gy1);
        const [ox2, oy2] = convertToOSM(gx2, gy2);
        const bbString = `${oy1}, ${ox1}, ${oy2}, ${ox2}`;
        const queryString = `[bbox:${bbString}][out:json][timeout:25];(nwr["building"];nwr["building:part"];);out geom;`;

        const result = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: "data=" + encodeURIComponent(queryString),
        }).then((data) => data.json());

        result.elements.forEach((building) => {
            if (building.type === "relation") return;

            let additionalTags = {};

            if ("building:levels" in building?.tags) {
                additionalTags.height =
                    building.tags["building:levels"] *
                    BuildingCache.levelHeight;
            } else if ("height" in building?.tags) {
                try {
                    additionalTags.height =
                        3.28 *
                        parseFloat(building.tags["height"].replace(",", "."));
                } catch (err) {
                    console.log("Error parsing height: " + err);
                }
                // building.tags["height"].replace(",", ".") ;
                // TODO: parse this
            } else {
                additionalTags.height =
                    BuildingCache.defaultHeight +
                    Math.random() * BuildingCache.heightRandomness;
            }

            additionalTags.floorHeight = this.computeMinHeight(
                building,
                data,
                gw,
                gh,
                gx1,
                gy1
            );

            additionalTags.panels = [];
            for (let i = 0; i < building.geometry.length - 1; i++) {
                additionalTags.panels.push(false);
            }

            this.cache[building.id] = { ...building, ...additionalTags };
        });

        console.log("done");
    }

    computeMinHeight(building, data, gw, gh, gx1, gy1) {
        if (!building.bounds) {
            console.log(building);
            return;
        }
        let [minX, minY] = convertFromOSM(
            building.bounds.minlon,
            building.bounds.minlat
        );
        let [maxX, maxY] = convertFromOSM(
            building.bounds.maxlon,
            building.bounds.maxlat
        );

        const minXPixel = Math.max(
            0,
            Math.floor(((minX - gx1) / gw) * data.width)
        );
        const minYPixel = Math.min(
            data.height - 1,
            Math.floor((1 - (minY - gy1) / gh) * data.height)
        );
        const maxXPixel = Math.min(
            data.width - 1,
            Math.floor(((maxX - gx1) / gw) * data.width)
        );
        const maxYPixel = Math.max(
            0,
            Math.floor((1 - (maxY - gy1) / gh) * data.height)
        );

        let minHeight = 1e9;

        for (let i = minXPixel; i <= maxXPixel; i++) {
            for (let j = maxYPixel; j <= minYPixel; j++) {
                minHeight = Math.min(minHeight, data[j * data.width + i]);
            }
        }

        return minHeight ?? 0;
    }
}
