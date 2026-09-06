/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {MESSAGE_TYPES} from "../../../common/constants";
import {polyfillRuntimeSendMessage} from "../../privilegedAPIs/privilegedAPIs";

type OnCaptureImageFinished = (imageDataUrl: string) => void;

export function startCaptureImage (onCaptureImageFinished: OnCaptureImageFinished): void {
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let isDragging = false;
    const highlighter = document.createElement("div");
    const overlay = document.createElement("div");

    Object.assign(highlighter.style, {
        position: "fixed",
        pointerEvents: "none",
        border: "2px dashed #0078d7",
        background: "#00fff530",
        borderRadius: "4px",
        zIndex: "1000002",
        padding: "0",
        margin: "0",
        width: "0",
    });

    Object.assign(overlay.style, {
        position: "fixed",
        padding: "0",
        margin: "0",
        background: "#fff0",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "1000001",
        cursor: "crosshair",
    });

    document.body.appendChild(overlay);
    document.body.appendChild(highlighter);

    const mouseDownHandler = (e: MouseEvent) => {
        e.preventDefault();

        document.body.style.userSelect = "none";

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        Object.assign(highlighter.style, {
            left: `${startX}px`,
            top: `${startY}px`,
            width: `0px`,
            height: `0px`,
        });

        overlay.addEventListener("mousemove", mouseMoveHandler);
        overlay.addEventListener("mouseup", mouseUpHandler, {once: true});
    };

    const mouseMoveHandler = (e: MouseEvent) => {
        if (!isDragging) return;

        currentX = e.clientX;
        currentY = e.clientY;

        const rectLeft = Math.min(startX, currentX);
        const rectTop = Math.min(startY, currentY);
        const rectWidth = Math.abs(startX - currentX);
        const rectHeight = Math.abs(startY - currentY);

        Object.assign(highlighter.style, {
            left: `${rectLeft}px`,
            top: `${rectTop}px`,
            width: `${rectWidth}px`,
            height: `${rectHeight}px`,
        });
    };

    const mouseUpHandler = async () => {
        isDragging = false;

        document.body.style.userSelect = "";

        overlay.removeEventListener("mousemove", mouseMoveHandler);

        overlay.remove();
        highlighter.remove();

        const rectLeft = Math.min(startX, currentX);
        const rectTop = Math.min(startY, currentY);
        const rectWidth = Math.abs(startX - currentX);
        const rectHeight = Math.abs(startY - currentY);

        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const response = await polyfillRuntimeSendMessage({type: MESSAGE_TYPES.CAPTURE_VISIBLE_TAB});

            if (response && response.dataUrl) {
                try {
                    // Decode via a Blob instead of new Image()/img.src, which is
                    // subject to the page's CSP img-src.
                    const bitmap = await dataUrlToImageBitmap(response.dataUrl);

                    const croppedCanvas = document.createElement("canvas");

                    // Scale CSS-pixel rect to the screenshot's physical-pixel size
                    // (also covers browser zoom, since both scale together).
                    const scaleX = bitmap.width / window.innerWidth;
                    const scaleY = bitmap.height / window.innerHeight;

                    const sourceX = rectLeft * scaleX;
                    const sourceY = rectTop * scaleY;
                    const sourceWidth = rectWidth * scaleX;
                    const sourceHeight = rectHeight * scaleY;

                    croppedCanvas.width = sourceWidth;
                    croppedCanvas.height = sourceHeight;

                    const ctx = croppedCanvas.getContext("2d");

                    if (ctx) {
                        ctx.drawImage(
                            bitmap,
                            sourceX,
                            sourceY,
                            sourceWidth,
                            sourceHeight,
                            0,
                            0,
                            sourceWidth,
                            sourceHeight
                        );

                        const rawBase64Image = croppedCanvas.toDataURL("image/png");

                        onCaptureImageFinished(rawBase64Image);
                    } else {
                        onCaptureImageFinished("");
                    }

                    bitmap.close();
                } catch (error) {
                    console.error("Error decoding captured image:", error);

                    onCaptureImageFinished("");
                }
            } else {
                console.error("Capture failed:", (response && response.error) || "no dataUrl in response");

                onCaptureImageFinished("");
            }
        } catch (error) {
            console.error("Error capturing image:", error);

            onCaptureImageFinished("");
        }
    };

    overlay.addEventListener("mousedown", mouseDownHandler, {once: true});
}

// Decodes a base64 data URL into an ImageBitmap, bypassing CSP img-src.
async function dataUrlToImageBitmap (dataUrl: string): Promise<ImageBitmap> {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = /data:(.*?);base64/.exec(header);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return createImageBitmap(new Blob([bytes], {type: mime}));
}