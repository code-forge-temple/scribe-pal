/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {EXTENSION_NAME} from "../../common/constants";
import {ATTACHED_TAG, CAPTURED_IMAGE_TAG, CAPTURED_TAG} from "./constants";
import {CommandBody, CommandRun, FileData} from "./types";
import {FetchCommandsResponse} from "../services/agenticSignalService/types";

export const AGENTIC_SIGNAL_URL_STORAGE_KEY = "agenticSignalUrl";
export const AGENTIC_SIGNAL_TOKEN_STORAGE_KEY = "agenticSignalToken";

export const TOKEN_NOT_RECOGNIZED = "Add a connection in Agentic Signal's Settings → Workflows → Outside connections, and paste its token into ScribePal's popup.";

// Nothing here counts tokens, so a result is cut by characters.
const RESULTS_SHARE_OF_CONTEXT = 0.5;
const CHARS_PER_TOKEN = 3;

const MIME_TYPES: Record<string, string> = {
    md: "text/markdown",
    json: "application/json",
    csv: "text/csv",
};

export const normalizeAgenticSignalUrl = (url: string): string | null => {
    let parsed: URL;

    try {
        parsed = new URL(url.trim());
    } catch {
        return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    const path = parsed.pathname.replace(/\/+$/, "");

    parsed.pathname = path.endsWith("/workflows") ? `${path}/` : `${path}/workflows/`;
    parsed.search = "";
    parsed.hash = "";

    return parsed.href;
};

// Null for a path like "/etc/hosts": that's an ordinary message.
export const parseCommandMessage = (message: string): {command: string; text: string} | null => {
    const match = /^\s*\/([a-z0-9][a-z0-9-]*)(?:\s+([\s\S]*))?$/i.exec(message);

    return match ? {command: match[1].toLowerCase(), text: (match[2] ?? "").trim()} : null;
};

// btoa() takes Latin-1 only, and spreading a whole large file into fromCharCode overflows the stack.
const utf8ToBase64 = (text: string): string => {
    const bytes = new TextEncoder().encode(text);
    let binary = "";

    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    return btoa(binary);
};

const mimeTypeFor = (fileName: string): string => MIME_TYPES[fileName.split(".").pop()?.toLowerCase() ?? ""] ?? "text/plain";

const imageFile = (dataUrl: string): CommandBody["value"]["files"][number] | null => {
    const match = /^data:([\w.+-]+\/[\w.+-]+)?[^,]*;base64,([\s\S]*)$/.exec(dataUrl);

    if (!match) return null;

    const mimeType = match[1] || "image/png";
    const extension = mimeType.split("/")[1].replace(/\+.*$/, "").replace("jpeg", "jpg");

    return {name: `captured-image.${extension}`, base64: match[2], mimeType};
};

export const buildCommandBody = (
    text: string,
    {capturedText, capturedImage, attachedFiles}: {capturedText: string, capturedImage: string, attachedFiles: FileData[]}
): CommandBody => {
    const files: CommandBody["value"]["files"] = [];

    if (text.includes(ATTACHED_TAG)) {
        files.push(...attachedFiles.map((file) => ({
            name: file.name,
            base64: utf8ToBase64(file.content),
            mimeType: mimeTypeFor(file.name)
        })));
    }

    const image = text.includes(CAPTURED_IMAGE_TAG) && capturedImage ? imageFile(capturedImage) : null;

    if (image) {
        files.push(image);
    }

    // Tags out before the captured text goes in, so its own text is never touched.
    const [beforeCaptured, ...afterCaptured] = [ATTACHED_TAG, CAPTURED_IMAGE_TAG]
        .reduce((current, tag) => current.split(tag).join(""), text)
        .replace(/ {2,}/g, " ")
        .split(CAPTURED_TAG);
    const inlined = afterCaptured.length
        ? beforeCaptured + (capturedText ? "\n```text\n" + capturedText + "\n```\n" : "") + afterCaptured.join("")
        : beforeCaptured;

    return {type: "markdown-and-files", value: {text: inlined.trim(), files}};
};

// What the `/` menu says when it has no commands to offer; nothing without Agentic Signal set up, so `/` stays out of the way.
export const COMMANDS_CHECKING = "Checking Agentic Signal for commands…";

export const commandsNotice = (response?: FetchCommandsResponse): string | undefined => {
    if (!response || (response.success === false && response.code === "not_configured")) return undefined;

    if (!response.success) return `No commands available: ${response.error}`;

    return response.commands.length
        ? undefined
        : "No commands available: no workflow is running for them in Agentic Signal. Open one that starts with a Workflow Input and switch it to Run.";
};

export const commandRunningText = (command: string) => `Running **/${command}** on Agentic Signal…`;

export const commandUnavailableText = (command: string, reason?: string) => `/${command} isn't available from Agentic Signal right now. ${
    reason ?? `To offer it, open a workflow for /${command} in one of your layers and switch its Workflow Input to Run.`
}`;

const FAILURE_HINTS: Record<string, (command: string) => string> = {
    app_not_open: () => "Open Agentic Signal, then try again.",
    no_listener: (command) => `Open a workflow for /${command} in one of your layers and switch its Workflow Input to Run.`,
};

export const commandFailureText = (command: string, {code, error, node}: {code: string; error: string; node?: string}) => {
    const hint = FAILURE_HINTS[code]?.(command);

    return `/${command} failed${node ? ` at **${node}**` : ""}: ${error}${hint ? ` ${hint}` : ""}`;
};

export const commandInterruptedText = (command: string) => `/${command} was interrupted before Agentic Signal answered.`
    + " Re-send the message to run it again.";

export const commandLostText = (command: string) => `/${command} is no longer known to Agentic Signal: it finished over 10 minutes ago,`
    + " or was cancelled after 2 minutes without anyone checking on it. Re-send the message to run it again.";

export const isEmptyCommandResult = (result: unknown) => result === null || result === undefined || (typeof result === "string" && !result.trim());

export const formatCommandResult = (result: unknown): string => typeof result === "string"
    ? result
    : "```json\n" + JSON.stringify(result, null, 2) + "\n```";

export const commandResultsLabel = (command: string) => `Results of /${command}`;

export const commandResultsMessage = (command: string, request: string, result: unknown, contextLimit: number): string => {
    const raw = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    const maxChars = Math.floor(contextLimit * RESULTS_SHARE_OF_CONTEXT * CHARS_PER_TOKEN);
    const cut = raw.length > maxChars;
    const kept = cut ? raw.slice(0, maxChars) : raw;
    const body = (typeof result === "string" ? kept : "```json\n" + kept + "\n```")
        + (cut ? "\n\n[… cut to fit the model's context window]" : "");
    const asked = request ? ` for "${request}"` : "";

    return `Results of /${command}${asked}, from the Agentic Signal workflow you ran:\n\n${body}`;
};

// It names the request: with an earlier question in the chat, some models (gpt-oss) answered that one instead.
export const commandReplySystemPrompt = ({command, description, request}: CommandRun): string => {
    const what = description ? ` (${description.replace(/\.$/, "")})` : "";
    const asked = [`/${command}`, request].filter(Boolean).join(" ");

    return `You are ${EXTENSION_NAME}. You ran the workflow /${command}${what} for the user's request "${asked}", and its result is in the last message.`
        + " Answer that request from it: clear and well structured, in Markdown, keeping any sources (with their URLs) the result cites."
        + " Say nothing the result doesn't support.";
};
