/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {ErrorResponse} from "../../utils/types";

// Types only — no runtime values. The page and popup bundles import from here, and a
// value export would pull the Ollama SDK into them.

export type LlmModel = {
    name: string;
}

export type FetchModelsResponse = {
    success: true;
    models: LlmModel[];
} | ErrorResponse;

export type DeleteModelResponse = {
    success: true;
    reply: string;
} | ErrorResponse;
