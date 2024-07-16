import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import "./style.css";
import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

import { createTerrain } from "./utils/utils.js";
import { initLights } from "./utils/initLights.js";
import { updatePlayer, resetPlayer, setupKeybinds } from "./utils/controls.js";
import {
    GPUPickHelper,
    clearPickPosition,
    addPickListeners,
} from "./utils/picking.js";
import { pickCallback } from "./utils/pickMenu.js";
import { onUser } from "./utils/firebase.js";

const params = {
    firstPerson: true,
    gravity: -30,
    playerSpeed: 5,
    physicsSteps: 5,

    reset: resetPlayer,
};

let camera, scene, pickingScene, renderer;
let collider, player, controls;
let canvas;
let exrCubeRenderTarget, exrBackground;
let pickHelper;

let faceletMap = {};

const clock = new THREE.Clock();

let user = null;
onUser((newUser) => {
    if (newUser) {
        user = newUser;
        console.log(user);
    } else {
        window.location.replace("/login/");
    }
});

init();
renderer.setAnimationLoop(animate);

function init() {
    //create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );
    camera.position.set(10, 10, -10);

    //setup scenes
    scene = new THREE.Scene();
    scene.background = new THREE.Color().setHSL(0.6, 0, 1);
    scene.fog = new THREE.FogExp2(0xaeb1bb, 0.01);

    pickingScene = new THREE.Scene();
    pickingScene.background = new THREE.Color(0);

    //setup renderer
    // canvas = document.getElementById("canvas");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    canvas = document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.autoUpdate = false;

    //setup player
    controls = new OrbitControls(camera, renderer.domElement);

    player = new THREE.Mesh(
        new RoundedBoxGeometry(0.5, 1.0, 0.5, 10, 0.25),
        new THREE.MeshStandardMaterial()
    );
    player.geometry.translate(0, -0.25, 0);
    player.capsuleInfo = {
        radius: 0.25,
        segment: new THREE.Line3(
            new THREE.Vector3(),
            new THREE.Vector3(0, -0.5, 0.0)
        ),
    };
    // player.castShadow = true;
    // player.receiveShadow = true;
    // player.material.shadowSide = 2;
    scene.add(player);
    resetPlayer(player, camera, controls);

    setupListeners();

    pickHelper = new GPUPickHelper();
    clearPickPosition();
    addPickListeners(canvas, () =>
        pickCallback(
            pickHelper.pick(pickingScene, camera, renderer, faceletMap)
        )
    );

    // REFLECTION MAPPING

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load(
        "https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/kloofendal_48d_partly_cloudy_puresky_1k.exr",
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
            exrBackground = texture;
        }
    );

    // setup objects in scene
    initLights(scene);

    // GROUND
    createTerrain(scene, pickingScene, renderer, faceletMap, [2363, 2364]).then(
        (res) => (collider = res)
    );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupListeners() {
    window.addEventListener("resize", onWindowResize);

    setupKeybinds();
}

function animate() {
    let delta = clock.getDelta();
    controls.update(delta);

    delta = Math.min(delta, 0.1);
    if (params.firstPerson) {
        controls.maxPolarAngle = Math.PI;
        controls.minDistance = 1e-4;
        controls.maxDistance = 1e-4;
    } else {
        controls.maxPolarAngle = Math.PI / 2;
        controls.minDistance = 1;
        controls.maxDistance = 20;
    }

    if (collider) {
        const physicsSteps = params.physicsSteps;

        for (let i = 0; i < physicsSteps; i++) {
            updatePlayer(
                delta / physicsSteps,
                player,
                camera,
                controls,
                collider,
                params
            );
        }
    }

    let newEnvMap = scene.environment;
    let background = scene.background;
    if (exrCubeRenderTarget) {
        newEnvMap = exrCubeRenderTarget.texture;
        background = exrBackground;
    }

    if (newEnvMap && newEnvMap !== scene.environment) {
        scene.environment = newEnvMap;
        scene.background = background;
        console.log("loaded");
        scene.traverse((object) => {
            if (object.type === "Mesh") object.material.needsUpdate = true;
        });
    }

    // pickHelper.pick(pickingScene, camera, renderer, faceletMap);
    renderer.render(scene, camera);
}
