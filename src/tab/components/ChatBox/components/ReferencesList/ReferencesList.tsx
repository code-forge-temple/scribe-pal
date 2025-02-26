/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from "react";
import {ReferenceTag, ReferenceTagProps} from "./components/ReferenceTag";
import styles from "./ReferencesList.scss?inline";
import {Group} from "../../../Group";
import {withShadowStyles} from "../../../../utils/withShadowStyles";

export type ReferencesListProps = {
    list: ReferenceTagProps[];
};

export const ReferencesList = withShadowStyles(({list}:ReferencesListProps) => {
    return (
        <Group title="References">
            <div className="references-list">
                {list.map((item, index) => (
                    <ReferenceTag
                        key={index}
                        {...item}
                    />
                ))}
            </div>
        </Group>
    );
}, styles);