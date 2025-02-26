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
        port.disconnect();
        port.onMessage.removeListener(listener);

        if(onDisconnect) onDisconnect();
    });
}