#!/usr/bin/env node
const { isEmpty } = require('../utils');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const normalizeData = require('normalize-package-data');
const pkg = path.join(process.cwd(), 'package.json');

exports.pkg = pkg;
function getPackageInfo(packageFile) {
	if (isEmpty(packageFile)) {
		packageFile = pkg;
	}

	try {
		if (fs.pathExistsSync(packageFile)) {
			packageFile = require(packageFile);
			normalizeData(packageFile);
			return packageFile;
		}
	} catch (error) {
		console.error(error);
	}
}

exports.getPackageInfo = getPackageInfo;

/**
 * Get a field from package.json
 *
 * @param {string} field
 * @param {*} [defaultVal=null]
 * @returns {*}
 */
function getPackageField(field, defaultVal = null) {
	const packageData = getPackageInfo();
	const fieldVal = _.get(packageData, field, defaultVal);
	return fieldVal;
}

exports.getPackageField = getPackageField;

const pkgData = getPackageInfo();
delete pkgData._id;

fs.writeJsonSync(pkg, pkgData, {
	spaces: '\t',
});
