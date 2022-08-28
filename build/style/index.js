// @ts-check

const chalk = require('chalk');
const parse = require('./lib/parse');
const style = require('./lib/style');
const format = require('webpack-format-messages');
const oclock = require('o-clock');
const createWebpackLogger = require('webpack/lib/logging/createConsoleLogger.js');

const PLUGIN_NAME = 'StylishReporter';
const { log, ololog } = require('./logger');
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

		this.hooks = {
			log: new SyncBailHook(['origin', 'logEntry']),
			infrastructureLog: new SyncBailHook(['name', 'type', 'args']),
		};

		this.options = { ...StylishReporter.defaultOptions, ...options };
	}

	getInfrastructureLogger(name) {
		return new Logger(
			(type, args) => {
				if (this.hooks.infrastructureLog.call(name, type, args) === undefined) {
					logger(name, type, args);
				}
			},
			(childName) => exports.getInfrastructureLogger(`${name}/${childName}`)
		);
	}

	// getLogger() {
	// 	webpackLogger;
	// }

	_ensureState() {
		if (!this.states[this.options.name]) {
			this.states[this.options.name] = {
				...DEFAULT_STATE,
				color: this.options.color,
				name: this.options.name,
			};
		}
	}
	/**
	 * @type WebpackPluginFunction
	 * @param {Compiler} compiler
	 * @memberof StylishReporter
	 */
	apply(compiler) {
		const pluginName = StylishReporter.name;

		// webpack module instance can be accessed from the compiler object,
		// this ensures that correct version of the module is used
		// (do not require/import the webpack or any symbols from it directly).
		const { webpack } = compiler;

		// Compilation object gives us reference to some useful constants.
		const { Compilation } = webpack;

		const { rendered, state, options } = this;

		function render(stats) {
			state.active += 1;
			state.instances += 1;
			const opts = {
				// all: undefined,
				context: process.cwd(),
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
				errorDetails: 'auto',
				errors: true,
				errorStack: true,
				excludeAssets: ['**/*.map'],
				excludeModules: [/mini-css/],
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
			if (state.hashes.includes(json.hash)) {
				return;
			}

			state.active -= 1;
			state.hashes.push(json.hash);
			state.time += json.time;

			// errors and warnings go first, to make sure the counts are correct for modules
			const problems = style.problems(parse.problems(messages, json, state));
			const files = style.files(parse.files(json, compiler.watchMode), compiler.options);
			const hidden = style.hidden(parse.hidden(json));
			const hash = style.hash(json, files, hidden);

			const { version } = json;
			const out = [];

			if (!rendered.header) {
				rendered.header = true;
				if (options.title !== '') {
					out.push(chalk.cyan(`\n${options.title}\n`));
				}
			}

			out.push(hash);
			out.push(problems);

			// note: when --watch the active count will drop below zero.
			if (state.active <= 0) {
				const footer = style.footer(parse.footer(state));
				if (footer.length) {
					rendered.footer = true;
					out.push(footer);
				}

				// reset the totals
				state.totals = { errors: 0, time: 0, warnings: 0 };
			} else {
				rendered.footer = false;
			}
			ololog.newline();
			log(out.join('\n'));
			log(`Finished build at ${oclock()}`);
			ololog.newline();

			if (rendered.footer) {
				ololog.newline();
			}
		}

		state.active += 1;
		state.instances += 1;

		compiler.options.stats = 'none';

		if (compiler.hooks) {
			// compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			// 	// you can also access Logger from compilation

			// 	logger(pluginName, '', 'log from compilation');
			// });
			compiler.hooks.done.tap(PLUGIN_NAME, render);
		} else {
			compiler.plugin('done', render);
		}
	}
}

module.exports = StylishReporter;
