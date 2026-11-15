/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {browser} from "../../../common/browser";
import {CommandBody} from "../../utils/types";
import {AGENTIC_SIGNAL_TOKEN_STORAGE_KEY, AGENTIC_SIGNAL_URL_STORAGE_KEY, TOKEN_NOT_RECOGNIZED} from "../../utils/agenticSignal";
import {AgenticSignalCommand, CancelCommandResponse, CommandErrorResponse, CommandJobResponse, FetchCommandsResponse} from "./types";


// Well under the 30 s after which Chrome stops a service worker waiting on a fetch.
const REQUEST_TIMEOUT_MS = 15000;
// The `/` menu waits on it; with Agentic Signal open it takes milliseconds.
const LIST_TIMEOUT_MS = 5000;
const DEFAULT_RETRY_AFTER_S = 2;

type Endpoint = {
    base: string;
    token: string;
}

const failure = (code: string, error: string, extra: {node?: string; status?: number} = {}): CommandErrorResponse => ({
    success: false,
    code,
    error,
    ...extra
});

export class AgenticSignalService {
    static #instance: AgenticSignalService | null = null;

    constructor () {
        if (AgenticSignalService.#instance) {
            return AgenticSignalService.#instance;
        }

        AgenticSignalService.#instance = this;
    }

    static getInstance (): AgenticSignalService {
        if (!AgenticSignalService.#instance) {
            AgenticSignalService.#instance = new AgenticSignalService();
        }

        return AgenticSignalService.#instance;
    }

    // Read on every call: the popup can change them at any time.
    getEndpoint = async (): Promise<Endpoint | CommandErrorResponse> => {
        const {
            [AGENTIC_SIGNAL_URL_STORAGE_KEY]: base,
            [AGENTIC_SIGNAL_TOKEN_STORAGE_KEY]: token
        } = await browser.storage.local.get([AGENTIC_SIGNAL_URL_STORAGE_KEY, AGENTIC_SIGNAL_TOKEN_STORAGE_KEY]);

        if (!base) {
            return failure("not_configured", "Agentic Signal isn't set up: add its URL and token in ScribePal's popup.");
        }

        if (!token) {
            return failure("unauthorized", `Agentic Signal needs a token. ${TOKEN_NOT_RECOGNIZED}`);
        }

        return {base, token};
    };

    request = async (path: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response | CommandErrorResponse> => {
        const endpoint = await this.getEndpoint();

        if ("success" in endpoint) return endpoint;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(new URL(path, endpoint.base), {
                ...init,
                headers: {...init.headers, Authorization: `Bearer ${endpoint.token}`},
                signal: controller.signal
            });
        } catch (error) {
            console.error("Error calling Agentic Signal:", error);

            return controller.signal.aborted
                ? failure("timeout", `Agentic Signal at ${endpoint.base} didn't answer within ${timeoutMs / 1000} s. Is it running?`)
                : failure("unreachable", `Can't reach Agentic Signal at ${endpoint.base}. Is it running?`);
        } finally {
            clearTimeout(timer);
        }
    };

    readError = async (response: Response): Promise<CommandErrorResponse> => {
        const body = await response.json().catch(() => null);
        const {code, message, node} = body?.error ?? {};

        return failure(
            typeof code === "string" ? code : `http_${response.status}`,
            response.status === 401
                ? `Agentic Signal doesn't recognize the token. ${TOKEN_NOT_RECOGNIZED}`
                : typeof message === "string" ? message : `Agentic Signal answered HTTP ${response.status}.`,
            {status: response.status, ...(typeof node === "string" ? {node} : {})}
        );
    };

    readJob = async (response: Response | CommandErrorResponse, job?: string): Promise<CommandJobResponse> => {
        if (!(response instanceof Response)) return response;

        if (!response.ok) return this.readError(response);

        const body = await response.json().catch(() => undefined);

        if (body === undefined) {
            return failure("bad_response", "Agentic Signal's answer wasn't JSON.", {status: response.status});
        }

        if (response.status === 202) {
            const retryAfter = Number(response.headers.get("Retry-After"));

            return {
                success: true,
                status: "running",
                job: typeof body?.job === "string" ? body.job : job ?? "",
                retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : DEFAULT_RETRY_AFTER_S
            };
        }

        return {success: true, status: "done", result: body?.result ?? null};
    };

    fetchCommands = async (): Promise<FetchCommandsResponse> => {
        const response = await this.request("", {}, LIST_TIMEOUT_MS);

        if (!(response instanceof Response)) return response;

        if (!response.ok) return this.readError(response);

        const body = await response.json().catch(() => null);
        const commands: AgenticSignalCommand[] = Array.isArray(body?.commands)
            ? body.commands
                .filter((item: any) => typeof item?.command === "string")
                .map((item: any) => ({command: item.command, description: typeof item.description === "string" ? item.description : ""}))
            : [];

        return {success: true, commands};
    };

    // As a job: a whole run can take minutes, far longer than Chrome lets a service worker wait on one fetch.
    startCommand = async (command: string, body: CommandBody): Promise<CommandJobResponse> => {
        const response = await this.request(encodeURIComponent(command), {
            method: "POST",
            headers: {"Content-Type": "application/json", "Prefer": "respond-async"},
            body: JSON.stringify(body)
        });

        return this.readJob(response);
    };

    checkCommand = async (job: string): Promise<CommandJobResponse> => {
        return this.readJob(await this.request(`jobs/${encodeURIComponent(job)}`), job);
    };

    cancelCommand = async (job: string): Promise<CancelCommandResponse> => {
        const response = await this.request(`jobs/${encodeURIComponent(job)}`, {method: "DELETE"});

        if (!(response instanceof Response)) return response;

        if (!response.ok) return this.readError(response);

        return {success: true};
    };
}
