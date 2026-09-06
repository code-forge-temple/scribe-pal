/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useCallback, useRef, useState} from "react";

export function useAutoScroll () {
    const [autoScroll, setAutoScroll] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<Element | null>(null);
    // Last scrollTop we know about (set by our own scrolls or the previous event).
    // A `scroll` event only counts as a user interrupt when scrollTop drops below
    // this — content growth and our performScroll never scroll the view *up*.
    const lastScrollTopRef = useRef(0);
    const delay = 200;

    const performScroll = (chatDiv: Element | null) => {
        if (!chatDiv) return;

        chatDiv.scrollTop = chatDiv.scrollHeight;
        lastScrollTopRef.current = chatDiv.scrollTop;
    };

    const updateScroll = useCallback(
        (chatDiv: Element | null) => {
            if (!chatDiv || !autoScroll) {
                return;
            }

            // Always remember the latest container so the trailing scroll below
            // catches content that streamed in during the throttle window (a fast
            // model can finish an entire response inside one `delay`).
            pendingRef.current = chatDiv;

            if (timerRef.current === null) {
                performScroll(chatDiv);

                timerRef.current = setTimeout(() => {
                    timerRef.current = null;

                    if (pendingRef.current) {
                        performScroll(pendingRef.current);

                        pendingRef.current = null;
                    }
                }, delay);
            }
        },
        [autoScroll]
    );

    const userInterruptAutoScroll = useCallback(
        (event: Event) => {
            const target = event.target as HTMLElement;
            const previousScrollTop = lastScrollTopRef.current;

            lastScrollTopRef.current = target.scrollTop;

            const atBottom = Math.abs(target.scrollHeight - (target.scrollTop + target.clientHeight)) < 5;
            const scrolledUp = target.scrollTop < previousScrollTop - 2;

            if (!atBottom && scrolledUp) {
                setAutoScroll(false);
            }
        },
        []);

    return {updateScroll, setAutoScroll, userInterruptAutoScroll};
}
