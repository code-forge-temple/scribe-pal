/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import React, {useState, useCallback, useMemo, FC} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneDark} from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./MarkdownRenderer.scss?inline";
import {withShadowStyles} from "../../utils/withShadowStyles";

interface MarkdownRendererProps {
    content: string;
}

const CodeBlock: FC<any> = React.memo(({inline, className, children, ...props}) => {
    const [copied, setCopied] = useState(false);
    const codeString = useMemo(() => String(children).replace(/\n$/, ""), [children]);
    const match = /language-(\w+)/.exec(className || "");

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(codeString).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [codeString]);

    if (!inline && match) {
        return (
            <div className="code-wrapper">
                <button className="copy-button" onClick={handleCopy}>
                    {copied ? "Copied" : "Copy"}
                </button>
                <SyntaxHighlighter style={oneDark} language={match[1]} {...props}>
                    {codeString}
                </SyntaxHighlighter>
            </div>
        );
    }
    return <code className={className} {...props}>{children}</code>;
});

const PreBlock: FC<any> = React.memo(({children, ...props}) => <div {...props}>{children}</div>);

export const MarkdownRenderer = withShadowStyles(React.memo(({content}:MarkdownRendererProps) => {
    const components = useMemo(() => ({
        pre: PreBlock,
        code: CodeBlock
    }), []);

    return (
        <ReactMarkdown
            children={content}
            remarkPlugins={[remarkGfm]}
            urlTransform={(url: string) =>
                url.startsWith("data:") ? url : url
            }
            components={components}
        />
    );
}), styles);