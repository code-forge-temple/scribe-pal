/************************************************************************
 *    Copyright (C) 2026 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

// Serialises read-modify-write cycles that share a storage key: two writers that both read
// before either writes each write back a snapshot missing the other's change.
//
// The read must happen INSIDE the task - serialising only the writes leaves the stale read.
// This is a queue, not a lock, and covers only this JS context.

const queues = new Map<string, Promise<unknown>>();

export function withKeyedLock<T> (key: string, task: () => Promise<T>): Promise<T> {
    const previous = queues.get(key) ?? Promise.resolve();
    const result = previous.then(task);
    // The next waiter chains off a swallowed copy, so one failure doesn't reject the queue.
    const tail = result.then(() => undefined, () => undefined);

    queues.set(key, tail);

    tail.then(() => {
        if (queues.get(key) === tail) {
            queues.delete(key);
        }
    });

    return result;
}
