/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

// Global, per-model chat settings (thinking + temperature), keyed by model name,
// stored via useGlobalStorage(LLM_SETTINGS_STORAGE_KEY). Every consumer calls
// useGlobalStorage itself (no shared hook here) and uses these plain functions
// to read/update one model's entry in the map.

export const LLM_SETTINGS_STORAGE_KEY = "llmSettings";

export type LlmSettings = {
    think: boolean;
    temperatureEnabled: boolean;
    temperature: number;
};

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
    think: false,
    temperatureEnabled: false,
    temperature: 0.8,
};

export type LlmSettingsMap = Record<string, LlmSettings>;

export const getModelSettings = (map: LlmSettingsMap, model: string): LlmSettings => map[model] ?? DEFAULT_LLM_SETTINGS;

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
