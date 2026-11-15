/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useRef, useState, useLayoutEffect, useEffect} from 'react';
import styles from "./ChatInput.scss?inline";
import {withShadowStyles} from '../../../../utils/withShadowStyles';
import {SUGGESTIONS} from '../../../../utils/constants';
import {ChatInputSuggestions, Suggestion} from './components/ChatInputSuggestions';
import {ContextGauge} from '../ContextGauge';
import {matchingSuggestions} from './suggestions';

type ChatInputProps = {
    message: string;
    onMessageChange: (value: string) => void;
    onSend: () => void;
    commands: Suggestion[];
    commandsNotice?: string;
    disabled?: boolean;
    modelName: string;
    usedTokens: number;
}

const KEYWORD_SUGGESTIONS: Suggestion[] = SUGGESTIONS.map((value) => ({value}));

export const ChatInput = withShadowStyles(({
    message,
    onMessageChange,
    onSend,
    commands,
    commandsNotice,
    disabled = false,
    modelName,
    usedTokens
}: ChatInputProps) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [caret, setCaret] = useState<number>(0);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [notice, setNotice] = useState<string | undefined>();
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);
    const [suggestionPosition, setSuggestionPosition] = useState({top: 0, left: 0});
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    // Where Escape closed the menu. Without it, a command list arriving later reopens the menu, and Enter picks instead of sending.
    const [dismissedAt, setDismissedAt] = useState("");

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
                    inputRef.current.scrollLeft = caretPixelPos - visibleWidth + ctx.measureText('M').width;
                }
            }
        }
    }, [message, caret]);

    // Only until the text or caret moves: coming back to the same spot later must open the menu again.
    useEffect(() => {
        if (dismissedAt && dismissedAt !== `${caret}:${message}`) {
            setDismissedAt("");
        }
    }, [message, caret, dismissedAt]);

    useEffect(() => {
        const textUpToCaret = message.slice(0, caret);
        const words = textUpToCaret.split(/\s/);
        const lastWord = words.pop() || "";
        const isCommandWord = lastWord.startsWith("/") && words.every((word) => word === "");
        const options = lastWord.startsWith("@") ? KEYWORD_SUGGESTIONS : isCommandWord ? commands : [];
        const matching = matchingSuggestions(options, lastWord);
        const menuNotice = isCommandWord && !commands.length ? commandsNotice : undefined;

        if ((matching.length || menuNotice) && dismissedAt !== `${caret}:${message}` && inputRef.current) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (ctx) {
                const computedStyle = window.getComputedStyle(inputRef.current);

                ctx.font = computedStyle.font;

                const textStart = parseFloat(computedStyle.borderLeftWidth || "0") + parseFloat(computedStyle.paddingLeft || "0");
                const textWidth = ctx.measureText(textUpToCaret).width;
                const {top, left} = inputRef.current.getBoundingClientRect();

                setSuggestionPosition({top: top, left: left + textStart + textWidth - inputRef.current.scrollLeft});
                setSuggestions(matching);
                setNotice(menuNotice);
                setSuggestionsVisible(true);

                setSelectedSuggestionIndex(0);
            }
        } else {
            setSuggestionsVisible(false);
        }
    }, [message, caret, commands, commandsNotice, dismissedAt]);

    const onSuggestionClick = (option: string) => {
        const textUpToCaret = message.slice(0, caret);
        const restText = message.slice(caret);
        const words = textUpToCaret.split(" ");

        words[words.length - 1] = option;

        const newText = words.join(" ") + " " + restText;
        const newCaret = words.join(" ").length + 1;

        onMessageChange(newText);
        setCaret(newCaret);
        setSuggestionsVisible(false);
    };

    return (
        <div className="chat-input-container">
            <ContextGauge modelName={modelName} usedTokens={usedTokens} />
            <textarea
                ref={inputRef}
                rows={1}
                name="message"
                aria-label="Message"
                placeholder="Type your message..."
                value={message}
                disabled={disabled}
                onKeyUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onChange={(e) => onMessageChange(e.target.value)} // needed in situations like spellcheck for example
                onPaste={(e) => {
                    if (disabled) return;

                    e.preventDefault();

                    const pastedText = e.clipboardData.getData('text')
                        .replace(/\r\n/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\t/g, ' ');
                    const input = inputRef.current;

                    if (!input) return;

                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;
                    const newMessage = message.slice(0, start) + pastedText + message.slice(end);

                    onMessageChange(newMessage);
                    setCaret(start + pastedText.length);
                }}
                onKeyDown={(e) => {
                    if (disabled) return;

                    e.stopPropagation();

                    const input = e.target as HTMLInputElement;
                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;

                    if (suggestionsVisible && suggestions.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                        e.preventDefault();

                        if (e.key === "ArrowDown") {
                            setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                        } else {
                            setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                        }

                        return;
                    }

                    if (suggestionsVisible && suggestions.length && e.key === "Enter") {
                        e.preventDefault();

                        onSuggestionClick(suggestions[selectedSuggestionIndex].value);

                        return;
                    }

                    if (suggestionsVisible && e.key === "Escape") {
                        e.preventDefault();

                        setDismissedAt(`${caret}:${message}`);
                        setSuggestionsVisible(false);

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

                    if (e.key === "Enter") {
                        e.preventDefault();

                        onSend();

                        return;
                    }

                    e.preventDefault();

                    let newCaret = start;
                    let newMessage = message;

                    if (e.key === "Backspace") {
                        if (start !== end) {
                            newMessage = message.slice(0, start) + message.slice(end);
                        } else if (start > 0) {
                            newMessage = message.slice(0, start - 1) + message.slice(start);
                            newCaret = start - 1;
                        }

                        onMessageChange(newMessage);
                        setCaret(newCaret);

                        return;
                    } else if (e.key === "Delete") {
                        if (start !== end) {
                            newMessage = message.slice(0, start) + message.slice(end);
                        } else {
                            newMessage = message.slice(0, start) + message.slice(start + 1);
                        }

                        onMessageChange(newMessage);
                        setCaret(start);

                        return;
                    }

                    if (e.key.length === 1 && !e.metaKey) {
                        newMessage = message.slice(0, start) + e.key + message.slice(end);

                        onMessageChange(newMessage);
                        setCaret(start + 1);
                    }
                }}
            />
            <button onClick={onSend} disabled={disabled}>Send</button>
            {suggestionsVisible && (
                <ChatInputSuggestions
                    suggestions={suggestions}
                    notice={notice}
                    selectedIndex={selectedSuggestionIndex}
                    position={suggestionPosition}
                    onSuggestionClick={onSuggestionClick}
                    onSuggestionHover={setSelectedSuggestionIndex}
                />
            )}
        </div>
    );
}, styles);