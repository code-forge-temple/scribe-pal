/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useEffect} from "react";
import styles from "./FilesModal.scss?inline";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import {FileData} from "../../../../utils/types";
import DeleteFileSvg from '../../../../assets/bin-full.svg';
import {Tooltip} from "../Tooltip";

type FilesModalProps = {
    visible: boolean;
    files: FileData[];
    closeButtonName?: string;
    onUpdate: (files: FileData[]) => void;
};

export const FilesModal = withShadowStyles(({
    visible,
    files: filesRef,
    onUpdate,
    closeButtonName = "Close",
}:FilesModalProps) => {
    const [files, setFiles] = useState(filesRef);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(filesRef[0]);

    useEffect(() => {
        setFiles(filesRef);
        setSelectedFile(filesRef[0]);
    }, [filesRef]);

    if (!visible) return null;

    return (
        <div className="attached-files-modal">
            <div className="contents">
                <ul className="list-group">
                    {files.map((file, index) => (
                        <li
                            key={index}
                            className={`menu-item list-group-item${selectedFile === file ? ' selected' : ''}`}
                            onClick={() => setSelectedFile(file)}>
                            <span
                                title={file.name}
                                className="file-name">
                                {file.name}
                            </span>
                            <Tooltip text='Delete file'>
                                <DeleteFileSvg className="delete-file" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    const newFiles = [...files];

                                    newFiles.splice(index, 1);

                                    if(selectedFile === file) {
                                        setSelectedFile(null);
                                    }

                                    setFiles(newFiles);
                                }} />
                            </Tooltip>
                        </li>
                    ))}
                </ul>
                <textarea
                    className={"textarea"}
                    value={selectedFile ? selectedFile.content : ""}
                    readOnly={true}
                />
            </div>
            <div className="modal-buttons">
                <button onClick={() => { setFiles([]); onUpdate([]) }}>Clear</button>
                <button onClick={() => { onUpdate(files) }}>{closeButtonName}</button>
            </div>
        </div>
    );
}, styles);