/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from 'react';
import styles from "./ChatInput.scss?inline";
import {withShadowStyles} from '../../../../utils/withShadowStyles';

type ChatInputProps = {
    message: string;
    onMessageChange: (value: string) => void;
    onSend: () => void;
}

export const ChatInput = withShadowStyles(({message, onMessageChange, onSend}:ChatInputProps) => {
    return (
        <div className="chat-input-container">
            <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={(e) => {
                    e.stopPropagation();

                    return e.key === "Enter" && onSend();
                }}
            />
            <button onClick={onSend}>Send</button>
        </div>
    );
}, styles);