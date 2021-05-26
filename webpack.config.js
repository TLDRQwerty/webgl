const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, options) => {
	return {
		entry: "./src/index.ts",
		mode: process.env.NODE_ENV,
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.(frag|vert|glsl)$/,
					use: "glsl-shader-loader",
				}
			],
		},
		resolve: {
			extensions: [".tsx", ".ts", ".js"],
		},
		output: {
			filename: "bundle.js",
			path: path.resolve(__dirname, "dist"),
		},
		plugins: [new HTMLWebpackPlugin({ template: "./src/index.html" })]
	}
}
