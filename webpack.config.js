const webpack = require('webpack');
const _ = require('lodash');
const path = require('path');
const { argv } = require('yargs');
const { merge, mergeWithCustomize, customizeArray } = require('webpack-merge');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanupMiniCssExtractPlugin = require('cleanup-mini-css-extract-plugin');
const magicImporter = require('node-sass-magic-importer');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const FriendlyErrorsPlugin = require('@soda/friendly-errors-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { log, ololog } = require('./build/logger');
const StylishReporter = require('./build/style/index');
const WebpackBar = require('webpackbar');

/**
 * Get the current enviornment
 *
 * @return {*}
 */
const env = () => {
	if (_.has(argv, 'mode')) {
		return argv.mode;
	} else if (_.has(argv, 'env')) {
		return argv.env;
	} else if (_.has(argv, 'node-env')) {
		return argv.env;
	} else if (_.has(argv, 'p')) {
		return 'production';
	}
	return 'development';
};

exports.env = env;

/**
 * Is the mode set to production
 *
 * @type {Boolean}
 */
const isProduction = env() === 'production';

exports.isProduction = isProduction;

/**
 * Is the mode set to development
 *
 * @type {Boolean}
 */
const isDevelopment = env() === 'development';

exports.isDevelopment = isDevelopment;

const postcssConfig = {
	parser: 'postcss-scss',
	plugins: [
		// 'postcss-fixes',
		'postcss-viewport-height-correction',
		'postcss-100vh-fix',
		'postcss-momentum-scrolling',
		'postcss-easings',
		'postcss-easing-gradients',
		'postcss-letter-tracking',
		[
			'postcss-inline-svg',
			{
				paths: [path.join(process.cwd(), 'src', 'img')],
			},
		],
		[
			'postcss-sort-media-queries',
			{
				configuration: {
					unitlessMqAlwaysFirst: true,
				},
			},
		],
		'autoprefixer',
		'postcss-merge-rules',
		[
			'postcss-reporter',
			{
				clearReportedMessages: false,
				filter: (message) => {
					return true;
				},
			},
		],
	],
};

const config = {
	entry: ['./src/js/index.js', './src/css/index.scss'],
	output: {
		path: path.join(process.cwd(), 'dist'),
		filename: 'js/[name].js',
	},
	cache: {
		type: 'filesystem',
	},
	devtool: false,
	infrastructureLogging: {
		colors: true,
	},
	optimization: {
		mangleExports: false,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				test: /\.js(\?.*)?$/i,
				terserOptions: {
					format: {
						comments: false,
						beautify: isDevelopment,
					},
					ecma: 2022,
					safari10: true,
					mangle: isProduction,
					compress: isProduction,
					sourceMap: isDevelopment,
				},
				parallel: true,
				extractComments: false,
			}),
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: isProduction
						? [
								'default',
								{
									discardComments: {
										removeAll: true,
									},
								},
						  ]
						: [
								'lite',
								{
									normalizeWhitespace: false,
									mergeRules: true,
									discardDuplicates: true,
									safe: true,
									calc: false,
									normalizeCharset: true,
									discardComments: { removeAll: true },
								},
						  ],
				},
			}),
		],
	},
	module: {
		rules: [
			{
				enforce: 'pre',
				test: /\.(j|t)sx?$/,
				loader: 'import-glob-loader',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							cacheCompression: false,
							cacheDirectory: true,
							sourceMaps: false,
							comments: false,
							presets: [
								[
									'@babel/preset-env',
									{
										modules: false,
										useBuiltIns: 'entry',
										corejs: { version: 3, proposals: true },
									},
								],
							],
						},
					},
				],
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: postcssConfig,
						},
					},
				],
			},
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							importLoaders: 2,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: postcssConfig,
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								includePaths: [
									path.join(process.cwd(), 'src', 'scss'),
									path.join(process.cwd(), 'node_modules'),
								],
								outputStyle: 'expanded',
								indentWidth: 4,
								fiber: false,
								importer: magicImporter(),
							},
						},
					},
				],
			},
		],
	},
	plugins: [
		new WebpackBar({
			name: 'Resume',
			reporters: ['fancy'],
		}),

		new ESLintPlugin({
			failOnWarning: false,
			failOnError: false,
			emitError: true,
			emitWarning: true,
			lintDirtyModulesOnly: true,
			formatter: require('eslint-formatter-pretty'),
		}),
		new StyleLintPlugin({
			failOnWarning: false,
			failOnError: false,
			emitError: true,
			emitWarning: true,
			formatter: require('stylelint-formatter-pretty'),
			lintDirtyModulesOnly: true,
		}),
		new RemoveEmptyScriptsPlugin({ verbose: false }),
		new MiniCssExtractPlugin({
			filename: 'css/[name].css',
		}),
		new CleanupMiniCssExtractPlugin({ warnings: true }),
		new StylishReporter({
			title: 'Resume',
		}),
		new WebpackBuildNotifierPlugin({
			appName: 'Resume',
			buildSuccessful: true,
			suppressSuccess: false,
			showDuration: true,
			suppressCompileStart: false,
		}),
	],
};

module.exports = config;
