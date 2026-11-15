/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {Suggestion} from './components/ChatInputSuggestions';


// Those starting with the typed word first, then, from two letters after the `/` or `@` on
// (one would match nearly everything), those containing them.
export const matchingSuggestions = (options: Suggestion[], typed: string): Suggestion[] => {
    const query = typed.toLowerCase();
    const starting = options.filter((option) => option.value.toLowerCase().startsWith(query));
    const containing = query.length > 2
        ? options.filter((option) => !starting.includes(option) && option.value.toLowerCase().includes(query.slice(1)))
        : [];

    return [...starting, ...containing];
};
