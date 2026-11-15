/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {MESSAGE_TYPES} from "../../common/constants";
import {THINK_LEVELS, ThinkSetting} from "./llmSettings";

export type ChatMessage = {
    id: string;
    sender: string;
    text: string;
    loading?: boolean;
    thinking?: string;
    // The text can't be turned back into a body: its `@` items were whatever was stored when it was sent.
    command?: CommandCall;
    commandRun?: CommandRun;
    commandResults?: CommandResults;
}

export type CommandBody = {
    type: "markdown-and-files";
    value: {
        text: string;
        files: {name: string; base64: string; mimeType?: string}[];
    };
}

export type CommandCall = {
    name: string;
    description: string;
    body: CommandBody;
}

export type CommandRun = {
    command: string;
    description: string;
    request: string;
    job?: string;
}

export type CommandResults = {
    label: string;
    content: string;
}

export type ChatBoxIds = {
    tabId: number;
    chatBoxId: string;
}

export type ErrorResponse = {
    success: false;
    error: string;
}

export type Message = {
    role: string;
    content: string;
    images?: string[];
};

export type FetchModelResponse =
    | {success: true; reply: number}
    | ErrorResponse;

export type FetchAiResponse =
    | {success: true; reply: string; final: boolean; thinking?: string; promptEvalCount?: number; evalCount?: number}
    | ErrorResponse;

// Tagged with the model that produced it: counts aren't comparable across tokenizers, so a
// reading is only meaningful while that model stays selected.
export type ContextUsage = {
    model: string;
    promptTokens: number;
    replyTokens: number;
}

export type MessageData = {
    [MESSAGE_TYPES.FETCH_MODEL]: {
        type: typeof MESSAGE_TYPES.FETCH_MODEL;
        model: string;
    };
    [MESSAGE_TYPES.FETCH_AI_RESPONSE]: {
        type: typeof MESSAGE_TYPES.FETCH_AI_RESPONSE;
        messages: Message[];
        model: string;
        think?: ThinkSetting;
        temperature?: number;
        contextWindow?: number;
    };
}

const isMessages = (messages: unknown): messages is Message[] => {
    if (!Array.isArray(messages)) return false;

    if (messages.some((message: unknown) => {
        if (typeof message !== "object" || message === null) return true;

        if (!("role" in message) || typeof message["role"] !== "string") return true;

        if (!("content" in message) || typeof message["content"] !== "string") return true;

        return false;
    })) return false;

    return true;
}

export const isFetchModelMessageData = (data: unknown): data is MessageData[typeof MESSAGE_TYPES.FETCH_MODEL] => {
    if(typeof data !== "object" || data === null) return false;

    if(!("type" in data) || data["type"] !== MESSAGE_TYPES.FETCH_MODEL) return false;

    if(!("model" in data) || typeof data["model"] !== "string") return false;

    return true;
}

export const isFetchAiResponseMessageData = (data: unknown): data is MessageData[typeof MESSAGE_TYPES.FETCH_AI_RESPONSE] => {
    if(typeof data !== "object" || data === null) return false;

    if(!("type" in data) || data["type"] !== MESSAGE_TYPES.FETCH_AI_RESPONSE) return false;

    if(!("model" in data) || typeof data["model"] !== "string") return false;

    if(!("messages" in data) || !isMessages(data["messages"])) return false;

    if("think" in data) {
        const {think} = data as {think?: unknown};
        const isLevel = typeof think === "string" && (THINK_LEVELS as readonly string[]).includes(think);

        if (typeof think !== "boolean" && !isLevel) return false;
    }

    if("temperature" in data && typeof (data as {temperature?: unknown})["temperature"] !== "number") return false;

    if("contextWindow" in data && typeof (data as {contextWindow?: unknown})["contextWindow"] !== "number") return false;

    return true;
}

// One-shot requests, so not in MessageData: its keys are the port names.
export type CommandMessageData = {
    [MESSAGE_TYPES.START_COMMAND]: {
        type: typeof MESSAGE_TYPES.START_COMMAND;
        command: string;
        body: CommandBody;
    };
    [MESSAGE_TYPES.CHECK_COMMAND]: {
        type: typeof MESSAGE_TYPES.CHECK_COMMAND;
        job: string;
    };
    [MESSAGE_TYPES.CANCEL_COMMAND]: {
        type: typeof MESSAGE_TYPES.CANCEL_COMMAND;
        job: string;
    };
}

const isCommandBody = (body: unknown): body is CommandBody => {
    if (typeof body !== "object" || body === null) return false;

    if (!("type" in body) || body["type"] !== "markdown-and-files") return false;

    if (!("value" in body) || typeof body["value"] !== "object" || body["value"] === null) return false;

    const {text, files} = body["value"] as {text?: unknown; files?: unknown};

    return typeof text === "string" && Array.isArray(files);
}

export const isStartCommandMessageData = (data: unknown): data is CommandMessageData[typeof MESSAGE_TYPES.START_COMMAND] => {
    if(typeof data !== "object" || data === null) return false;

    if(!("type" in data) || data["type"] !== MESSAGE_TYPES.START_COMMAND) return false;

    if(!("command" in data) || typeof data["command"] !== "string") return false;

    if(!("body" in data) || !isCommandBody(data["body"])) return false;

    return true;
}

export const isJobMessageData = (
    data: unknown
): data is CommandMessageData[typeof MESSAGE_TYPES.CHECK_COMMAND | typeof MESSAGE_TYPES.CANCEL_COMMAND] => {
    if(typeof data !== "object" || data === null) return false;

    if(!("type" in data) || (data["type"] !== MESSAGE_TYPES.CHECK_COMMAND && data["type"] !== MESSAGE_TYPES.CANCEL_COMMAND)) return false;

    if(!("job" in data) || typeof data["job"] !== "string") return false;

    return true;
}

export type MessageResponse = {
    [MESSAGE_TYPES.FETCH_MODEL]: FetchModelResponse;
    [MESSAGE_TYPES.FETCH_AI_RESPONSE]: FetchAiResponse;
}

export type RuntimeConnectParams<T extends keyof MessageData> = {
    name: T;
    data: MessageData[T];
    onMessage: (response: MessageResponse[T]) => void;
    onDisconnect?: () => void;
};

export type StorageChanges = Record<string, {oldValue?: any; newValue?: any}>;

export type FileData = {
    name: string;
    content: string;
}