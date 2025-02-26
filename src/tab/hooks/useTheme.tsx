/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useCallback, useEffect, RefObject} from "react";
import {polyfillStorageLocalGet} from "../privilegedAPIs/privilegedAPIs";

export function useTheme (ref: RefObject<HTMLDivElement | null>) {
    const applyTheme = useCallback(async () => {
        const result = await polyfillStorageLocalGet("activeTheme");

        if (result.activeTheme === "dark") {
            ref.current?.classList.add("dark-theme");
        } else {
            ref.current?.classList.remove("dark-theme");
        }
    }, [ref]);

    useEffect(() => {
        applyTheme();

        window.addEventListener("focus", applyTheme);

        return () => window.removeEventListener("focus", applyTheme);
    }, [applyTheme]);

    return applyTheme;
}