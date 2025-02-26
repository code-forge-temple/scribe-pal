/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

export const PRIVILEGED_API = {
    BROWSER_STORAGE_LOCAL_GET: "browser.storage.local.get",
    BROWSER_STORAGE_LOCAL_SET: "browser.storage.local.set",
    BROWSER_RUNTIME_SEND_MESSAGE: "browser.runtime.sendMessage",
    BROWSER_RUNTIME_CONNECT: "browser.runtime.connect",
    GET_TAB_STORAGE: "getTabStorage",
    SET_TAB_STORAGE: "setTabStorage",
} as const;