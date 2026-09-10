/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

// Kept out of llmSettings.ts deliberately: that holds preferences that follow a model around
// and get deleted with it, this caches facts about the model itself.

export const MODEL_CONTEXT_STORAGE_KEY = "modelContextLengths";

// null = asked, no answer; missing key = never asked. Collapsing the two would refetch a
// model with no reported context length forever.
export type ModelContextMap = Record<string, number | null>;
