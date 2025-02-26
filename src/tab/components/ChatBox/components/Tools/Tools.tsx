/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from "react";
import {Group} from "../../../Group";
import {withShadowStyles} from "../../../../utils/withShadowStyles";
import styles from "./Tools.scss?inline";

type ToolAction = {
    label: string;
    call: () => void;
    icon?: React.ReactNode;
};

type ToolsProps = {
    actions: ToolAction[];
};

export const Tools = withShadowStyles(({actions}: ToolsProps) => {
    return (
        <Group title="Tools">
            <div className="tools-group">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            action.call();
                        }}
                    >
                        {action.label}
                        {action.icon}
                    </button>
                ))}
            </div>
        </Group>
    );
}, styles);