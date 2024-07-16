import * as THREE from "three";

let pickPosition = { x: 0, y: 0 };
let picks = 0;

export class GPUPickHelper {
    constructor() {
        // create a 1x1 pixel render target
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
        this.pixelBuffer = new Uint8Array(4);
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
    }
    pick(scene, camera, renderer, faceletMap) {
        const { pickingTexture, pixelBuffer } = this;

        // restore the color if there is a picked object
        if (this.pickedObject) {
            this.pickedObject = undefined;
        }

        // set the view offset to represent just a single pixel under the mouse
        const pixelRatio = 1;
        // console.log(pixelRatio);
        camera.setViewOffset(
            renderer.getContext().drawingBufferWidth, // full width
            renderer.getContext().drawingBufferHeight, // full top
            (pickPosition.x * pixelRatio) | 0, // rect x
            (pickPosition.y * pixelRatio) | 0, // rect y
            1, // rect width
            1 // rect height
        );
        // render the scene
        renderer.setRenderTarget(pickingTexture);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        // clear the view offset so rendering returns to normal
        camera.clearViewOffset();
        //read the pixel
        renderer.readRenderTargetPixels(
            pickingTexture,
            0, // x
            0, // y
            1, // width
            1, // height
            pixelBuffer
        );

        const id =
            (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];

        if (id in faceletMap) {
            return faceletMap[id];
        }
    }
}

export function getCanvasRelativePosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    // console.log(rect.width, canvas.width);
    // console.log((event.clientX / rect.width) * canvas.width);
    return {
        x: ((event.clientX - rect.left) * canvas.width) / rect.width,
        y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
}

export function setPickPosition(event, canvas) {
    const pos = getCanvasRelativePosition(event, canvas);
    pickPosition.x = pos.x;
    pickPosition.y = pos.y;
}

export function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
}

function recordPressStart(event, canvas) {
    const pos = getCanvasRelativePosition(event, canvas);
    pickPosition.x = pos.x;
    pickPosition.y = pos.y;
    pickPosition.moveX = 0;
    pickPosition.moveY = 0;
}

function recordMovement(event, canvas) {
    const pos = getCanvasRelativePosition(event, canvas);

    pickPosition.moveX += Math.abs(pos.x - pickPosition.x);
    pickPosition.moveY += Math.abs(pos.y - pickPosition.y);
}

// function selectIfNoMovement(event) {
//     if (pickPosition.moveX < 5 && pickPosition.moveY < 5) {
//         picks += 1;
//         console.log(picks);
//     }

//     window.removeEventListener("pointermove", recordMovement);
//     window.removeEventListener("pointerup", selectIfNoMovement);
// }

export function addPickListeners(canvas, pickCallback) {
    // window.addEventListener("mousemove", (event) =>
    //     setPickPosition(event, canvas)
    // );
    // window.addEventListener("mouseout", clearPickPosition);
    // window.addEventListener("mouseleave", clearPickPosition);

    // window.addEventListener(
    //     "touchstart",
    //     (event) => {
    //         // prevent the window from scrolling
    //         event.preventDefault();
    //         setPickPosition(event.touches[0], canvas);
    //     },
    //     { passive: false }
    // );

    // window.addEventListener("touchmove", (event) => {
    //     setPickPosition(event.touches[0], canvas);
    // });

    // window.addEventListener("touchend", clearPickPosition);

    // window.addEventListener("pointerdown", (event) => console.log("hello"));

    const selectIfNoMovement = (event) => {
        if (pickPosition.moveX < 5 && pickPosition.moveY < 5) {
            pickCallback();
        }

        window.removeEventListener("pointermove", recordMovement);
        window.removeEventListener("pointerup", selectIfNoMovement);
    };

    canvas.addEventListener(
        "pointerdown",
        (event) => {
            event.preventDefault();
            recordPressStart(event, canvas);
            window.addEventListener("pointermove", (event) =>
                recordMovement(event, canvas)
            );
            window.addEventListener("pointerup", selectIfNoMovement);
        },
        { passive: false }
    );
}
