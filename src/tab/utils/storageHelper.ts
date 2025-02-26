/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../../common/browser";

export type TabsStorage = {
    [tabId: number]: {
        chatBoxes: {
            [chatBoxId: string]: {
                [key: string]: any;
            } | undefined;
        };
    };
} | undefined;

type TabData = NonNullable<TabsStorage>[number];

export async function getTabStorage (tabId: number): Promise<TabData> {
    const result = await browser.storage.local.get("tabs");
    const tabsStorage = (result.tabs ?? {}) as NonNullable<TabsStorage>;

    return tabsStorage[tabId] || {chatBoxes: {}};
}

export async function setTabStorage (tabId: number, tabContents: TabData | undefined): Promise<void> {
    const result = await browser.storage.local.get("tabs");
    const tabsStorage = (result.tabs ?? {}) as NonNullable<TabsStorage>;

    if (!tabContents) {
        delete tabsStorage[tabId];
    }
    else {
        tabsStorage[tabId] = tabContents;
    }

    await browser.storage.local.set({tabs: tabsStorage});
}