/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from "react";
import styles from "./ReferenceTag.scss?inline";
import {withShadowStyles} from "../../../../../../utils/withShadowStyles";

export type ReferenceTagProps = {
    text: string;
    tooltip?: string;
    onClose?: () => void;
    onClick?: () => void;
}

export const ReferenceTag = withShadowStyles(({
    text,
    onClose,
    onClick,
    tooltip,
}:ReferenceTagProps) => {
    return (
        <span className="tag" title={tooltip} onClick={onClick}>
            {text}
            {onClose && (
                <button
                    className="close-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    &times;
                </button>
            )}
        </span>
    );
}, styles);