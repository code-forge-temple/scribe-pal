/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {OllamaService} from "./services/ollamaService";
import {EXTENSION_NAME, MESSAGE_TYPES} from "../common/constants";
import {getTabStorage, setTabStorage} from "./utils/storageHelper";
import {browser} from "../common/browser";
import {polyfillScriptingExecuteScript} from "./privilegedAPIs/privilegedAPIs";
import {isFetchAiResponseMessageData, isFetchModelMessageData} from "./utils/types";


type MessageRequest = {
    type: string;
    messages?: { role: string; content: string }[];
    model?: string;
    theme?: string;
}

browser.runtime.onMessage.addListener((
    request: MessageRequest,
    sender: any,
    responseCallback: (response?: any) => void
) => {
    switch (request.type) {
        case MESSAGE_TYPES.ACTION_SHOW_CHAT:
            actionShowChat();

            break;

        case MESSAGE_TYPES.ACTION_OLLAMA_HOST_UPDATED:
            (async () => {
                const [{id: tabId}] = await browser.tabs.query({currentWindow: true, active: true});

                OllamaService.reloadInstance();

                browser.tabs.sendMessage(tabId, {type: MESSAGE_TYPES.ACTION_OLLAMA_HOST_UPDATED});
            })();

            break;

        case MESSAGE_TYPES.ACTION_UPDATE_THEME:
            (async () => {
                const [{id: tabId}] = await browser.tabs.query({currentWindow: true, active: true});

                browser.tabs.sendMessage(tabId, {type: MESSAGE_TYPES.ACTION_UPDATE_THEME});
            })();

            break;

        case MESSAGE_TYPES.FETCH_MODELS:
            OllamaService.getInstance()
                .fetchModels()
                .then(responseCallback);

            return true;

        case MESSAGE_TYPES.DELETE_MODEL:
            if (request.model) {
                OllamaService.getInstance()
                    .deleteModel(request.model)
                    .then(responseCallback);
            } else {
                responseCallback({error: "No model provided"});
            }

            return true;

        case MESSAGE_TYPES.ABORT_AI_RESPONSE:
            OllamaService.getInstance()
                .abortAIResponse()
                .then(responseCallback);

            return true;

        case MESSAGE_TYPES.CAPTURE_VISIBLE_TAB:
            (async () => {
                const [{windowId}] = await browser.tabs.query({currentWindow: true, active: true});

                browser.tabs.captureVisibleTab(windowId, {format: "png"}, function (dataUrl: string) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        responseCallback({dataUrl: ""});
                    } else {
                        responseCallback({dataUrl});
                    }
                });
            })();

            return true;

        default:
            console.error("Unknown request type:", request.type);

            responseCallback({error: "Unknown request type."});

            break;
    }
});

browser.runtime.onConnect.addListener((port: any) => {
    if (port.name === MESSAGE_TYPES.FETCH_AI_RESPONSE) {
        port.onMessage.addListener(async (data: unknown) => {
            if (isFetchAiResponseMessageData(data)) {
                try {
                    const stream = OllamaService.getInstance().fetchAIResponse(data.messages, data.model);

                    for await (const part of stream) {
                        port.postMessage(part);
                    }
                } catch (error) {
                    port.postMessage({
                        error: error instanceof Error ? error.message : String(error)
                    });
                } finally {
                    port.disconnect();
                    console.log("Port disconnected");
                }
            }
        });
    } else if (port.name === MESSAGE_TYPES.FETCH_MODEL) {
        port.onMessage.addListener(async (data: unknown) => {
            if (isFetchModelMessageData(data)) {
                try {
                    const stream = OllamaService.getInstance().pullModel(data.model);

                    for await (const part of stream) {
                        port.postMessage(part);
                    }
                } catch (error) {
                    port.postMessage({
                        error: error instanceof Error ? error.message : String(error),
                    });
                } finally {
                    port.disconnect();
                }
            }
        });
    }
});

browser.webNavigation.onCompleted.addListener(
    ({tabId, frameId}: { tabId: number; frameId: number }) => {
        if (frameId !== 0) return;

        (async () => {
            const tabStorage = await getTabStorage(tabId);
            const chatBoxesIds = Object.keys(tabStorage.chatBoxes);

            if (chatBoxesIds.length && !(await isScriptInjected(tabId))) {
                await polyfillScriptingExecuteScript({
                    target: {tabId},
                    files: ["injectedScript.js"],
                });
            }

            for (const chatBoxId of chatBoxesIds) {
                await showChat(tabId, chatBoxId);
            }
        })();
    },
    {url: [{urlMatches: ".*"}]}
);

browser.tabs.onRemoved.addListener((tabId: any) => {
    (async () => {
        setTabStorage(tabId, undefined);
    })();
});

browser.commands.onCommand.addListener((command:string) => {
    if (command === "show-chat") {
        actionShowChat();
    }
});

const isScriptInjected = async (tabId: number) => {
    const injectionResults = await polyfillScriptingExecuteScript({
        target: {tabId},
        func: (extensionName: string) => Boolean((window as any)[extensionName]),
        args: [EXTENSION_NAME],
    });

    return injectionResults[0]?.result;
}

const isChatShown = async (tabId: number, chatBoxId: string) => {
    const querySelector = await polyfillScriptingExecuteScript({
        target: {tabId},
        func: (extensionName: string, chatBoxId: string) => {
            const extensionNamespace = (window as any)[extensionName];

            return extensionNamespace.shownChatBoxes[chatBoxId] || false;
        },
        args: [EXTENSION_NAME, chatBoxId],
    });
    const chatIsShown:boolean = querySelector[0]?.result;

    return chatIsShown;
}

const actionShowChat = async () => {
    const [{id: tabId}] = await browser.tabs.query({currentWindow: true, active: true});
    const chatBoxId = crypto.randomUUID();

    if (!tabId) return;

    if (await isScriptInjected(tabId)) {
        await showChat(tabId, chatBoxId);
    } else {
        await polyfillScriptingExecuteScript({
            target: {tabId},
            files: ["injectedScript.js"],
        });

        await showChat(tabId, chatBoxId);
    }
}

const showChat = async (tabId: number, chatBoxId: string) => {
    const chatIsShown = await isChatShown(tabId, chatBoxId);

    if (!chatIsShown) {
        await polyfillScriptingExecuteScript({
            target: {tabId},
            func: (extensionName: string, tabId: number, chatBoxId: string) => {
                const extensionNamespace = (window as any)[extensionName];

                extensionNamespace.showChat(tabId, chatBoxId);

                extensionNamespace.shownChatBoxes[chatBoxId] = true;

            },
            args: [EXTENSION_NAME, tabId, chatBoxId],
        });
    }
}