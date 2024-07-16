import * as THREE from "three";

export function initLights(scene) {
    // LIGHTS
    const hemiLight = new THREE.HemisphereLight(16777215, 16777215, 2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
    // scene.add(hemiLightHelper);
    //
    const dirLight = new THREE.DirectionalLight(16777215, 2);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(1300, 1450, 1000);
    dirLight.target.position.set(50, 0, -50);
    // dirLight.position.multiplyScalar(10000);
    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 100;

    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.left = -d;

    dirLight.shadow.camera.far = 2500;
    dirLight.shadow.bias = 0.003;
    // dirLight.shadow.normalBias = 0.003;

    dirLight.shadow.camera.near = 1200;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
    scene.add(dirLightHelper);
}
