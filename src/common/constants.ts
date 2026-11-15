/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

export const EXTENSION_NAME = "ScribePal";

export const MESSAGE_TYPES = {
    ACTION_SHOW_CHAT: "actionShowChat",
    ACTION_OLLAMA_HOST_UPDATED: "actionOllamaHostUpdated",
    ACTION_UPDATE_THEME: "actionUpdateTheme",
    FETCH_MODELS: "fetchModels",
    FETCH_MODEL: "fetchModel",
    FETCH_MODEL_CONTEXT_LENGTH: "fetchModelContextLength",
    FETCH_AI_RESPONSE: "fetchAIResponse",
    ABORT_AI_RESPONSE: "abortAIResponse",
    CAPTURE_HTML: "captureHtml",
    DELETE_MODEL: "deleteModel",
    TOGGLE_CHAT_VISIBILITY: "toggleChatVisibility",
    CAPTURE_VISIBLE_TAB: "captureVisibleTab",
    ACTION_DEFAULT_LLM_UPDATED: "actionDefaultLlmUpdated",
    ACTION_AGENTIC_SIGNAL_UPDATED: "actionAgenticSignalUpdated",
    FETCH_COMMANDS: "fetchCommands",
    START_COMMAND: "startCommand",
    CHECK_COMMAND: "checkCommand",
    CANCEL_COMMAND: "cancelCommand",
} as const;