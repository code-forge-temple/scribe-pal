/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

type OnCaptureFinished = (capturedText: string) => void;

export function startCapture (onCaptureFinished: OnCaptureFinished): void {
    const highlighter = document.createElement("div");
    let currentElement: HTMLElement | null = null;

    Object.assign(highlighter.style, {
        position: "fixed",
        pointerEvents: "none",
        border: "2px dashed #0078d7",
        background: "#00fff530",
        borderRadius: "4px",
        zIndex: "1000000",
        padding: "0",
        margin: "0",
        width: "0",
    });

    document.body.appendChild(highlighter);
    document.documentElement.style.cursor = "pointer";


    const mouseMoveHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (!target) return;

        currentElement = target;

        const rect = target.getBoundingClientRect();

        Object.assign(highlighter.style, {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
        });
    };

    const mouseClickHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (currentElement) {
            highlighter.remove();

            document.documentElement.style.cursor = "";

            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("click", mouseClickHandler, true);

            let capturedText = '';

            if (currentElement instanceof HTMLInputElement ||
            currentElement instanceof HTMLTextAreaElement ||
            currentElement instanceof HTMLSelectElement) {
                capturedText = currentElement.value.trim() || '';
            } else {
                capturedText = currentElement.innerText?.trim() || '';
            }

            onCaptureFinished(capturedText);
        }
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("click", mouseClickHandler, true);
}