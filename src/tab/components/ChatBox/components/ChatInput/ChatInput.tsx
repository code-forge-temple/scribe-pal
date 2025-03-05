/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useRef, useState, useLayoutEffect} from 'react';
import styles from "./ChatInput.scss?inline";
import {withShadowStyles} from '../../../../utils/withShadowStyles';

type ChatInputProps = {
    message: string;
    onMessageChange: (value: string) => void;
    onSend: () => void;
}

// Custom behavior for the input due to some sites blocking onChange event (probably a global event listener on the main page)
// and not allowing to change the value of the input field except for some special keys.

export const ChatInput = withShadowStyles(({message, onMessageChange, onSend}: ChatInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [caret, setCaret] = useState<number>(0);

    useLayoutEffect(() => {
        if (inputRef.current) {
            inputRef.current.setSelectionRange(caret, caret);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const computedStyle = window.getComputedStyle(inputRef.current);
                ctx.font = computedStyle.font;

                const textBeforeCaret = message.slice(0, caret);
                const caretPixelPos = ctx.measureText(textBeforeCaret).width;

                const scrollLeft = inputRef.current.scrollLeft;
                const visibleWidth = inputRef.current.clientWidth;

                if (caretPixelPos > scrollLeft + visibleWidth) {
                    inputRef.current.scrollLeft = caretPixelPos - visibleWidth + 15;
                }
            }
        }
    }, [message, caret]);

    return (
        <div className="chat-input-container">
            <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={(e) => {
                    e.stopPropagation();

                    if (e.key === "Enter") {
                        e.preventDefault();

                        onSend();

                        return;
                    }

                    if (
                        e.key.startsWith('Arrow') ||
                        e.key === "Home" ||
                        e.key === "End" ||
                        e.ctrlKey ||
                        e.metaKey
                    ) {
                        return;
                    }

                    //From here on is custom behavior
                    e.preventDefault();

                    const input = e.target as HTMLInputElement;
                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;

                    if (e.key === "Backspace" || e.key === "Delete") {
                        let newCaret = start;
                        let newMessage = message;

                        if (start !== end) {
                            newMessage = message.slice(0, start) + message.slice(end);
                        } else if (start > 0) {
                            newMessage = message.slice(0, start - 1) + message.slice(start);
                            newCaret = start - 1;
                        }

                        onMessageChange(newMessage);
                        setCaret(newCaret);

                        return;
                    }

                    if (e.key.length === 1 && !e.metaKey) {
                        const newMessage = message.slice(0, start) + e.key + message.slice(end);

                        onMessageChange(newMessage);
                        setCaret(start + 1);
                    }
                }}
            />
            <button onClick={onSend}>Send</button>
        </div>
    );
}, styles);