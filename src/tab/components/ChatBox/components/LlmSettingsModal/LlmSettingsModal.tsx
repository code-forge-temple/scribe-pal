/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useEffect, useState} from "react";
import styles from "./LlmSettingsModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import {useGlobalStorage} from "../../../../hooks";
import {LLM_SETTINGS_STORAGE_KEY, LlmSettingsMap, getModelSettings, withModelSettings} from "../../../../utils/llmSettings";
import {Toggle} from "../Toggle";

type LlmSettingsModalProps = {
    visible: boolean;
    modelName: string;
    onClose: () => void;
};

export const LlmSettingsModal = withShadowStyles(({visible, modelName, onClose}: LlmSettingsModalProps) => {
    const [llmSettingsMap, setLlmSettingsMap] = useGlobalStorage<LlmSettingsMap>(LLM_SETTINGS_STORAGE_KEY, {});
    const settings = getModelSettings(llmSettingsMap, modelName);

    const [think, setThink] = useState(settings.think);
    const [temperatureEnabled, setTemperatureEnabled] = useState(settings.temperatureEnabled);
    const [temperature, setTemperature] = useState(settings.temperature);

    useEffect(() => {
        if (visible) {
            setThink(settings.think);
            setTemperatureEnabled(settings.temperatureEnabled);
            setTemperature(settings.temperature);
        }
    }, [visible, settings]);

    if (!visible) return null;

    const handleSave = () => {
        setLlmSettingsMap(withModelSettings(llmSettingsMap, modelName, {think, temperatureEnabled, temperature}));
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
            </div>
            <div className="modal-buttons">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}, styles);
