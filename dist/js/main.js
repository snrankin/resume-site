(function() {
    var __webpack_require__ = {};
    !function() {
        __webpack_require__.r = function(exports) {
            if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                Object.defineProperty(exports, Symbol.toStringTag, {
                    value: "Module"
                });
            }
            Object.defineProperty(exports, "__esModule", {
                value: true
            });
        };
    }();
    var __webpack_exports__ = {};
    !function() {
        function _slicedToArray(arr, i) {
            return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
        }
        function _nonIterableRest() {
            throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        function _iterableToArrayLimit(arr, i) {
            var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
            if (_i == null) return;
            var _arr = [];
            var _n = true;
            var _d = false;
            var _s, _e;
            try {
                for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);
                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"] != null) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }
            return _arr;
        }
        function _arrayWithHoles(arr) {
            if (Array.isArray(arr)) return arr;
        }
        function _toConsumableArray(arr) {
            return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
        }
        function _nonIterableSpread() {
            throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        function _iterableToArray(iter) {
            if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
        }
        function _arrayWithoutHoles(arr) {
            if (Array.isArray(arr)) return _arrayLikeToArray(arr);
        }
        function _createForOfIteratorHelper(o, allowArrayLike) {
            var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
            if (!it) {
                if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
                    if (it) o = it;
                    var i = 0;
                    var F = function F() {};
                    return {
                        s: F,
                        n: function n() {
                            if (i >= o.length) return {
                                done: true
                            };
                            return {
                                done: false,
                                value: o[i++]
                            };
                        },
                        e: function e(_e2) {
                            throw _e2;
                        },
                        f: F
                    };
                }
                throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            var normalCompletion = true, didErr = false, err;
            return {
                s: function s() {
                    it = it.call(o);
                },
                n: function n() {
                    var step = it.next();
                    normalCompletion = step.done;
                    return step;
                },
                e: function e(_e3) {
                    didErr = true;
                    err = _e3;
                },
                f: function f() {
                    try {
                        if (!normalCompletion && it.return != null) it.return();
                    } finally {
                        if (didErr) throw err;
                    }
                }
            };
        }
        function _unsupportedIterableToArray(o, minLen) {
            if (!o) return;
            if (typeof o === "string") return _arrayLikeToArray(o, minLen);
            var n = Object.prototype.toString.call(o).slice(8, -1);
            if (n === "Object" && o.constructor) n = o.constructor.name;
            if (n === "Map" || n === "Set") return Array.from(o);
            if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
        }
        function _arrayLikeToArray(arr, len) {
            if (len == null || len > arr.length) len = arr.length;
            for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
            }
            return arr2;
        }
        function isEmpty(el) {
            if (el === undefined || el == null) {
                return true;
            }
            if (typeof el === "string" && el.length > 0) {
                return false;
            } else if (el === true) {
                return false;
            } else if (el instanceof Object) {
                if (Array.isArray(el) && el.length > 0) {
                    return false;
                } else {
                    if (Object.keys(el).length > 0) {
                        return false;
                    }
                }
            }
            return false;
        }
        function stringToHtml(str) {
            var domParserSupport = function() {
                if (!window.DOMParser) return false;
                var parser = new DOMParser;
                try {
                    parser.parseFromString("x", "text/html");
                } catch (err) {
                    return false;
                }
                return true;
            }();
            if (domParserSupport) {
                var parser = new DOMParser;
                var doc = parser.parseFromString(str, "text/html");
                return doc.body.firstElementChild;
            }
            var dom = document.createElement("div");
            dom.innerHTML = str;
            return dom;
        }
        function get(obj, path, defValue) {
            if (!path) return undefined;
            var pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
            var result = pathArray.reduce((function(prevObj, key) {
                return prevObj && prevObj[key];
            }), obj);
            return result === undefined ? defValue : result;
        }
        function sortObjectByKeys(o) {
            return Object.keys(o).sort().reduce((function(r, k) {
                return r[k] = o[k], r;
            }), {});
        }
        function isElement($obj) {
            try {
                return !!$obj.constructor.__proto__.prototype.constructor.name;
            } catch (e) {
                return false;
            }
        }
        function isNodeList(el) {
            if (typeof el.length === "number" && typeof el.item !== "undefined" && typeof el.entries === "function" && typeof el.forEach === "function" && typeof el.keys === "function" && typeof el.values === "function") {
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
            var parent;
            if (isNodeList(toWrap) && toWrap.length > 0) {
                parent = toWrap[0].parentNode;
                parent.insertBefore(wrapper, toWrap[0]);
                toWrap.forEach((function(item) {
                    wrapper.appendChild(item);
                }));
            } else {
                parent = toWrap.parentNode;
                parent.insertBefore(wrapper, toWrap);
                wrapper.appendChild(toWrap);
            }
        }
        function makeList(node) {
            var text = node.textContent;
            text = text.split("\n");
            text = text.filter((function(textNode) {
                return textNode.length > 1;
            })).map((function(textNode) {
                var bullet = textNode.match(/(-+)\s/gm);
                textNode = textNode.replace(/\s*•\s*/, "").trim();
                textNode = "<li>".concat(textNode, "</li>");
                return textNode;
            }));
            text = text.join("\n");
            var list = convertMarkdownToHtml(text);
            node.parentElement.replaceWith(list);
        }
        function getChildNodes(node) {
            if (node.hasChildNodes()) {
                var children = node.childNodes;
                var _iterator = _createForOfIteratorHelper(children), _step;
                try {
                    for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                        var child = _step.value;
                        if (child.tagName === "SPAN" || child.tagName === "DIV") {
                            getChildNodes(child);
                        } else {
                            if (typeof child.tagName === "undefined") {
                                makeList(child);
                            }
                        }
                    }
                } catch (err) {
                    _iterator.e(err);
                } finally {
                    _iterator.f();
                }
            }
        }
        function convertJobDescriptionLists(id) {
            var pageHtml = fetch("https://notion-page-to-html-api.vercel.app/html?id=".concat(id), {
                method: "GET"
            }).then((function(res) {
                return res.text();
            }));
            return pageHtml;
        }
        function addJobDescriptions() {
            document.querySelectorAll("#block-jobs .notion-collection-list__item-content .property-6c5e6670 .notion-semantic-string > span").forEach((function(block) {
                var id = block.innerHTML;
                if (!isEmpty(id)) {
                    convertJobDescriptionLists(id).then((function(res) {
                        var html = stringToHtml(res);
                        if (html.hasChildNodes()) {
                            html.firstElementChild.remove();
                        }
                        block.parentElement.replaceWith(html);
                    }));
                }
            }));
        }
        addJobDescriptions();
        function convertMarkdownToHtml(text) {
            var converter = new showdown.Converter;
            return converter.makeHtml(text);
        }
        function setupDates() {
            document.querySelectorAll("#block-jobs .notion-collection-list__item").forEach((function(job) {
                if (job.querySelector(".inner-wrapper") == null) {
                    var items = job.querySelectorAll(".notion-link, .notion-property__title, .notion-collection-list__item-content");
                    wrapElement(items, '<div class="inner-wrapper"></div>');
                }
                if (job.querySelector(".job-dates") == null) {
                    var jobDates = {
                        start: null,
                        end: stringToHtml('<div class="notion-property notion-property__date property-4a3d4840 end-date"><span>Present</span></div>')
                    };
                    var dates = job.querySelectorAll(".notion-property__date");
                    if (dates.length < 2) {
                        var end = stringToHtml('<div class="notion-collection-list__item-property"><div class="notion-property notion-property__date property-4a3d4840 end-date">Present</div></div>');
                        job.querySelector(".notion-collection-list__item-content").prepend(end);
                    }
                    job.querySelectorAll(".notion-property__date").forEach((function(jobDate) {
                        var dateText = jobDate.textContent;
                        if (dateText !== "Present") {
                            dateText = moment(dateText, "MMMM DD, YYYY").format("MMM YYYY");
                        }
                        jobDate.innerHTML = "";
                        dateText = stringToHtml('<span class="date">'.concat(dateText, "</span>"));
                        jobDate.prepend(dateText);
                        var date = jobDate.cloneNode(true);
                        if (date.classList.contains("property-3b6d6761")) {
                            jobDate.classList.add("start-date");
                            var width = jobDate.offsetWidth;
                            var height = jobDate.offsetHeight;
                            jobDate.setAttribute("style", "--date-width: ".concat(height, "px; --date-height: ").concat(width, "px;"));
                            jobDates.start = jobDate;
                        }
                        if (date.classList.contains("property-4a3d4840")) {
                            jobDate.classList.add("end-date");
                            var _width = jobDate.offsetWidth;
                            var _height = jobDate.offsetHeight;
                            jobDate.setAttribute("style", "--date-width: ".concat(_height, "px; --date-height: ").concat(_width, "px;"));
                            jobDates.end = jobDate;
                        }
                    }));
                    var startDate = jobDates.start;
                    var endDate = jobDates.end;
                    var desktopDates = stringToHtml('<div class="job-dates"></div>');
                    desktopDates.append(startDate);
                    desktopDates.append(stringToHtml('<div class="separator"></div>'));
                    desktopDates.append(endDate);
                    job.prepend(desktopDates);
                }
            }));
        }
        setupDates();
        if (document.querySelector(".notion-column-list > .row") == null) {
            var columns = document.querySelectorAll(".notion-column-list >  .notion-column");
            wrapElement(columns, '<div class="row"></div>');
        }
        if (window.matchMedia("(prefers-color-scheme:dark)").matches) {
            window.colorScheme = "dark";
        } else {
            window.colorScheme = "light";
        }
        function getAllCSSVariableNames() {
            var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
            var sameDomain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var styleSheets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document.styleSheets;
            if (!prefix.match(/^--/)) {
                prefix = "--".concat(prefix);
            }
            var cssVars = {};
            if (sameDomain) {
                var isSameDomain = function isSameDomain(styleSheet) {
                    if (!styleSheet.href) {
                        return true;
                    }
                    return styleSheet.href.indexOf(window.location.origin) === 0;
                };
                styleSheets = _toConsumableArray(styleSheets).filter(isSameDomain);
            }
            for (var i = 0; i < styleSheets.length; i++) {
                var stylesheet = styleSheets[i];
                try {
                    var styleSheetRules = styleSheets[i].cssRules;
                    if (styleSheetRules.length > 0) {
                        for (var j = 0; j < styleSheetRules.length; j++) {
                            try {
                                var styleSheetRule = styleSheetRules[j];
                                if (styleSheetRule.type === 1) {
                                    for (var k = 0; k < styleSheetRule.style.length; k++) {
                                        var name = styleSheetRule.style[k];
                                        if (name.startsWith(prefix)) {
                                            var value = styleSheetRule.style.getPropertyValue(name).trim();
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
        function getElementCSSVariables(allCSSVars) {
            var element = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.body;
            var pseudo = arguments.length > 2 ? arguments[2] : undefined;
            var elStyles = window.getComputedStyle(element, pseudo);
            var cssVars = {};
            for (var i = 0; i < allCSSVars.length; i++) {
                var key = allCSSVars[i];
                var value = elStyles.getPropertyValue(key);
                if (value) {
                    cssVars[key] = value;
                }
            }
            return cssVars;
        }
        getAllCSSVariableNames("dark", true);
        function switchColorScheme(type) {
            var colors = getAllCSSVariableNames(type, true);
            var styleNode = document.getElementById("color-sheme");
            if (window.matchMedia("print")) {
                colors = getAllCSSVariableNames("light", true);
            }
            var colorStyles = ":root{";
            Object.entries(colors).forEach((function(entry) {
                var _entry = _slicedToArray(entry, 2), cssVar = _entry[0], varVal = _entry[1];
                cssVar = cssVar.replace("".concat(type, "-"), "");
                var value = "".concat(cssVar, ": ").concat(varVal, " !important;");
                colorStyles += value;
            }));
            colorStyles += "}";
            if (styleNode) {
                styleNode.innerHTML = colorStyles;
            } else {
                var s = document.createElement("style");
                s.setAttribute("id", "color-sheme");
                s.type = "text/css";
                s.innerText = colorStyles;
                document.head.appendChild(s);
            }
        }
        switchColorScheme(window.colorScheme);
    }();
    !function() {
        "use strict";
        __webpack_require__.r(__webpack_exports__);
    }();
})();