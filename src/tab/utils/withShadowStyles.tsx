import React, {ComponentType, useContext, useEffect, FC} from "react";
import {ShadowContext} from "../contexts/ShadowContext";

export function withShadowStyles<P extends object> (
    WrappedComponent: ComponentType<P>,
    styles: string
): FC<P> {
    return function WithShadowStyles (props: P) {
        const shadowRoot = useContext(ShadowContext);

        useEffect(() => {
            if (shadowRoot) {
                const styleSheet = document.createElement("style");
                styleSheet.textContent = styles;
                shadowRoot.appendChild(styleSheet);
            }
        }, [shadowRoot]);

        return <WrappedComponent {...props} />;
    };
}