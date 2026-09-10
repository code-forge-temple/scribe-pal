/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser, getManifestVersion} from "../../common/browser";
import {decrypt, windowPostEncryptedMessage} from "../utils/encryption";
import {getTabStorage, setTabStorage} from "../utils/storageHelper";
import {ErrorResponse, MessageData, MessageResponse, RuntimeConnectParams, StorageChanges} from "../utils/types";
import {generateUniqueId, runtimeConnect} from "../utils/utils";
import {PRIVILEGED_API} from "./constants";
import {
    EventDataResponse,
    isBrowserRuntimeConnectResponseDisconnect,
    isBrowserRuntimeConnectResponse,
    isBrowserRuntimeSendMessageResponse,
    isBrowserStorageLocalGetResponse,
    isBrowserStorageLocalSetResponse,
    isBrowserStorageOnChangedResponse,
    isGetTabStorageResponse,
    isSetTabStorageResponse
} from "./types";


export const polyfillStorageLocalGet = async (key: string | string[]): Promise<any> => {
    if (browser && browser.storage?.local?.get) {
        return await browser.storage.local.get(key);
    } else {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isBrowserStorageLocalGetResponse(event.data)) return;

                const {key: refKey, response: encryptedResponse} = event.data;

                if (refKey === key) {
                    window.removeEventListener("message", listener);

                    decrypt(encryptedResponse).then(response => {
                        resolve(response);
                    });
                }
            };

            window.addEventListener("message", listener);

            windowPostEncryptedMessage({
                type: PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET,
                payload: {key}
            }, "payload");
        });
    }
};

export const polyfillStorageLocalSet = async (payload: Record<string, any>): Promise<void> => {
    if (browser && browser.storage?.local?.set) {
        return await browser.storage.local.set(payload);
    } else {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isBrowserStorageLocalSetResponse(event.data)) return;

                window.removeEventListener("message", listener);

                resolve();
            };

            window.addEventListener("message", listener);

            windowPostEncryptedMessage({
                type: PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET,
                payload
            }, "payload");
        });
    }
};

// Subscribe to `storage.local` changes for `key`; returns an unsubscribe function. Long-lived
// like `polyfillRuntimeConnect`, so the MV2 branch tags its request with a `subscriptionId` and
// tears the contentReceiver-side listener down again on unsubscribe.
export const polyfillStorageOnChanged = (key: string | string[], listener: (changes: StorageChanges) => void): (() => void) => {
    const keys = Array.isArray(key) ? key : [key];
    const pickSubscribed = (changes: StorageChanges) => Object.fromEntries(
        Object.entries(changes).filter(([changedKey]) => keys.includes(changedKey))
    );

    if (browser && browser.storage?.onChanged?.addListener) {
        const wrapped = (changes: StorageChanges, areaName: string) => {
            if (areaName !== "local") return;

            const subscribed = pickSubscribed(changes);

            if (Object.keys(subscribed).length > 0) listener(subscribed);
        };

        browser.storage.onChanged.addListener(wrapped);

        return () => browser.storage.onChanged.removeListener(wrapped);
    } else {
        const subscriptionId = generateUniqueId();
        const wrapped = (event: MessageEvent<EventDataResponse>) => {
            if(!isBrowserStorageOnChangedResponse(event.data)) return;

            const {subscriptionId: refSubscriptionId, response: encryptedResponse} = event.data;

            if (refSubscriptionId === subscriptionId) {
                decrypt<StorageChanges>(encryptedResponse).then(listener);
            }
        };

        window.addEventListener("message", wrapped);

        windowPostEncryptedMessage({
            type: PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED,
            payload: {key},
            subscriptionId
        }, "payload");

        return () => {
            window.removeEventListener("message", wrapped);

            window.postMessage(
                {
                    type: PRIVILEGED_API.BROWSER_STORAGE_ON_CHANGED_UNSUBSCRIBE,
                    subscriptionId
                },
                "*"
            );
        };
    }
};

export const polyfillGetTabStorage = async (tabId: number): Promise<any> => {
    if (getManifestVersion() === 3) {
        return await getTabStorage(tabId);
    } else {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isGetTabStorageResponse(event.data)) return;

                const {response: encryptedResponse} = event.data;

                window.removeEventListener("message", listener);

                decrypt(encryptedResponse).then(response => {
                    resolve(response);
                });
            };

            window.addEventListener("message", listener);

            windowPostEncryptedMessage({
                type: PRIVILEGED_API.GET_TAB_STORAGE,
                payload: {tabId}
            }, "payload");
        });
    }
};

export const polyfillSetTabStorage = async (tabId: number, tabContents: any): Promise<void> => {
    if (getManifestVersion() === 3) {
        return await setTabStorage(tabId, tabContents);
    } else {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isSetTabStorageResponse(event.data)) return;

                window.removeEventListener("message", listener);

                resolve();
            };

            window.addEventListener("message", listener);

            windowPostEncryptedMessage({
                type: PRIVILEGED_API.SET_TAB_STORAGE,
                payload: {tabId, tabContents}
            }, "payload");
        });
    }
};

export const polyfillRuntimeSendMessage = async (payload: any): Promise<any> => {
    if (browser && browser.runtime && browser.runtime.sendMessage) {
        return await browser.runtime.sendMessage(payload);
    } else {
        const requestId = generateUniqueId();

        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isBrowserRuntimeSendMessageResponse(event.data)) return;

                const {requestId: refRequestId, response: encryptedResponse} = event.data;

                if (refRequestId === requestId) {
                    window.removeEventListener("message", listener);

                    decrypt(encryptedResponse).then(response => {
                        resolve(response);
                    });
                }
            };

            window.addEventListener("message", listener);

            windowPostEncryptedMessage({
                type: PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE,
                payload,
                requestId
            }, "payload");
        });
    }
};

export async function polyfillScriptingExecuteScript (
    options: { target: { tabId: number }; files?: string[]; func?: (...args: any[]) => any; args?: any[] }
) {
    if (browser.scripting && browser.scripting.executeScript) {
        return await browser.scripting.executeScript(options);
    } else if (browser.tabs && browser.tabs.executeScript) {
        const {tabId} = options.target;

        if (options.func) {
            const args = options.args || [];
            const code = `(${options.func})(${args.map(arg => JSON.stringify(arg)).join(",")});`;

            return await browser.tabs.executeScript(tabId, {code});
        } else if (options.files && options.files.length > 0) {
            let lastResult: any;

            for (const file of options.files) {
                lastResult = await browser.tabs.executeScript(tabId, {file});
            }

            return lastResult;
        } else {
            throw new Error("Either 'func' or 'files' must be provided to execute script");
        }
    } else {
        throw new Error("No supported API to execute script");
    }
}

export const polyfillCaptureVisibleTab = async (windowId: number): Promise<{success: true; dataUrl: string} | ErrorResponse> => {
    try {
        const dataUrl = await browser.tabs.captureVisibleTab(windowId, {format: "png"});

        return {success: true, dataUrl};
    } catch (error) {
        return {success: false, error: error instanceof Error ? error.message : String(error)};
    }
};

export const polyfillRuntimeConnect = <D extends keyof MessageData>({name, data, onMessage, onDisconnect}: RuntimeConnectParams<D>) => {
    if (getManifestVersion() === 3) {
        runtimeConnect({name, data, onMessage, onDisconnect});
    } else {
        const portId = generateUniqueId();
        const listener = (event: MessageEvent<EventDataResponse>) => {
            if(isBrowserRuntimeConnectResponse(event.data)) {
                const {portId: refPortId, response: encryptedResponse} = event.data;

                if (refPortId === portId) {
                    decrypt<MessageResponse[D]>(encryptedResponse).then(response => {
                        onMessage(response);
                    });
                }
            } else if(isBrowserRuntimeConnectResponseDisconnect(event.data)) {
                window.removeEventListener("message", listener);

                if (onDisconnect) onDisconnect();
            }
        };

        window.addEventListener("message", listener);

        windowPostEncryptedMessage({
            type: PRIVILEGED_API.BROWSER_RUNTIME_CONNECT,
            name,
            payload: data,
            portId,
        }, "payload");
    }
}