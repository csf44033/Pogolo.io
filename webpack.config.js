var path = require("path");
var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var { CleanWebpackPlugin } = require("clean-webpack-plugin");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var sass = require("node-sass");

var autoprefixer = require("autoprefixer");
var postcss = require("postcss");

module.exports = {
	entry: {
		app: "./src/index.js"
		//vendor: ["pixi.js", "lodash"]
	},
	output: {
		filename: "js/[name].[chunkhash:8].js",
		path: path.resolve(__dirname, "client")
	},
	plugins: [
		new CopyWebpackPlugin([
			{
				from: "src",
				ignore: ["*.js", "templates/*"],
				transform: (content, path) => {
					if (path.match(/\.png|\.jpg|\.gif/g)) return content;
					if (path.match(/\.s[ca]ss$/g)) {
						return Buffer.from(
							postcss([autoprefixer]).process(
								sass
									.renderSync({
										data: content.toString()
									})
									.css.toString()
							).css
						);
					}

					return Buffer.from(content);
				},
				transformPath: path => {
					if (path.match(/\.s[ca]ss$/g)) {
						return path.replace(/\.s[ca]ss$/g, ".css");
					}

					return path;
				}
			}
		]),
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: "!!handlebars-loader!src/templates/index.hbs",
			minify: {
				collapseWhitespace: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true
			}
		})
	],
	module: {
		rules: []
	}
};
