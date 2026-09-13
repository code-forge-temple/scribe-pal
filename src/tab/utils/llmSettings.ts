/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

// Global, per-model chat settings. Every field is optional and absent means "not overridden".
// There is deliberately no enabled/value pair: a flag and its value can disagree.

export const LLM_SETTINGS_STORAGE_KEY = "llmSettings";

// An assumption, not a reading: Ollama tiers its default by VRAM the client cannot see.
export const DEFAULT_CONTEXT_WINDOW = 4096;
export const CONTEXT_WINDOW_MIN = 512;
export const CONTEXT_WINDOW_STEP = 512;
// Slider ceiling when ollama.show() couldn't tell us the model's real maximum.
export const CONTEXT_WINDOW_FALLBACK_MAX = 32768;

export const TEMPERATURE_MIN = 0;
export const TEMPERATURE_MAX = 2;
export const TEMPERATURE_STEP = 0.1;

export const CONTEXT_DEFAULT_TIERS = "under 24 GiB VRAM: 4K, 24-48 GiB: 32K, 48 GiB+: 256K";

// Some models (gpt-oss, minimax-m2) ignore the boolean entirely and only respond to a level.
export const THINK_LEVELS = ["low", "medium", "high"] as const;

export type ThinkLevel = typeof THINK_LEVELS[number];

// `max` is in Ollama's docs but not in the installed client's ChatRequest["think"] type.
export type ThinkSetting = boolean | ThinkLevel;

export type LlmSettings = {
    think?: ThinkSetting;
    temperature?: number;
    contextWindow?: number;
};

export type LlmSettingsMap = Record<string, LlmSettings>;

const isThinkSetting = (value: unknown): value is ThinkSetting =>
    typeof value === "boolean" || (typeof value === "string" && (THINK_LEVELS as readonly string[]).includes(value));

const clampedNumber = (value: unknown, min: number, max?: number): number | undefined => {
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;

    return max === undefined ? Math.max(value, min) : Math.min(Math.max(value, min), max);
};

// Nothing gates a value any more, so anything unusable is dropped before it reaches the model.
const sanitizeSettings = (raw: unknown): LlmSettings => {
    if (typeof raw !== "object" || raw === null) return {};

    const {think, temperature, contextWindow} = raw as Record<string, unknown>;
    const settings: LlmSettings = {};

    if (isThinkSetting(think)) {
        settings.think = think;
    }

    const safeTemperature = clampedNumber(temperature, TEMPERATURE_MIN, TEMPERATURE_MAX);

    if (safeTemperature !== undefined) {
        settings.temperature = safeTemperature;
    }

    const safeContextWindow = clampedNumber(contextWindow, CONTEXT_WINDOW_MIN);

    if (safeContextWindow !== undefined) {
        settings.contextWindow = safeContextWindow;
    }

    return settings;
};

// Not merged over defaults: that would invent a temperature for a model that never set one.
export const getModelSettings = (map: LlmSettingsMap, model: string): LlmSettings => sanitizeSettings(map[model]);

export const withoutModelSettings = (map: LlmSettingsMap, model: string): LlmSettingsMap => {
    if (!(model in map)) return map;

    const next = {...map};

    delete next[model];

    return next;
};

export const withModelSettings = (map: LlmSettingsMap, model: string, settings: LlmSettings): LlmSettingsMap => {
    if (Object.keys(settings).length === 0) return withoutModelSettings(map, model);

    return {...map, [model]: settings};
};

// A disabled slider still needs a value to sit at, so the draft shape is not the stored shape.

export const DRAFT_DEFAULTS = {
    temperature: 0.8,
    contextWindow: DEFAULT_CONTEXT_WINDOW,
};

export type LlmSettingsDraft = {
    thinkEnabled: boolean;
    // "default" is reasoning on with no level asked for, i.e. plain `think: true`.
    thinkLevel: ThinkLevel | "default";
    temperatureEnabled: boolean;
    temperature: number;
    contextWindowEnabled: boolean;
    contextWindow: number;
};

export const toDraft = (settings: LlmSettings): LlmSettingsDraft => ({
    thinkEnabled: settings.think !== undefined && settings.think !== false,
    thinkLevel: typeof settings.think === "string" ? settings.think : "default",
    temperatureEnabled: settings.temperature !== undefined,
    temperature: settings.temperature ?? DRAFT_DEFAULTS.temperature,
    contextWindowEnabled: settings.contextWindow !== undefined,
    contextWindow: settings.contextWindow ?? DRAFT_DEFAULTS.contextWindow,
});

export const fromDraft = (draft: LlmSettingsDraft): LlmSettings => ({
    // Always written: an absent `think` means "leave it to the model", not "off".
    think: draft.thinkEnabled ? (draft.thinkLevel === "default" ? true : draft.thinkLevel) : false,
    ...(draft.temperatureEnabled ? {temperature: draft.temperature} : {}),
    ...(draft.contextWindowEnabled ? {contextWindow: draft.contextWindow} : {}),
});
