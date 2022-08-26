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
window.addEventListener(
	'load',
	function () {
		document
			.querySelectorAll(
				'#block-jobs .notion-collection-list__item-content .notion-property__text.property-79483e77'
			)
			.forEach(function (block) {
				getChildNodes(block);
			});
	},
	false
);
