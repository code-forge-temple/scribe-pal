/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from "react";
import {createRoot} from "react-dom/client";
import {ChatBox} from "../../../components/ChatBox";
import {ShadowContext}from "../../../contexts/ShadowContext";
import {App} from "../../../components/App";

export function showChat (tabId: number, chatBoxId: string, coordsOffset: number): void {

    const host = document.createElement("div");
    const shadow = host.attachShadow({mode: "closed"});

    host.classList.add("scribe-pal-extension");

    host.style.width = "0";
    host.style.height = "0";
    host.style.padding = "0";
    host.style.margin = "0";

    document.body.appendChild(host);

    const root = createRoot(shadow);

    const handleRemove = () => {
        root.unmount();

        host.remove();
    };

    root.render(
        <ShadowContext.Provider value={shadow}>
            <App>
                <ChatBox chatBoxId={chatBoxId} tabId={tabId} onRemove={handleRemove} coordsOffset={coordsOffset} />
            </App>
        </ShadowContext.Provider>
    );
}
