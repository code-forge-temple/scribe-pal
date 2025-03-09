/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useCallback, useRef, useState} from "react";

export function useAutoScroll () {
    const [autoScroll, setAutoScroll] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const delay = 200;

    const updateScroll = useCallback(
        (chatDiv: Element | null) => {
            if (chatDiv && autoScroll) {
                if (timerRef.current === null) {
                    chatDiv.scrollTop = chatDiv.scrollHeight;

                    timerRef.current = setTimeout(() => {
                        timerRef.current = null;
                    }, delay);
                }
            }
        },
        [autoScroll]
    );

    const userInterruptAutoScroll = useCallback(
        (event: Event) => {
            const target = event.target as HTMLElement;
            const atBottom = Math.abs(target.scrollHeight - (target.scrollTop + target.clientHeight)) < 5;

            if (!atBottom) {
                setAutoScroll(false);
            }
        },
        []);

    return {updateScroll, setAutoScroll, userInterruptAutoScroll};
}