import * as THREE from "three";

let fwdPressed = false,
    bkdPressed = false,
    lftPressed = false,
    rgtPressed = false;
let playerIsOnGround = false;
let playerVelocity = new THREE.Vector3();
let upVector = new THREE.Vector3(0, 1, 0);
let tempVector = new THREE.Vector3();
let tempVector2 = new THREE.Vector3();
let tempBox = new THREE.Box3();
let tempMat = new THREE.Matrix4();
let tempSegment = new THREE.Line3();

export function updatePlayer(
    delta,
    player,
    camera,
    controls,
    collider,
    params
) {
    if (playerIsOnGround) {
        playerVelocity.y = delta * params.gravity;
    } else {
        playerVelocity.y += delta * params.gravity;
    }

    player.position.addScaledVector(playerVelocity, delta);

    // move the player
    const angle = controls.getAzimuthalAngle();
    if (fwdPressed) {
        tempVector.set(0, 0, -1).applyAxisAngle(upVector, angle);
        player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    if (bkdPressed) {
        tempVector.set(0, 0, 1).applyAxisAngle(upVector, angle);
        player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    if (lftPressed) {
        tempVector.set(-1, 0, 0).applyAxisAngle(upVector, angle);
        player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    if (rgtPressed) {
        tempVector.set(1, 0, 0).applyAxisAngle(upVector, angle);
        player.position.addScaledVector(tempVector, params.playerSpeed * delta);
    }

    player.updateMatrixWorld(true);

    // adjust player position based on collisions
    const capsuleInfo = player.capsuleInfo;
    tempBox.makeEmpty();
    tempMat.copy(collider.matrixWorld).invert();
    tempSegment.copy(capsuleInfo.segment);

    // get the position of the capsule in the local space of the collider
    tempSegment.start.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat);
    tempSegment.end.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat);

    // get the axis aligned bounding box of the capsule
    tempBox.expandByPoint(tempSegment.start);
    tempBox.expandByPoint(tempSegment.end);

    tempBox.min.addScalar(-capsuleInfo.radius);
    tempBox.max.addScalar(capsuleInfo.radius);

    collider.geometry.boundsTree.shapecast({
        intersectsBounds: (box) => box.intersectsBox(tempBox),

        intersectsTriangle: (tri) => {
            // check if the triangle is intersecting the capsule and adjust the
            // capsule position if it is.
            const triPoint = tempVector;
            const capsulePoint = tempVector2;

            const distance = tri.closestPointToSegment(
                tempSegment,
                triPoint,
                capsulePoint
            );
            if (distance < capsuleInfo.radius) {
                const depth = capsuleInfo.radius - distance;
                const direction = capsulePoint.sub(triPoint).normalize();

                tempSegment.start.addScaledVector(direction, depth);
                tempSegment.end.addScaledVector(direction, depth);
            }
        },
    });

    // get the adjusted position of the capsule collider in world space after checking
    // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
    // the origin of the player model.
    const newPosition = tempVector;
    newPosition.copy(tempSegment.start).applyMatrix4(collider.matrixWorld);

    // check how much the collider was moved
    const deltaVector = tempVector2;
    deltaVector.subVectors(newPosition, player.position);

    // if the player was primarily adjusted vertically we assume it's on something we should consider ground
    playerIsOnGround =
        deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25);

    // const offset = Math.max(0.0, deltaVector.length() - 1e-4);
    const offset = Math.max(1e-5, deltaVector.length());
    deltaVector.normalize().multiplyScalar(offset);

    // adjust the player model
    player.position.add(deltaVector);

    if (!playerIsOnGround) {
        deltaVector.normalize();
        playerVelocity.addScaledVector(
            deltaVector,
            -deltaVector.dot(playerVelocity)
        );
    } else {
        playerVelocity.set(0, 0, 0);
    }

    // adjust the camera
    camera.position.sub(controls.target);
    controls.target.copy(player.position);
    camera.position.add(player.position);

    // if the player has fallen too far below the level reset their position to the start
    if (player.position.y < -25) {
        resetPlayer(player, camera, controls);
    }
    console.log(player.position);
    if (player.position.z > -12.227) player.position.z = -12.227;
    if (player.position.x > 112.9) player.position.x = 112.9;
}

export function setupKeybinds() {
    window.addEventListener("keydown", function (e) {
        switch (e.code) {
            case "KeyW":
                fwdPressed = true;
                break;
            case "KeyS":
                bkdPressed = true;
                break;
            case "KeyD":
                rgtPressed = true;
                break;
            case "KeyA":
                lftPressed = true;
                break;
            case "Space":
                if (playerIsOnGround) {
                    playerVelocity.y = 10.0;
                    playerIsOnGround = false;
                }

                break;
        }
    });

    window.addEventListener("keyup", function (e) {
        switch (e.code) {
            case "KeyW":
                fwdPressed = false;
                break;
            case "KeyS":
                bkdPressed = false;
                break;
            case "KeyD":
                rgtPressed = false;
                break;
            case "KeyA":
                lftPressed = false;
                break;
        }
    });
}

export function resetPlayer(player, camera, controls) {
    playerVelocity.set(0, 0, 0);
    player.position.set(50, 10, -50);
    camera.position.sub(controls.target);
    controls.target.copy(player.position);
    camera.position.add(player.position);
    controls.update();
}
