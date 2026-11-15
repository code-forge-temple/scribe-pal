/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {ErrorResponse} from "../../utils/types";

export type AgenticSignalCommand = {
    command: string;
    description: string;
}

export type CommandErrorResponse = ErrorResponse & {
    code: string;
    node?: string;
    status?: number;
}

export type FetchCommandsResponse = {
    success: true;
    commands: AgenticSignalCommand[];
} | CommandErrorResponse;

export type CommandJobResponse = {
    success: true;
    status: "running";
    job: string;
    retryAfter: number;
} | {
    success: true;
    status: "done";
    result: unknown;
} | CommandErrorResponse;

export type CancelCommandResponse = {
    success: true;
} | CommandErrorResponse;
