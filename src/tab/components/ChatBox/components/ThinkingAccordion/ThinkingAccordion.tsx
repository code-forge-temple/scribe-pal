/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useEffect, useRef, useState} from 'react';
import {MarkdownRenderer} from '../../../MarkdownRenderer';
import styles from "./ThinkingAccordion.scss?inline";
import {withShadowStyles} from '../../../../utils/withShadowStyles';

type ThinkingAccordionProps = {
    thinking: string;
    isStreaming: boolean;
};

export const ThinkingAccordion = withShadowStyles(({thinking, isStreaming}: ThinkingAccordionProps) => {
    // Open while actively streaming; a finished panel (e.g. after reload) mounts collapsed.
    const [open, setOpen] = useState(isStreaming);
    const bodyRef = useRef<HTMLDivElement>(null);
    // Auto-collapse exactly once, the first time streaming is done. After that the user's
    // manual toggle wins. Seeded true when it mounts already-finished so there is no flash.
    const autoCollapsed = useRef(!isStreaming);

    useEffect(() => {
        if (!isStreaming && !autoCollapsed.current) {
            autoCollapsed.current = true;
            setOpen(false);
        }
    }, [isStreaming]);

    useEffect(() => {
        if (open && bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [thinking, open]);

    return (
        <div className="chat-log-thinking">
            <button
                type="button"
                className={`thinking-toggle${open ? ' open' : ''}`}
                onClick={() => setOpen(prev => !prev)}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <span className="thinking-chevron">{open ? '▾' : '▸'}</span>
                {isStreaming ? 'Thinking…' : 'Thought process'}
            </button>
            <div className={`thinking-body${open ? ' open' : ''}`} ref={bodyRef}>
                <MarkdownRenderer content={thinking} />
            </div>
        </div>
    );
}, styles);
