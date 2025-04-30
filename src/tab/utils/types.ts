/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {MESSAGE_TYPES} from "../../common/constants";

export type ChatMessage = {
    id: string;
    sender: string;
    text: string;
    loading?: boolean;
}

export type Model = {
    name: string;
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
    | {success: true; reply: string; final: boolean}
    | ErrorResponse;

export type MessageData = {
    [MESSAGE_TYPES.FETCH_MODEL]: {
        type: typeof MESSAGE_TYPES.FETCH_MODEL;
        model: string;
    };
    [MESSAGE_TYPES.FETCH_AI_RESPONSE]: {
        type: typeof MESSAGE_TYPES.FETCH_AI_RESPONSE;
        messages: Message[];
        model: string;
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

export type FileData = {
    name: string;
    content: string;
}