/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useEffect, useState} from 'react';
import {Model} from '../../../../utils/types';
import {EXTENSION_NAME, MESSAGE_TYPES} from '../../../../../common/constants';
import {RichTextModal} from '../RichTextModal';
import DeleteModelSvg from '../../../../assets/bin-full.svg';
import {Tooltip} from '../Tooltip/Tooltip';
import {polyfillRuntimeConnect, polyfillStorageLocalGet} from '../../../../privilegedAPIs/privilegedAPIs';
import styles from "./ChatHeader.scss?inline";
import {withShadowStyles} from '../../../../utils/withShadowStyles';
import {browser} from '../../../../../common/browser';


type ChatHeaderProps = {
    selectedModel: string;
    models: Model[];
    isMinimized: boolean;
    onModelSelect: (model: string) => void;
    onMinimize: () => void;
    onNewModel: (modelName: string) => void;
    onError: (error: string) => void;
    onModelsRefresh: () => void;
    onModelDelete: (modelName: string) => void;
    onClose: () => void;
}

const SELECT_MODEL_ACTIONS = {
    REFRESH: "REFRESH",
    NEW: "NEW",
}

export const ChatHeader = withShadowStyles(({
    selectedModel,
    models,
    isMinimized,
    onModelSelect,
    onMinimize,
    onNewModel,
    onError,
    onModelsRefresh,
    onModelDelete,
    onClose,
}: ChatHeaderProps) => {
    const [newModelModalVisible, setNewModelModalVisible] = useState<boolean>(false);
    const [newModel, setNewModel] = useState<string>("");
    const [isModelDownloading, setIsModelDownloading] = useState<boolean>(false);
    const [modelDownloadedPercentage, setModelDownloadedPercentage] = useState<number>(0);

    const onModelDownload = (modelName: string) => {
        setNewModel(modelName);
        setNewModelModalVisible(false);

        if (!modelName) return;

        setIsModelDownloading(true);

        polyfillRuntimeConnect({
            name: MESSAGE_TYPES.FETCH_MODEL,
            data: {type: MESSAGE_TYPES.FETCH_MODEL, model: modelName},
            onMessage: (response) => {
                if ("error" in response) {
                    console.error("Pull model error:", response.error);

                    onError(`"Pull model error: ${response.error}`);

                    setIsModelDownloading(false);
                    setNewModel("");
                } else {
                    setModelDownloadedPercentage(response.reply);

                    if (response.reply === 100) {
                        setIsModelDownloading(false);
                        onNewModel(modelName);
                        setNewModel("");
                    }
                }
            },
        });
    }

    useEffect(() => {
        const updateDefaultLlm = () => {
            if (!selectedModel) {
                polyfillStorageLocalGet("defaultLlm").then((result: { defaultLlm: string }) => {
                    if (result.defaultLlm) {
                        onModelSelect(result.defaultLlm);
                    }
                });
            }
        };

        const listener = (message: any) => {
            if (message.type === MESSAGE_TYPES.ACTION_DEFAULT_LLM_UPDATED) {
                updateDefaultLlm();
            }
        };

        browser.runtime.onMessage.addListener(listener);

        updateDefaultLlm();

        return () => {
            browser.runtime.onMessage.removeListener(listener);
        };
    }, [onModelSelect, selectedModel]);

    return (
        <>
            <div className="chat-box-header">
                <span className="prevent-select">{`${EXTENSION_NAME} Chat`}</span>
                <div className="model-selection">
                    {selectedModel ? (
                        <Tooltip text='Delete model'>
                            <DeleteModelSvg className='delete-model' onClick={() => { onModelDelete(selectedModel) }} />
                        </Tooltip>
                    ) : null}
                    <select className="prevent-select"
                        value={selectedModel}
                        onChange={(e) => {
                            const selectedModel = e.target.value;

                            if (selectedModel === SELECT_MODEL_ACTIONS.NEW) {
                                setNewModelModalVisible(true);
                                return;
                            }

                            if (selectedModel === SELECT_MODEL_ACTIONS.REFRESH) {
                                onModelsRefresh();
                                return;
                            }

                            onModelSelect(selectedModel);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <option value="" disabled>Select a model...</option>
                        {models.map((model: Model, index: number) => (
                            <option key={index} value={model.name}>
                                {model.name}
                            </option>
                        ))}
                        <option value="" disabled>──────────</option>
                        <option value={SELECT_MODEL_ACTIONS.REFRESH}>Refresh...</option>
                        {!newModel ? <option value={SELECT_MODEL_ACTIONS.NEW}>New...</option> : null}
                        {isModelDownloading ? <option value="" disabled>{`${newModel} [${modelDownloadedPercentage.toString().padStart(2, "0")}%]`}</option> : null}
                    </select>
                </div>
                <div className="header-buttons prevent-select">
                    <button
                        className="header-button"
                        onClick={onMinimize}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {isMinimized ? '□' : '−'}
                    </button>
                    <button
                        className="header-button"
                        onClick={onClose}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        ×
                    </button>
                </div>
            </div>
            <RichTextModal
                visible={newModelModalVisible}
                richText={newModel}
                singleLine={true}
                onUpdate={onModelDownload}
                closeButtonName="Download"
            />
        </>
    );
}, styles);