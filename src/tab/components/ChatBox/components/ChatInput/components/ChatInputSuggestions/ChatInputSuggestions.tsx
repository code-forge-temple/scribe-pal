/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from 'react';
import styles from './ChatInputSuggestions.scss?inline';
import {withShadowStyles} from '../../../../../../utils/withShadowStyles';


type ChatInputSuggestionsProps = {
    suggestions: string[];
    position: { top: number; left: number };
    onSuggestionClick: (option: string) => void;
    selectedIndex: number;
    onSuggestionHover: (index: number) => void;
  };

export const ChatInputSuggestions: React.FC<ChatInputSuggestionsProps> = withShadowStyles(({
    suggestions,
    position,
    selectedIndex,
    onSuggestionClick,
    onSuggestionHover,
}) => {
    return (
        <ul
            className="chat-input-suggestions"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {suggestions.map((option, index) => (
                <li
                    className={'chat-input-suggestion' + (index === selectedIndex ? ' selected' : '')}
                    key={option}
                    onClick={() => onSuggestionClick(option)}
                    onMouseEnter={() => onSuggestionHover(index)}
                >
                    {option}
                </li>
            ))}
        </ul>
    );
}, styles);