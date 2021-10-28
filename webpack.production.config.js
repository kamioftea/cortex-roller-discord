const webpack = require('webpack');

const settings = require('./webpack.development.config')

settings.mode = 'production';

settings.plugins.push(
	new webpack.DefinePlugin(
		{
			'process.env.NODE_ENV': JSON.stringify('production')
		}
	)
);

settings.optimization ={
	splitChunks: {
		chunks: 'all',
	},
};

module.exports = settings;
