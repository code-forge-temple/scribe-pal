/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser, getManifestVersion} from "../../common/browser";
import {getTabStorage, setTabStorage} from "../utils/storageHelper";
import {MessageData, RuntimeConnectParams} from "../utils/types";
import {generateUniqueId, runtimeConnect} from "../utils/utils";
import {PRIVILEGED_API} from "./constants";
import {
    EventDataResponse,
    isBrowserRuntimeConnectResponseDisconnect,
    isBrowserRuntimeConnectResponse,
    isBrowserRuntimeSendMessageResponse,
    isBrowserStorageLocalGetResponse,
    isBrowserStorageLocalSetResponse,
    isGetTabStorageResponse,
    isSetTabStorageResponse
} from "./types";


export const polyfillStorageLocalGet = async (key: string | string[]): Promise<any> => {
    if (browser && browser.storage?.local?.get) {
        return JSON.parse(JSON.stringify(await browser.storage.local.get(key)));
    } else {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isBrowserStorageLocalGetResponse(event.data)) return;

                const {key: refKey, response} = event.data;

                if (refKey === key) {

                    window.removeEventListener("message", listener);

                    resolve(JSON.parse(JSON.stringify(response)));
                }
            };

            window.addEventListener("message", listener);
            window.postMessage({type: PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET, payload: {key}}, "*");
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
            window.postMessage(
                {type: PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET, payload},
                "*"
            );
        });
    }
};

export const polyfillGetTabStorage = async (tabId: number): Promise<any> => {
    if (getManifestVersion() === 3) {
        return await getTabStorage(tabId);
    } else {
        return new Promise((resolve) => {
            const listener = (event: MessageEvent<EventDataResponse>) => {
                if(!isGetTabStorageResponse(event.data)) return;

                const {response} = event.data;

                window.removeEventListener("message", listener);

                resolve(JSON.parse(JSON.stringify(response)));
            };

            window.addEventListener("message", listener);
            window.postMessage(
                {type: PRIVILEGED_API.GET_TAB_STORAGE, payload: {tabId}},
                "*"
            );
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
            window.postMessage(
                {type: PRIVILEGED_API.SET_TAB_STORAGE, payload: {tabId, tabContents}},
                "*"
            );
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

                const {requestId: refRequestId, response} = event.data;

                if (refRequestId === requestId) {
                    window.removeEventListener("message", listener);

                    resolve(response);
                }
            };

            window.addEventListener("message", listener);
            window.postMessage(
                {type: PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE, payload, requestId},
                "*"
            );
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

export const polyfillRuntimeConnect = <D extends keyof MessageData>({name, data, onMessage}: RuntimeConnectParams<D>) => {
    if (getManifestVersion() === 3) {
        runtimeConnect({name, data, onMessage});
    } else {
        const portId = generateUniqueId();
        const listener = (event: MessageEvent<EventDataResponse>) => {
            if(isBrowserRuntimeConnectResponse(event.data)) {
                const {portId: refPortId, response} = event.data;

                if (refPortId === portId) {
                    onMessage(response);
                }
            } else if(isBrowserRuntimeConnectResponseDisconnect(event.data)) {
                window.removeEventListener("message", listener);
            }
        };

        window.addEventListener("message", listener);
        window.postMessage(
            {
                type: PRIVILEGED_API.BROWSER_RUNTIME_CONNECT,
                name,
                payload: data,
                portId,
            },
            "*"
        );
    }

}