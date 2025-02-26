/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React from 'react';

type TooltipProps = {
    text: string;
    children: React.ReactNode;
    className?: string;
}


export const Tooltip = ({text, className, children}: TooltipProps) => {
    return (
        <span className={`${className ? className : ""}`} title={text}>
            {children}
        </span>
    );
}