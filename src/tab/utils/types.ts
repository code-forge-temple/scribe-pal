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
        message: any;
        model: string;
    };
}

type MessageResponse = {
    [MESSAGE_TYPES.FETCH_MODEL]: FetchModelResponse;
    [MESSAGE_TYPES.FETCH_AI_RESPONSE]: FetchAiResponse;
}

export type RuntimeConnectParams<T extends keyof MessageData> = {
    name: T;
    data: MessageData[T];
    onMessage: (response: MessageResponse[T]) => void;
    onDisconnect?: () => void;
};