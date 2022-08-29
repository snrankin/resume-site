!function(){var __webpack_require__={r:function(exports){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(exports,"__esModule",{value:!0})}},__webpack_exports__={};!function(){function _slicedToArray(arr,i){return function(arr){if(Array.isArray(arr))return arr}(arr)||function(arr,i){var _i=null==arr?null:"undefined"!=typeof Symbol&&arr[Symbol.iterator]||arr["@@iterator"];if(null==_i)return;var _s,_e,_arr=[],_n=!0,_d=!1;try{for(_i=_i.call(arr);!(_n=(_s=_i.next()).done)&&(_arr.push(_s.value),!i||_arr.length!==i);_n=!0);}catch(err){_d=!0,_e=err}finally{try{_n||null==_i.return||_i.return()}finally{if(_d)throw _e}}return _arr}(arr,i)||_unsupportedIterableToArray(arr,i)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function _toConsumableArray(arr){return function(arr){if(Array.isArray(arr))return _arrayLikeToArray(arr)}(arr)||function(iter){if("undefined"!=typeof Symbol&&null!=iter[Symbol.iterator]||null!=iter["@@iterator"])return Array.from(iter)}(arr)||_unsupportedIterableToArray(arr)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function _unsupportedIterableToArray(o,minLen){if(o){if("string"==typeof o)return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);return"Object"===n&&o.constructor&&(n=o.constructor.name),"Map"===n||"Set"===n?Array.from(o):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?_arrayLikeToArray(o,minLen):void 0}}function _arrayLikeToArray(arr,len){(null==len||len>arr.length)&&(len=arr.length);for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2}function stringToHtml(str){var domParserSupport=function(){if(!window.DOMParser)return!1;var parser=new DOMParser;try{parser.parseFromString("x","text/html")}catch(err){return!1}return!0}();if(domParserSupport)return(new DOMParser).parseFromString(str,"text/html").body.firstElementChild;var dom=document.createElement("div");return dom.innerHTML=str,dom}function wrapElement(toWrap,wrapper){var el;wrapper=stringToHtml(wrapper),"number"==typeof(el=toWrap).length&&void 0!==el.item&&"function"==typeof el.entries&&"function"==typeof el.forEach&&"function"==typeof el.keys&&"function"==typeof el.values&&function($obj){try{return!!$obj.constructor.__proto__.prototype.constructor.name}catch(e){return!1}}(el[0])&&toWrap.length>0?(toWrap[0].parentNode.insertBefore(wrapper,toWrap[0]),toWrap.forEach((function(item){wrapper.appendChild(item)}))):(toWrap.parentNode.insertBefore(wrapper,toWrap),wrapper.appendChild(toWrap))}function makeList(node){var text=node.textContent;text=(text=(text=text.split("\n")).filter((function(textNode){return textNode.length>1})).map((function(textNode){return textNode=textNode.replace(/\s*•\s*/,"").trim(),textNode="<li>".concat(textNode,"</li>")}))).join("\n");var list=stringToHtml("<ul>".concat(text,"</ul>"));node.parentElement.replaceWith(list)}function getChildNodes(node){if(node.hasChildNodes()){var _step,_iterator=function(o,allowArrayLike){var it="undefined"!=typeof Symbol&&o[Symbol.iterator]||o["@@iterator"];if(!it){if(Array.isArray(o)||(it=_unsupportedIterableToArray(o))||allowArrayLike&&o&&"number"==typeof o.length){it&&(o=it);var i=0,F=function(){};return{s:F,n:function(){return i>=o.length?{done:!0}:{done:!1,value:o[i++]}},e:function(_e2){throw _e2},f:F}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var err,normalCompletion=!0,didErr=!1;return{s:function(){it=it.call(o)},n:function(){var step=it.next();return normalCompletion=step.done,step},e:function(_e3){didErr=!0,err=_e3},f:function(){try{normalCompletion||null==it.return||it.return()}finally{if(didErr)throw err}}}}(node.childNodes);try{for(_iterator.s();!(_step=_iterator.n()).done;){var child=_step.value;"SPAN"===child.tagName||"DIV"===child.tagName?getChildNodes(child):void 0===child.tagName&&makeList(child)}}catch(err){_iterator.e(err)}finally{_iterator.f()}}}(document.querySelectorAll("#block-jobs .notion-collection-list__item-content .notion-property__text.property-79483e77").forEach((function(block){getChildNodes(block)})),document.querySelectorAll("#block-jobs .notion-collection-list__item").forEach((function(job){if(null==job.querySelector(".inner-wrapper")&&wrapElement(job.querySelectorAll(".notion-link, .notion-property__title, .notion-collection-list__item-content"),'<div class="inner-wrapper"></div>'),null==job.querySelector(".job-dates")){var jobDates={start:null,end:stringToHtml('<div class="notion-property notion-property__date property-4a3d4840 end-date"><span>Present</span></div>')};if(job.querySelectorAll(".notion-property__date").length<2){var end=stringToHtml('<div class="notion-collection-list__item-property"><div class="notion-property notion-property__date property-4a3d4840 end-date">Present</div></div>');job.querySelector(".notion-collection-list__item-content").prepend(end)}job.querySelectorAll(".notion-property__date").forEach((function(jobDate){var dateText=jobDate.textContent;"Present"!==dateText&&(dateText=moment(dateText,"MMMM DD, YYYY").format("MMM YYYY")),jobDate.innerHTML="",dateText=stringToHtml('<span class="date">'.concat(dateText,"</span>")),jobDate.prepend(dateText);var date=jobDate.cloneNode(!0);if(date.classList.contains("property-3b6d6761")){jobDate.classList.add("start-date");var width=jobDate.offsetWidth,height=jobDate.offsetHeight;jobDate.setAttribute("style","--date-width: ".concat(height,"px; --date-height: ").concat(width,"px;")),jobDates.start=jobDate}if(date.classList.contains("property-4a3d4840")){jobDate.classList.add("end-date");var _width=jobDate.offsetWidth,_height=jobDate.offsetHeight;jobDate.setAttribute("style","--date-width: ".concat(_height,"px; --date-height: ").concat(_width,"px;")),jobDates.end=jobDate}}));var startDate=jobDates.start,endDate=jobDates.end,desktopDates=stringToHtml('<div class="job-dates"></div>');desktopDates.append(startDate),desktopDates.append(stringToHtml('<div class="separator"></div>')),desktopDates.append(endDate),job.prepend(desktopDates)}})),null==document.querySelector(".notion-column-list > .row"))&&wrapElement(document.querySelectorAll(".notion-column-list >  .notion-column"),'<div class="row"></div>');function getAllCSSVariableNames(){var prefix=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",sameDomain=arguments.length>1&&void 0!==arguments[1]&&arguments[1],styleSheets=arguments.length>2&&void 0!==arguments[2]?arguments[2]:document.styleSheets;prefix.match(/^--/)||(prefix="--".concat(prefix));var cssVars={};if(sameDomain){var isSameDomain=function(styleSheet){return!styleSheet.href||0===styleSheet.href.indexOf(window.location.origin)};styleSheets=_toConsumableArray(styleSheets).filter(isSameDomain)}for(var i=0;i<styleSheets.length;i++){styleSheets[i];try{var styleSheetRules=styleSheets[i].cssRules;if(styleSheetRules.length>0)for(var j=0;j<styleSheetRules.length;j++)try{var styleSheetRule=styleSheetRules[j];if(1===styleSheetRule.type)for(var k=0;k<styleSheetRule.style.length;k++){var name=styleSheetRule.style[k];if(name.startsWith(prefix)){var value=styleSheetRule.style.getPropertyValue(name).trim();cssVars[name]=value}}}catch(error){console.error(error)}}catch(error){console.error(error)}}return cssVars}window.matchMedia("(prefers-color-scheme:dark)").matches?window.colorScheme="dark":window.colorScheme="light",getAllCSSVariableNames("dark",!0),function(type){var colors=getAllCSSVariableNames(type,!0),styleNode=document.getElementById("color-sheme"),colorStyles=":root{";if(Object.entries(colors).forEach((function(entry){var _entry=_slicedToArray(entry,2),cssVar=_entry[0],varVal=_entry[1];cssVar=cssVar.replace("".concat(type,"-"),"");var value="".concat(cssVar,": ").concat(varVal," !important;");colorStyles+=value})),colorStyles+="}",styleNode)styleNode.innerHTML=colorStyles;else{var s=document.createElement("style");s.setAttribute("id","color-sheme"),s.type="text/css",s.innerText=colorStyles,document.head.appendChild(s)}}(window.colorScheme)}(),function(){"use strict";__webpack_require__.r(__webpack_exports__)}()}();