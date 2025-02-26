/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useCallback, useRef} from "react";
import {ChatBoxIds} from "../utils/types";
import {usePersistentState} from "./usePersistentState";

export function useAutoScroll ({tabId, chatBoxId}: ChatBoxIds): [
    number,
    (chatDiv: Element | null) => void
] {
    const [scrollTop, setScrollTop] = usePersistentState<number>("chatBoxScroll", 0, {tabId, chatBoxId});
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const delay = 200;

    const updateScroll = useCallback((chatDiv: Element | null) => {
        if (chatDiv) {
            if (timerRef.current === null) {
                chatDiv.scrollTop = chatDiv.scrollHeight;

                setScrollTop(chatDiv.scrollTop);

                timerRef.current = setTimeout(() => {
                    timerRef.current = null;
                }, delay);
            }
        }
    }, [setScrollTop]);

    return [scrollTop, updateScroll];
}