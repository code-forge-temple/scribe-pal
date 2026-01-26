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
                const fullImage = new Image();

                fullImage.src = response.dataUrl;
                fullImage.onload = () => {
                    const croppedCanvas = document.createElement("canvas");

                    croppedCanvas.width = rectWidth;
                    croppedCanvas.height = rectHeight;

                    const ctx = croppedCanvas.getContext("2d");

                    if (ctx) {
                        ctx.drawImage(
                            fullImage,
                            rectLeft,
                            rectTop,
                            rectWidth,
                            rectHeight,
                            0,
                            0,
                            rectWidth,
                            rectHeight
                        );

                        const rawBase64Image = croppedCanvas.toDataURL("image/png");

                        onCaptureImageFinished(rawBase64Image);
                    } else {
                        onCaptureImageFinished("");
                    }
                };
                fullImage.onerror = () => {
                    console.error("Error loading captured image.");

                    onCaptureImageFinished("");
                };
            } else {
                onCaptureImageFinished("");
            }
        } catch (error) {
            console.error("Error capturing image:", error);

            onCaptureImageFinished("");
        }
    };

    overlay.addEventListener("mousedown", mouseDownHandler, {once: true});
}