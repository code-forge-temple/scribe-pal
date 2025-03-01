/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {Ollama} from "ollama/browser";
import {browser} from "../../common/browser";
import {ErrorResponse, FetchAiResponse, FetchModelResponse, Message} from "../utils/types";


type OllamaModel = {
    name: string;
}

type FetchModelsResponse = {
    success: true;
    models: OllamaModel[];
} | ErrorResponse;

type DeleteModelResponse = {
    success: true;
    reply: string;
} | ErrorResponse;

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
        model: string
    ): AsyncGenerator<FetchAiResponse, void, unknown> {
        try {
            const ollama = await this.getOllama();
            const stream = await ollama.chat({model, messages, stream: true, keep_alive: "30m"});
            let fullReply = "";

            for await (const part of stream) {
                fullReply += part.message.content;

                yield {
                    success: true,
                    final: false,
                    reply: fullReply
                };
            }

            yield {
                success: true,
                final: true,
                reply: fullReply
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