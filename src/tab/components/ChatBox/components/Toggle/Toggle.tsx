/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from "react";
import styles from "./Toggle.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";

type ToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
};

export const Toggle = withShadowStyles(({checked, onChange, label, disabled = false}: ToggleProps) => (
    <label
        className={`toggle${disabled ? " disabled" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
    >
        {label ? <span className="toggle-label">{label}</span> : null}
        <input
            className="toggle-input"
            type="checkbox"
            name="toggle"
            aria-label={label}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-track" aria-hidden="true" />
        <span className="toggle-status">{checked ? "On" : "Off"}</span>
    </label>
), styles);
