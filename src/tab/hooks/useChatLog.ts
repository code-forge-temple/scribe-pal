/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {useState, useEffect, useCallback} from 'react';
import {EXTENSION_NAME} from '../../common/constants';
import {ChatBoxIds, ChatMessage} from '../utils/types';
import {generateUniqueId} from '../utils/utils';
import {polyfillGetTabStorage, polyfillSetTabStorage} from '../privilegedAPIs/privilegedAPIs';

export type Sender = "user" | typeof EXTENSION_NAME;

export type NewChatLogParams = { text: string; sender: Sender; loading?: boolean };
export type ExistingChatLogParams = { text: string; messageId: string; loading?: boolean };
export type DeleteChatLogParams = { delete: true; messageId: string };

export type UpdateChatLogParams = NewChatLogParams | ExistingChatLogParams;

const isExistingChatLogParams = (
    params: NewChatLogParams | ExistingChatLogParams | DeleteChatLogParams
): params is ExistingChatLogParams => {
    if ('delete' in params && params.delete === true) {
        return false;
    }

    return 'messageId' in params;
};

const isDeleteChatLogParams = (
    params: NewChatLogParams | ExistingChatLogParams | DeleteChatLogParams
): params is DeleteChatLogParams => {
    return 'delete' in params && params.delete === true;
};

export const useChatLog = ({tabId, chatBoxId}: ChatBoxIds) => {
    const [chatLog, setChatLogState] = useState<ChatMessage[]>([]);

    useEffect(() => {
        (async () => {
            const currentTab = await polyfillGetTabStorage(tabId);
            const storedLog = currentTab.chatBoxes?.[chatBoxId]?.chatBoxChatLog;
            if (storedLog !== undefined) {
                setChatLogState(storedLog);
            }
        })();
    }, [tabId, chatBoxId]);

    const persistChatLog = useCallback((log: ChatMessage[]) => {
        polyfillGetTabStorage(tabId).then((currentTab) => {
            currentTab.chatBoxes = currentTab.chatBoxes || {};
            currentTab.chatBoxes[chatBoxId] = currentTab.chatBoxes[chatBoxId] || {};
            currentTab.chatBoxes[chatBoxId]["chatBoxChatLog"] = log;

            polyfillSetTabStorage(tabId, currentTab);
        });
    }, [tabId, chatBoxId]);

    function updateChatLog(params: NewChatLogParams, persist?: boolean): string;
    function updateChatLog(params: ExistingChatLogParams, persist?: boolean): undefined;
    function updateChatLog(params: DeleteChatLogParams, persist?: boolean): undefined;
    function updateChatLog (
        params: UpdateChatLogParams | DeleteChatLogParams,
        persist: boolean = true
    ): string | undefined {
        if (isDeleteChatLogParams(params)) {
            setChatLogState((prevLog) => {
                const updated = prevLog.filter((msg) => msg.id !== params.messageId);
                if (persist) {
                    persistChatLog(updated);
                }

                return updated;
            });

            return undefined;
        }

        if (isExistingChatLogParams(params)) {
            setChatLogState((prevLog) => {
                const updated = prevLog.map((msg): ChatMessage =>
                    msg.id === params.messageId
                        ? {...msg, text: params.text, loading: params.loading}
                        : msg
                );
                if (persist) {
                    persistChatLog(updated);
                }

                return updated;
            });

            return undefined;
        }

        const newId = generateUniqueId();

        setChatLogState((prevLog) => {
            const updated = [
                ...prevLog,
                {id: newId, sender: params.sender, text: params.text, loading: params.loading}
            ];

            if (persist) {
                persistChatLog(updated);
            }

            return updated;
        });

        return newId;
    }

    const memoizedUpdateChatLog = useCallback(updateChatLog, [tabId, chatBoxId, updateChatLog]);

    return {chatLog, setChatLog: memoizedUpdateChatLog};
};