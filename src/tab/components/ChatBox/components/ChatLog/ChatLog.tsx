/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useEffect, useRef} from 'react';
import {ChatMessage} from '../../../../utils/types';
import {MarkdownRenderer} from '../../../MarkdownRenderer';
import {EXTENSION_NAME} from '../../../../../common/constants';
import SpinnerSvg from '../../../../assets/refresh-double.svg';
import ScrollToEndSvg from '../../../../assets/download-circle-solid.svg';
import DeleteMessageSvg from '../../../../assets/bin-full.svg';
import CopyMessageSvg from '../../../../assets/copy.svg';
import {Group} from '../../../Group';
import styles from "./ChatLog.scss?inline";
import {useAutoScroll} from '../../../../hooks';
import {Tooltip} from '../Tooltip/Tooltip';
import {withShadowStyles} from '../../../../utils/withShadowStyles';

type ChatLogProps = {
    messages: ChatMessage[];
    isMinimized: boolean;
    onDeleteMessage: (messageId: string, messageIndex: number) => void;
    onCopyMessage: (messageId: string, messageIndex: number) => void;
}

export const ChatLog = withShadowStyles(({messages, isMinimized, onDeleteMessage, onCopyMessage}:ChatLogProps) => {
    const {updateScroll, setAutoScroll, userInterruptAutoScroll} = useAutoScroll();
    const chatLogRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (chatLogRef.current) {
            updateScroll(chatLogRef.current);
        }
    }, [messages, updateScroll]);

    useEffect(() => {
        const currentDiv = chatLogRef.current;

        if (!currentDiv) return;

        currentDiv.addEventListener("scroll", userInterruptAutoScroll);

        return () => {
            currentDiv.removeEventListener("scroll", userInterruptAutoScroll);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setAutoScroll, userInterruptAutoScroll, chatLogRef.current]);

    if (isMinimized || !messages.length) {
        return null;
    }

    return (
        <>
            <Group ref={chatLogRef} className='chat-log'>
                {messages.map((msg, index) => (
                    <div key={msg.id || index} className={`chat-message ${msg.sender}`}>
                        <span className='sender'>
                            <Tooltip text='Delete message'>
                                <DeleteMessageSvg className="delete-message" onClick={() => onDeleteMessage(msg.id, index)} />
                            </Tooltip>
                            <Tooltip text='Copy message'>
                                <CopyMessageSvg className="copy-message" onClick={() => onCopyMessage(msg.id, index)} />
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
            <div
                className='scroll-to-end'
                title="scroll to end"
                onClick={() => setAutoScroll(true)}
            ><ScrollToEndSvg /></div>
        </>
    );
}, styles);