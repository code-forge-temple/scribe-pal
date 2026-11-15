/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useLayoutEffect, useRef, useState} from 'react';
import styles from './ChatInputSuggestions.scss?inline';
import {withShadowStyles} from '../../../../../../utils/withShadowStyles';


export type Suggestion = {
    value: string;
    description?: string;
};

type ChatInputSuggestionsProps = {
    suggestions: Suggestion[];
    notice?: string;
    position: { top: number; left: number };
    onSuggestionClick: (option: string) => void;
    selectedIndex: number;
    onSuggestionHover: (index: number) => void;
  };

const VIEWPORT_MARGIN = 8;

export const ChatInputSuggestions: React.FC<ChatInputSuggestionsProps> = withShadowStyles(({
    suggestions,
    notice,
    position,
    selectedIndex,
    onSuggestionClick,
    onSuggestionHover,
}) => {
    const listRef = useRef<HTMLUListElement>(null);
    const [left, setLeft] = useState(position.left);

    useLayoutEffect(() => {
        const width = listRef.current?.offsetWidth ?? 0;

        setLeft(Math.max(VIEWPORT_MARGIN, Math.min(position.left, window.innerWidth - width - VIEWPORT_MARGIN)));
    }, [position.left, suggestions, notice]);

    return (
        <ul
            ref={listRef}
            className="chat-input-suggestions"
            style={{
                top: position.top,
                left,
            }}
        >
            {suggestions.map((option, index) => (
                <li
                    className={'chat-input-suggestion' + (index === selectedIndex ? ' selected' : '')}
                    key={option.value}
                    onClick={() => onSuggestionClick(option.value)}
                    onMouseEnter={() => onSuggestionHover(index)}
                >
                    <span className="chat-input-suggestion-value">{option.value}</span>
                    {option.description && (
                        <span className="chat-input-suggestion-description" title={option.description}>{option.description}</span>
                    )}
                </li>
            ))}
            {notice && <li className="chat-input-suggestions-notice">{notice}</li>}
        </ul>
    );
}, styles);
