const path = require('path');
const webpack = require('webpack');

module.exports = {
	mode:      'development',
	entry:     './assets/index.jsx',
	module:    {
		rules: [
			{
				test:    /\.jsx?$/,
				loader:  'babel-loader',
				options: {
					presets: ['@babel/preset-env', '@babel/preset-react'],
				}
			},
		]
	},
	output:    {
		path:     path.resolve(__dirname, 'public', 'javascripts'),
		filename: 'webpack-[name].js'
	},
	resolve:   {
		extensions: ['.js', '.jsx', '.json'],
	},
	externals: {
		jquery: 'jQuery'
	},
	plugins:   [
		new webpack.ProvidePlugin({$: "jquery", jQuery: "jquery"}),
	]
};
