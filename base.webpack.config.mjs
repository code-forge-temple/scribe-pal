/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";
import fs from "fs/promises";

function convertToTitleCase (str) {
    return str
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
}

function convertToDotNotation (str) {
    return str.toLowerCase().trim().split(/\s+/).join(".");
}

const BUILD_FOLDER = "./dist";

const baseConfig = (browser, manifestFile) => ({
    mode: "development",
    devtool: "source-map",
    entry: {
        popup: "./src/popup/popup.ts",
        serviceWorker: "./src/tab/serviceWorker.ts",
        injectedScript: "./src/tab/injectedScript.ts",
    },
    output: {
        path: path.resolve(process.cwd(), `${BUILD_FOLDER}/${browser}`),
        filename: "[name].js",
        clean: true,
    },
    optimization: {
        runtimeChunk: false,
    },
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx|js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            "@babel/preset-react",
                            "@babel/preset-typescript",
                        ],
                    },
                },
            },
            {
                test: /\.scss$/,
                oneOf: [
                    {
                        resourceQuery: /inline/,
                        use: ["raw-loader", "sass-loader"],
                    },
                    {
                        use: ["style-loader", "css-loader", "sass-loader"],
                    },
                ],
            },
            {
                test: /\.svg$/i,
                use: ["@svgr/webpack"],
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {from: path.resolve("src/popup/popup.html"), to: "."},
                {from: path.resolve("src/popup/assets"), to: "assets"},
                {
                    from: path.resolve(manifestFile),
                    to: "./manifest.json",
                    transform: async (content) => {
                        try {
                            const pkgPath = path.resolve("package.json");
                            const pkgData = await fs.readFile(pkgPath, "utf8");
                            const pkg = JSON.parse(pkgData);
                            const manifest = JSON.parse(content.toString());

                            manifest.name = convertToTitleCase(pkg.name);
                            manifest.version = pkg.version;
                            manifest.description = pkg.description;

                            if(manifest.browser_specific_settings) {
                                manifest.browser_specific_settings.gecko.id = `${pkg.name}@${convertToDotNotation(pkg.author)}`;
                            }

                            return JSON.stringify(manifest, null, 4);
                        } catch (error) {
                            console.error("Error updating manifest.json:", error);

                            return content;
                        }
                    },
                },
            ],
        }),
    ],
});

export default baseConfig;
