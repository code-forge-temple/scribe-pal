/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useRef, useLayoutEffect} from "react";
import styles from "./RichTextArea.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";


type RichTextAreaProps = {
    value: string;
    onChange: (value: string) => void;
    singleLine?: boolean;
    className?: string;
    placeholder?: string;
};

export const RichTextArea = withShadowStyles(({
    value,
    onChange,
    singleLine,
    className,
    placeholder = "",
}:RichTextAreaProps) => {
    const [caret, setCaret] = useState(value.length);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.setSelectionRange(caret, caret);
        }
    }, [caret]);

    return (
        <div className={`rich-text-area ${className || ""}`}>
            <textarea
                placeholder={placeholder}
                ref={textareaRef}
                className={`${className} ${(singleLine ? "textarea-single-line" : "textarea")}`}
                value={value}
                rows={singleLine ? 1 : undefined}
                onChange={(e) => {
                    onChange(e.target.value);
                    setCaret(e.target.selectionStart ?? e.target.value.length);
                }}
                onPaste={(e) => {
                    e.preventDefault();

                    let pastedText = e.clipboardData.getData('text');

                    if (singleLine) {
                        pastedText = pastedText.replace(/[\r\n]+/g, ' ');
                    } else {
                        pastedText = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    }

                    const input = textareaRef.current;

                    if (!input) return;

                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;
                    const newText = value.slice(0, start) + pastedText + value.slice(end);

                    setCaret(start + pastedText.length);
                    onChange(newText);
                }}
                onKeyUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onKeyDown={(e) => {
                    e.stopPropagation();

                    const input = e.target as HTMLTextAreaElement;
                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;
                    let newText = value;
                    let newCaret = start;

                    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
                        return;
                    }

                    if (e.key === "Tab") {
                        e.preventDefault();
                        newText = value.slice(0, start) + "\t" + value.slice(end);
                        newCaret = start + 1;
                        setCaret(newCaret);
                        onChange(newText);
                        return;
                    }

                    if (e.key === "Enter") {
                        e.preventDefault();

                        if (singleLine) {
                            return;
                        }

                        newText = value.slice(0, start) + "\n" + value.slice(end);
                        newCaret = start + 1;

                        setCaret(newCaret);
                        onChange(newText);

                        return;
                    }

                    if (e.key === "Backspace") {
                        e.preventDefault();

                        if (start !== end) {
                            newText = value.slice(0, start) + value.slice(end);
                            newCaret = start;
                        } else if (start > 0) {
                            newText = value.slice(0, start - 1) + value.slice(end);
                            newCaret = start - 1;
                        }

                        setCaret(newCaret);
                        onChange(newText);

                        return;
                    }

                    if (e.key === "Delete") {
                        e.preventDefault();

                        if (start !== end) {
                            newText = value.slice(0, start) + value.slice(end);
                            newCaret = start;
                        } else {
                            newText = value.slice(0, start) + value.slice(start + 1);
                            newCaret = start;
                        }

                        setCaret(newCaret);
                        onChange(newText);

                        return;
                    }

                    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
                        e.preventDefault();

                        newText = value.slice(0, start) + e.key + value.slice(end);
                        newCaret = start + 1;

                        setCaret(newCaret);
                        onChange(newText);

                        return;
                    }
                }}
            />
        </div>
    );
}, styles);