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
import {DEFAULT_NUM_CTX, LLM_SETTINGS_STORAGE_KEY, LlmSettingsMap, getModelSettings} from "../../../../utils/llmSettings";
import {Tooltip} from "../Tooltip/Tooltip";

const RADIUS = 15.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TRACK_COLOR = "rgba(255, 255, 255, 0.3)";

const usedColor = (ratio: number) => {
    if (ratio >= 0.9) return "#ff6b6b";

    if (ratio >= 0.6) return "#ffd166";

    return "#7ee787";
};

type ContextGaugeProps = {
    modelName: string;
    usedTokens: number;
};

export const ContextGauge = withShadowStyles(({modelName, usedTokens}: ContextGaugeProps) => {
    const [llmSettingsMap] = useGlobalStorage<LlmSettingsMap>(LLM_SETTINGS_STORAGE_KEY, {});

    if (!modelName) return null;

    const {numCtxEnabled, numCtx} = getModelSettings(llmSettingsMap, modelName);
    const limit = numCtxEnabled ? numCtx : DEFAULT_NUM_CTX;
    // Unmeasured still renders, as an empty ring — the gauge shouldn't come and go between messages.
    const measured = usedTokens > 0;
    const percent = Math.round((usedTokens / limit) * 100);
    const ratio = Math.min(Math.max(usedTokens / limit, 0), 1);
    const dash = CIRCUMFERENCE * ratio;
    const tooltip = [
        measured
            ? `Context: ${usedTokens.toLocaleString()} / ${limit.toLocaleString()} tokens (${percent}%)`
            : `Context: no measurement yet — limit ${limit.toLocaleString()} tokens.`,
        measured
            ? "Measured on the last response; the next message adds to it."
            : "Send a message to measure it.",
        numCtxEnabled
            ? `Limit: your context size override for ${modelName}.`
            : `Limit: assuming Ollama's default of ${DEFAULT_NUM_CTX.toLocaleString()} — it doesn't report the window`
                + " it actually allocated. Set a context size in model settings for an exact figure.",
        ratio >= 1 ? "Over the limit — Ollama is dropping the oldest messages." : ""
    ].filter(Boolean).join("\n");

    return (
        <Tooltip text={tooltip}>
            <svg
                className="context-gauge"
                viewBox="0 0 36 36"
                role="img"
                aria-label={measured ? `Context window ${percent}% used` : "Context window usage not measured yet"}
                focusable="false"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <circle cx="18" cy="18" r={RADIUS} fill="none" stroke={TRACK_COLOR} strokeWidth="4" />
                <circle
                    cx="18"
                    cy="18"
                    r={RADIUS}
                    fill="none"
                    stroke={usedColor(ratio)}
                    strokeWidth="4"
                    strokeLinecap="butt"
                    strokeDasharray={`${dash.toFixed(3)} ${(CIRCUMFERENCE - dash).toFixed(3)}`}
                    // Set as an SVG attribute rather than in CSS: a CSS rotate on an SVG child
                    // needs transform-box/transform-origin to behave consistently.
                    transform="rotate(-90 18 18)"
                />
            </svg>
        </Tooltip>
    );
}, styles);
