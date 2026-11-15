/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../common/browser";
import {MESSAGE_TYPES} from "../common/constants";
import {LlmModel} from "../tab/services/ollamaService/types";
import {AGENTIC_SIGNAL_TOKEN_STORAGE_KEY, AGENTIC_SIGNAL_URL_STORAGE_KEY, normalizeAgenticSignalUrl} from "../tab/utils/agenticSignal";
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

// Firefox doesn't resize the popup when its content's height changes.
const fitPopupHeight = (afterMs: number) => {
    document.documentElement.style.height = "auto";

    setTimeout(() => {
        document.documentElement.style.height = `${document.body.scrollHeight}px`;
    }, afterMs);
};

document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".settings-tab"));

    const selectTab = (selected: HTMLButtonElement) => {
        for (const tab of tabs) {
            const isSelected = tab === selected;
            const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");

            tab.classList.toggle("selected", isSelected);
            tab.setAttribute("aria-selected", String(isSelected));
            tab.tabIndex = isSelected ? 0 : -1;

            if (panel) {
                panel.hidden = !isSelected;
            }
        }

        fitPopupHeight(0);
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectTab(tab));

        tab.addEventListener("keydown", (e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

            const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];

            selectTab(next);
            next.focus();
        });
    });

    const toggleBtn = document.getElementById("extra-settings-toggle");
    const extraSettings = document.querySelector(".extra-settings");

    if (toggleBtn && extraSettings) {
        toggleBtn.addEventListener("click", async () => {
            const extraSettingsCollapsed = extraSettings.classList.toggle("collapsed");
            toggleBtn.classList.toggle("rotated");

            fitPopupHeight(500);

            if(!extraSettingsCollapsed) {
                const response = await browser.runtime.sendMessage({type: MESSAGE_TYPES.FETCH_MODELS});

                if (response && response.models) {
                    const {defaultLlm} = await browser.storage.local.get("defaultLlm");
                    const defaultLlmSelect = document.getElementById("default-llm") as HTMLSelectElement;
                    const models: LlmModel[] = response.models;
                    const defaultLlmOptions = models.map((model: LlmModel) => {
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

    browser.storage.local.get(["ollamaHost", "activeTheme", AGENTIC_SIGNAL_URL_STORAGE_KEY, AGENTIC_SIGNAL_TOKEN_STORAGE_KEY], (result: any) => {
        const ollamaUrl = document.getElementById("ollama-url") as HTMLInputElement;
        const agenticSignalUrl = document.getElementById("agentic-signal-url") as HTMLInputElement;
        const agenticSignalToken = document.getElementById("agentic-signal-token") as HTMLInputElement;
        const toggle = document.getElementById("dark-theme-toggle") as HTMLInputElement | null;
        const status = document.getElementById("dark-theme-status") as HTMLSpanElement | null;
        let darkThemeActive = result.activeTheme === "dark";

        if (result.ollamaHost) {
            ollamaUrl.value = result.ollamaHost;
        }

        if (result[AGENTIC_SIGNAL_URL_STORAGE_KEY]) {
            agenticSignalUrl.value = result[AGENTIC_SIGNAL_URL_STORAGE_KEY];
        }

        if (result[AGENTIC_SIGNAL_TOKEN_STORAGE_KEY]) {
            agenticSignalToken.value = result[AGENTIC_SIGNAL_TOKEN_STORAGE_KEY];
        }

        const renderTheme = () => {
            document.body.classList.toggle("dark-theme", darkThemeActive);

            if (toggle) toggle.checked = darkThemeActive;
            if (status) status.textContent = darkThemeActive ? "On" : "Off";
        };

        const setDarkTheme = (active: boolean) => {
            darkThemeActive = active;

            renderTheme();

            browser.storage.local.set({activeTheme: darkThemeActive ? "dark" : "light"});

            browser.runtime.sendMessage({
                type: MESSAGE_TYPES.ACTION_UPDATE_THEME,
                theme: darkThemeActive ? "dark" : "light",
            });
        };

        renderTheme();

        toggle?.addEventListener("change", (e) => setDarkTheme((e.target as HTMLInputElement).checked));
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

const saveAgenticSignalSetting = (key: string, value: string, savedMessage: string) => {
    const done = () => {
        showNotification("Saved", savedMessage);

        browser.runtime.sendMessage({
            type: MESSAGE_TYPES.ACTION_AGENTIC_SIGNAL_UPDATED
        });
    };

    if (value) {
        browser.storage.local.set({[key]: value}, done);
    } else {
        browser.storage.local.remove(key, done);
    }
};

document.getElementById("save-agentic-signal-url")?.addEventListener("click", () => {
    const agenticSignalUrl = document.getElementById("agentic-signal-url") as HTMLInputElement;
    const url = agenticSignalUrl.value.trim();
    const normalizedUrl = url ? normalizeAgenticSignalUrl(url) : "";

    if (normalizedUrl === null) {
        showNotification("Invalid URL", "Please enter a valid URL (e.g., http://127.0.0.1:8001/workflows/)");

        return;
    }

    agenticSignalUrl.value = normalizedUrl;

    saveAgenticSignalSetting(
        AGENTIC_SIGNAL_URL_STORAGE_KEY,
        normalizedUrl,
        normalizedUrl ? "Agentic Signal URL saved!" : "Agentic Signal URL removed."
    );
});

document.getElementById("save-agentic-signal-token")?.addEventListener("click", () => {
    const token = (document.getElementById("agentic-signal-token") as HTMLInputElement).value.trim();

    saveAgenticSignalSetting(
        AGENTIC_SIGNAL_TOKEN_STORAGE_KEY,
        token,
        token ? "Agentic Signal token saved!" : "Agentic Signal token removed."
    );
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