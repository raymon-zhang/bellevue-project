import { config } from "../config.js";
import { auth } from "./firebase.js";
import { loadPanelImage } from "./utils.js";
import feather from "feather-icons";

let prevModal = null;
export function pickCallback(panelId) {
    if (!panelId) return;

    if (prevModal) prevModal.remove();
    const container = document.createElement("div");
    container.classList.add("modal");
    prevModal = container;

    const topContainer = document.createElement("div");
    topContainer.classList.add("topContainer");
    const newContent = document.createTextNode(`Panel ${panelId} was clicked!`);
    const closeButton = document.createElement("button");
    closeButton.innerHTML = feather.icons.x.toSvg({
        width: 18,
        height: 18,
    });
    closeButton.classList.add("closeButton");
    closeButton.onclick = () => container.remove();
    topContainer.appendChild(newContent);
    topContainer.appendChild(closeButton);

    container.appendChild(topContainer);
    document.body.appendChild(container);

    fetch(`${config.apiUrl}/cache/panelInfo/${panelId}`).then((res) => {
        if (res.status === 200) {
            return;
        } else if (res.status === 202) {
            createModalContent();
        }
    });

    const createModalContent = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/png, image/jpeg";
        fileInput.id = "fileInput";
        fileInput.name = "fileInput";

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Submit";
        submitButton.onclick = async () => {
            let file = fileInput.files[0];
            if (!file) return;
            let data = new FormData();
            data.append("panel", fileInput.files[0]);
            data.append("panelId", panelId);
            data.append("idToken", await auth.currentUser.getIdToken(true));
            container.remove();
            const res = await fetch(`${config.apiUrl}/cache/uploadPanel`, {
                method: "POST",
                body: data,
            });
            console.log(res);
            loadPanelImage(panelId);
        };
        submitButton.classList.add("submitButton");

        // container.appendChild(newContent);
        // const innerContainer = document.createElement("div");
        // innerContainer.classList.add("innerContainer");

        container.appendChild(fileInput);
        container.appendChild(submitButton);
        // container.appendChild(closeButton);
        // container.appendChild(innerContainer);
    };
}
