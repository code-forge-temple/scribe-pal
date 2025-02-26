/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useEffect} from "react";
import styles from "./RichTextModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";

type RichTextModalProps = {
    visible: boolean;
    richText: string;
    singleLine?: boolean;
    closeButtonName?: string;
    onUpdate: (updatedText: string) => void;
};

export const RichTextModal = withShadowStyles(({
    visible,
    richText,
    singleLine,
    onUpdate,
    closeButtonName = "Close",
}:RichTextModalProps) => {
    const [text, setText] = useState(richText);

    useEffect(() => {
        setText(richText);
    }, [richText]);

    if (!visible) return null;

    return (
        <div className="rich-text-modal">
            <textarea
                className={singleLine ? "textarea-single-line" : "textarea"}
                value={text}
                rows={singleLine ? 1 : undefined}
                onChange={(e) => setText(e.target.value)}
            />
            <div className="modal-buttons">
                <button onClick={() => { setText(""); onUpdate("") }}>Clear</button>
                <button onClick={() => { onUpdate(text) }}>{closeButtonName}</button>
            </div>
        </div>
    );
}, styles);