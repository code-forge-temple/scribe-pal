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
    DEFAULT_LLM_SETTINGS,
    LLM_SETTINGS_STORAGE_KEY,
    LlmSettingsMap,
    NUM_CTX_FALLBACK_MAX,
    NUM_CTX_MIN,
    NUM_CTX_STEP,
    getModelSettings,
    withModelSettings
} from "../../../../utils/llmSettings";
import {MODEL_CONTEXT_STORAGE_KEY, ModelContextMap} from "../../../../utils/modelContext";
import {FetchModelContextLengthResponse} from "../../../../services/ollamaService/types";
import {polyfillRuntimeSendMessage} from "../../../../privilegedAPIs/privilegedAPIs";
import {MESSAGE_TYPES} from "../../../../../common/constants";
import {Toggle} from "../Toggle";

type LlmSettingsModalProps = {
    visible: boolean;
    modelName: string;
    onClose: () => void;
};

export const LlmSettingsModal = withShadowStyles(({visible, modelName, onClose}: LlmSettingsModalProps) => {
    const [llmSettingsMap, setLlmSettingsMap] = useGlobalStorage<LlmSettingsMap>(LLM_SETTINGS_STORAGE_KEY, {});
    const [modelContextMap, setModelContextMap] = useGlobalStorage<ModelContextMap>(MODEL_CONTEXT_STORAGE_KEY, {});

    const [think, setThink] = useState(DEFAULT_LLM_SETTINGS.think);
    const [temperatureEnabled, setTemperatureEnabled] = useState(DEFAULT_LLM_SETTINGS.temperatureEnabled);
    const [temperature, setTemperature] = useState(DEFAULT_LLM_SETTINGS.temperature);
    const [numCtxEnabled, setNumCtxEnabled] = useState(DEFAULT_LLM_SETTINGS.numCtxEnabled);
    const [numCtx, setNumCtx] = useState(DEFAULT_LLM_SETTINGS.numCtx);

    // `getModelSettings` is called inside the effect, not in the render body: it merges over
    // the defaults and so returns a fresh object every call, which as a dependency would
    // reseed on every render and snap the sliders back mid-drag.
    useEffect(() => {
        if (!visible) return;

        const settings = getModelSettings(llmSettingsMap, modelName);

        setThink(settings.think);
        setTemperatureEnabled(settings.temperatureEnabled);
        setTemperature(settings.temperature);
        setNumCtxEnabled(settings.numCtxEnabled);
        setNumCtx(settings.numCtx);
    }, [visible, modelName, llmSettingsMap]);

    // `modelContextMap` is both read and written here, but a cached value (null included)
    // short-circuits before the request, so the re-run terminates.
    useEffect(() => {
        if (!visible || !modelName) return;
        if (modelContextMap[modelName] !== undefined) return;

        let active = true;

        polyfillRuntimeSendMessage({type: MESSAGE_TYPES.FETCH_MODEL_CONTEXT_LENGTH, model: modelName})
            .then((response?: FetchModelContextLengthResponse) => {
                if (!active) return;

                setModelContextMap({
                    ...modelContextMap,
                    [modelName]: response?.success ? response.contextLength : null
                });
            })
            .catch(() => { /* host unreachable / context gone — the slider falls back to its default ceiling */ });

        return () => { active = false; };
    }, [visible, modelName, modelContextMap, setModelContextMap]);

    if (!visible) return null;

    const modelMax = modelContextMap[modelName];
    // Floored at NUM_CTX_MIN, not DEFAULT_NUM_CTX: a model whose real maximum is below
    // Ollama's default must not get a slider that exceeds it.
    const numCtxMax = Math.max(modelMax ?? NUM_CTX_FALLBACK_MAX, NUM_CTX_MIN);
    const numCtxValue = Math.min(numCtx, numCtxMax);

    const handleSave = () => {
        setLlmSettingsMap(withModelSettings(llmSettingsMap, modelName, {
            think,
            temperatureEnabled,
            temperature,
            numCtxEnabled,
            numCtx: numCtxValue
        }));
        onClose();
    };

    return (
        <div className="llm-settings-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="contents">
                <div className="model-name" title={modelName}>{`Settings — ${modelName}`}</div>

                <div className="setting-row">
                    <span className="setting-label">Thinking</span>
                    <Toggle checked={think} onChange={setThink} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Temperature</span>
                    <Toggle checked={temperatureEnabled} onChange={setTemperatureEnabled} />
                    <span className={`temp-slider-wrap${temperatureEnabled ? "" : " disabled"}`}>
                        <input
                            type="range"
                            name="temperature"
                            aria-label="Temperature"
                            min={0}
                            max={2}
                            step={0.1}
                            value={temperature}
                            disabled={!temperatureEnabled}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                        />
                        <span className="slider-value">{temperature.toFixed(1)}</span>
                    </span>
                </div>

                <div className="setting-row">
                    <span className="setting-label">Context size</span>
                    <Toggle checked={numCtxEnabled} onChange={setNumCtxEnabled} />
                    <span className={`temp-slider-wrap num-ctx-slider-wrap${numCtxEnabled ? "" : " disabled"}`}>
                        <input
                            type="range"
                            name="numCtx"
                            aria-label="Context size (num_ctx)"
                            min={NUM_CTX_MIN}
                            max={numCtxMax}
                            step={NUM_CTX_STEP}
                            value={numCtxValue}
                            disabled={!numCtxEnabled}
                            onChange={(e) => setNumCtx(Number(e.target.value))}
                        />
                        <span
                            className="slider-value"
                            title={modelMax ? `Model maximum: ${modelMax.toLocaleString()}` : "Model maximum unknown"}
                        >
                            {numCtxValue.toLocaleString()}
                        </span>
                    </span>
                </div>
            </div>
            <div className="modal-buttons">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}, styles);
