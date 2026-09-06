/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useState, useEffect, useCallback} from "react";
import {
    polyfillStorageLocalGet,
    polyfillStorageLocalSet,
    polyfillStorageOnChanged
} from "../privilegedAPIs/privilegedAPIs";

/**
 * Global-scope counterpart to `usePersistentState` (which is per-chatbox only).
 * Reads/writes a single top-level `storage.local` key and stays in sync with other
 * chat boxes / tabs through `storage.onChanged`.
 */
export function useGlobalStorage<T> (key: string, defaultValue: T): [T, (next: T) => void] {
    const [value, setValue] = useState<T>(defaultValue);

    useEffect(() => {
        let active = true;

        polyfillStorageLocalGet(key)
            .then((result) => {
                if (active && result?.[key] !== undefined) {
                    setValue(result[key]);
                }
            })
            .catch(() => { /* extension context gone / storage unavailable — keep the default */ });

        let unsubscribe = () => {};

        try {
            unsubscribe = polyfillStorageOnChanged(key, (changes) => {
                if (changes[key]) {
                    setValue(changes[key].newValue ?? defaultValue);
                }
            });
        } catch { /* storage.onChanged unavailable — no live sync, load-on-mount still applies */ }

        return () => {
            active = false;
            unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const persist = useCallback((next: T) => {
        setValue(next); // optimistic; the echoed onChanged is an idempotent no-op
        polyfillStorageLocalSet({[key]: next}).catch(() => { /* context gone; local state still updated */ });
    }, [key]);

    return [value, persist];
}
