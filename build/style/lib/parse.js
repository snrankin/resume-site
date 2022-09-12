'use strict';

const { isEmpty, removeLoaders } = require('../utils');
const _ = require('lodash');
const path = require('path');
const plur = require('plur');
const formatMessages = require('webpack-format-messages');
const errorLabel = 'Syntax error:';
const isLikelyASyntaxError = (str) => str.includes(errorLabel);
const StackTracey = require('stacktracey');
const StackUtils = require('stack-utils');
const exportRegex = /\s*(.+?)\s*(")?export '(.+?)' was not found in '(.+?)'/;
const stackRegex = /^\s*at\s((?!webpack:).)*:\d+:\d+[\s)]*(\n|$)/gm;
const sassRegex = /^SassError/gm;
const strip = require('strip-ansi');
const ansiRegex = require('ansi-regex');
const { partition } = require('printable-characters');
const { formatMessage } = require('webpack-format-messages');
const { log, ololog, trace } = require('../logger');
const { isString } = require('lodash');
const { container } = require('webpack');
const formattedStack = new StackUtils({ cwd: process.cwd(), internals: StackUtils.nodeInternals() });

const reFileList = /((assets|entrypoints):[\s\S]+)$/i;
const srcFile = /^\.\//i;
const rePerformance = /^([\w ]+ limit|[\w ]+ recommendations): /i;
const rePosition = /\s?\(?((\d+):(\d+))(-\d+)?\)?/;
const pathRegEx = new RegExp(`${process.cwd()}[^:]+:`); //eslint-disable-line
const relPathRegEx = new RegExp(`${process.cwd()}/`);
module.exports = {
	assets(stats, isWatch) {
		const result = [];

		//   ['49.1 kB', 'main', './output.js', 'emitted'],

		let assets = stats.assets;

		assets = assets.filter(function (item) {
			return item.type === 'asset';
		});

		for (const asset of assets) {
			const chunk = (asset.chunk || asset.chunkNames || '').toString();
			const assetFile = (asset.name || '').toString();

			// let name = asset.chunkNames.join(', ');

			// // some loaders populate chunkNames
			// if (!name) {
			// 	const matches = assetFile.match(/\.[\w]+$/);
			// 	name = matches && matches.length > 0 ? matches[0].substring(1) : '<unknown>';
			// }

			let status = this.assetStatus(asset);

			result.push([asset.size, chunk, assetFile, status]);

			if (asset.related.length > 0) {
				asset.related.forEach((related) => {
					let status = this.assetStatus(related);
					result.push([related.size, chunk, related.name, status]);
				});
			}
		}

		return result;
	},

	files(stats, isWatch) {
		const assets = module.exports.assets(stats, isWatch);
		const modules = module.exports.modules(stats);
		let result = [];
		// let result = [].concat(module.exports.header(), modules);
		if (assets.length) {
			result = result.concat(module.exports.header('asset'), assets);
		}

		return result;
	},

	footer(state) {
		const { totals } = state;
		if (state.instances > 1) {
			totals.time = state.time;
		}
		return totals;
	},

	header(type) {
		return [['size', 'chunk', type || 'module', 'status']];
	},

	ansiRegex({ onlyFirst = false } = {}) {
		const pattern = [
			'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
			'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
		].join('|');

		return new RegExp(pattern, onlyFirst ? undefined : 'g');
	},

	hasAnsi(string) {
		const pattern = [
			'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
			'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
		].join('|');

		const regex = new RegExp(pattern);

		return regex.test(string);
	},

	hidden(stats) {
		const result = [];
		const assets = stats.filteredAssets;
		const modules = stats.filteredModules;

		if (assets > 0) {
			result.push(`${assets} ${plur('asset', assets)}`);
		}

		if (modules > 0) {
			result.push(`${modules} ${plur('module', modules)}`);
		}

		return result.length ? `(${result.join(', ')} hidden)` : '';
	},

	modules(stats) {
		const result = [];
		const { status } = module.exports;
		const reLoader = /(.+node_modules\/)((.+-loader).+!)/i;
		const reNodeModules = /(.*)node_modules/;

		let modules = stats.modules.filter(function (item) {
			return item.type === 'module';
		});

		for (const module of modules) {
			let modulePath = module.identifier || module.name;
			let chunk = module.chunks || '';
			if (!isEmpty(chunk) && _.isArray(chunk)) {
				chunk = chunk.join(', ');
			}
			if (reLoader.test(modulePath)) {
				modulePath = modulePath.replace(reLoader, '$3!');
			} else if (reNodeModules.test(modulePath)) {
				modulePath = modulePath.replace(reNodeModules, '(node_modules)');
			}

			let id = module.id;

			if (id) {
				id = id.toString();
				const row = [module.size, chunk, id, status(module)];

				result.push(row);
			}
		}

		return result;
	},

	problems(stats, state) {
		const probs = {};

		const messages = formatMessages(stats);
		const json = stats.toJson();

		stats = stats.compilation;

		const { errors, warnings } = stats;

		const result = {
			errors,
			warnings,
		};

		for (const [level, items] of Object.entries(result)) {
			for (let [i, reported] of Object.entries(items)) {
				let reportedJson = json[level][i];
				if (reported.message.includes('mini-css')) {
					continue;
				}

				reported = { ...reported, ...reportedJson };

				// if (json[level][i].moduleTrace.length > 0) {
				// 	continue;
				// }

				// const message = messages[level][i];
				if (typeof reported !== 'undefined') {
					let isError = false;
					if (level === 'errors') {
						isError = true;
					}
					const item = this.problem(reported, isError);
					const { file, module } = item;
					const problem = probs[file] || { errors: [], warnings: [] };

					problem[level].push(item);

					for (const moduleItem of json.modules) {
						// manually update the error count. something is broken in webpack
						if (
							module === moduleItem.id ||
							module === moduleItem.name ||
							module === moduleItem.identifier
						) {
							moduleItem[level] += 1;
						}
					}

					probs[module] = problem;
					state.totals[level] += 1;
				}
			}
		}

		// for (const level of ['errors', 'warnings']) {
		// 	for (const [i, reported] of json[level].entries()) {
		// 		const message = messages[level][i];
		// 		let isError = false;
		// 		if (level === 'errors') {
		// 			isError = true;
		// 		}
		// 		const item = module.exports.problem(reported, message, isError);
		// 		if (item) {
		// 			const { file } = item;
		// 			const problem = probs[file] || { errors: [], warnings: [] };

		// 			problem[level].push(item);

		// 			for (const module of json.modules) {
		// 				// manually update the error count. something is broken in webpack
		// 				if (file === module.id || file === module.name || file === module.identifier) {
		// 					module[level] += 1;
		// 				}
		// 			}

		// 			probs[file] = problem;
		// 			state.totals[level] += 1;
		// 		}
		// 	}
		// }

		return probs;
	},

	trace(err, startingPoint = 0) {
		return new StackUtils({
			cwd: process.cwd(),
			internals: StackUtils.nodeInternals(),
			ignoredPackages: ['/mini-css/'],
		}).parseLine(err);
	},

	problem(original, isError) {
		const { removeLoaders } = this;

		// if (typeof original === 'object') {
		// 	message = err.details || err.stack || err.message;
		// }

		let error = _.get(original, 'error', {}),
			file = _.get(original, 'file', ''),
			module = _.get(original, 'moduleId', false) || _.get(original, 'moduleName', ''),
			name = _.get(original, 'name', ''),
			loc = _.get(original, 'loc', { line: 0, column: 0 }),
			message = _.get(original, 'message', ''),
			stack = _.get(original, 'stack', ''),
			fileList = [];

		if (typeof error === 'object' && !Array.isArray(error)) {
			// problem = error.message;
			message = _.get(error, 'message', message);
			file = _.get(error, 'file', file);
			loc = _.get(error, 'loc', loc);
			name = _.get(error, 'name', name);
			stack = _.get(error, 'stack', stack);
		}

		if (name === 'SassError') {
			file = message.split('\n').filter(function (line) {
				return /\son line\s/.test(line);
			});
			file = file[0];
			file = file.replace(/,.*/gm, '');
			file = file.replace(/^\s*on\s.*of\s/gm, './');
			message = message.split('\n').filter(function (line) {
				return !/\son line\s/.test(line) && line !== '';
			});
			message = message.join('\n');
			stack = '';
		}

		if (!isEmpty(stack) && name !== 'SassError') {
			stack = trace(original);
		}

		if (!isEmpty(module) && isString(module)) {
			module = removeLoaders(module);
			if (!file) {
				file = module;
			}
		}

		if (rePerformance.test(message)) {
			// the prefix of the performance errors are overly verbose for stylish
			file = 'performance';
			message = message.replace(rePerformance, '');
		}

		if (srcFile.test(original.moduleId)) {
			file = original.moduleId;
		}

		if (reFileList.test(message)) {
			const matches = message.match(reFileList);
			fileList = matches.length ? matches[0] : '<stylish-error>';
			// replace spaces with a unicode character we can replace later to
			// preserve formatting, and allow for automation. replace 3 spaces with
			// 2 to match stylish output.
			fileList = fileList.trim().replace(/ {3}/g, '  ').replace(/ /g, '░');
			message = message.replace(reFileList, '');
		}

		let lines = this.formatMessage(message, isError);

		let { line, column } = loc;

		if (!file) {
			file = lines[0];
			file = file.replace(/:.*/, '').trim();
		} else {
			lines.unshift('');
		}

		let msg = lines.join('\n');
		msg = msg || 'webpack-stylish: <please report unknown message format>';

		if (!line || !column) {
			if (rePosition.test(msg)) {
				// warnings position format (beginning of the msg)
				[, , line, column] = msg.match(rePosition) || [0, 0, 0, 0];

				if (lines.length > 3) {
					msg = lines.slice(1, lines.length);
				}
			} else {
				// errors position format (end of the msg)
				const position = lines[lines.length - 1];
				if (rePosition.test(position)) {
					[, , line, column] = position.match(rePosition) || [0, 0, 0, 0];
					msg = lines.slice(1, lines.length - 1);
				} else {
					[line, column] = [0, 0];
				}
			}
		}

		if (rePosition.test(lines[0])) {
			lines.shift();
			msg = lines.join('\n');
		}

		msg = msg.replace(pathRegEx, '').trim();

		if (file && relPathRegEx.test(file)) {
			file = file.replace(relPathRegEx, './').trim();
		}

		message = msg;

		let item = { file, message, line, column, module };

		if (fileList) {
			item.message += `\n ${fileList}`;
		}

		if (stack) {
			item.message += `\n ${stack}`;
		}

		return item;
	},

	removeLoaders(file) {
		if (!file) {
			return '';
		}
		const split = file.split('!');
		const filePath = split[split.length - 1];
		return filePath;
	},

	assetStatus(asset) {
		const result = [];

		// if (asset.cached === false) {
		// 	result.push('no-cache');
		// }

		if (asset.comparedForEmit) {
			result.push('compared');
		}

		if (asset.emitted) {
			result.push('built');
		}

		if (asset.prefetched) {
			result.push('prefetch');
		}

		if (asset.failed) {
			result.push('failed');
		}

		if (asset.warnings) {
			result.push('warning');
		}

		if (asset.errors) {
			result.push('error');
		}

		return result;
	},

	formatMessage(err, isError) {
		const errorLabel = 'Syntax error:';
		const isLikelyASyntaxError = (str) => str.includes(errorLabel);

		const exportRegex = /\s*(.+?)\s*(")?export '(.+?)' was not found in '(.+?)'/;
		const stackRegex = /^\s*at\s*.+|^\s*.+@import|^\s*.+root stylesheet/gm;
		const sassStack = /^.*(?:@import|root stylesheet)$/gm;

		let message;
		// Workaround to accommodate Webpack v5
		// It gives us an Object now, not a string...
		// Objects not identical; details > stack > message
		if (typeof err === 'object') {
			message = err.details || err.stack || err.message;
		} else {
			message = err;
		}

		let lines = message.split('\n');

		if (lines.length > 2 && lines[1] === '') {
			lines.splice(1, 1); // Remove extra newline.
		}

		// // 0 ~> filename; 1 ~> main err msg
		// if (!lines[0] || !lines[1]) {
		// 	return lines.join('\n');
		// }

		// Cleans up verbose "module not found" messages for files and packages.
		// if (lines[1].startsWith('Module not found: ')) {
		// 	lines = [
		// 		lines[0],
		// 		lines[1] // "Module not found: " is enough detail
		// 			.replace("Cannot resolve 'file' or 'directory' ", '') // eslint-disable-line
		// 			.replace('Cannot resolve module ', '')
		// 			.replace('Error: ', '')
		// 			.replace('[CaseSensitivePathsPlugin] ', ''),
		// 	];
		// }

		// // Cleans up syntax error messages.
		// if (lines[0].startsWith('ModuleBuildError: ')) {
		// 	lines.shift();
		// }
		// if (lines[0].startsWith('SassError:')) {
		// 	lines[0] = lines[0].replace('SassError:', errorLabel);
		// }
		// if (lines[0].startsWith('HookWebpackError: ')) {
		// 	lines[0] = lines[0].replace('Module build failed: SyntaxError:', errorLabel);
		// }
		// if (lines[1].startsWith('Module build failed: ')) {
		// 	lines[1] = lines[1].replace('Module build failed: SyntaxError:', errorLabel);
		// }

		// // Cleans up syntax error messages.
		// if (lines[1].startsWith('Module build failed: ')) {
		// 	lines[1] = lines[1].replace('Module build failed: SyntaxError:', errorLabel);
		// }

		// if (lines[1].match(exportRegex)) {
		// 	lines[1] = lines[1].replace(exportRegex, "$1 '$4' does not contain an export named '$3'."); //eslint-disable-line
		// }

		let sassSrcLine = lines.find((line) => line.endsWith('@import'));

		// Remove useless `entry` filename stack details
		lines = lines.filter((line) => {
			return line.indexOf(' @ ') !== 0 || line.endsWith('@import') || line.endsWith('stylesheet');
		});

		lines = lines.map(function (line) {
			line = line
				.replace("Cannot resolve 'file' or 'directory' ", '') // eslint-disable-line
				.replace('Cannot resolve module ', '')
				.replace('Error: ', '')
				.replace('Error: ', '')
				.replace('SassError: ', '')
				.replace('SyntaxError: ', '')
				.replace('[CaseSensitivePathsPlugin] ', '');

			// line = removeLoaders(line);

			if (line.match(exportRegex)) {
				line = line.replace(exportRegex, "$1 '$4' does not contain an export named '$3'."); //eslint-disable-line
			}

			if (line.indexOf('!') !== 0) {
				line = line.substr(line.lastIndexOf('!') + 1);
			}

			return line;
		});

		if (sassSrcLine) {
			sassSrcLine = sassSrcLine.replace('@import', '').trim();
			let sassFile = sassSrcLine.replace(/\d+:\d+/, '').trim();
			lines.unshift(sassFile);
			lines.push(sassSrcLine);
		}

		// lines = lines.filter((line) => {
		// 	return !sassStack.test(line);
		// });

		// lines = lines.join('\n').trim();

		// Reassemble & Strip internal tracing, except `webpack:` -- (create-react-app/pull/1050)
		return lines;
	},

	status(module) {
		const result = [];

		if (module.cacheable === false) {
			result.push('no-cache');
		}

		if (module.optional) {
			result.push('optional');
		}

		if (module.built) {
			result.push('built');
		}

		if (module.prefetched) {
			result.push('prefetch');
		}

		if (module.failed) {
			result.push('failed');
		}

		if (module.warnings) {
			result.push('warning');
		}

		if (module.errors) {
			result.push('error');
		}

		return result;
	},
};
