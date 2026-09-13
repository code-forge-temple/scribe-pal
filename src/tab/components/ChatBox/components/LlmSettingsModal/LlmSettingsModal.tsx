/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useEffect, useState} from "react";
import styles from "./LlmSettingsModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import {useGlobalStorage} from "../../../../hooks";
import {
    CONTEXT_DEFAULT_TIERS,
    LLM_SETTINGS_STORAGE_KEY,
    LlmSettingsDraft,
    LlmSettingsMap,
    CONTEXT_WINDOW_FALLBACK_MAX,
    CONTEXT_WINDOW_MIN,
    CONTEXT_WINDOW_STEP,
    TEMPERATURE_MAX,
    TEMPERATURE_MIN,
    TEMPERATURE_STEP,
    fromDraft,
    getModelSettings,
    toDraft,
    withModelSettings
} from "../../../../utils/llmSettings";
import {MODEL_CONTEXT_STORAGE_KEY, ModelContextMap, isCloudModel} from "../../../../utils/modelContext";
import {FetchModelContextLengthResponse} from "../../../../services/ollamaService/types";
import {polyfillRuntimeSendMessage} from "../../../../privilegedAPIs/privilegedAPIs";
import {MESSAGE_TYPES} from "../../../../../common/constants";
import {Toggle} from "../Toggle";

type LlmSettingsModalProps = {
    visible: boolean;
    modelName: string;
    onClose: () => void;
};

// "Default" is reasoning on with no level requested, i.e. plain `think: true`.
const THINK_LEVEL_OPTIONS: {value: LlmSettingsDraft["thinkLevel"]; label: string}[] = [
    {value: "default", label: "Default"},
    {value: "low", label: "Low"},
    {value: "medium", label: "Medium"},
    {value: "high", label: "High"}
];

export const LlmSettingsModal = withShadowStyles(({visible, modelName, onClose}: LlmSettingsModalProps) => {
    const [llmSettingsMap, setLlmSettingsMap] = useGlobalStorage<LlmSettingsMap>(LLM_SETTINGS_STORAGE_KEY, {});
    const [modelContextMap, setModelContextMap] = useGlobalStorage<ModelContextMap>(MODEL_CONTEXT_STORAGE_KEY, {});

    const [draft, setDraft] = useState<LlmSettingsDraft>(() => toDraft({}));

    const isCloud = isCloudModel(modelName);

    // Called inside the effect: it returns a fresh object each time, so as a dependency it
    // would reseed every render and snap the sliders back mid-drag.
    useEffect(() => {
        if (!visible) return;

        setDraft(toDraft(getModelSettings(llmSettingsMap, modelName)));
    }, [visible, modelName, llmSettingsMap]);

    // `modelContextMap` is both read and written here, but a cached value (null included)
    // short-circuits before the request, so the re-run terminates.
    useEffect(() => {
        if (!visible || !modelName) return;
        if (modelContextMap[modelName] !== undefined) return;

        let active = true;

        polyfillRuntimeSendMessage({type: MESSAGE_TYPES.FETCH_MODEL_CONTEXT_LENGTH, model: modelName})
            .then((response?: FetchModelContextLengthResponse) => {
                if (!active || !response?.success) return;

                // Only a real "no length" is cached as null; null is never retried, so a failed
                // lookup must record nothing.
                setModelContextMap((current) => ({...current, [modelName]: response.contextLength}));
            })
            .catch(() => { /* host unreachable / context gone — retried next time the dialog opens */ });

        return () => { active = false; };
    }, [visible, modelName, modelContextMap, setModelContextMap]);

    if (!visible) return null;

    const modelMax = modelContextMap[modelName];
    // Floored at CONTEXT_WINDOW_MIN, not the default: a smaller real maximum must still cap the slider.
    const contextWindowMax = Math.max(modelMax ?? CONTEXT_WINDOW_FALLBACK_MAX, CONTEXT_WINDOW_MIN);
    const contextWindowValue = Math.min(draft.contextWindow, contextWindowMax);

    const handleSave = () => {
        const settings = fromDraft({...draft, contextWindow: contextWindowValue});

        if (isCloud) {
            delete settings.contextWindow;
        }

        setLlmSettingsMap((current) => withModelSettings(current, modelName, settings));
        onClose();
    };

    return (
        <div className="llm-settings-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="contents">
                <div className="model-name" title={modelName}>{`Settings — ${modelName}`}</div>

                <div className="setting-row">
                    <span className="setting-label">Thinking</span>
                    <Toggle
                        checked={draft.thinkEnabled}
                        onChange={(checked) => setDraft({...draft, thinkEnabled: checked})}
                    />
                    <select
                        className={`setting-select${draft.thinkEnabled ? "" : " disabled"}`}
                        name="thinkLevel"
                        aria-label="Thinking level"
                        value={draft.thinkLevel}
                        disabled={!draft.thinkEnabled}
                        onChange={(e) => setDraft({...draft, thinkLevel: e.target.value as LlmSettingsDraft["thinkLevel"]})}
                    >
                        {THINK_LEVEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="setting-note">
                    <span>Not every model honours Off — some always reason and ignore the switch.</span>
                    <span>For those a level is the only control over how much reasoning you get.</span>
                </div>

                <div className="setting-row">
                    <span className="setting-label">Temperature</span>
                    <Toggle
                        checked={draft.temperatureEnabled}
                        onChange={(checked) => setDraft({...draft, temperatureEnabled: checked})}
                    />
                    <span className={`temp-slider-wrap${draft.temperatureEnabled ? "" : " disabled"}`}>
                        <input
                            type="range"
                            name="temperature"
                            aria-label="Temperature"
                            min={TEMPERATURE_MIN}
                            max={TEMPERATURE_MAX}
                            step={TEMPERATURE_STEP}
                            value={draft.temperature}
                            disabled={!draft.temperatureEnabled}
                            onChange={(e) => setDraft({...draft, temperature: Number(e.target.value)})}
                        />
                        <span className="slider-value">{draft.temperature.toFixed(1)}</span>
                    </span>
                </div>

                {isCloud ? (
                    <div className="setting-note">
                        Context size is fixed at this model&apos;s maximum. Cloud models run on Ollama&apos;s
                        servers, which ignore any window you set.
                    </div>
                ) : (
                    <>
                        <div className="setting-row">
                            <span className="setting-label">Context size</span>
                            <Toggle
                                checked={draft.contextWindowEnabled}
                                onChange={(checked) => setDraft({...draft, contextWindowEnabled: checked})}
                            />
                            <span className={`temp-slider-wrap context-window-slider-wrap${draft.contextWindowEnabled ? "" : " disabled"}`}>
                                <input
                                    type="range"
                                    name="contextWindow"
                                    aria-label="Context size (num_ctx)"
                                    min={CONTEXT_WINDOW_MIN}
                                    max={contextWindowMax}
                                    step={CONTEXT_WINDOW_STEP}
                                    value={contextWindowValue}
                                    disabled={!draft.contextWindowEnabled}
                                    onChange={(e) => setDraft({...draft, contextWindow: Number(e.target.value)})}
                                />
                                <span className="slider-value">{contextWindowValue.toLocaleString()}</span>
                            </span>
                        </div>
                        <div className="setting-note">
                            <span>
                                {modelMax
                                    ? `Model maximum: ${modelMax.toLocaleString()} tokens.`
                                    : "Model maximum unknown."}
                            </span>
                            <span>
                                Left off, Ollama picks its own default from the server&apos;s free VRAM
                                ({CONTEXT_DEFAULT_TIERS}).
                            </span>
                            <span>Changing this makes Ollama reload the model, so the next reply is slower.</span>
                        </div>
                    </>
                )}
            </div>
            <div className="modal-buttons">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}, styles);
