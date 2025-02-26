/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

export const browser = (globalThis as any).browser || (globalThis as any).chrome || {};

export const getManifestVersion = () => {
    return Number(browser.runtime.getManifest().manifest_version);
}