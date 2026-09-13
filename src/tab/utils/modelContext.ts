/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

// Kept out of llmSettings.ts deliberately: that holds preferences that follow a model around
// and get deleted with it, this caches facts about the model itself.

import {DEFAULT_CONTEXT_WINDOW, LlmSettings} from "./llmSettings";

export const MODEL_CONTEXT_STORAGE_KEY = "modelContextLengths";

// null = asked, no answer; missing key = never asked. Collapsing the two would refetch a
// model with no reported context length forever.
export type ModelContextMap = Record<string, number | null>;

// Cloud models always run at their maximum context and silently ignore `options.num_ctx`.
export const isCloudModel = (model: string): boolean => model.endsWith("-cloud");

export type ContextLimitSource = "override" | "cloudMax" | "assumedDefault";

export type ContextLimit = {
    limit: number | null;
    source: ContextLimitSource;
};

export const resolveContextLimit = (
    model: string,
    settings: LlmSettings,
    modelMax: number | null | undefined
): ContextLimit => {
    // Before the override on purpose: a stale saved contextWindow is not in effect here.
    if (isCloudModel(model)) {
        return {limit: modelMax ?? null, source: "cloudMax"};
    }

    if (settings.contextWindow !== undefined) {
        return {limit: settings.contextWindow, source: "override"};
    }

    return {limit: DEFAULT_CONTEXT_WINDOW, source: "assumedDefault"};
};
