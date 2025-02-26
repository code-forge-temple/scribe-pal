import React from 'react';
import styles from "./App.scss?inline";
import {withShadowStyles} from '../../utils/withShadowStyles';

type AppProps= {
    children: React.ReactNode;
}

export const App=withShadowStyles(({children}: AppProps)=> {
    return <>{children}</>;
}, styles);