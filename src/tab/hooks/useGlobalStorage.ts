/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useState, useEffect, useCallback, useRef} from "react";
import {
    polyfillStorageLocalGet,
    polyfillStorageLocalSet,
    polyfillStorageOnChanged
} from "../privilegedAPIs/privilegedAPIs";
import {withKeyedLock} from "../utils/keyedLock";

/**
 * Global-scope counterpart to `usePersistentState` (which is per-chatbox only).
 * Reads/writes a single top-level `storage.local` key and stays in sync with other
 * chat boxes / tabs through `storage.onChanged`.
 *
 * The setter takes an updater rather than a value: a key here holds a map of many models'
 * entries, so writing a value computed from the rendered snapshot would discard anything
 * another writer stored since this component last rendered.
 */
export function useGlobalStorage<T> (
    key: string,
    defaultValue: T
): [T, (update: (current: T) => T) => Promise<void>] {
    const [value, setValue] = useState<T>(defaultValue);
    const defaultValueRef = useRef(defaultValue);

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

    // Against storage, not the rendered snapshot: two chat boxes saving different models
    // would otherwise discard each other's entry.
    const persist = useCallback((update: (current: T) => T) => withKeyedLock(key, async () => {
        const stored = await polyfillStorageLocalGet(key);
        const current = (stored?.[key] ?? defaultValueRef.current) as T;
        const next = update(current);

        await polyfillStorageLocalSet({[key]: next});

        setValue(next);
    }).catch(() => { /* context gone / storage unavailable */ }), [key]);

    return [value, persist];
}
