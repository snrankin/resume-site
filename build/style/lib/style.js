'use strict';

const chalk = require('chalk');
const plur = require('plur');
const prettyBytes = require('pretty-bytes');
const strip = require('strip-ansi');
const symbols = require('log-symbols');
const path = require('path');
const { table, getBorderCharacters } = require('table');

const { strlen } = require('printable-characters');
const _ = require('lodash');
const prettyTime = require('pretty-ms');
const figures = require('figures');
const { isEmpty } = require('../utils');
const { tagLevelDecorators, consoleTag, decoratorLevel } = require('../logger');

const borderOptions = getBorderCharacters('void');
borderOptions.topBody = figures.line;
borderOptions.joinBody = figures.line;
const options = {
	// border: borderOptions,
	drawHorizontalLine: (lineIndex, rowCount) => {
		return lineIndex === 1;
	},
	drawVerticalLine: (lineIndex, columnCount) => {
		return false;
	},
};

module.exports = {
	files(rows, opts) {
		const max = opts.performance.maxAssetSize;
		let tableOpts = options;
		_.unset(tableOpts, 'header');
		tableOpts.columns = [
			{ alignment: 'justify', paddingLeft: 0, paddingRight: 2 },
			{ alignment: 'left', paddingLeft: 2, paddingRight: 2 },
			{ alignment: 'left', paddingLeft: 2, paddingRight: 2 },
			{ alignment: 'left', paddingLeft: 2, paddingRight: 0 },
			// { alignment: 'center', paddingLeft: 2, paddingRight: 0 },
		];

		// rows.shift();
		rows = rows.map((row, i) => {
			const [size, chunk, file, status] = row;
			const asset = !isEmpty(size) && !isEmpty(file) && size !== 'size' ? row.pop() : '';

			let chunkName = '';

			let formattedRow = [];

			if (size === 'size') {
				// row.pop();
				formattedRow = module.exports.header(row);

				// rows.splice(i + 1, 0, ['', '', '', '']);
			} else if (size && file) {
				let fileDir = path.dirname(file);
				let fileName = path.basename(file);
				let sizeStyle = chalk.green;
				if (!isEmpty(asset)) {
					// chunkName = asset.chunkNames.shift();
					sizeStyle = asset.isOverSizeLimit ? chalk.yellow : chalk.green;
				}
				// ignore empty rows, only render rows with data
				formattedRow.push(sizeStyle(prettyBytes(size)));
				formattedRow.push(chalk.blue(chunk).trim());
				formattedRow.push(chalk.blue.dim(fileDir) + path.sep + fileName);
				formattedRow.push(module.exports.status(status));
				// formattedRow.push(module.exports.assetStatus(emitted));
				// row[0] = sizeStyle(prettyBytes(size));
				// row[1] = chalk.blue(chunkName).trim();
				// row[2] = chalk.blue.dim(fileDir) + path.sep + fileName;
				// row[3] = module.exports.assetStatus(cached);
				// row[4] = module.exports.assetStatus(emitted);
			}

			return formattedRow;
		});

		const filesTable = table(rows, tableOpts);

		return filesTable;
	},

	footer(counts) {
		const problems = counts.errors + counts.warnings;
		const result = [];

		if (counts.time) {
			const time = module.exports.time(counts.time);
			result.push(chalk`{gray {bold {italic total}} Δ{italic t}} ${time}`);
		}

		if (problems > 0) {
			const symbol = counts.errors > 0 ? symbols.error : symbols.warning;
			const style = {
				errors: counts.errors > 0 ? 'red' : 'dim',
				problems: problems > 0 ? 'bold' : 'dim',
				warnings: counts.warnings > 0 ? 'yellow' : 'dim',
			};
			const labels = {
				errors: plur('error', counts.errors),
				problems: chalk[style.problems](`${problems} ${plur('problem', problems)}`),
				warnings: plur('warning', counts.warnings),
			};
			const errors = chalk[style.errors](`${counts.errors} ${labels.errors}`);
			const warnings = chalk[style.warnings](`${counts.warnings} ${labels.warnings}`);

			if (counts.errors > 0) {
				labels.problems = chalk[style.errors](labels.problems);
			} else if (counts.warnings) {
				labels.problems = ` ${chalk[style.warnings](labels.problems)}`;
			}

			result.push(chalk`${symbol} ${labels.problems} {dim (}${errors}, ${warnings}{dim )}`);
		}

		return result.join('\n');
	},

	hash(json, files, hidden) {
		const { hash } = json;
		const time = module.exports.time(json.time);
		const result = [];

		//result.push(chalk.underline(hash));
		result.push(files);
		result.push(chalk`\n{gray Δ{italic t}} ${time} ${hidden}`);

		return result.join('\n');
	},

	header(row) {
		return row.map((h) => chalk.gray(h.toUpperCase()));
	},

	hidden(text) {
		return chalk.dim(text);
	},

	problems(problems) {
		const result = [];
		const { dim } = chalk;
		const types = { errors: 'error', warnings: 'warning' };

		// tableOpts.spanningCells = [{ col: 0, row: 0, colSpan: 3 }];

		// render problem table per-file
		for (const key of Object.keys(problems)) {
			const problem = problems[key];
			let tableOpts = options;

			tableOpts.columns = [
				{ alignment: 'left', paddingLeft: 0, paddingRight: 2 },
				{ alignment: 'left', paddingLeft: 2, paddingRight: 2 },
				{ alignment: 'left', paddingLeft: 2, paddingRight: 2 },
				{ alignment: 'left', paddingLeft: 2, paddingRight: 0 },
			];

			const rows = [''];
			let header = [];

			tableOpts.header = {
				alignment: 'left',
				content: `${key}`,
			};

			// header.push([key, '', '', '']);

			// result.push('', chalk.underline(key));

			for (const type of Object.keys(types)) {
				let errType = types[type];

				if (!isEmpty(errType)) {
					switch (errType) {
						case 'errors':
						case 'error':
							errType = 'error';

							break;
						case 'warnings':
						case 'warning':
						case 'warn':
							errType = 'warn';

							break;
					}
				}

				for (const item of problem[type]) {
					let bgColor = decoratorLevel(errType, 'bg');
					let color = decoratorLevel(errType, 'color');
					let symbol = color(decoratorLevel(errType, 'symbol'));

					const message = item.message;
					const lines = message.split('\n');
					const probType = color(type.substring(0, type.length - 1));

					let fileLocation = dim(`${item.file}:${item.line}:${item.column}`);

					header.push([`${symbol}`, `${probType}`, `${fileLocation}`, `${lines[0]}`]);

					let test = typeof header;

					// let header = [`${symbol}`, `${probType}`, `${dim(`${item.file}:${item.line}:${item.column}`)}`, `${lines[0]}`];
					header = table(header, tableOpts);

					rows.push(header);

					for (const line of lines.slice(1)) {
						rows.push(line);
					}
				}
			}

			result.push(rows.join('\n'));
			result.push('');
		}

		if (result.length) {
			result.unshift('');
			result.push('');
		}

		return result.join('\n');
	},

	status(statuses) {
		return statuses
			.map((status) => {
				if (status === 'emitted' || status === 'built') {
					return chalk.green(status);
				} else if (status === 'error') {
					status = chalk.bold(symbols.error);
				} else if (status === 'failed') {
					status = chalk.red.bold(status);
				} else if (status === 'warning') {
					status = chalk.bold(symbols.warning);
				} else if (status === 'optional' || status === 'no-cache') {
					return chalk.yellow(status);
				} else if (status === 'prefetch') {
					return chalk.cyan(status);
				} else if (status === 'skipped') {
					return chalk.dim(status);
				}

				return status;
			})
			.join(', ');
	},

	time(ms) {
		const out = prettyTime(ms);
		const ubound = 1600;
		const lbound = 200;

		if (ms > ubound) {
			return chalk.bgRed.inverse(out);
		} else if (ms <= lbound) {
			return chalk.green.bold(out);
		}

		const styles = [chalk.red.bold, chalk.red, chalk.yellow, chalk.green];
		const values = [ubound, ubound / 2, lbound * 2, lbound];
		const closest = Math.max.apply(
			null,
			values.filter((v) => v <= ms)
		);
		const style = styles[values.indexOf(closest)];

		return style(out);
	},
};
