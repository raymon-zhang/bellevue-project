import { fromUrl } from "geotiff";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { convertToOSM, convertFromOSM } from "../geo.js";
import {
    MeshBVH,
    MeshBVHHelper,
    SAH,
    StaticGeometryGenerator,
} from "three-mesh-bvh";
import { config } from "../config.js";

const textureLoader = new THREE.TextureLoader();
let sideMeshMap = {};

const originX = 1300500.75;
const originY = 224999.25;
const scaleFactor = 100 / 4500;

export const createTerrain = async (
    scene,
    pickingScene,
    renderer,
    faceletMap,
    chunkIds
) => {
    const groundGeos = [];
    const loadGround = async (chunkId, renderer, scene) => {
        const tiff = await fromUrl(
            `https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/OPR/Projects/WA_KingCounty_2021_B21/WA_KingCo_1_2021/TIFF/USGS_OPR_WA_KingCounty_2021_B21_be_King_${chunkId}.tif`
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
        const scaleFactor = 100 / gw;

        const offsetX = (gx1 - originX) * scaleFactor;
        const offsetY = (gy1 - originY) * scaleFactor;

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

        const texture1 = textureLoader.load(`/${chunkId}.png`);

        const groundGeo = new THREE.PlaneGeometry(
            gw * scaleFactor,
            gh * scaleFactor,
            data.width / 2 - 1,
            data.height / 2 - 1
        );
        const groundMat = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            map: texture1,
        });

        texture1.colorSpace = THREE.SRGBColorSpace;
        texture1.anisotropy = maxAnisotropy;
        texture1.repeat.set(1, 1);

        groundMat.color.setHSL(0.095, 1, 0.75);

        // const vertices = groundGeo.attributes.position;
        // const arr1 = new Array(groundGeo.attributes.position.count);
        // console.log(groundGeo.attributes.position.count);
        // const arr = arr1.fill(1);
        // arr.forEach((a, index) => {
        //     groundGeo.attributes.position.setZ(
        //         index,
        //         data[index] * scaleFactor
        //     );
        // });
        let idx = 0;
        for (let i = 0; i < data.width; i += 2) {
            for (let j = 0; j < data.height; j += 2) {
                groundGeo.attributes.position.setZ(
                    idx,
                    data[j + i * data.height] * scaleFactor
                );
                idx++;
            }
        }
        groundGeo.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.geometry.rotateX(-Math.PI / 2);
        // ground.rotation.x = -Math.PI / 2;
        ground.geometry.translate(
            (gw * scaleFactor) / 2,
            0,
            -(gh * scaleFactor) / 2
        );
        ground.geometry.translate(offsetX, 0, -offsetY);
        // ground.position.x = (gw * scaleFactor) / 2;
        // ground.position.z = -(gh * scaleFactor) / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        groundGeos.push(
            groundGeo
            // .toNonIndexed()
            // .deleteAttribute("uv")
            // .deleteAttribute("normal")
        );
    };

    for (const chunkId of chunkIds) {
        await loadGround(chunkId, renderer, scene);
    }
    const gx1 = originX;
    const gy1 = originY;
    // const tiff = await fromUrl(
    //     `https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/OPR/Projects/WA_KingCounty_2021_B21/WA_KingCo_1_2021/TIFF/USGS_OPR_WA_KingCounty_2021_B21_be_King_${chunkId}.tif`
    // );
    // // 2363
    // const image = await tiff.getImage();
    // const data = await image.readRasters({ interleave: true });
    // console.log(data.width - 1);
    // console.log(data.height - 1);
    // const [gx1, gy1, gx2, gy2] = image.getBoundingBox();
    // console.log(gx1, gx2);
    // console.log(gy1, gy2);
    // const gw = gx2 - gx1;
    // const gh = gy2 - gy1;
    // const scaleFactor = 100 / gw;

    // const offsetX = (gx1 - originX) * scaleFactor;
    // const offsetY = (gy1 - originY) * scaleFactor;

    // const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // const texture1 = textureLoader.load(`/${chunkId}.png`);

    // const groundGeo = new THREE.PlaneGeometry(
    //     gw * scaleFactor,
    //     gh * scaleFactor,
    //     data.width - 1,
    //     data.height - 1
    // );
    // const groundMat = new THREE.MeshPhongMaterial({
    //     side: THREE.DoubleSide,
    //     map: texture1,
    // });

    // texture1.colorSpace = THREE.SRGBColorSpace;
    // texture1.anisotropy = maxAnisotropy;
    // texture1.repeat.set(1, 1);

    // groundMat.color.setHSL(0.095, 1, 0.75);

    // const vertices = groundGeo.attributes.position;
    // const arr1 = new Array(groundGeo.attributes.position.count);
    // const arr = arr1.fill(1);
    // arr.forEach((a, index) => {
    //     groundGeo.attributes.position.setZ(index, data[index] * scaleFactor);
    // });
    // groundGeo.computeVertexNormals();

    // const ground = new THREE.Mesh(groundGeo, groundMat);
    // ground.geometry.rotateX(-Math.PI / 2);
    // // ground.rotation.x = -Math.PI / 2;
    // ground.geometry.translate(
    //     (gw * scaleFactor) / 2,
    //     0,
    //     -(gh * scaleFactor) / 2
    // );
    // ground.geometry.translate(offsetX, 0, -offsetY);
    // // ground.position.x = (gw * scaleFactor) / 2;
    // // ground.position.z = -(gh * scaleFactor) / 2;
    // ground.receiveShadow = true;
    // scene.add(ground);

    // LOAD BUILDINGS
    const result = await fetch(`${config.apiUrl}/cache?`).then((data) =>
        data.json()
    );

    const buildingMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        envMapIntensity: 1,
        roughness: 0.12,
        metalness: 0.5,
        color: 0xbbbbbb,
    });

    console.log(result);

    const geometries = [];
    // const environment = [groundGeo.toNonIndexed().deleteAttribute("uv")];

    let faceletId = 0;

    // result.forEach((building) => {
    for (const [key, building] of Object.entries(result)) {
        let points = [];
        let shapePoints = [];

        let floorHeight = 0;

        // if (building.floorHeight === "unknown") {
        // floorHeight = computeMinHeight(building, data, gw, gh, gx1, gy1);
        // } else {
        floorHeight = building.floorHeight ?? 0;
        // }

        let osmMinHeight = 0;
        // if ("min_height" in building.tags) {
        //     osmMinHeight =
        //         3.28 * parseFloat(building.tags.min_height) * scaleFactor;
        // }

        if (building.type === "relation") {
        } else {
            const p0 = convertFromOSM(
                building.geometry[0].lon,
                building.geometry[0].lat
            );
            shapePoints.push(new THREE.Vector2(0, 0));
            for (let i = 1; i < building.geometry.length; i++) {
                const c1 = convertFromOSM(
                    building.geometry[i - 1].lon,
                    building.geometry[i - 1].lat
                );
                const c2 = convertFromOSM(
                    building.geometry[i].lon,
                    building.geometry[i].lat
                );

                c1[1] = -c1[1];
                c2[1] = -c2[1];

                shapePoints.push(
                    new THREE.Vector2(
                        (c2[0] - p0[0]) * scaleFactor,
                        (c2[1] + p0[1]) * scaleFactor
                    )
                );

                const sidePoints = [];

                sidePoints.push(
                    new THREE.Vector3(
                        (c1[0] - gx1) * scaleFactor,
                        (floorHeight + osmMinHeight) * scaleFactor,
                        (c1[1] + gy1) * scaleFactor
                    )
                );
                sidePoints.push(
                    new THREE.Vector3(
                        (c2[0] - gx1) * scaleFactor,
                        (floorHeight + osmMinHeight) * scaleFactor,
                        (c2[1] + gy1) * scaleFactor
                    )
                );
                sidePoints.push(
                    new THREE.Vector3(
                        (c2[0] - gx1) * scaleFactor,
                        (floorHeight + building.height) * scaleFactor,
                        (c2[1] + gy1) * scaleFactor
                    )
                );
                sidePoints.push(
                    new THREE.Vector3(
                        (c2[0] - gx1) * scaleFactor,
                        (floorHeight + building.height) * scaleFactor,
                        (c2[1] + gy1) * scaleFactor
                    )
                );
                sidePoints.push(
                    new THREE.Vector3(
                        (c1[0] - gx1) * scaleFactor,
                        (floorHeight + building.height) * scaleFactor,
                        (c1[1] + gy1) * scaleFactor
                    )
                );
                sidePoints.push(
                    new THREE.Vector3(
                        (c1[0] - gx1) * scaleFactor,
                        (floorHeight + osmMinHeight) * scaleFactor,
                        (c1[1] + gy1) * scaleFactor
                    )
                );

                faceletId++;

                const pickingMaterial = new THREE.MeshPhongMaterial({
                    emissive: new THREE.Color().setHex(
                        faceletId,
                        THREE.NoColorSpace
                    ),
                    color: new THREE.Color(0, 0, 0),
                    specular: new THREE.Color(0, 0, 0),
                    transparent: true,
                    side: THREE.DoubleSide,
                    alphaTest: 0.5,
                    blending: THREE.NoBlending,
                });
                const sideGeometry = new THREE.BufferGeometry().setFromPoints(
                    sidePoints
                );
                const pickingSide = new THREE.Mesh(
                    sideGeometry,
                    pickingMaterial
                );
                pickingScene.add(pickingSide);

                faceletMap[faceletId] = `${building.id}_${i - 1}`;

                points = points.concat(sidePoints);

                sideGeometry.computeVertexNormals();
                sideGeometry.computeBoundingSphere();

                // prettier-ignore
                const uvs = [
                    1, 0, 
                    0, 0, 
                    0, 1, 
                    0, 1, 
                    1, 1, 
                    1, 0
                ];
                sideGeometry.setAttribute(
                    "uv",
                    new THREE.Float32BufferAttribute(uvs, 2)
                );

                let sideMaterial = buildingMaterial;

                if (building.panels[i - 1]) {
                    sideMaterial = new THREE.MeshPhongMaterial({
                        map: textureLoader.load(
                            // `${config.apiUrl}/panels/${building.id}_${i - 1}`
                            `https://firebasestorage.googleapis.com/v0/b/bellevue-9b030.appspot.com/o/panels%2F${
                                building.id
                            }_${i - 1}?alt=media`
                        ),
                        side: THREE.DoubleSide,
                    });
                }
                const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
                sideMesh.castShadow = true;
                scene.add(sideMesh);

                sideMeshMap[`${building.id}_${i - 1}`] = sideMesh;
            }
            // const geometry = new THREE.BufferGeometry().setFromPoints(points);
            // geometry.computeVertexNormals();
            // geometry.computeBoundingSphere();
            // geometries.push(geometry);
            // environment.push(geometry);

            // const buildingMesh = new THREE.Mesh(geometry, buildingMaterial);
            // buildingMesh.castShadow = true;
            // scene.add(buildingMesh);

            const ceiling = new THREE.Shape(shapePoints);
            const ceilingGeo = new THREE.ShapeGeometry(ceiling);
            const ceilingMesh = new THREE.Mesh(ceilingGeo, buildingMaterial);
            ceilingMesh.geometry.rotateX(Math.PI / 2);
            // ceilingMesh.rotateX(Math.PI / 2);
            ceilingMesh.geometry.translate(
                (p0[0] - gx1) * scaleFactor,
                (floorHeight + building.height) * scaleFactor,
                -(p0[1] - gy1) * scaleFactor
            );
            // ceilingMesh.position.x = (p0[0] - gx1) * scaleFactor;
            // ceilingMesh.position.z = -(p0[1] - gy1) * scaleFactor;
            // ceilingMesh.position.y =
            //     (floorHeight + building.height) * scaleFactor;
            scene.add(ceilingMesh);
            // environment.push(ceilingGeo.toNonIndexed().deleteAttribute("uv"));
        }
    }
    // const mergedGeometry = BufferGeometryUtils.mergeGeometries(
    //     geometries,
    //     false
    // );
    // const buildingsMesh = new THREE.Mesh(mergedGeometry, buildingMaterial);
    // buildingsMesh.castShadow = true;
    // scene.add(buildingsMesh);

    // const mergedEnvironment = BufferGeometryUtils.mergeGeometries(
    //     environment,
    //     false
    // );

    const mergedGroundGeos = BufferGeometryUtils.mergeGeometries(groundGeos);

    // const mergedGroundGeos = groundGeos[0];
    console.log(groundGeos);

    mergedGroundGeos.boundsTree = new MeshBVH(mergedGroundGeos, {
        strategy: SAH,
        maxDepth: 35,
    });
    const collider = new THREE.Mesh(mergedGroundGeos);

    // collider.visible = false;
    // scene.add(collider);

    renderer.shadowMap.needsUpdate = true;

    // FINISHED LOADING
    finishLoading();
    return collider;
};

const finishLoading = () => {
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("fade-out");
    loadingScreen.addEventListener("transitionend", (event) =>
        event.target.remove()
    );
};

export const loadPanelImage = async (panelId) => {
    sideMeshMap[panelId].material = new THREE.MeshPhongMaterial({
        map: textureLoader.load(
            `https://firebasestorage.googleapis.com/v0/b/bellevue-9b030.appspot.com/o/panels%2F${panelId}?alt=media`
        ),
        side: THREE.DoubleSide,
    });
};
