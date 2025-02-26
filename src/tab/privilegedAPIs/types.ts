import {MessageData} from "../utils/types";
import {PRIVILEGED_API} from "./constants";

export type BrowserStorageLocalGet = {
    type: typeof PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET;
    payload: {
        key: string | string[];
    };
}

export type BrowserStorageLocalGetResponse = {
    type: `${typeof PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET}.response`;
    key: string | string[];
    response: any;
}

export const isBrowserStorageLocalGetResponse = (data: unknown): data is BrowserStorageLocalGetResponse => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.BROWSER_STORAGE_LOCAL_GET}.response`;
}

export type BrowserStorageLocalSet = {
    type: typeof PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET;
    payload: any;
}

export type BrowserStorageLocalSetResponse = {
    type: `${typeof PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET}.response`;
}

export const isBrowserStorageLocalSetResponse = (data: unknown): data is BrowserStorageLocalSetResponse => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.BROWSER_STORAGE_LOCAL_SET}.response`;
}

export type GetTabStorage = {
    type: typeof PRIVILEGED_API.GET_TAB_STORAGE;
    payload: {
        tabId: number;
    };
}

export type GetTabStorageResponse = {
    type: `${typeof PRIVILEGED_API.GET_TAB_STORAGE}.response`;
    response: any;
}

export const isGetTabStorageResponse = (data: unknown): data is GetTabStorageResponse => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.GET_TAB_STORAGE}.response`;
}

export type SetTabStorage = {
    type: typeof PRIVILEGED_API.SET_TAB_STORAGE;
    payload: {
        tabId: number;
        tabContents: any;
    };
}

export type SetTabStorageResponse = {
    type: `${typeof PRIVILEGED_API.SET_TAB_STORAGE}.response`;
}

export const isSetTabStorageResponse = (data: unknown): data is SetTabStorageResponse => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.SET_TAB_STORAGE}.response`;
}

export type BrowserRuntimeSendMessage = {
    type: typeof PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE;
    payload: any;
    requestId: string;
}

export type BrowserRuntimeSendMessageResponse = {
    type: `${typeof PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE}.response`;
    requestId: string;
    response: any;
}

export const isBrowserRuntimeSendMessageResponse = (data: unknown): data is BrowserRuntimeSendMessageResponse => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.BROWSER_RUNTIME_SEND_MESSAGE}.response`;
}

export type BrowserRuntimeConnect<T extends keyof MessageData> = {
    type: typeof PRIVILEGED_API.BROWSER_RUNTIME_CONNECT;
    payload: any;
    name: T;
    portId: string;
}

export type BrowserRuntimeConnectResponse = {
    type: `${typeof PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response`;
    portId: string;
    response: any;
}

export const isBrowserRuntimeConnectResponse = (data: unknown): data is BrowserRuntimeConnectResponse => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response`;
}

export type BrowserRuntimeConnectResponseDisconnect = {
    type: `${typeof PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response.disconnect`;
}

export const isBrowserRuntimeConnectResponseDisconnect = (data: unknown): data is BrowserRuntimeConnectResponseDisconnect => {
    return !!data && typeof data === 'object' && 'type' in data && data.type === `${PRIVILEGED_API.BROWSER_RUNTIME_CONNECT}.response.disconnect`;
}

export type EventData<T extends keyof MessageData> =
    BrowserStorageLocalGet |
    BrowserStorageLocalSet |
    GetTabStorage |
    SetTabStorage |
    BrowserRuntimeSendMessage |
    BrowserRuntimeConnect<T>;

export type EventDataResponse =
    BrowserStorageLocalGetResponse |
    BrowserStorageLocalSetResponse |
    GetTabStorageResponse |
    SetTabStorageResponse |
    BrowserRuntimeSendMessageResponse |
    BrowserRuntimeConnectResponse |
    BrowserRuntimeConnectResponseDisconnect;