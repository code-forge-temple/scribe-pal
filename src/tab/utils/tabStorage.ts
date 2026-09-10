/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {polyfillGetTabStorage, polyfillSetTabStorage} from "../privilegedAPIs/privilegedAPIs";
import {ChatBoxIds} from "./types";

// Everything a chat box persists lives under one `tabs` storage key, so a writer can only
// rewrite the whole blob, never a single field. Two writers that both read before either
// writes will each write back a snapshot missing the other's change. Serialising the
// read-modify-write cycles is what stops that — the chat log and the context usage
// otherwise collide on every response's final chunk.
let queue: Promise<unknown> = Promise.resolve();

export const updateChatBoxStorage = (
    {tabId, chatBoxId}: ChatBoxIds,
    mutate: (chatBoxStorage: Record<string, any>) => void
): Promise<void> => {
    queue = queue
        .then(async () => {
            const currentTab = await polyfillGetTabStorage(tabId);

            currentTab.chatBoxes = currentTab.chatBoxes || {};
            currentTab.chatBoxes[chatBoxId] = currentTab.chatBoxes[chatBoxId] || {};

            mutate(currentTab.chatBoxes[chatBoxId]);

            await polyfillSetTabStorage(tabId, currentTab);
        })
        // A failed write must not break the chain for every writer after it.
        .catch(() => { /* extension context gone / storage unavailable */ });

    return queue as Promise<void>;
};
