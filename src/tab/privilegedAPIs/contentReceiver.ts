/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../../common/browser";
import {decrypt, windowPostEncryptedMessage} from "../utils/encryption";
import {getTabStorage, setTabStorage} from "../utils/storageHelper";
import {MessageData, StorageChanges} from "../utils/types";
import {runtimeConnect} from "../utils/utils";
import {PRIVILEGED_API} from "./constants";
import {EventData} from "./types";


type StorageChangeListener = (changes: StorageChanges, areaName: string) => void;

const storageChangeSubscriptions = new Map<string, StorageChangeListener>();


const privilegedApiRequestsHandler = <T extends keyof MessageData>(event: MessageEvent<EventData<T>>) => {
    const {type} = event.data;

    switch (type) {
        case PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET: {
            const {key} = event.data.payload;

            browser.storage.local.get(key, (response: any) => {
                windowPostEncryptedMessage({
                    response,
                    type: `${PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET}.response`,
                    key,
                }, "response");
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
        case PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED: {
            const {payload: {key}, subscriptionId} = event.data;
            const keys = Array.isArray(key) ? key : [key];

            const listener: StorageChangeListener = (changes, areaName) => {
                if (areaName !== "local") return;

                const response = Object.fromEntries(
                    Object.entries(changes).filter(([changedKey]) => keys.includes(changedKey))
                );

                if (Object.keys(response).length === 0) return;

                windowPostEncryptedMessage({
                    response,
                    type: `${PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED}.response`,
                    subscriptionId,
                }, "response");
            };

            storageChangeSubscriptions.set(subscriptionId, listener);

            browser.storage.onChanged.addListener(listener);
            break;
        }
        case PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED_UNSUBSCRIBE: {
            const {subscriptionId} = event.data;
            const listener = storageChangeSubscriptions.get(subscriptionId);

            if (listener) {
                browser.storage.onChanged.removeListener(listener);

                storageChangeSubscriptions.delete(subscriptionId);
            }
            break;
        }
        case PRIVILEGED_API.GET_TAB_STORAGE: {
            const {tabId} = event.data.payload;

            getTabStorage(tabId).then((response) => {
                windowPostEncryptedMessage({
                    response,
                    type: `${PRIVILEGED_API.GET_TAB_STORAGE}.response`,
                }, "response");
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
                windowPostEncryptedMessage({
                    response,
                    type: `${PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE}.response`,
                    requestId,
                }, "response");
            });
            break;
        }
        case PRIVILEGED_API.BROWSER_RUNTIME_CONNECT: {
            const {name, payload, portId} = event.data;

            runtimeConnect({
                name,
                data: payload,
                onMessage: (response) => {
                    windowPostEncryptedMessage({
                        response,
                        type: `${PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response`,
                        portId,
                    }, "response");
                },
                onDisconnect: () => {
                    setTimeout((portIdRef: string) => {
                        window.postMessage(
                            {
                                type: `${PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response.disconnect`,
                                portId: portIdRef
                            },
                            "*"
                        );
                    }, 100, portId);
                }
            });

            break;
        }
    }
}

const processPrivilegedApiRequests = (event: MessageEvent) => {
    if (
        event.source !== window ||
        !event.data ||
        typeof event.data !== "object" ||
        !("type" in event.data)
    ) {
        return;
    }

    const {type} = event.data;

    switch (type) {
        case PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET:
        case PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET:
        case PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED:
        case PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED_UNSUBSCRIBE:
        case PRIVILEGED_API.GET_TAB_STORAGE:
        case PRIVILEGED_API.SET_TAB_STORAGE:
        case PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE:
        case PRIVILEGED_API.BROWSER_RUNTIME_CONNECT:{
            const {payload: encryptedPayload} = event.data;

            if(encryptedPayload) {
                decrypt(encryptedPayload).then((payload) => {
                    privilegedApiRequestsHandler({
                        ...event,
                        data: {
                            ...event.data,
                            payload
                        }
                    });
                });
            } else {
                privilegedApiRequestsHandler(event);
            }

            break;
        }
    }
};

window.addEventListener("message", processPrivilegedApiRequests);
