/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useEffect} from "react";
import styles from "./ImageModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";

type ImageModalProps = {
    visible: boolean;
    imageBase64: string;
    closeButtonName?: string;
    onUpdate: (updatedText: string) => void;
};

export const ImageModal = withShadowStyles(({
    visible,
    imageBase64,
    onUpdate,
    closeButtonName = "Close",
}:ImageModalProps) => {
    const [text, setText] = useState(imageBase64);

    useEffect(() => {
        setText(imageBase64);
    }, [imageBase64]);

    if (!visible) return null;

    return (
        <div className="image-modal">
            <div className="image-container">
                {text ? <img src={text} alt="Base64 encoded" /> : false}
            </div>
            <div className="modal-buttons">
                <button onClick={() => { setText(""); onUpdate("") }}>Clear</button>
                <button onClick={() => { onUpdate(text) }}>{closeButtonName}</button>
            </div>
        </div>
    );
}, styles);