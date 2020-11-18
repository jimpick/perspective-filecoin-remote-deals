/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    mode: process.env.NODE_ENV || "development",
    entry: "./src/index.js",
    output: {
        filename: "index.js"
    },
    plugins: [
        new HtmlWebPackPlugin({
            title: "Slingshot Deal History"
        }),
        new PerspectivePlugin()
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [{loader: "style-loader"}, {loader: "css-loader"}]
            }
        ]
    },
    devServer: {
        contentBase: [path.join(__dirname, "dist"), path.join(__dirname, "./data")]
    },
    devtool: "source-map"
};
