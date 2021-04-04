const webpack = require('webpack');
const MinifyPlugin = require("babel-minify-webpack-plugin");

const settings = require('./webpack.development.config')

settings.mode = 'production';

settings.plugins.push(
	new webpack.DefinePlugin(
		{
			'process.env.NODE_ENV': JSON.stringify('production')
		}
	)
);

settings.plugins.push(new MinifyPlugin());

module.exports = settings;
