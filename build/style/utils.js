/** ============================================================================
 * utils
 *
 * @version   1.0.0
 * @author    Sam Rankin <srankin@riester.com>
 * @copyright 2022 RIESTER
 * ========================================================================== */

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const { argv } = require('yargs');

const sassType = RegExp('scss$');

const isSassError = (e) => {
	const file = _.get(e, 'file', '');
	const isSassFile = sassType.test(file);

	const errorMessage = _.get(e, 'webpackError.message', '');
	const miniCSSModule = errorMessage.indexOf('mini-css-extract-plugin');
	const isNotMiniCSS = miniCSSModule === -1;
	return isSassFile && isNotMiniCSS;
};
exports.isSassError = isSassError;

const sortObjectByKeys = (o) => {
	return Object.keys(o)
		.sort()
		.reduce((r, k) => ((r[k] = o[k]), r), {}); // eslint-disable-line
};
exports.sortObjectByKeys = sortObjectByKeys;

const fullPath = (filePath) => {
	return path.join(process.cwd(), filePath);
};

exports.fullPath = fullPath;

const pathExists = (filePath) => {
	filePath = fullPath(filePath);
	fs.pathExists(filePath, (err, exists) => {
		if (!isEmpty(err)) {
			console.error(err);
			return false;
		}
		return true;
	});
};
exports.pathExists = pathExists;
function fileContents(filePath = '') {
	filePath = fullPath(filePath);
	if (fs.existsSync(filePath)) {
		const file = fs.readFileSync(filePath);
		if (file) {
			return file.toString();
		}
	} else {
		console.error(`${filePath} does not exist`);
		return '';
	}
}

exports.fileContents = fileContents;

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
	} else if (_.has(argv, 'p')) {
		return 'production';
	}
	return 'development';
};

exports.env = env;

const sortArray = (arr1, arr2) => {
	arr2.sort((a, b) => {
		const aKey = Object.keys(a)[0];
		const bKey = Object.keys(b)[0];
		return arr1.indexOf(aKey) - arr1.indexOf(bKey);
	});
};
exports.sortArray = sortArray;

/**
 * Nicer looking console.log helper
 *
 * @param {*} debugItem
 */
const debug = (debugItem) => {
	console.log(
		util.inspect(debugItem, {
			depth: 8,
			colors: true,
		})
	);
};
exports.debug = debug;

/**
 * Check if a variable is empty
 *
 * @export
 * @param {*} el The variable to check
 * @return {boolean} True if empty, false if not
 */
const isEmpty = (el) => {
	if (_.isNull(el) || _.isUndefined(el)) {
		return true;
	} else if (_.isString(el) && el.length === 0) {
		return true;
	} else if (_.isObject(el) && _.isEmpty(el)) {
		return true;
	}
	return false;
};

exports.isEmpty = isEmpty;

/**
 * Convert a string to slug or kebab case
 *
 * @param {*} str
 * @return {*}
 */

const slugCase = (str) => {
	const pattern = new RegExp('((s+&s+)|(s+&amp;s+))');
	str = _.replace(str, pattern, ' and ');
	return _.chain(str).deburr().trim().kebabCase().value();
};
exports.slugCase = slugCase;

/**
 * Convert a string to title case with ampersands
 *
 * @param {*} str
 * @return {*}
 */
const titleCase = (str) => {
	const pattern = new RegExp(/(\/|-|_)/gm);
	str = _.replace(str, pattern, ' ');
	str = _.chain(str)
		.trim()
		.startCase()
		.tap(function (str) {
			const andPattern = new RegExp(/and/gim);
			const amp = _.escape('&');
			return _.replace(str, andPattern, amp);
		})
		.value();
	return str;
};
exports.titleCase = titleCase;

const blockPath = (file = '') => {
	return './' + path.join('blocks', file, 'index.js');
};

const getPathFromUrl = (url) => {
	return url.split('?')[0];
};

const removeLoaders = (error) => {
	const file = _.get(error, 'file', '');
	if (!file) {
		return '';
	}
	const split = file.split('!');
	const filePath = split[split.length - 1];
	_.set(error, 'file', filePath);
	return error;
};

exports.removeLoaders = removeLoaders;

/**
 *
 *
 * @param {Object} object
 * @returns {Object} object
 */
function deepFreeze(object) {
	// Retrieve the property names defined on object
	const propNames = Object.getOwnPropertyNames(object);

	// Freeze properties before freezing self

	for (const name of propNames) {
		const value = object[name];

		if (value && typeof value === 'object') {
			deepFreeze(value);
		}
	}

	return Object.freeze(object);
}
exports.deepFreeze = deepFreeze;
