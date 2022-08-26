!function() {
    var __webpack_require__ = {
        r: function(exports) {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(exports, Symbol.toStringTag, {
                value: "Module"
            }), Object.defineProperty(exports, "__esModule", {
                value: !0
            });
        }
    }, __webpack_exports__ = {};
    !function() {
        function _createForOfIteratorHelper(o, allowArrayLike) {
            var it = "undefined" != typeof Symbol && o[Symbol.iterator] || o["@@iterator"];
            if (!it) {
                if (Array.isArray(o) || (it = function(o, minLen) {
                    if (!o) return;
                    if ("string" == typeof o) return _arrayLikeToArray(o, minLen);
                    var n = Object.prototype.toString.call(o).slice(8, -1);
                    "Object" === n && o.constructor && (n = o.constructor.name);
                    if ("Map" === n || "Set" === n) return Array.from(o);
                    if ("Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
                }(o)) || allowArrayLike && o && "number" == typeof o.length) {
                    it && (o = it);
                    var i = 0, F = function() {};
                    return {
                        s: F,
                        n: function() {
                            return i >= o.length ? {
                                done: !0
                            } : {
                                done: !1,
                                value: o[i++]
                            };
                        },
                        e: function(_e) {
                            throw _e;
                        },
                        f: F
                    };
                }
                throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            var err, normalCompletion = !0, didErr = !1;
            return {
                s: function() {
                    it = it.call(o);
                },
                n: function() {
                    var step = it.next();
                    return normalCompletion = step.done, step;
                },
                e: function(_e2) {
                    didErr = !0, err = _e2;
                },
                f: function() {
                    try {
                        normalCompletion || null == it.return || it.return();
                    } finally {
                        if (didErr) throw err;
                    }
                }
            };
        }
        function _arrayLikeToArray(arr, len) {
            (null == len || len > arr.length) && (len = arr.length);
            for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
            return arr2;
        }
        function stringToHtml(str) {
            var domParserSupport = function() {
                if (!window.DOMParser) return !1;
                var parser = new DOMParser;
                try {
                    parser.parseFromString("x", "text/html");
                } catch (err) {
                    return !1;
                }
                return !0;
            }();
            if (domParserSupport) return (new DOMParser).parseFromString(str, "text/html").body.firstElementChild;
            var dom = document.createElement("div");
            return dom.innerHTML = str, dom;
        }
        function wrapElement(toWrap, wrapper) {
            var el;
            wrapper = stringToHtml(wrapper), "number" == typeof (el = toWrap).length && void 0 !== el.item && "function" == typeof el.entries && "function" == typeof el.forEach && "function" == typeof el.keys && "function" == typeof el.values && function($obj) {
                try {
                    return !!$obj.constructor.__proto__.prototype.constructor.name;
                } catch (e) {
                    return !1;
                }
            }(el[0]) && toWrap.length > 0 ? (toWrap[0].parentNode.insertBefore(wrapper, toWrap[0]), 
            toWrap.forEach((function(item) {
                wrapper.appendChild(item);
            }))) : (toWrap.parentNode.insertBefore(wrapper, toWrap), wrapper.appendChild(toWrap));
        }
        function makeList(node) {
            var text = node.textContent;
            text = (text = (text = text.split("\n")).filter((function(textNode) {
                return textNode.length > 1;
            })).map((function(textNode) {
                return textNode = textNode.replace(/\s*•\s*/, "").trim(), textNode = "<li>".concat(textNode, "</li>");
            }))).join("\n");
            var list = stringToHtml("<ul>".concat(text, "</ul>"));
            node.parentElement.replaceWith(list);
        }
        function getChildNodes(node) {
            if (node.hasChildNodes()) {
                var _step, _iterator = _createForOfIteratorHelper(node.childNodes);
                try {
                    for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                        var child = _step.value;
                        "SPAN" === child.tagName || "DIV" === child.tagName ? getChildNodes(child) : void 0 === child.tagName && makeList(child);
                    }
                } catch (err) {
                    _iterator.e(err);
                } finally {
                    _iterator.f();
                }
            }
        }
        (document.querySelectorAll("#block-jobs .notion-collection-list__item-content .notion-property__text.property-79483e77").forEach((function(block) {
            getChildNodes(block);
        })), document.querySelectorAll("#block-jobs .notion-collection-list__item").forEach((function(job) {
            if (null == job.querySelector(".inner-wrapper") && wrapElement(job.querySelectorAll(".notion-link, .notion-property__title, .notion-collection-list__item-content"), '<div class="inner-wrapper"></div>'), 
            null == job.querySelector(".job-dates")) {
                var jobDates = {
                    start: null,
                    end: stringToHtml('<div class="notion-property notion-property__date property-4a3d4840 end-date"><span>Present</span></div>')
                };
                if (job.querySelectorAll(".notion-property__date").length < 2) {
                    var end = stringToHtml('<div class="notion-collection-list__item-property"><div class="notion-property notion-property__date property-4a3d4840 end-date">Present</div></div>');
                    job.querySelector(".notion-collection-list__item-content").prepend(end);
                }
                job.querySelectorAll(".notion-property__date").forEach((function(jobDate) {
                    var dateText = jobDate.textContent;
                    "Present" !== dateText && (dateText = moment(dateText, "MMMM DD, YYYY").format("MMM YYYY")), 
                    jobDate.innerHTML = "", dateText = stringToHtml('<span class="date">'.concat(dateText, "</span>")), 
                    jobDate.prepend(dateText);
                    var date = jobDate.cloneNode(!0);
                    if (date.classList.contains("property-3b6d6761")) {
                        jobDate.classList.add("start-date");
                        var width = jobDate.offsetWidth, height = jobDate.offsetHeight;
                        jobDate.setAttribute("style", "--date-width: ".concat(height, "px; --date-height: ").concat(width, "px;")), 
                        jobDates.start = jobDate;
                    }
                    if (date.classList.contains("property-4a3d4840")) {
                        jobDate.classList.add("end-date");
                        var _width = jobDate.offsetWidth, _height = jobDate.offsetHeight;
                        jobDate.setAttribute("style", "--date-width: ".concat(_height, "px; --date-height: ").concat(_width, "px;")), 
                        jobDates.end = jobDate;
                    }
                }));
                var startDate = jobDates.start, endDate = jobDates.end, desktopDates = stringToHtml('<div class="job-dates"></div>');
                desktopDates.append(startDate), desktopDates.append(stringToHtml('<div class="separator"></div>')), 
                desktopDates.append(endDate), job.prepend(desktopDates);
            }
        })), null == document.querySelector(".notion-column-list > .row")) && wrapElement(document.querySelectorAll(".notion-column-list >  .notion-column"), '<div class="row"></div>');
    }(), function() {
        "use strict";
        __webpack_require__.r(__webpack_exports__);
    }();
}();