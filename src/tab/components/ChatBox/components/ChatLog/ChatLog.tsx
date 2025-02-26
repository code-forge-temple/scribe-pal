/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useEffect, useRef} from 'react';
import {ChatBoxIds, ChatMessage} from '../../../../utils/types';
import {MarkdownRenderer} from '../../../MarkdownRenderer';
import {EXTENSION_NAME} from '../../../../../common/constants';
import SpinnerSvg from '../../../../assets/refresh-double.svg';
import {Group} from '../../../Group';
import styles from "./ChatLog.scss?inline";
import {useAutoScroll} from '../../../../hooks';
import DeleteMessageSvg from '../../../../assets/bin-full.svg';
import {Tooltip} from '../Tooltip/Tooltip';
import {withShadowStyles} from '../../../../utils/withShadowStyles';

type ChatLogProps = {
    messages: ChatMessage[];
    isMinimized: boolean;
    chatBoxIds: ChatBoxIds;
    onDeleteMessage: (messageId: string, messageIndex: number) => void;
}

export const ChatLog = withShadowStyles(({messages, isMinimized, chatBoxIds, onDeleteMessage}:ChatLogProps) => {
    const [, updateScroll] = useAutoScroll(chatBoxIds);
    const chatLogRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (chatLogRef.current) {
            updateScroll(chatLogRef.current);
        }
    }, [messages, updateScroll]);

    if (isMinimized || !messages.length) {
        return null;
    }

    return (
        <Group ref={chatLogRef} className='chat-log'>
            {messages.map((msg, index) => (
                <div key={msg.id || index} className={`chat-message ${msg.sender}`}>
                    <span className='sender'>
                        <Tooltip text='Delete message'>
                            <DeleteMessageSvg className="delete-message" onClick={() => onDeleteMessage(msg.id, index)} />
                        </Tooltip>
                        {msg.sender === "user" ? "You" : EXTENSION_NAME}:{" "}
                        {msg.loading && <SpinnerSvg className="spinner" />}
                    </span>
                    {
                        !msg.loading && (
                            <MarkdownRenderer content={msg.text.replace(`${EXTENSION_NAME}: `, "")} />
                        )
                    }
                </div>
            ))
            }
        </Group >
    );
}, styles);