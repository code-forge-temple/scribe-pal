/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../common/browser";
import {MESSAGE_TYPES} from "../common/constants";
import {Model} from "../tab/utils/types";
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
    const toggleBtn = document.getElementById("extra-settings-toggle");
    const extraSettings = document.querySelector(".extra-settings");

    if (toggleBtn && extraSettings) {
        toggleBtn.addEventListener("click", async () => {
            const extraSettingsCollapsed = extraSettings.classList.toggle("collapsed");
            toggleBtn.classList.toggle("rotated");

            /* For Firefox */
            document.documentElement.style.height = "auto";

            setTimeout(() => {
                document.documentElement.style.height = `${document.body.scrollHeight}px`;
            }, 500);
            /***************/

            if(!extraSettingsCollapsed) {
                const response = await browser.runtime.sendMessage({type: MESSAGE_TYPES.FETCH_MODELS});

                if (response && response.models) {
                    const {defaultLlm} = await browser.storage.local.get("defaultLlm");
                    const defaultLlmSelect = document.getElementById("default-llm") as HTMLSelectElement;
                    const models: Model[] = response.models;
                    const defaultLlmOptions = models.map((model: Model) => {
                        const option = document.createElement("option");

                        option.value = model.name;
                        option.textContent = model.name;

                        if (defaultLlm && model.name === defaultLlm) {
                            option.selected = true;
                        }

                        return option;
                    });
                    const defaultLlmLabel = document.createElement("option");

                    defaultLlmLabel.value = "";
                    defaultLlmLabel.textContent = "Select a model...";

                    if(!defaultLlm) {
                        defaultLlmLabel.selected = true;
                    }

                    defaultLlmSelect.innerHTML = "";
                    defaultLlmSelect.append(defaultLlmLabel);
                    defaultLlmSelect.append(...defaultLlmOptions);
                }
            }
        });
    }

    if (browser.commands && browser.commands.getAll) {
        browser.commands.getAll().then((commands: any[]) => {
            const showChatCommand = commands.find(cmd => cmd.name === 'show-chat');
            const shortcutInput = document.getElementById("keyboard-shortcut") as HTMLInputElement;

            if (showChatCommand?.shortcut && shortcutInput) {
                shortcutInput.value = showChatCommand.shortcut;
                shortcutInput.title = "Click 'Change Shortcut' to modify";

                const showChatButton = document.getElementById("showChat");

                if(showChatButton) {
                    showChatButton.textContent = `${showChatButton.textContent} (${showChatCommand.shortcut})`;
                }
            }
        });
    }

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

document.getElementById("save-default-llm")?.addEventListener("click", () => {
    const selectedLlm = (document.getElementById("default-llm") as HTMLSelectElement).value;

    browser.storage.local.set({defaultLlm: selectedLlm}, () => {
        showNotification("Saved", "Default LLM saved!");

        browser.runtime.sendMessage({
            type: MESSAGE_TYPES.ACTION_DEFAULT_LLM_UPDATED
        });
    });
});

document.getElementById("save-keyboard-shortcut")?.addEventListener("click", async () => {
    try {
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        if (isFirefox) {
            showNotification(
                "Keyboard Shortcuts",
                "Type 'about:addons' in URL bar → Extensions → ScribePal → ⚙️ → Shortcuts"
            );
        } else {
            await browser.tabs.create({
                url: 'chrome://extensions/shortcuts'
            });

            showNotification(
                "Keyboard Shortcuts",
                "Please modify the shortcut in Chrome's extension shortcuts page"
            );
        }
    } catch (error) {
        console.error('Error handling shortcuts:', error);

        showNotification(
            "Keyboard Shortcuts",
            `Error handling shortcuts: ${error}`
        );
    }
});