/** ============================================================================
 *
 * index
 * @author    Sam Rankin <srankin@riester.com>
 * @copyright 2022 RIESTER
 * @version   1.0.0
 * ========================================================================== */
const figures = require('figures');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const { argv } = require('yargs');
const exceptionFormatter = require('exception-formatter');
const { Entry, Configuration } = require('webpack');
const chalk = require('chalk');
const StackTracey = require('stacktracey');
const logSymbols = import('log-symbols');
const bullet = require('string.bullet'); // NB: these packages are part of Ololog, no need to install them separately
const { stringWidth } = import('string-width');
const { stringify } = require('q-i');
const { formatMessage } = require('webpack-format-messages');
const { strlen } = require('printable-characters');
const createConsoleLogger = require('webpack/lib/logging/createConsoleLogger');
const ololog = require('ololog');
const { Logger, LogType } = require('webpack/lib/logging/Logger.js');
const { isEmpty, deepFreeze } = require('./utils');

const ConsoleType = Object.freeze({
	error: /** @type {"error"} */ ('error'),
	warn: /** @type {"warn"} */ ('warn'),
	info: /** @type {"info"} */ ('info'),
	none: /** @type {""} */ (''),
	debug: /** @type {"debug"} */ ('debug'),
});

exports.ConsoleType = ConsoleType;

/** @typedef {typeof ConsoleType[keyof typeof ConsoleType]} ConsoleTypeEnum */

const nbsp = ' ';

/** @typedef {import("chalk").ChalkFunction} ChalkFunction */
/** @typedef {import("figures")} figures  */

const DecoratorType = Object.freeze({
	error: /** @type {"error"} */ ('error'),
	warn: /** @type {"warn"} */ ('warn'),
	info: /** @type {"info"} */ ('info'),
	none: /** @type {""} */ (''),
	debug: /** @type {"debug"} */ ('debug'),
	success: /** @type {"success"} */ ('success'),
	dim: /** @type {"dim"} */ ('dim'),
});

exports.DecoratorType = DecoratorType;

/** @typedef {typeof DecoratorType[keyof typeof DecoratorType]} DecoratorTypeEnum */

/** @typedef {""} noSymbol */
/** @typedef {"ℹ"} infoSymbol */
/** @typedef {"⚠"} warnSymbol */
/** @typedef {"✖"} errorSymbol */
/** @typedef {"⬢"} debugSymbol */
/** @typedef {"✔"} successSymbol */

/**
 * @typedef  {Object}         LogLevel
 * @property {Object}         symbol         - The symbol based on the console type
 * @property {noSymbol}       symbol.none    - The symbol for the default console type
 * @property {infoSymbol}     symbol.info    - The symbol for the info console type
 * @property {warnSymbol}     symbol.warn    - The symbol for the warn console type
 * @property {errorSymbol}    symbol.error   - The symbol for the error console type
 * @property {debugSymbol}    symbol.debug   - The symbol for the debug console type
 * @property {successSymbol}  symbol.success - The symbol for the success console type
 * @property {Object}         bg             - The background color function based on the console type
 * @property {ChalkFunction}  bg.none        - The background color function for the default console type
 * @property {ChalkFunction}  bg.info        - The background color function for the info console type
 * @property {ChalkFunction}  bg.warn        - The background color function for the warn console type
 * @property {ChalkFunction}  bg.error       - The background color function for the error console type
 * @property {ChalkFunction}  bg.debug       - The background color function for the debug console type
 * @property {ChalkFunction}  bg.success     - The background color function for the success console type
 * @property {Object}         text           - The The text color function based on the console type
 * @property {ChalkFunction}  text.none      - The text color function for the default console type
 * @property {ChalkFunction}  text.info      - The text color function for the info console type
 * @property {ChalkFunction}  text.warn      - The text color function for the warn console type
 * @property {ChalkFunction}  text.error     - The text color function for the error console type
 * @property {ChalkFunction}  text.debug     - The text color function for the debug console type
 * @property {ChalkFunction}  text.success   - The text color function for the success console type
 */

/** @type {LogLevel} */
const tagLevelDecorators = {
	symbol: {
		none: '',
		info: figures.info,
		warn: figures.warning,
		error: figures.cross,
		debug: figures.info,
		success: figures.tick,
		dim: '',
	},
	bg: {
		none: chalk.reset,
		info: chalk.bgBlackBright.inverse,
		warn: chalk.bgYellow.inverse,
		error: chalk.bgRedBright.inverse,
		debug: chalk.bgBlue.inverse,
		success: chalk.bgGreen.inverse,
		dim: chalk.dim,
	},
	text: {
		none: chalk.reset,
		info: chalk.dim,
		warn: chalk.yellow,
		error: chalk.redBright,
		debug: chalk.blue,
		success: chalk.green,
		dim: chalk.dim,
	},
};
exports.tagLevelDecorators = tagLevelDecorators;

/**
 *
 * @param {DecoratorType} lvl
 * @param {"text"|"bg"|"symbol"} type
 * @returns {ChalkFunction|String} Return a tag symbol, a Chalk color function or a Chalk background function
 */
const decoratorLevel = (lvl = '', type = 'text') => {
	if (isEmpty(lvl)) {
		lvl = 'none';
	}

	return tagLevelDecorators[type][lvl];
};

exports.decoratorLevel = decoratorLevel;

const trace = (startingPoint = 0) => {
	return new StackTracey()
		.withSources()
		.slice(startingPoint)
		.filter((x) => {
			return !x.thirdParty && !x.file.includes('node:');
		})
		.clean();
};

/**
 *
 *
 * @param {DecoratorType} level
 * @param {string} [title='']
 * @param {boolean} [bg=false]
 * @param {boolean} [addSymbol = true]
 * @returns {string} A formatted console tag
 */
function consoleTag(level, title = '', bg = false, addSymbol = true) {
	let tag = title;
	if (level === '' || level === 'log' || level === 'default') {
		level = 'none';
	}
	let symbol = decoratorLevel(level, 'symbol');
	let bgColor = decoratorLevel(level, 'bg');
	let color = decoratorLevel(level, 'text');

	if (addSymbol && !isEmpty(symbol)) {
		symbol += nbsp;
	}

	if (!isEmpty(tag)) {
		tag = `${nbsp}${symbol}${tag}${nbsp}`;
		tag = bgColor(tag);
	}

	return tag;
}

/**
 *
 *
 * @param {DecoratorType} [level='']
 * @param {string} [title='']
 * @param {Array} [lines=[]]
 * @param {boolean} [addDivider=true]
 * @returns {Array} - The lines with the tag preprended to it
 */
function formatLogTitle(level = '', title = '', lines = [], addDivider = true) {
	let tag = level;
	if (level === '' || level === 'log' || level === 'default') {
		level = 'none';
		tag = '';
	}
	tag = consoleTag(level, tag, true);
	let color = decoratorLevel(level, 'text');

	if (!isEmpty(title)) {
		tag += `${nbsp}${color(title)}${nbsp}`;
	}

	if (addDivider) {
		tag = color(separator(tag));
	}

	lines.unshift(tag);

	return lines;
}

exports.formatLogTitle = formatLogTitle;

const separator = (str = '', char = figures.line, width = 80) => {
	let strWidth = strlen(str);
	if (strWidth > 0) {
		if (strWidth < width - 1) {
			let dividerLength = width - 1 - strWidth;
			char = char.repeat(dividerLength);
			str = `\n${str}${nbsp}${char}\n`;
		}
	} else {
		char = char.repeat(width);
		str = `\n${char}\n`;
	}

	return str;
};

/** @type {OlologConfig} */
const olologConfig = {
	stringify: {
		// print: stringify,
		indentation: '    ',
		fancy: false,
		maxDepth: 20,
	},
	tag: (lines, { level = '', title = '', separator = false }) => {
		return formatLogTitle(level, title, lines, separator);
	},
	locate: {
		shift: 1,
		where: new StackTracey()
			.withSources()
			.filter((x) => {
				return !x.thirdParty && !x.file.includes('node:');
			})
			.clean(),
		print: (args) => {
			if (_.has(args, 'items')) {
				args = args.items.pop();
			}

			let loc = `${args.calleeShort} @ ${args.fileRelative}:${args.line}`;

			return separator(loc);
		},
	},
};
const olologMethods = {
	// adds `title` helper
	title(n) {
		return this.configure({ tag: { title: n } });
	},

	get separator() {
		return this.configure({ tag: { separator: true } });
	},
	get success() {
		return this.configure({ tag: { level: 'success' }, render: { consoleMethod: '' } });
	},
};

exports.ololog = ololog.configure(olologConfig).methods(olologMethods);

/**
 * @typedef {Object}           LogOptions
 * @property {ConsoleTypeEnum} level      - The level to use for console
 * @property {String}          title      - Title to add to the log
 * @property {Boolean}         separator  - Add a separator before and after the log
 * @property {Boolean}         unlimited  - Remove limiting
 * @property {false|Object}    locate     - The locate args or false
 * @property {false|Object}    time       - The time args or false
 */

/**
 *
 *
 * @param {*} msg
 * @param {LogOptions} options
 * @returns {*}
 */
function log(msg, options) {
	const defaults = {
		level: '',
		title: '',
		separator: false,
		unlimited: false,
		locate: false,
		time: false,
	};
	options = { ...defaults, ...options };
	let { level, title, separator, unlimited, locate, time } = options;
	/** @type {ololog} */
	let logConfig = {
		locate,
		time,
		tag: {
			title,
			separator,
		},
	};

	logConfig = { ...olologConfig, ...logConfig };

	const log = ololog.configure(logConfig).methods(olologMethods);

	if (unlimited) {
		if (!isEmpty(level)) {
			log.unlimited[level](msg);
		} else {
			log.unlimited(msg);
		}
	} else {
		if (!isEmpty(level)) {
			log[level](msg);
		} else {
			log(msg);
		}
	}
}

exports.log = log;

process.on('uncaughtException', (e) => {
	log(e, { type: 'error' });
	process.exit(1);
});
process.on('unhandledRejection', (e) => {
	log(e, { type: 'error' });
	process.exit(1);
});

/**
 * @param {string} name name of the logger
 * @param {LogTypeEnum} type type of the log entry
 * @param {any[]} args arguments of the log entry
 * @returns {void}
 */
const webpackLogger = (name, type, args) => {
	const labeledArgs = () => {
		if (Array.isArray(args)) {
			if (args.length > 0 && typeof args[0] === 'string') {
				if (args.length == 1) {
					return [
						{
							title: name,
							message: args[0],
							options: args.slice(1),
						},
					];
				} else {
					return [
						{
							title: name,
							message: args,
						},
					];
				}
			} else {
				return [
					{
						title: name,
						message: args,
					},
				];
			}
		} else {
			return [];
		}
	};

	args = labeledArgs();
	/** @type {createConsoleLogger.LoggerOptions} */
	const opts = {
		level: type,
		debug: false,
		console: {
			error: (...args) => {
				ololog.unlimited.error.noLocate(args);
			},

			warn: (...args) => {
				ololog.unlimited.warn.noLocate(args);
			},

			info: (...args) => {
				if (args.length >= 2) {
					args.shift();
				}
				if (typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
					let msg = args[0].message;
					let title = args[0].title;

					ololog.title(title).unlimited.info.noLocate(msg);
				}
			},

			log: (...args) => {
				ololog.unlimited.noLocate(args);
			},

			debug: (...args) => {
				ololog.unlimited.debug.noLocate(args);
			},

			assert: (assertion, ...args) => {
				if (!assertion) {
					ololog.unlimited.debug.noLocate(args);
				}
			},

			trace: () => {
				let trace = trace();

				ololog.unlimited.debug.noLocate(args);
			},
		},
	};

	let currentDefaultLogger = createConsoleLogger(opts);

	return currentDefaultLogger(name, type, args);
};

exports.webpackLogger = webpackLogger;
