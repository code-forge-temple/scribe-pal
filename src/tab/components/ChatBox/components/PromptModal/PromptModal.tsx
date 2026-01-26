/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useEffect} from "react";
import styles from "./PromptModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import {RichTextArea} from "../RichTextArea";
import DeleteSvg from '../../../../assets/bin-full.svg';
import AddSvg from '../../../../assets/floppy-disk.svg';
import {Tooltip} from "../Tooltip";
import {polyfillStorageLocalGet, polyfillStorageLocalSet} from "../../../../privilegedAPIs/privilegedAPIs";

type PromptItem = {
    id: string;
    title: string;
    content: string;
};

type PromptModalProps = {
    visible: boolean;
    prompt: string;
    closeButtonName?: string;
    onUpdate: (updatedPrompt: string) => void;
};

const PROMPTS_STORAGE_KEY = "savedPrompts";

function generateId () {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const PromptModal = withShadowStyles(({
    visible,
    prompt,
    onUpdate,
    closeButtonName = "Save",
}: PromptModalProps) => {
    const [text, setText] = useState(prompt);
    const [prompts, setPrompts] = useState<PromptItem[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string>("");
    const [newPromptTitle, setNewPromptTitle] = useState<string>("");

    useEffect(() => {
        polyfillStorageLocalGet(PROMPTS_STORAGE_KEY).then((result) => {
            if (result[PROMPTS_STORAGE_KEY]) {
                setPrompts(result[PROMPTS_STORAGE_KEY]);
            }
        });
    }, []);

    useEffect(() => {
        if (visible) {
            setSelectedPromptId("");
            setText(prompt);
            setNewPromptTitle("");
        }
    }, [visible, prompt]);

    useEffect(() => {
        setText(prompt);
        setSelectedPromptId("");
    }, [prompt]);

    useEffect(() => {
        if (selectedPromptId) {
            const found = prompts.find(p => p.id === selectedPromptId);

            if (found) {
                setText(found.content);
                setNewPromptTitle(found.title);
            }
        } else {
            setText(prompt);
            setNewPromptTitle("");
        }
    }, [selectedPromptId, prompts, prompt]);

    const persistPrompts = (list: PromptItem[]) => {
        setPrompts(list);
        polyfillStorageLocalSet({[PROMPTS_STORAGE_KEY]: list});
    };

    const handleAddPrompt = () => {
        if (!newPromptTitle.trim()) {
            return;
        }

        const newPrompt: PromptItem = {
            id: generateId(),
            title: newPromptTitle.trim(),
            content: text,
        };
        const updated = [...prompts, newPrompt];

        persistPrompts(updated);
        setSelectedPromptId(newPrompt.id);
        setNewPromptTitle("");
    };

    if (!visible) return null;

    return (
        <div className="prompt-modal">
            <div className="contents">
                <ul className="list-group">
                    <li
                        className={`menu-item list-group-item ${!selectedPromptId ? 'selected' : ''}`}
                        onClick={() => setSelectedPromptId("")}
                    >
                        <span className="prompt-name">(New/Custom Prompt)</span>
                    </li>
                    {prompts.map((p) => (
                        <li
                            key={p.id}
                            className={`menu-item list-group-item ${selectedPromptId === p.id ? 'selected' : ''}`}
                            onClick={() => setSelectedPromptId(p.id)}
                        >
                            <span title={p.title} className="prompt-name">{p.title}</span>
                            <Tooltip text='Delete prompt'>
                                <DeleteSvg className="delete-prompt" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    const updated = prompts.filter(pr => pr.id !== p.id);

                                    persistPrompts(updated);

                                    if (selectedPromptId === p.id) {
                                        setSelectedPromptId("");
                                        setText("");
                                    }
                                }} />
                            </Tooltip>
                        </li>
                    ))}
                </ul>
                <div className="prompt-content">
                    <div className="title-row">
                        <input
                            type="text"
                            className="prompt-title-input"
                            placeholder="Prompt title"
                            value={newPromptTitle}
                            onChange={e => setNewPromptTitle(e.target.value)}
                        />
                        <Tooltip text='Save prompt globally'>
                            <AddSvg
                                className="save-button"
                                onClick={handleAddPrompt}
                                style={{width: 20, height: 20}} />
                        </Tooltip>
                    </div>
                    <RichTextArea
                        value={text}
                        onChange={setText}
                        singleLine={false}
                        placeholder="Ex: You are a helpful assistant. Answer concisely and clearly."
                    />
                </div>
            </div>
            <div className="modal-buttons">
                <button onClick={() => { setText(""); onUpdate(""); }}>Clear</button>
                <button onClick={() => { onUpdate(text); }}>{closeButtonName}</button>
            </div>
        </div>
    );
}, styles);