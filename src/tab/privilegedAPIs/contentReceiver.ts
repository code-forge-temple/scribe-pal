/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../../common/browser";
import {getTabStorage, setTabStorage} from "../utils/storageHelper";
import {MessageData} from "../utils/types";
import {runtimeConnect} from "../utils/utils";
import {PRIVILEGED_API} from "./constants";
import {EventData} from "./types";


window.addEventListener("message", <T extends keyof MessageData>(event: MessageEvent<EventData<T>>) => {
    if (event.source !== window || !event.data) return;

    const {type} = event.data;

    switch (type) {
        case PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET: {
            const {key} = event.data.payload;

            browser.storage.local.get(key, (response: any) => {
                window.postMessage(
                    {
                        type: `${PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET}.response`,
                        key,
                        response
                    },
                    "*"
                );
            });
            break;
        }
        case PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET: {
            const {payload} = event.data;

            browser.storage.local.set(payload, () => {
                window.postMessage(
                    {type: `${PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET}.response`},
                    "*"
                );
            });
            break;
        }
        case PRIVILEGED_API.GET_TAB_STORAGE: {
            const {tabId} = event.data.payload;

            getTabStorage(tabId).then((response) => {
                window.postMessage(
                    {
                        type: `${PRIVILEGED_API.GET_TAB_STORAGE}.response`,
                        response
                    },
                    "*"
                );
            });
            break;
        }
        case PRIVILEGED_API.SET_TAB_STORAGE: {
            const {tabId, tabContents} = event.data.payload;

            setTabStorage(tabId, tabContents).then(() => {
                window.postMessage(
                    {type: `${PRIVILEGED_API.SET_TAB_STORAGE}.response`},
                    "*"
                );
            });
            break;
        }
        case PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE: {
            const {payload, requestId} = event.data;

            browser.runtime.sendMessage(payload, (response: any) => {
                window.postMessage(
                    {
                        type: `${PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE}.response`,
                        requestId,
                        response
                    },
                    "*"
                );
            });
            break;
        }
        case PRIVILEGED_API.BROWSER_RUNTIME_CONNECT: {
            const {name, payload, portId} = event.data;

            runtimeConnect({
                name,
                data: payload,
                onMessage: (response) => {
                    window.postMessage(
                        {
                            type: `${PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response`,
                            portId,
                            response
                        },
                        "*"
                    );
                },
                onDisconnect: () => {
                    window.postMessage(
                        {
                            type: `${PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response.disconnect`,
                            portId
                        },
                        "*"
                    );
                }
            });

            break;
        }
    }
});
