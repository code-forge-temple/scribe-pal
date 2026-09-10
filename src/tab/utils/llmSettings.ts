/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

// Global, per-model chat settings (thinking + temperature), keyed by model name,
// stored via useGlobalStorage(LLM_SETTINGS_STORAGE_KEY). Every consumer calls
// useGlobalStorage itself (no shared hook here) and uses these plain functions
// to read/update one model's entry in the map.

export const LLM_SETTINGS_STORAGE_KEY = "llmSettings";

// An assumption, not a reading: Ollama never reports the window it actually allocated, and
// a server setting OLLAMA_CONTEXT_LENGTH will differ from this.
export const DEFAULT_NUM_CTX = 4096;
export const NUM_CTX_MIN = 512;
export const NUM_CTX_STEP = 512;
// Slider ceiling when ollama.show() couldn't tell us the model's real maximum.
export const NUM_CTX_FALLBACK_MAX = 32768;

export type LlmSettings = {
    think: boolean;
    temperatureEnabled: boolean;
    temperature: number;
    numCtxEnabled: boolean;
    numCtx: number;
};

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
    think: false,
    temperatureEnabled: false,
    temperature: 0.8,
    numCtxEnabled: false,
    numCtx: DEFAULT_NUM_CTX,
};

export type LlmSettingsMap = Record<string, LlmSettings>;

// Merged over the defaults rather than returned as-is, so entries stored by earlier
// versions pick up fields added since instead of yielding undefined.
export const getModelSettings = (map: LlmSettingsMap, model: string): LlmSettings => ({
    ...DEFAULT_LLM_SETTINGS,
    ...map[model],
});

export const withModelSettings = (map: LlmSettingsMap, model: string, settings: LlmSettings): LlmSettingsMap => ({
    ...map,
    [model]: settings,
});

export const withoutModelSettings = (map: LlmSettingsMap, model: string): LlmSettingsMap => {
    if (!(model in map)) return map;

    const next = {...map};

    delete next[model];

    return next;
};
