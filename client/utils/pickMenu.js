import { loadPanelImage } from "./utils.js";
import feather from "feather-icons";

let prevModal = null;
export function pickCallback(panelId) {
    if (!panelId) return;

    if (prevModal) prevModal.remove();
    const container = document.createElement("div");
    container.classList.add("modal");
    prevModal = container;

    const newContent = document.createTextNode(`Panel ${panelId} was clicked!`);

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
        const res = await fetch("http://localhost:3000/cache/uploadPanel", {
            method: "POST",
            body: data,
        });
        console.log(res);
        container.remove();
        loadPanelImage(panelId);
    };
    submitButton.classList.add("submitButton");

    const closeButton = document.createElement("button");
    closeButton.innerHTML = feather.icons.x.toSvg({ width: 18, height: 18 });
    closeButton.classList.add("closeButton");
    closeButton.onclick = () => container.remove();

    const topContainer = document.createElement("div");
    topContainer.classList.add("topContainer");
    topContainer.appendChild(newContent);
    topContainer.appendChild(closeButton);

    // container.appendChild(newContent);
    const innerContainer = document.createElement("div");
    innerContainer.classList.add("innerContainer");

    innerContainer.appendChild(topContainer);
    innerContainer.appendChild(fileInput);
    innerContainer.appendChild(submitButton);
    // container.appendChild(closeButton);
    container.appendChild(innerContainer);

    document.body.appendChild(container);
}
