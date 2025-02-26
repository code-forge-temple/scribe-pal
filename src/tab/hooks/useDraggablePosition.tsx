/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useRef} from 'react';
import {usePersistentState} from "./usePersistentState";

type DraggableOptions = {
    tabId: number;
    chatBoxId: string;
}

type Position = {
    left: string;
    top: string;
}

type SetPosition = (pos: Position) => void;

type DragState = {
    offsetX: number;
    offsetY: number;
    isDown: boolean;
}

type HandleDrag = (boxRef: React.RefObject<HTMLDivElement | null>, SNAP_DISTANCE?: number) => () => void;

export function useDraggablePosition (
    {tabId, chatBoxId}: DraggableOptions,
    initialPosition: Position = {left: "100px", top: "100px"}
): [Position, SetPosition, HandleDrag] {
    const [position, setPosition] = usePersistentState<Position>("chatBoxPosition", initialPosition, {tabId, chatBoxId});
    const posRef = useRef<DragState>({offsetX: 0, offsetY: 0, isDown: false});

    const handleDrag = (boxRef: React.RefObject<HTMLDivElement | null>, SNAP_DISTANCE: number = 20) => {
        const box = boxRef.current;
        if (!box) return () => { };

        const header = box.querySelector(".chat-box-header");
        if (!header) return () => { };

        const handleMouseDown = (e: MouseEvent) => {
            const rect = box.getBoundingClientRect();

            posRef.current.isDown = true;
            posRef.current.offsetX = rect.left - e.clientX;
            posRef.current.offsetY = rect.top - e.clientY;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!posRef.current.isDown) return;

            let newLeft = e.clientX + posRef.current.offsetX;
            let newTop = e.clientY + posRef.current.offsetY;

            const {clientWidth: viewportWidth, clientHeight: viewportHeight} = document.documentElement;
            const {offsetWidth: boxWidth, offsetHeight: boxHeight} = box;

            // Apply bounds and snapping
            newLeft = Math.max(0, Math.min(newLeft, viewportWidth - boxWidth));
            newTop = Math.max(0, Math.min(newTop, viewportHeight - boxHeight));

            if (newLeft < SNAP_DISTANCE) {
                newLeft = 0;
            } else if (viewportWidth - boxWidth - newLeft < SNAP_DISTANCE) {
                newLeft = viewportWidth - boxWidth;
            }

            if (newTop < SNAP_DISTANCE) {
                newTop = 0;
            } else if (viewportHeight - boxHeight - newTop < SNAP_DISTANCE) {
                newTop = viewportHeight - boxHeight;
            }

            box.style.left = `${newLeft}px`;
            box.style.top = `${newTop}px`;

            e.preventDefault();
        };

        const handleMouseUp = () => {
            if (posRef.current.isDown) {
                posRef.current.isDown = false;
                setPosition({
                    left: box.style.left,
                    top: box.style.top
                });
            }
        };

        header.addEventListener("mousedown", handleMouseDown as EventListener);
        document.addEventListener("mousemove", handleMouseMove as EventListener);
        document.addEventListener("mouseup", handleMouseUp as EventListener);

        return () => {
            header.removeEventListener("mousedown", handleMouseDown as EventListener);
            document.removeEventListener("mousemove", handleMouseMove as EventListener);
            document.removeEventListener("mouseup", handleMouseUp as EventListener);
        };
    };

    return [position, setPosition, handleDrag];
}