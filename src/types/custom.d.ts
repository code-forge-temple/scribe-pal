/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

declare module "*.svg" {
    import type {FunctionComponent, SVGProps} from "react";
    const content: FunctionComponent<SVGProps<SVGSVGElement>>;
    export default content;
}

declare module '*.scss?inline';