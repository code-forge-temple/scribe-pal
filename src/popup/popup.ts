/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../common/browser";
import {MESSAGE_TYPES} from "../common/constants";
import "./popup.scss";


const showNotification = (title: string, message: string) => {
    const iconUrl = browser.runtime.getURL("assets/icon48.png");
    browser.notifications.create("", {
        type: "basic",
        iconUrl,
        title,
        message,
    });
};

document.addEventListener("DOMContentLoaded", () => {
    browser.storage.local.get(["ollamaHost", "activeTheme"], (result: any) => {
        const ollamaUrl = document.getElementById("ollama-url") as HTMLInputElement;
        const toggle = document.getElementById("dark-theme-toggle") as HTMLImageElement | null;
        const status = document.getElementById("dark-theme-status") as HTMLSpanElement | null;
        let darkThemeActive = result.activeTheme === "dark";

        if (result.ollamaHost) {
            ollamaUrl.value = result.ollamaHost;
        }

        if (darkThemeActive) {
            document.body.classList.add("dark-theme");

            if (toggle) toggle.src = "assets/switch-on.svg";
            if (status) status.textContent = "On";
        } else {
            document.body.classList.remove("dark-theme");

            if (toggle) toggle.src = "assets/switch-off.svg";
            if (status) status.textContent = "Off";
        }

        if (toggle && status) {
            toggle.addEventListener("click", () => {
                darkThemeActive = !darkThemeActive;
                toggle.src = darkThemeActive ? "assets/switch-on.svg" : "assets/switch-off.svg";
                status.textContent = darkThemeActive ? "On" : "Off";

                if (darkThemeActive) {
                    document.body.classList.add("dark-theme");
                } else {
                    document.body.classList.remove("dark-theme");
                }

                browser.storage.local.set({activeTheme: darkThemeActive ? "dark" : "light"});

                browser.runtime.sendMessage({
                    type: MESSAGE_TYPES.ACTION_UPDATE_THEME,
                    theme: darkThemeActive ? "dark" : "light",
                });
            });
        }
    });
});

document.getElementById("save-ollama-url")?.addEventListener("click", () => {
    const ollamaUrl = document.getElementById("ollama-url") as HTMLInputElement;
    const url = ollamaUrl.value.trim();

    if (!url.startsWith("http")) {
        showNotification("Invalid URL", "Please enter a valid URL (e.g., http://localhost:11434)");

        return;
    }

    browser.storage.local.set({ollamaHost: url}, () => {
        showNotification("Saved", "Ollama API URL saved!");

        browser.runtime.sendMessage({
            type: MESSAGE_TYPES.ACTION_OLLAMA_HOST_UPDATED
        });
    });
});

document.getElementById("showChat")?.addEventListener("click", () => {
    browser.runtime.sendMessage({
        type: MESSAGE_TYPES.ACTION_SHOW_CHAT,
        message: "showChat",
    });
});
