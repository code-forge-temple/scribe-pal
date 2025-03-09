/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import baseConfig from "./base.webpack.config.mjs";

export default (env) => {
    const browser = env.browser || "chrome";
    const updatedBaseConfig = baseConfig(
        browser,
        browser === "chrome" ? "manifest.json" : "firefox.manifest.json"
    );

    if (browser !== "chrome") {
        updatedBaseConfig.entry.contentReceiver =
      "./src/tab/privilegedAPIs/contentReceiver.ts";
    }

    return updatedBaseConfig;
};
