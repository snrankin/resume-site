#!/usr/bin/env node

const path = require('path');
const { paramCase } = require('change-case');
const { getConfigField, getPath, getPackageField, filePaths, rootPath } = require('../globals');
const { errMessage, debug, logError, isEmpty, logSuccess } = require('../utils');
const fs = require('fs-extra');
const xml2js = require('xml2js');
const _ = require('lodash');
// debug(filePaths, 'FilePaths');
function parseXML(xml, output = 'string') {
	return xml2js.parseString(xml, (err, result) => {
		if (err) {
			console.error(logError(err));
			return;
		}
		let json = result;
		if (output === 'string') {
			json = JSON.stringify(json, null, 4);
		}

		// log JSON string
		debug(json, 'Parse XML');

		return json;
	});
}

var { favicons } = require('favicons'),
	colorSource = getPath('favicon-color', 'src', false),
	whiteSource = getPath('favicon-white', 'src', false), // Source image(s). `string`, `buffer` or array of `string`
	distPath = getPath('favicon-dest', 'dist', true),
	baseConfig = {
		path: './', // Path for overriding default icons path. `string`
		appName: getConfigField('app.name'), // Your application's name. `string`
		appShortName: paramCase(getConfigField('app.name')), // Your application's short_name. `string`. Optional. If not set, appName will be used
		appDescription: getConfigField('app.description'), // Your application's description. `string`
		developerName: getPackageField('author.name'), // Your (or your developer's) name. `string`
		developerURL: getPackageField('author.url'), // Your (or your developer's) URL. `string`
		dir: 'auto', // Primary text direction for name, short_name, and description
		lang: 'en-US', // Primary language for name and short_name
		theme_color: getConfigField('app.color'), // Theme color user for example in Android's task switcher. `string`
		appleStatusBarStyle: 'black-translucent', // Style for Apple status bar: "black-translucent", "default", "black". `string`
		display: 'browser', // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
		orientation: 'any', // Default orientation: "any", "natural", "portrait" or "landscape". `string`
		scope: '/', // set of URLs that the browser considers within your app
		start_url: '/', // Start URL when launching the application from a device. `string`
		preferRelatedApplications: false, // Should the browser prompt the user to install the native companion app. `boolean`
		version: getPackageField('version'), // Your application's version string. `string`
		pixel_art: true, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
		loadManifestWithCredentials: true, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
		manifestMaskable: false, // Maskable source image(s) for manifest.json. "true" to use default source. More information at https://web.dev/maskable-icon/. `boolean`, `string`, `buffer` or array of `string`
	};
const formatFile = (file) => {
	if (!isEmpty(file)) {
		let ext = path.extname(file.name);

		if (ext.includes('.')) {
			ext = ext.slice(1);
		}

		let contents = file.contents;

		if ('xml' === ext) {
			contents = parseXML(contents, 'object');
		} else {
			contents = JSON.parse(contents);
		}
		file.contents = contents;

		return file;
	}
};
let colorConfig = {
		...baseConfig,
		icons: {
			favicons: true, // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
			yandex: true, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
			android: false, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
			appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
			appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
			windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
		},
	},
	whiteConfig = {
		...baseConfig,
		background: getConfigField('app.color'), // Background colour for flattened icons. `string`
		theme_color: getConfigField('app.color'), // Theme color user for example in Android's task switcher. `string`
		manifestMaskable: true, // Maskable source image(s) for manifest.json. "true" to use default source. More information at https://web.dev/maskable-icon/. `boolean`, `string`, `buffer` or array of `string`
		icons: {
			// Platform Options:
			// - offset - offset in percentage
			// - background:
			//   * false - use default
			//   * true - force use default, e.g. set background for Android icons
			//   * color - set background for the specified icons
			//
			android: true, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
			appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
			appleStartup: true, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
			windows: { background: getConfigField('app.color') }, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
			favicons: false, // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
			yandex: false, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
		},
	},
	outputFile = (file) => {
		let name = path.join(distPath, file.name);

		try {
			fs.outputFileSync(name, file.contents, {
				encoding: 'utf8',
			});
			logSuccess(`File ${file.name} created`);
		} catch (err) {
			console.error(logError(err));
		}
	},
	outputFiles = (err, response) => {
		if (err) {
			console.error(logError(err));
			return;
		}

		_.map(response.images, outputFile);

		_.map(response.files, outputFile);
	};

favicons(colorSource, colorConfig, outputFiles);
favicons(whiteSource, whiteConfig, outputFiles);
