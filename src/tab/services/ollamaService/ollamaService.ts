/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {Ollama, Options} from "ollama/browser";
import {browser} from "../../../common/browser";
import {ErrorResponse, FetchAiResponse, FetchModelResponse, Message} from "../../utils/types";
import {DeleteModelResponse, FetchModelContextLengthResponse, FetchModelsResponse} from "./types";
import {ThinkSetting} from "../../utils/llmSettings";
import {isCloudModel} from "../../utils/modelContext";


export class OllamaService {
    static #instance: OllamaService | null = null;
    #ollama: Ollama | null = null;

    constructor () {
        if (OllamaService.#instance) {
            return OllamaService.#instance;
        }

        OllamaService.#instance = this;
    }

    static getInstance (): OllamaService {
        if (!OllamaService.#instance) {
            OllamaService.#instance = new OllamaService();
        }

        return OllamaService.#instance;
    }

    static reloadInstance (): void {
        OllamaService.#instance = null;
        OllamaService.#instance = new OllamaService();
    }

    getOllama = async (): Promise<Ollama> => {
        if (!this.#ollama) {
            const {ollamaHost: host} = await browser.storage.local.get("ollamaHost");

            this.#ollama = new Ollama({host});
        }

        return this.#ollama;
    };

    fetchModels = async (): Promise<FetchModelsResponse> => {
        try {
            const ollama = await this.getOllama();
            const {models} = await ollama.list();

            return {
                success: true,
                models
            };
        } catch (error) {
            console.error("Error fetching models:", error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    };

    async *fetchAIResponse (
        messages: Message[],
        model: string,
        settings?: {think?: ThinkSetting; temperature?: number; contextWindow?: number}
    ): AsyncGenerator<FetchAiResponse, void, unknown> {
        try {
            const ollama = await this.getOllama();
            const updatedMessages = messages.map((message) => ({
                ...message,
                content: message.content.replace(/!\[.*?\]\(data:image\/\w+;base64,([^)]+)\)/g, "attached image"),
                images: extractImages(message.content)
            }));
            // Built as one object rather than two conditional `{options: ...}` spreads,
            // which would overwrite each other key-for-key.
            const options: Partial<Options> = {};

            if (settings?.temperature !== undefined) {
                options.temperature = settings.temperature;
            }

            // Ollama Cloud ignores num_ctx outright (200, never applied).
            if (settings?.contextWindow !== undefined && !isCloudModel(model)) {
                options.num_ctx = settings.contextWindow;
            }

            const stream = await ollama.chat({
                model,
                messages: updatedMessages,
                stream: true,
                keep_alive: "60m",
                // Never coerced: a level is the only control some models respond to. Omitted when
                // unset, which leaves the model to its default.
                ...(settings?.think !== undefined ? {think: settings.think} : {}),
                ...(Object.keys(options).length ? {options} : {})
            });
            let fullReply = "";
            let fullThinking = "";
            let promptEvalCount: number | undefined;
            let evalCount: number | undefined;

            for await (const part of stream) {
                if (part.message.thinking) {
                    fullThinking += part.message.thinking;
                }

                fullReply += part.message.content;

                // Only the terminating `done: true` part carries the token counts, and this
                // loop consumes it — so latch them here for the final yield below.
                if (typeof part.prompt_eval_count === "number") {
                    promptEvalCount = part.prompt_eval_count;
                }

                if (typeof part.eval_count === "number") {
                    evalCount = part.eval_count;
                }

                yield {
                    success: true,
                    final: false,
                    reply: fullReply,
                    thinking: fullThinking || undefined
                };
            }

            yield {
                success: true,
                final: true,
                reply: fullReply,
                thinking: fullThinking || undefined,
                ...(promptEvalCount !== undefined ? {promptEvalCount} : {}),
                ...(evalCount !== undefined ? {evalCount} : {})
            };
        } catch (error) {
            console.error("Error fetching AI response:", error);

            yield {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async *pullModel (
        model: string
    ): AsyncGenerator<FetchModelResponse, void, unknown> {
        try {
            const ollama = await this.getOllama();
            const stream = await ollama.pull({model, stream: true});

            for await (const part of stream) {
                yield {
                    success: true,
                    reply: part.completed && part.total ? Math.floor(100 * (part.completed / part.total)) : 0
                };
            }
        } catch (error) {
            console.error("Error pulling model:", error);

            yield {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async deleteModel (model: string): Promise<DeleteModelResponse> {
        try {
            const ollama = await this.getOllama();
            await ollama.delete({model});

            return {
                success: true,
                reply: "Model deleted successfully"
            };
        } catch (error) {
            console.error("Error deleting model:", error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async fetchModelContextLength (model: string): Promise<FetchModelContextLengthResponse> {
        try {
            const ollama = await this.getOllama();
            const {model_info: modelInfo} = await ollama.show({model});
            // `model_info` is typed as a Map but arrives as a plain object (it comes straight
            // from `response.json()`), so it has to be indexed rather than `.get()`.
            const info = modelInfo as unknown as Record<string, any>;
            const architecture = info?.["general.architecture"];
            // The key is namespaced by architecture, e.g. "llama.context_length". Fall back to
            // scanning for the suffix when the model doesn't declare its architecture.
            const key = typeof architecture === "string"
                ? `${architecture}.context_length`
                : Object.keys(info ?? {}).find((infoKey) => infoKey.endsWith(".context_length"));
            const contextLength = key ? info[key] : undefined;

            return {
                success: true,
                contextLength: typeof contextLength === "number" && contextLength > 0 ? contextLength : null
            };
        } catch (error) {
            console.error("Error fetching model context length:", error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    abortAIResponse = async (): Promise<{success: true} | ErrorResponse> => {
        try {
            const ollama = await this.getOllama();
            ollama.abort();

            return {
                success: true
            };
        } catch (error) {
            console.error("Error aborting current conversation:", error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

function extractImages (content: string): string[] {
    const imageRegex = /!\[.*?\]\(data:image\/\w+;base64,([^)]+)\)/g;
    const images: string[] = [];
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
        images.push(match[1]);
    }

    return images;
}