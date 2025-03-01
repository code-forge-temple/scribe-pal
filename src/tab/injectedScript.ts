/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {EXTENSION_NAME} from "../common/constants";
import {showChat} from "./features/chat/actions/showChat";
import {generateKey} from "./utils/encryption";

type ChatBoxId = string;

type IsChatBoxShown = boolean;

type ExtensionNamespace = {
    showChat: typeof showChat;
    shownChatBoxes: Record<ChatBoxId, IsChatBoxShown>;
    encryption: {
        key: CryptoKey;
    };
}

interface ExtensionWindow extends Window {
    [EXTENSION_NAME]: ExtensionNamespace;
}

declare const window: ExtensionWindow;

(async () => {
    const key = await generateKey();

    if (!window[EXTENSION_NAME]) {
        window[EXTENSION_NAME] = {
            showChat,
            shownChatBoxes: {},
            encryption: {
                key
            }
        };
    }
})();