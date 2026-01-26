/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useEffect} from "react";
import styles from "./CapturedTextModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import {RichTextArea} from "../RichTextArea";


type CapturedTextModalProps = {
    visible: boolean;
    richText: string;
    closeButtonName?: string;
    onUpdate: (updatedText: string) => void;
};

export const CapturedTextModal = withShadowStyles(({
    visible,
    richText,
    onUpdate,
    closeButtonName = "Close",
}: CapturedTextModalProps) => {
    const [text, setText] = useState(richText);

    useEffect(() => {
        setText(richText);
    }, [richText]);

    if (!visible) return null;

    return (
        <div className="captured-text-modal">
            <div className="contents">
                <RichTextArea
                    value={text}
                    onChange={setText}
                    singleLine={false}
                />
            </div>
            <div className="modal-buttons">
                <button onClick={() => { setText(""); onUpdate(""); }}>Clear</button>
                <button onClick={() => { onUpdate(text); }}>{closeButtonName}</button>
            </div>
        </div>
    );
}, styles);