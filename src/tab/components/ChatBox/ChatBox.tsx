/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useRef, useEffect, useState, useCallback} from "react";
import {usePersistentState, useDraggablePosition} from "../../hooks";
import {ChatBoxIds, FileData, Model} from "../../utils/types";
import {EXTENSION_NAME, MESSAGE_TYPES} from "../../../common/constants";
import {ChatInput} from "./components/ChatInput";
import {ChatLog} from "./components/ChatLog";
import {ChatHeader} from "./components/ChatHeader";
import {useChatLog} from "../../hooks/useChatLog";
import {Tools} from "./components/Tools";
import {useKeepInViewport} from "../../hooks/useKeepInViewport";
import {startCapture} from "../../features/capture/captureTool";
import {CapturedTextModal} from "./components/CapturedTextModal";
import {ReferencesList} from "./components/ReferencesList";
import {getLanguageForExtension, prefixChatBoxId} from "../../utils/utils";
import PromptSvg from '../../assets/eye-solid.svg';
import CaptureTxtSvg from '../../assets/menu-scale.svg';
import CaptureImgSvg from '../../assets/media-image.svg';
import AttachSvg from '../../assets/attachment.svg';
import {useTheme} from "../../hooks/useTheme";
import {polyfillRuntimeSendMessage, polyfillGetTabStorage, polyfillRuntimeConnect, polyfillSetTabStorage} from "../../privilegedAPIs/privilegedAPIs";
import {browser} from "../../../common/browser";
import styles from "./ChatBox.scss?inline";
import {withShadowStyles} from "../../utils/withShadowStyles";
import {startCaptureImage} from "../../features/capture/captureImageTool";
import {ImageModal} from "./components/ImageModal";
import {ATTACHED_TAG, CAPTURED_IMAGE_TAG, CAPTURED_TAG} from "../../utils/constants";
import {FilesModal} from "./components/FilesModal";
import {PromptModal} from "./components/PromptModal";

const formatMessage = (message: string, {capturedText, capturedImage, attachedFiles}: {capturedText: string, capturedImage: string, attachedFiles: FileData[]}) => {
    let newMessage = message.replace(
        CAPTURED_IMAGE_TAG,
        capturedImage ? (`\n![Captured Image](${capturedImage})\n`) : ""
    );

    let attachedFilesContents: string|undefined = "";

    for(const attachedFile of attachedFiles) {
        const fileExtension = attachedFile.name.split(".").pop()?.toLowerCase();
        const language = getLanguageForExtension(fileExtension);

        attachedFilesContents += `\n\`\`\`${language}\n${attachedFile.content}\n\`\`\`\n`;
    }

    if(attachedFilesContents) {
        newMessage = newMessage.replace(ATTACHED_TAG, attachedFilesContents);
    }

    newMessage = newMessage.replace(
        CAPTURED_TAG,
        capturedText ? ("\n```text\n" + capturedText + "\n```\n") : ""
    );

    return newMessage;
}

const ROLE = {
    USER: "user",
    SYSTEM: "system",
    ASSISTANT: "assistant"
} as const;

type ChatBoxProps = ChatBoxIds & {
    onRemove: () => void;
    coordsOffset: number;
};

export const ChatBox = withShadowStyles(({tabId, chatBoxId, onRemove, coordsOffset}: ChatBoxProps) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition, handleDrag] = useDraggablePosition(
        {tabId, chatBoxId},
        {
            left:  `calc(100% - 600px - ${30 * coordsOffset}px)`,
            top: `calc(210px + ${30 * coordsOffset}px)`
        });
    const [message, setMessage] = usePersistentState<string>("chatBoxMessage", "", {tabId, chatBoxId});
    const {chatLog, setChatLog} = useChatLog({tabId, chatBoxId});
    const [selectedModel, setSelectedModel] = usePersistentState<string>("chatBoxSelectedModel", "", {tabId, chatBoxId});
    const [models, setModels] = useState<Model[]>([]);
    const [isMinimized, setIsMinimized] = usePersistentState<boolean>("chatBoxMinimized", false, {tabId, chatBoxId});
    const [isExpanded, setIsExpanded] = usePersistentState<boolean>("chatBoxExpanded", false, {tabId, chatBoxId});
    const [isLLMResponding, setIsLLMResponding] = useState<boolean>(false);
    const [capturedText, setCapturedText] = usePersistentState<string>("capturedText", "", {tabId, chatBoxId});
    const [capturedImage, setCapturedImage] = usePersistentState<string>("capturedImage", "", {tabId, chatBoxId});
    const [capturedModalVisible, setCapturedModalVisible] = useState<boolean>(false);
    const [capturedImageModalVisible, setCapturedImageModalVisible] = useState<boolean>(false);
    const [promptMessage, setPromptMessage] = usePersistentState<string>("promptMessage", "", {tabId, chatBoxId});
    const [promptModalVisible, setPromptModalVisible] = useState<boolean>(false);

    const [attachedFiles, setAttachedFiles] = usePersistentState<FileData[]>("attachedFiles", [], {tabId, chatBoxId});
    const [attachedFilesModalVisible, setAttachedFilesModalVisible] = useState<boolean>(false);

    const updateTheme = useTheme(boxRef);

    const fetchModels = useCallback(() => {
        polyfillRuntimeSendMessage({type: MESSAGE_TYPES.FETCH_MODELS}).then((response: any) => {
            if (response && response.models) {
                setModels(response.models);
            } else {
                setChatLog({
                    text: `${EXTENSION_NAME}: ${response && response.error
                        ? "Error fetching models: " + response.error
                        : "No models received from service worker."
                    }`,
                    sender: EXTENSION_NAME
                });

                setModels([]);
            }
        });
    }, [setModels, setChatLog]);

    const pollForNewModel = useCallback((targetModel: string) => {
        const intervalId = setInterval(() => {
            polyfillRuntimeSendMessage({type: MESSAGE_TYPES.FETCH_MODELS}).then((response: any) => {
                if (response && response.models) {
                    setModels(response.models);

                    if (response.models.some((model: any) => model.name.startsWith(targetModel))) {
                        clearInterval(intervalId);
                    }
                }
            });
        }, 2000);
    }, [setModels]);

    useEffect(() => {
        fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    useEffect(() => {
        return handleDrag(boxRef);
    }, [handleDrag]);

    useEffect(() => {
        const listener = (message: any) => {
            if (message.type === MESSAGE_TYPES.ACTION_OLLAMA_HOST_UPDATED) {
                fetchModels();
            } else if (message.type === MESSAGE_TYPES.ACTION_UPDATE_THEME) {
                updateTheme();
            }
        };

        browser.runtime.onMessage.addListener(listener);

        return () => {
            browser.runtime.onMessage.removeListener(listener);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateTheme]);

    useEffect(() => {
        const listener = (event: MessageEvent) => {
            const {type, visible} = event.data;

            if (type === MESSAGE_TYPES.TOGGLE_CHAT_VISIBILITY) {
                setIsVisible(visible);
            }
        };

        window.addEventListener("message", listener);

        return () => {
            window.removeEventListener("message", listener);
        };
    }, []);

    useKeepInViewport({ref: boxRef, position, setPosition, isVisible, triggerCheck: isExpanded});

    const handleSend = async () => {
        if (message.trim() === "") return;

        const formattedMessage = formatMessage(message, {capturedText, capturedImage, attachedFiles});

        const conversationHistory = chatLog
            .filter((msg) => !msg.loading)
            .map((msg) => ({
                role: msg.sender === ROLE.USER ? ROLE.USER : ROLE.ASSISTANT,
                content: msg.text
            }));

        const systemMessage = promptMessage.trim()
            ? [{role: ROLE.SYSTEM, content: promptMessage.trim()}]
            : [];

        const conversation = [
            ...systemMessage,
            ...conversationHistory,
            {role: ROLE.USER, content: formattedMessage}
        ];

        setChatLog({text: formattedMessage, sender: ROLE.USER});

        if (!selectedModel) {
            setChatLog({
                text: `${EXTENSION_NAME}: Please select a model before sending a message.`,
                sender: EXTENSION_NAME
            });

            return;
        }

        const pendingMessageId = setChatLog({
            text: `${EXTENSION_NAME}: `,
            sender: EXTENSION_NAME,
            loading: true
        });

        setIsLLMResponding(true);

        polyfillRuntimeConnect({
            name: MESSAGE_TYPES.FETCH_AI_RESPONSE,
            data: {type: MESSAGE_TYPES.FETCH_AI_RESPONSE, messages: conversation, model: selectedModel},
            onMessage: (response) => {
                if ("error" in response) {
                    setChatLog({
                        text: `${EXTENSION_NAME}: Sorry, there was an error: ${response.error}`,
                        messageId: pendingMessageId,
                    });
                    setIsLLMResponding(false);
                } else {
                    setChatLog({text: response.reply, messageId: pendingMessageId}, response.final === true);

                    if (response.final) {
                        setIsLLMResponding(false);
                    }
                }

                setMessage("");
            },
        });
    };

    const handleResendMessage = (messageIndex: number) => {
        const msg = chatLog[messageIndex];

        if (!msg || msg.sender !== ROLE.USER) return;

        const truncatedChatLog = chatLog.slice(0, messageIndex + 1);
        const conversationHistory = truncatedChatLog
            .slice(0, messageIndex)
            .filter((m) => !m.loading)
            .map((m) => ({
                role: m.sender === ROLE.USER ? ROLE.USER : ROLE.ASSISTANT,
                content: m.text
            }));
        const systemMessage = promptMessage.trim()
            ? [{role: ROLE.SYSTEM, content: promptMessage.trim()}]
            : [];
        const conversation = [
            ...systemMessage,
            ...conversationHistory,
            {role: ROLE.USER, content: msg.text}
        ];

        if (!selectedModel) {
            setChatLog({
                text: `${EXTENSION_NAME}: Please select a model before resending a message.`,
                sender: EXTENSION_NAME
            });

            return;
        }

        for (let i = chatLog.length - 1; i > messageIndex; i--) {
            setChatLog({delete: true, messageId: chatLog[i].id});
        }

        const pendingMessageId = setChatLog({
            text: `${EXTENSION_NAME}: `,
            sender: EXTENSION_NAME,
            loading: true
        });

        setIsLLMResponding(true);

        polyfillRuntimeConnect({
            name: MESSAGE_TYPES.FETCH_AI_RESPONSE,
            data: {type: MESSAGE_TYPES.FETCH_AI_RESPONSE, messages: conversation, model: selectedModel},
            onMessage: (response) => {
                if ("error" in response) {
                    setChatLog({
                        text: `${EXTENSION_NAME}: Sorry, there was an error: ${response.error}`,
                        messageId: pendingMessageId,
                    });
                    setIsLLMResponding(false);
                } else {
                    setChatLog({text: response.reply, messageId: pendingMessageId}, response.final === true);

                    if (response.final) {
                        setIsLLMResponding(false);
                    }
                }
            },
        });
    };

    const handleShareMessageHistory = (messageIndex: number) => {
        const historyToShare = chatLog
            .slice(0, messageIndex + 1)
            .filter((msg) => !msg.loading)
            .map((msg) => {
                const sender = msg.sender === ROLE.USER ? "You" : EXTENSION_NAME;
                const content = msg.text.replace(`${EXTENSION_NAME}: `, "");
                return `**${sender}:**\n${content}`;
            })
            .join("\n\n---\n\n");

        navigator.clipboard.writeText(historyToShare).then(() => {
            console.log("Message history copied to clipboard");
        }).catch((err) => {
            console.error("Failed to copy message history:", err);
        });
    };

    const handleClose = () => {
        (async () => {
            const tabStorage = await polyfillGetTabStorage(tabId);

            if (tabStorage.chatBoxes?.[chatBoxId]) {
                delete tabStorage.chatBoxes[chatBoxId];

                await polyfillSetTabStorage(tabId, tabStorage);
            }
        })();

        onRemove();
    };

    const handleModelDelete = (modelName: string) => {
        if (!window.confirm("Are you sure you want to delete this model?")) {
            return;
        }

        polyfillRuntimeSendMessage({type: MESSAGE_TYPES.DELETE_MODEL, model: modelName}).then((response: any) => {
            if (response && response.success) {
                setSelectedModel("");
                fetchModels();
            } else {
                setChatLog({
                    text: `${EXTENSION_NAME}: Failed to delete model: ${response && response.error ? response.error : "Unknown error"
                    }`,
                    sender: EXTENSION_NAME
                });
            }
        });
    };

    const handleDeleteMessage = (messageId: string, messageIndex: number) => {
        if (messageIndex === chatLog.length - 1) {
            polyfillRuntimeSendMessage({type: MESSAGE_TYPES.ABORT_AI_RESPONSE});
            setIsLLMResponding(false);
        }

        setChatLog({delete: true, messageId});
    };

    const handleMinimize = () => { setIsMinimized(!isMinimized); };
    const handleExpand = () => {setIsExpanded(!isExpanded); };

    const toggleChatVisibility = (visible: boolean) => {
        window.postMessage(
            {
                type: MESSAGE_TYPES.TOGGLE_CHAT_VISIBILITY,
                visible,
            },
            "*"
        );
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (!files) return;

        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (e) => {
                    const fileContent = e.target?.result as string;

                    const fileData: FileData = {
                        name: file.name,
                        content: fileContent,
                    };

                    setAttachedFiles((prevFiles) => [...prevFiles, fileData]);
                };

                reader.readAsText(file);
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div
            id={prefixChatBoxId(chatBoxId)}
            className="chat-box"
            ref={boxRef}
            style={{
                left: position.left,
                top: position.top,
                display: isVisible ? "flex" : "none",
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                width: isExpanded ? '800px' : '',
            }} >
            <ChatHeader
                selectedModel={selectedModel}
                models={models}
                onNewModel={pollForNewModel}
                onError={(error: string) => setChatLog({text: error, sender: EXTENSION_NAME})}
                onModelDelete={handleModelDelete}
                isMinimized={isMinimized}
                isExpanded={isExpanded}
                onModelSelect={setSelectedModel}
                onModelsRefresh={fetchModels}
                onExpand={handleExpand}
                onMinimize={handleMinimize}
                onClose={handleClose}
            />
            {!isMinimized && (
                <>
                    <ChatLog
                        messages={chatLog}
                        isMinimized={isMinimized}
                        onDeleteMessage={handleDeleteMessage}
                        onCopyMessage={(msgId: string) => {
                            const foundMessage = chatLog.find((msg) => msg.id === msgId);
                            const message = (foundMessage?.text ?? '').replace(`${EXTENSION_NAME}: `, "");
                            navigator.clipboard.writeText(message);
                        }}
                        onResendMessage={handleResendMessage}
                        onShareMessageHistory={handleShareMessageHistory}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.md,.html,.css,.scss,.js,.ts,.tsx,.json,.xml,.csv,.yaml,.yml,.ini,.log,.sh,.sql,.py,.java,.c,.cpp,.h,.bat,.env"
                        style={{display: "none"}}
                        onChange={handleFileChange}
                    />
                    <Tools actions={[
                        {
                            call: () => {
                                toggleChatVisibility(false);

                                startCapture((capturedText) => {
                                    toggleChatVisibility(true);

                                    setCapturedText(capturedText);
                                    setCapturedModalVisible(true);
                                });
                            },
                            label: <>Capture <CaptureTxtSvg className={capturedText ? "icon" : ""} /></>,
                            tooltip: "capture text",
                        },
                        {
                            call: () => {
                                toggleChatVisibility(false);

                                startCaptureImage((capturedImageBase64) => {
                                    toggleChatVisibility(true);

                                    setCapturedImage(capturedImageBase64);
                                    setCapturedImageModalVisible(true);
                                });
                            },
                            label: <>Capture <CaptureImgSvg className={capturedImage ? "icon" : ""} /></>,
                            tooltip: "capture image",
                        },
                        {
                            call: () => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.click();
                                }
                            },
                            label: <>Attach <AttachSvg className={attachedFiles.length ? "icon" : ""} /></>,
                            tooltip: "attach files",
                        },
                        {
                            call: () => {
                                setPromptModalVisible(true);
                            },
                            label: "Prompt",
                            tooltip: "add prompt",
                            icon: promptMessage ? <PromptSvg className="icon" /> : undefined
                        },
                    ]} />
                    <ReferencesList list={[
                        ... (capturedText ? [
                            {
                                text: CAPTURED_TAG,
                                tooltip: "Click to view captured text",
                                onClick: () => {
                                    setCapturedModalVisible(true);
                                },
                                onClose: () => {
                                    setCapturedText("");
                                }
                            }
                        ] : []),
                        ... (capturedImage ? [
                            {
                                text: CAPTURED_IMAGE_TAG,
                                tooltip: "Click to view captured image",
                                onClick: () => {
                                    setCapturedImageModalVisible(true);
                                },
                                onClose: () => {
                                    setCapturedImage("");
                                }
                            }
                        ] : []),
                        ... (attachedFiles.length ? [
                            {
                                text: ATTACHED_TAG,
                                tooltip: "Click to view attached files",
                                onClick: () => {
                                    setAttachedFilesModalVisible(true);
                                },
                                onClose: () => {
                                    setAttachedFiles([]);
                                }
                            }
                        ] : []),

                    ]} />
                    <CapturedTextModal
                        visible={capturedModalVisible}
                        richText={capturedText}
                        closeButtonName="Save"
                        onUpdate={(txt:string) => { setCapturedText(txt); setCapturedModalVisible(false); }} />
                    <FilesModal
                        visible={attachedFilesModalVisible}
                        files={attachedFiles}
                        closeButtonName="Save"
                        onUpdate={(files: FileData[]) => { setAttachedFiles(files); setAttachedFilesModalVisible(false); }} />
                    <ImageModal
                        visible={capturedImageModalVisible}
                        imageBase64={capturedImage}
                        closeButtonName="Save"
                        onUpdate={(txt:string) => { setCapturedImage(txt); setCapturedImageModalVisible(false); }} />
                    <PromptModal
                        visible={promptModalVisible}
                        prompt={promptMessage}
                        closeButtonName="Save"
                        onUpdate={(txt:string) => { setPromptMessage(txt); setPromptModalVisible(false); }} />
                    <ChatInput
                        message={message}
                        onMessageChange={setMessage}
                        onSend={handleSend}
                        disabled={isLLMResponding}
                    />
                </>
            )}
        </div>
    );
}, styles);