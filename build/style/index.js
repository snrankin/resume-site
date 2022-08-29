// @ts-check

const chalk = require('chalk');
const parse = require('./lib/parse');
const style = require('./lib/style');
const format = require('webpack-format-messages');
const oclock = require('o-clock');
const createWebpackLogger = require('webpack/lib/logging/createConsoleLogger.js');

const PLUGIN_NAME = 'StylishReporter';
const { log, ololog, formatLogTitle } = require('./logger');
const SyncBailHook = require('tapable/lib/SyncBailHook');
const createConsoleLogger = require('webpack/lib/logging/createConsoleLogger');
const { Logger, LogType } = require('webpack/lib/logging/Logger.js');
const memoize = require('webpack/lib/util/memoize');
const getValidate = memoize(() => require('schema-utils').validate);
/** @typedef {import("webpack/lib/logging/Logger").Logger} WebpackLogger */
/** @typedef {import("webpack/lib/logging/Logger").LogTypeEnum} LogTypeEnum */
/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack").Compilation} Compilation */

process.on('uncaughtException', (e) => {
	log(e, { type: 'error' });
	process.exit(1);
});
process.on('unhandledRejection', (e) => {
	log(e, { type: 'error' });
	process.exit(1);
});

const DEFAULT_STATE = {
	start: null,
	progress: -1,
	done: false,
	message: '',
	details: [],
	request: null,
	hasErrors: false,
};

function formattedArgs(...args) {
	let formatted = {
		message: '',
		options: {
			title: '',
		},
	};

	if (Array.isArray(args)) {
		if (args.length == 1) {
			args = args[0];
		}
		if (args.length >= 2) {
			args.shift();
		}
		if (args.length > 1) {
			formatted.message = args[0];
			if (typeof args[1] === 'object' && !Array.isArray(args[1]) && args[1] !== null) {
				formatted.options = args[1];
			}
		} else {
			formatted.message = args[0];
		}
	}
	return formatted;
}
/**
 *
 *
 * @param {string} [name='']
 * @param {string} [type='']
 * @param {*} [args=[]]
 * @returns {*}
 */
function logger(name = '', type = '', args = []) {
	/** @type {createConsoleLogger.LoggerOptions} */

	if (Array.isArray(args)) {
		args = [name, ...args];
	} else {
		return [];
	}

	const opts = {
		level: type,
		debug: type === 'debug',
		console: {
			error: (...args) => {
				let formatted = formattedArgs(args);
				formatted.options.level = 'error';
				log(...formatted);
			},

			warn: (...args) => {
				let formatted = formattedArgs(args);
				formatted.options.level = 'warn';
				log(...formatted);
			},

			info: (...args) => {
				let formatted = formattedArgs(args);
				formatted.options.level = 'info';
				log(...Object.values(formatted));
			},

			log: (...args) => {
				let formatted = formattedArgs(args);
				formatted.options.locate = false;
				log(...formatted);
			},

			status: (...args) => {
				let formatted = formattedArgs(args);
				formatted.options.locate = false;
				log(formatted.message, formatted.options);
			},

			debug: (...args) => {
				let formatted = formattedArgs(args);
				formatted.options.level = 'debug';
				formatted.options.unlimited = true;
				log(...formatted);
			},

			assert: (assertion, ...args) => {
				if (!assertion) {
					let formatted = formattedArgs(args);
					formatted.options.level = 'error';
					log(...formatted);
				}
			},

			trace: () => {
				let trace = trace();

				let formatted = formattedArgs(['Trace', trace]);
				formatted.options.level = 'debug';
				formatted.options.unlimited = true;
				log(...formatted);
			},
		},
	};

	let currentDefaultLogger = createConsoleLogger(opts);

	return currentDefaultLogger(name, type, args);
}
/**
 *
 * @type WebpackPluginInstance
 * @class StylishReporter
 */
class StylishReporter {
	static defaultOptions = {
		title: '',
	};
	constructor(options = {}) {
		this.state = {
			active: 0,
			hashes: [],
			instances: 0,
			totals: {
				errors: 0,
				time: 0,
				warnings: 0,
			},
			time: 0,
		};
		this.rendered = {
			footer: false,
			header: false,
		};

		this.compiler = {};

		this.options = { ...StylishReporter.defaultOptions, ...options };
	}

	render(stats) {
		this.state.active += 1;
		this.state.instances += 1;
		const opts = {
			// all: undefined,
			context: this.compiler.context,
			assets: true,
			assetsSort: 'name',
			assetsSpace: 10000,
			builtAt: true,
			cachedAssets: false,
			cachedModules: false,
			children: false,
			// chunkGroupAuxiliary: false,
			// chunkGroupChildren: false,
			// chunkGroups: false,
			// chunkModules: false,
			// chunkOrigins: false,
			// chunks: false,
			nestedModules: true,
			colors: true,
			entrypoints: true,
			env: true,
			errorDetails: true,
			errors: true,
			errorStack: true,
			excludeAssets: ['**/*.map'],
			excludeModules: [
				(moduleSource) => {
					let test = moduleSource.includes('.webpack');

					return test;
				},
			],
			// groupModulesByPath: true,
			// groupAssetsByChunk: false,
			// groupAssetsByPath: false,
			// groupAssetsByExtension: false,
			// groupAssetsByEmitStatus: true,
			hash: true,
			ids: true,
			logging: 'log',
			// moduleAssets: false,
			// modules: false,
			moduleTrace: true,
			providedExports: true,
			// outputPath: true,
			// publicPath: false,
			usedExports: true,
			reasons: false,
			// relatedAssets: false,
			// runtimeModules: false,
			source: true,
			// timings: false,
			// version: false,
			warnings: true,
		};
		const messages = format(stats);
		const json = stats.toJson(opts, true);

		// for --watch more than anything, don't print duplicate output for a hash
		// if we've already seen that hash. compensates for a bug in webpack.
		if (this.state.hashes.includes(json.hash)) {
			return;
		}

		this.state.active -= 1;
		this.state.hashes.push(json.hash);
		this.state.time += json.time;

		// errors and warnings go first, to make sure the counts are correct for modules
		const problems = style.problems(parse.problems(stats, this.state));
		const files = style.files(parse.files(json, this.compiler.watchMode), this.compiler.options);
		const hidden = style.hidden(parse.hidden(json));
		const hash = style.hash(json, files, hidden);

		const { version } = json;
		const out = [];

		if (!this.rendered.header) {
			this.rendered.header = true;
			if (this.options.title !== '') {
				out.push(chalk.cyan(`\n${this.options.title}\n`));
			}
		}

		out.push(hash);
		out.push(problems);

		// note: when --watch the active count will drop below zero.
		if (this.state.active <= 0) {
			const footer = style.footer(parse.footer(this.state));
			if (footer.length) {
				this.rendered.footer = true;
				out.push(footer);
			}

			// reset the totals
			this.state.totals = { errors: 0, time: 0, warnings: 0 };
		} else {
			this.rendered.footer = false;
		}
		ololog.newline();
		log(out.join('\n'));
		// log(`Finished build at ${oclock()}`);
		// ololog.newline();

		if (this.rendered.footer && this.compiler.options.watch === true) {
			ololog.newline();
		}
	}

	/**
	 * @type WebpackPluginFunction
	 * @param {Compiler} compiler
	 * @memberof StylishReporter
	 */
	apply(compiler) {
		const pluginName = StylishReporter.name;

		this.compiler = compiler;

		// webpack module instance can be accessed from the compiler object,
		// this ensures that correct version of the module is used
		// (do not require/import the webpack or any symbols from it directly).
		const { webpack } = compiler;

		// Compilation object gives us reference to some useful constants.
		const { Compilation } = webpack;

		const plugin = this;

		function render(stats) {
			const opts = {
				// all: undefined,
				context: compiler.context,
				assets: true,
				assetsSort: 'name',
				assetsSpace: 10000,
				builtAt: true,
				cachedAssets: false,
				cachedModules: false,
				children: false,
				// chunkGroupAuxiliary: false,
				// chunkGroupChildren: false,
				// chunkGroups: false,
				// chunkModules: false,
				// chunkOrigins: false,
				// chunks: false,
				nestedModules: true,
				colors: true,
				entrypoints: true,
				env: true,
				errorDetails: true,
				errors: true,
				errorStack: true,
				excludeAssets: ['**/*.map'],
				excludeModules: [
					(moduleSource) => {
						let test = moduleSource.includes('.webpack');

						return test;
					},
				],
				// groupModulesByPath: true,
				// groupAssetsByChunk: false,
				// groupAssetsByPath: false,
				// groupAssetsByExtension: false,
				// groupAssetsByEmitStatus: true,
				hash: true,
				ids: true,
				logging: 'log',
				// moduleAssets: false,
				// modules: false,
				moduleTrace: true,
				providedExports: true,
				// outputPath: true,
				// publicPath: false,
				usedExports: true,
				reasons: false,
				// relatedAssets: false,
				// runtimeModules: false,
				source: true,
				// timings: false,
				// version: false,
				warnings: true,
			};
			const messages = format(stats);
			const json = stats.toJson(opts, true);

			// for --watch more than anything, don't print duplicate output for a hash
			// if we've already seen that hash. compensates for a bug in webpack.
			if (plugin.state.hashes.includes(json.hash)) {
				return;
			}

			plugin.state.active -= 1;
			plugin.state.hashes.push(json.hash);
			plugin.state.time += json.time;

			// errors and warnings go first, to make sure the counts are correct for modules
			const problems = style.problems(parse.problems(stats, plugin.state));
			const files = style.files(parse.files(json, compiler.watchMode), compiler.options);
			const hidden = style.hidden(parse.hidden(json));
			const hash = style.hash(json, files, hidden);

			const { version } = json;
			const out = [];

			let logTitle = '';

			if (!plugin.rendered.header) {
				plugin.rendered.header = true;
				if (plugin.options.title !== '') {
					let when = new Date().toLocaleString();
					logTitle = `${chalk.dim(when)}\t${chalk.cyanBright.bold(plugin.options.title)}`;
				}
			}

			out.push(hash);
			out.push(problems);

			// note: when --watch the active count will drop below zero.
			if (plugin.state.active <= 0) {
				const footer = style.footer(parse.footer(plugin.state));
				if (footer.length) {
					plugin.rendered.footer = true;
					out.push(footer);
				}

				// reset the totals
				plugin.state.totals = { errors: 0, time: 0, warnings: 0 };
			} else {
				plugin.rendered.footer = false;
			}
			console.log('');
			console.log('');
			console.log(formatLogTitle('', logTitle, out, true));
			// log(out.join('\n'), { title: logTitle, separator: true });
			console.log('');

			if (plugin.rendered.footer) {
				console.log('');
			}
		}

		this.state.active += 1;
		this.state.instances += 1;

		compiler.options.stats = 'none';

		if (compiler.hooks) {
			// compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			// 	// you can also access Logger from compilation

			// 	logger(pluginName, '', 'log from compilation');
			// });
			compiler.hooks.done.tap(pluginName, render);
		} else {
			compiler.plugin('done', render);
		}
	}
}

module.exports = StylishReporter;
