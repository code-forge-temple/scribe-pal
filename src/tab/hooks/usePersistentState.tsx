/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useState, useEffect, useCallback} from "react";
import {ChatBoxIds} from "../utils/types";
import {polyfillGetTabStorage, polyfillSetTabStorage} from "../privilegedAPIs/privilegedAPIs";

export function usePersistentState<T> (
    key: string,
    defaultValue: T,
    {tabId, chatBoxId}: ChatBoxIds
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(defaultValue);

    const loadState = useCallback(async () => {
        const currentTab = await polyfillGetTabStorage(tabId);
        const value = currentTab.chatBoxes[chatBoxId]?.[key];

        if (value !== undefined) {
            setState(value);
        }
    }, [tabId, chatBoxId, key]);

    const persistState = useCallback(async () => {
        const currentTab = await polyfillGetTabStorage(tabId);
        currentTab.chatBoxes[chatBoxId] = currentTab.chatBoxes[chatBoxId] || {};
        currentTab.chatBoxes[chatBoxId][key] = state;

        await polyfillSetTabStorage(tabId, currentTab);
    }, [tabId, chatBoxId, key, state]);

    useEffect(() => {
        loadState();
    }, [loadState]);

    useEffect(() => {
        persistState();
    }, [persistState]);

    return [state, setState];
}