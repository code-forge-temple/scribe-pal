/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from "react";
import styles from "./ContextGauge.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import {useGlobalStorage} from "../../../../hooks";
import {
    CONTEXT_DEFAULT_TIERS,
    LLM_SETTINGS_STORAGE_KEY,
    LlmSettingsMap,
    getModelSettings
} from "../../../../utils/llmSettings";
import {MODEL_CONTEXT_STORAGE_KEY, ModelContextMap, resolveContextLimit} from "../../../../utils/modelContext";
import {Tooltip} from "../Tooltip/Tooltip";

const RADIUS = 15.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Mid-tones: the gauge sits on the chat body, so it must read in both themes.
const usedColor = (ratio: number) => {
    if (ratio >= 0.9) return "#e5534b";

    if (ratio >= 0.6) return "#d29922";

    return "#2ea043";
};

type ContextGaugeProps = {
    modelName: string;
    usedTokens: number;
};

export const ContextGauge = withShadowStyles(({modelName, usedTokens}: ContextGaugeProps) => {
    const [llmSettingsMap] = useGlobalStorage<LlmSettingsMap>(LLM_SETTINGS_STORAGE_KEY, {});
    const [modelContextMap] = useGlobalStorage<ModelContextMap>(MODEL_CONTEXT_STORAGE_KEY, {});

    if (!modelName) return null;

    const {limit, source} = resolveContextLimit(
        modelName,
        getModelSettings(llmSettingsMap, modelName),
        modelContextMap[modelName]
    );
    // Unmeasured still renders, as an empty ring — the gauge shouldn't come and go between messages.
    const measured = usedTokens > 0;
    const known = limit !== null && limit > 0;
    const ratio = measured && known ? Math.min(Math.max(usedTokens / limit, 0), 1) : 0;
    const percent = known ? Math.round((usedTokens / limit) * 100) : null;
    const dash = CIRCUMFERENCE * ratio;

    const usageLine = !measured
        ? "Context: no measurement yet."
        : known
            ? `Context: ${usedTokens.toLocaleString()} / ${limit.toLocaleString()} tokens (${percent}%)`
            : `Context: ${usedTokens.toLocaleString()} tokens used — window size unknown.`;

    const limitLine = {
        override: `Limit: your context size override for ${modelName}.`,
        cloudMax: "Limit: this model's maximum. Cloud models always run at their full window"
            + " and ignore any size you set.",
        assumedDefault: "Limit: assuming Ollama's default, which it sizes by the server's free VRAM"
            + ` (${CONTEXT_DEFAULT_TIERS}). Set a context size in model settings for an exact figure.`
    }[source];

    const overLine = measured && known && ratio >= 1
        ? source === "cloudMax"
            ? "Over the limit — Ollama Cloud rejects an oversized prompt outright."
            : "Over the limit — Ollama is dropping the oldest messages."
        : "";

    const tooltip = [
        usageLine,
        measured ? "Measured on the last response; the next message adds to it." : "",
        limitLine,
        overLine
    ].filter(Boolean).join("\n");

    const ariaLabel = measured && known
        ? `Context window ${percent}% used`
        : "Context window usage not measured yet";

    return (
        <Tooltip text={tooltip}>
            <svg
                className="context-gauge"
                viewBox="0 0 36 36"
                role="img"
                aria-label={ariaLabel}
                focusable="false"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                {ratio > 0 ? (
                    <circle
                        cx="18"
                        cy="18"
                        r={RADIUS}
                        fill="none"
                        stroke={usedColor(ratio)}
                        strokeWidth="4"
                        strokeLinecap="butt"
                        strokeDasharray={`${dash.toFixed(3)} ${(CIRCUMFERENCE - dash).toFixed(3)}`}
                        // An attribute, not CSS: a CSS rotate here needs transform-box to behave.
                        transform="rotate(-90 18 18)"
                    />
                ) : null}
            </svg>
        </Tooltip>
    );
}, styles);
