function stringToHtml(str) {
	// If DOMParser is supported, use it
	let domParserSupport = (function () {
		if (!window.DOMParser) return false;

		const parser = new DOMParser();
		try {
			parser.parseFromString('x', 'text/html');
		} catch (err) {
			return false;
		}
		return true;
	})();
	if (domParserSupport) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(str, 'text/html');
		return doc.body.firstElementChild;
	}
	// Otherwise, fallback to old-school method
	const dom = document.createElement('div');
	dom.innerHTML = str;
	return dom;
}

function get(obj, path, defValue) {
	// If path is not defined or it has false value
	if (!path) return undefined;
	// Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
	// Regex explained: https://regexr.com/58j0k
	const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
	// Find value
	const result = pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj);
	// If found value is undefined return default value; otherwise return the value
	return result === undefined ? defValue : result;
}

function sortObjectByKeys(o) {
	return Object.keys(o)
		.sort()
		.reduce((r, k) => ((r[k] = o[k]), r), {}); // eslint-disable-line
}

function isElement($obj) {
	try {
		return !!$obj.constructor.__proto__.prototype.constructor.name; //eslint-disable-line
	} catch (e) {
		return false;
	}
}
function isNodeList(el) {
	if (
		typeof el.length === 'number' &&
		typeof el.item !== 'undefined' &&
		typeof el.entries === 'function' &&
		typeof el.forEach === 'function' &&
		typeof el.keys === 'function' &&
		typeof el.values === 'function'
	) {
		if (isElement(el[0])) {
			return true;
		} else {
			return false;
		}
	}
	return false;
}
function wrapElement(toWrap, wrapper) {
	wrapper = stringToHtml(wrapper);

	let parent;

	// toWrap.parentNode.appendChild(wrapper);

	if (isNodeList(toWrap) && toWrap.length > 0) {
		parent = toWrap[0].parentNode;
		parent.insertBefore(wrapper, toWrap[0]);
		toWrap.forEach((item) => {
			wrapper.appendChild(item);
		});
	} else {
		parent = toWrap.parentNode;
		parent.insertBefore(wrapper, toWrap);
		wrapper.appendChild(toWrap);
	}

	// return wrapper;
}

/**
 *
 * @param {Node} text
 */
function makeList(node) {
	let text = node.textContent;
	text = text.split('\n');
	text = text
		.filter(function (textNode) {
			return textNode.length > 1;
		})
		.map(function (textNode) {
			textNode = textNode.replace(/\s*•\s*/, '').trim();
			textNode = `<li>${textNode}</li>`;
			return textNode;
		});
	text = text.join('\n');
	let list = stringToHtml(`<ul>${text}</ul>`);
	node.parentElement.replaceWith(list);
}
function getChildNodes(node) {
	if (node.hasChildNodes()) {
		let children = node.childNodes;
		for (const child of children) {
			if (child.tagName === 'SPAN' || child.tagName === 'DIV') {
				getChildNodes(child);
			} else {
				if (typeof child.tagName === 'undefined') {
					makeList(child);
				}
			}
		}
	}
}
document
	.querySelectorAll('#block-jobs .notion-collection-list__item-content .notion-property__text.property-79483e77')
	.forEach(function (block) {
		getChildNodes(block);
	});

function setupDates() {
	document.querySelectorAll('#block-jobs .notion-collection-list__item').forEach(function (job) {
		if (job.querySelector('.inner-wrapper') == null) {
			let items = job.querySelectorAll(
				'.notion-link, .notion-property__title, .notion-collection-list__item-content'
			);
			wrapElement(items, '<div class="inner-wrapper"></div>');
		}
		if (job.querySelector('.job-dates') == null) {
			let jobDates = {
				start: null,
				end: stringToHtml(
					'<div class="notion-property notion-property__date property-4a3d4840 end-date"><span>Present</span></div>'
				),
			};

			let dates = job.querySelectorAll('.notion-property__date');

			// dates = Array.from(dates);

			if (dates.length < 2) {
				let end = stringToHtml(
					'<div class="notion-collection-list__item-property"><div class="notion-property notion-property__date property-4a3d4840 end-date">Present</div></div>'
				);
				job.querySelector('.notion-collection-list__item-content').prepend(end);
			}

			job.querySelectorAll('.notion-property__date').forEach(function (jobDate) {
				let dateText = jobDate.textContent;
				if (dateText !== 'Present') {
					dateText = moment(dateText, 'MMMM DD, YYYY').format('MMM YYYY');
				}
				jobDate.innerHTML = '';
				dateText = stringToHtml(`<span class="date">${dateText}</span>`);

				jobDate.prepend(dateText);

				let date = jobDate.cloneNode(true);

				if (date.classList.contains('property-3b6d6761')) {
					jobDate.classList.add('start-date');

					// date.classList.add('start-date');
					let width = jobDate.offsetWidth;
					let height = jobDate.offsetHeight;
					// date.style.height = `${width}px`;
					// date.style.width = `${height}px`;
					jobDate.setAttribute('style', `--date-width: ${height}px; --date-height: ${width}px;`);
					jobDates.start = jobDate;
				}
				if (date.classList.contains('property-4a3d4840')) {
					jobDate.classList.add('end-date');

					// date.classList.add('end-date');
					let width = jobDate.offsetWidth;
					let height = jobDate.offsetHeight;
					// date.style.height = `${width}px`;
					// date.style.width = `${height}px`;
					jobDate.setAttribute('style', `--date-width: ${height}px; --date-height: ${width}px;`);
					jobDates.end = jobDate;
				}
			});

			// console.log(
			// 	"🚀 ~ file: test.html ~ line 130 ~ document.querySelectorAll ~ job.querySelector('job-dates')",
			// 	job.querySelector('job-dates')
			// );

			let startDate = jobDates.start;
			let endDate = jobDates.end;
			let desktopDates = stringToHtml('<div class="job-dates"></div>');

			desktopDates.append(startDate);
			desktopDates.append(stringToHtml('<div class="separator"></div>'));
			desktopDates.append(endDate);
			job.prepend(desktopDates);
		}
	});
}

setupDates();

if (document.querySelector('.notion-column-list > .row') == null) {
	let columns = document.querySelectorAll('.notion-column-list >  .notion-column');
	wrapElement(columns, '<div class="row"></div>');
}

if (window.matchMedia('(prefers-color-scheme:dark)').matches) {
	window.colorScheme = 'dark';
} else {
	window.colorScheme = 'light';
}

function getAllCSSVariableNames(prefix = '', sameDomain = false, styleSheets = document.styleSheets) {
	if (!prefix.match(/^--/)) {
		prefix = `--${prefix}`;
	}
	var cssVars = {};
	if (sameDomain) {
		const isSameDomain = (styleSheet) => {
			if (!styleSheet.href) {
				return true;
			}

			return styleSheet.href.indexOf(window.location.origin) === 0;
		};
		styleSheets = [...styleSheets].filter(isSameDomain);
	}
	// loop each stylesheet
	for (var i = 0; i < styleSheets.length; i++) {
		// loop stylesheet's cssRules
		let stylesheet = styleSheets[i];

		try {
			let styleSheetRules = styleSheets[i].cssRules;
			if (styleSheetRules.length > 0) {
				// try/catch used because 'hasOwnProperty' doesn't work
				for (var j = 0; j < styleSheetRules.length; j++) {
					try {
						let styleSheetRule = styleSheetRules[j];

						if (styleSheetRule.type === 1) {
							// loop stylesheet's cssRules' style (property names)
							for (var k = 0; k < styleSheetRule.style.length; k++) {
								let name = styleSheetRule.style[k];
								// test name for css variable signiture and uniqueness
								if (name.startsWith(prefix)) {
									let value = styleSheetRule.style.getPropertyValue(name).trim();
									cssVars[name] = value;
								}
							}
						}
					} catch (error) {
						console.error(error);
					}
				}
			}
		} catch (error) {
			console.error(error);
		}
	}
	return cssVars;
}
function getElementCSSVariables(allCSSVars, element = document.body, pseudo) {
	var elStyles = window.getComputedStyle(element, pseudo);
	var cssVars = {};
	for (var i = 0; i < allCSSVars.length; i++) {
		let key = allCSSVars[i];
		let value = elStyles.getPropertyValue(key);
		if (value) {
			cssVars[key] = value;
		}
	}
	return cssVars;
}
getAllCSSVariableNames('dark', true);
function switchColorScheme(type) {
	const colors = getAllCSSVariableNames(type, true);

	const styleNode = document.getElementById('color-sheme');
	let colorStyles = ':root{';
	Object.entries(colors).forEach((entry) => {
		let [cssVar, varVal] = entry;
		cssVar = cssVar.replace(`${type}-`, '');
		let value = `${cssVar}: ${varVal} !important;`;
		colorStyles += value;
	});
	colorStyles += '}';
	if (styleNode) {
		styleNode.innerHTML = colorStyles;
	} else {
		var s = document.createElement('style');
		s.setAttribute('id', 'color-sheme');
		s.type = 'text/css';
		s.innerText = colorStyles;
		document.head.appendChild(s);
	}
}

switchColorScheme(window.colorScheme);
