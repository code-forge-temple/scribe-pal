/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../../common/browser";
import {MessageData, RuntimeConnectParams} from "./types";


export const prefixChatBoxId = (chatBoxId: string): string => `chat-box-${chatBoxId}`;

export const generateUniqueId = (): string => `${Date.now()}-${Math.random()}`;

export const runtimeConnect = <D extends keyof MessageData>({name, data, onMessage, onDisconnect}: RuntimeConnectParams<D>) => {
    const port = browser.runtime.connect({name});

    port.postMessage(data);

    const listener = (response: any) => {
        onMessage(response);
    };

    port.onMessage.addListener(listener);

    port.onDisconnect.addListener(() => {
        try {
            port.disconnect();
            port.onMessage.removeListener(listener);
        } finally {
            if(onDisconnect) onDisconnect();
        }
    });
}

export const getLanguageForExtension = (extension?: string): string => {
    switch (extension) {
        case "txt":
            return "text";
        case "md":
            return "markdown";
        case "html":
            return "html";
        case "css":
            return "css";
        case "scss":
            return "scss";
        case "js":
            return "javascript";
        case "ts":
            return "typescript";
        case "tsx":
            return "typescript";
        case "json":
            return "json";
        case "xml":
            return "xml";
        case "csv":
            return "csv";
        case "yaml":
        case "yml":
            return "yaml";
        case "ini":
            return "ini";
        case "log":
            return "text";
        case "sh":
            return "bash";
        case "sql":
            return "sql";
        case "py":
            return "python";
        case "java":
            return "java";
        case "c":
            return "c";
        case "cpp":
            return "cpp";
        case "h":
            return "cpp";
        case "bat":
            return "batch";
        case "env":
            return "text";
        default:
            return "text";
    }
};