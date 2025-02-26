/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from 'react';
import styles from "./Group.scss?inline";
import {withShadowStyles} from '../../utils/withShadowStyles';


type GroupProps = {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const GroupComponent = withShadowStyles(
    React.forwardRef<HTMLDivElement, GroupProps>((props, ref) => {
        return (
            <div ref={ref} className={props.className ? `group ${props.className}` : "group"}>
                {props.title ? (<span className="group-title">{props.title}</span>) : null}
                {props.children}
            </div>
        );
    }),
    styles
);

(GroupComponent as React.FunctionComponent).displayName = "Group";

export const Group = GroupComponent;