import { fromUrl } from "geotiff";
import { convertToOSM } from "./geoUtils";

async function genChunk(chunkId) {
    const tiff = await fromUrl(
        "https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/OPR/Projects/WA_KingCounty_2021_B21/WA_KingCo_1_2021/TIFF/USGS_OPR_WA_KingCounty_2021_B21_be_King_2363.tif"
    );
    // 2363
    const image = await tiff.getImage();
    const data = await image.readRasters({ interleave: true });
    console.log(data.width - 1);
    console.log(data.height - 1);
    const [gx1, gy1, gx2, gy2] = image.getBoundingBox();
    console.log(gx1, gx2);
    console.log(gy1, gy2);
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

    const outputBuildings = {};

    result.elements.forEach((building) => {
        if (building.type === "relation") return;

        let additionalTags = {};
        // if (building.id in this.cache) {
        // additionalTags = this.cache[building.id];
        // } else {
        if ("building:levels" in building?.tags) {
            additionalTags.height =
                building.tags["building:levels"] * BuildingCache.levelHeight;
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

        additionalTags.floorHeight = "unknown";

        additionalTags.panels = [];
        for (let i = 0; i < building.geometry.length - 1; i++) {
            additionalTags.panels.push(false);
        }

        this.cache[building.id] = additionalTags;
        // }
        // outputBuildings.push({ ...building, ...additionalTags });
    });
}
