/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useEffect, useCallback} from "react";

export type Position = {
    left: string;
    top: string;
};

type KeepInViewportProps = {
    ref: React.RefObject<HTMLDivElement | null>;
    position: Position;
    setPosition: (pos: Position) => void;
    isVisible: boolean;
};

export function useKeepInViewport ({ref, position, setPosition, isVisible}: KeepInViewportProps) {
    const checkPosition = useCallback(() => {
        if (isVisible && ref.current) {
            const rect = ref.current.getBoundingClientRect();

            if (window.innerWidth < rect.width) return;

            let newLeft = parseInt(position.left, 10);
            let newTop = parseInt(position.top, 10);
            let updated = false;

            if (rect.right > window.innerWidth) {
                newLeft = window.innerWidth - rect.width;
                updated = true;
            }
            if (rect.bottom > window.innerHeight) {
                newTop = window.innerHeight - rect.height;
                updated = true;
            }
            if (rect.left < 0) {
                newLeft = 0;
                updated = true;
            }
            if (rect.top < 0) {
                newTop = 0;
                updated = true;
            }

            if (updated) {
                const newPos = {left: `${newLeft}px`, top: `${newTop}px`};
                if (newPos.left !== position.left || newPos.top !== position.top) {
                    setPosition(newPos);
                }
            }
        }
    }, [isVisible, ref, position, setPosition]);

    useEffect(() => {
        checkPosition();

        window.addEventListener("resize", checkPosition);

        return () => {
            window.removeEventListener("resize", checkPosition);
        };
    }, [isVisible, ref, position, checkPosition, setPosition]);
}