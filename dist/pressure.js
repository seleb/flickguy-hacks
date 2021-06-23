/**
🖌
@file pressure
@summary adds pressure sensitivity to paint tool
@license MIT
@version 1.2.1
@author Sean S. LeBlanc

@description
Adds a toggle to the brush selection that
enables/disables pressure sensitivity.

When pressure sensitivity is enabled,
brush selection will automatically update to match pressure.

If the input device doesn't support pressure, the toggle is disabled.

HOW TO USE:
Copy-paste this script into a script tag in your flickguy
*/
this.hacks = this.hacks || {};
(function (exports, flickguy) {
'use strict';
const hackOptions = {
	source: 'https://github.com/seleb/flickguy-hacks/blob/main/dist/pressure.js',
	// whether pressure sensitivity is enabled by default
	enabled: true,
};

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var flickguy__default = /*#__PURE__*/_interopDefaultLegacy(flickguy);

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var pressure_min = createCommonjsModule(function (module, exports) {
// Pressure v2.2.0 | Created By Stuart Yamartino | MIT License | 2015 - 2020
!function(e,t){module.exports=t();}(commonjsGlobal,function(){function i(e){return (i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function e(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&s(e,t);}function s(e,t){return (s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function t(s){var n=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(e){return !1}}();return function(){var e,t=r(s);return e=n?(e=r(this).constructor,Reflect.construct(t,arguments,e)):t.apply(this,arguments),t=this,!(e=e)||"object"!==i(e)&&"function"!=typeof e?function(e){if(void 0!==e)return e;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(t):e}}function r(e){return (r=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function n(e,t){for(var s=0;s<t.length;s++){var n=t[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n);}}function u(e,t,s){return t&&n(e.prototype,t),s&&n(e,s),e}var h={set:function(e,t,s){y(e,t,s);},config:function(e){p.set(e);},map:function(){return v.apply(null,arguments)}},c=function(){function n(e,t,s){o(this,n),this.routeEvents(e,t,s),this.preventSelect(e,s);}return u(n,[{key:"routeEvents",value:function(e,t,s){var n=p.get("only",s);this.adapter=!b||"mouse"!==n&&null!==n?!m||"pointer"!==n&&null!==n?!g||"touch"!==n&&null!==n?new l(e,t).bindUnsupportedEvent():new d(e,t,s).bindEvents():new f(e,t,s).bindEvents():new a(e,t,s).bindEvents();}},{key:"preventSelect",value:function(e,t){p.get("preventSelect",t)&&(e.style.webkitTouchCallout="none",e.style.webkitUserSelect="none",e.style.khtmlUserSelect="none",e.style.MozUserSelect="none",e.style.msUserSelect="none",e.style.userSelect="none");}}]),n}(),l=function(){function n(e,t,s){o(this,n),this.el=e,this.block=t,this.options=s,this.pressed=!1,this.deepPressed=!1,this.nativeSupport=!1,this.runningPolyfill=!1,this.runKey=Math.random();}return u(n,[{key:"setPressed",value:function(e){this.pressed=e;}},{key:"setDeepPressed",value:function(e){this.deepPressed=e;}},{key:"isPressed",value:function(){return this.pressed}},{key:"isDeepPressed",value:function(){return this.deepPressed}},{key:"add",value:function(e,t){this.el.addEventListener(e,t,!1);}},{key:"runClosure",value:function(e){e in this.block&&this.block[e].apply(this.el,Array.prototype.slice.call(arguments,1));}},{key:"fail",value:function(e,t){p.get("polyfill",this.options)?this.runKey===t&&this.runPolyfill(e):this.runClosure("unsupported",e);}},{key:"bindUnsupportedEvent",value:function(){var t=this;this.add(g?"touchstart":"mousedown",function(e){return t.runClosure("unsupported",e)});}},{key:"_startPress",value:function(e){!1===this.isPressed()&&(this.runningPolyfill=!1,this.setPressed(!0),this.runClosure("start",e));}},{key:"_startDeepPress",value:function(e){this.isPressed()&&!1===this.isDeepPressed()&&(this.setDeepPressed(!0),this.runClosure("startDeepPress",e));}},{key:"_changePress",value:function(e,t){this.nativeSupport=!0,this.runClosure("change",e,t);}},{key:"_endDeepPress",value:function(){this.isPressed()&&this.isDeepPressed()&&(this.setDeepPressed(!1),this.runClosure("endDeepPress"));}},{key:"_endPress",value:function(){!1===this.runningPolyfill?(this.isPressed()&&(this._endDeepPress(),this.setPressed(!1),this.runClosure("end")),this.runKey=Math.random(),this.nativeSupport=!1):this.setPressed(!1);}},{key:"deepPress",value:function(e,t){.5<=e?this._startDeepPress(t):this._endDeepPress();}},{key:"runPolyfill",value:function(e){this.increment=0===p.get("polyfillSpeedUp",this.options)?1:10/p.get("polyfillSpeedUp",this.options),this.decrement=0===p.get("polyfillSpeedDown",this.options)?1:10/p.get("polyfillSpeedDown",this.options),this.setPressed(!0),this.runClosure("start",e),!1===this.runningPolyfill&&this.loopPolyfillForce(0,e);}},{key:"loopPolyfillForce",value:function(e,t){!1===this.nativeSupport&&(this.isPressed()?(this.runningPolyfill=!0,e=1<e+this.increment?1:e+this.increment,this.runClosure("change",e,t),this.deepPress(e,t),setTimeout(this.loopPolyfillForce.bind(this,e,t),10)):((e=e-this.decrement<0?0:e-this.decrement)<.5&&this.isDeepPressed()&&(this.setDeepPressed(!1),this.runClosure("endDeepPress")),0===e?(this.runningPolyfill=!1,this.setPressed(!0),this._endPress()):(this.runClosure("change",e,t),this.deepPress(e,t),setTimeout(this.loopPolyfillForce.bind(this,e,t),10))));}}]),n}(),a=function(){e(i,l);var n=t(i);function i(e,t,s){return o(this,i),n.call(this,e,t,s)}return u(i,[{key:"bindEvents",value:function(){this.add("webkitmouseforcewillbegin",this._startPress.bind(this)),this.add("mousedown",this.support.bind(this)),this.add("webkitmouseforcechanged",this.change.bind(this)),this.add("webkitmouseforcedown",this._startDeepPress.bind(this)),this.add("webkitmouseforceup",this._endDeepPress.bind(this)),this.add("mouseleave",this._endPress.bind(this)),this.add("mouseup",this._endPress.bind(this));}},{key:"support",value:function(e){!1===this.isPressed()&&this.fail(e,this.runKey);}},{key:"change",value:function(e){this.isPressed()&&0<e.webkitForce&&this._changePress(this.normalizeForce(e.webkitForce),e);}},{key:"normalizeForce",value:function(e){return this.reachOne(v(e,1,3,0,1))}},{key:"reachOne",value:function(e){return .995<e?1:e}}]),i}(),d=function(){e(i,l);var n=t(i);function i(e,t,s){return o(this,i),n.call(this,e,t,s)}return u(i,[{key:"bindEvents",value:function(){k?(this.add("touchforcechange",this.start.bind(this)),this.add("touchstart",this.support.bind(this,0))):this.add("touchstart",this.startLegacy.bind(this)),this.add("touchend",this._endPress.bind(this));}},{key:"start",value:function(e){0<e.touches.length&&(this._startPress(e),this.touch=this.selectTouch(e),this.touch&&this._changePress(this.touch.force,e));}},{key:"support",value:function(e,t,s){s=2<arguments.length&&void 0!==s?s:this.runKey;!1===this.isPressed()&&(e<=6?(e++,setTimeout(this.support.bind(this,e,t,s),10)):this.fail(t,s));}},{key:"startLegacy",value:function(e){this.initialForce=e.touches[0].force,this.supportLegacy(0,e,this.runKey,this.initialForce);}},{key:"supportLegacy",value:function(e,t,s,n){n!==this.initialForce?(this._startPress(t),this.loopForce(t)):e<=6?(e++,setTimeout(this.supportLegacy.bind(this,e,t,s,n),10)):this.fail(t,s);}},{key:"loopForce",value:function(e){this.isPressed()&&(this.touch=this.selectTouch(e),setTimeout(this.loopForce.bind(this,e),10),this._changePress(this.touch.force,e));}},{key:"selectTouch",value:function(e){if(1===e.touches.length)return this.returnTouch(e.touches[0],e);for(var t=0;t<e.touches.length;t++)if(e.touches[t].target===this.el||this.el.contains(e.touches[t].target))return this.returnTouch(e.touches[t],e)}},{key:"returnTouch",value:function(e,t){return this.deepPress(e.force,t),e}}]),i}(),f=function(){e(i,l);var n=t(i);function i(e,t,s){return o(this,i),n.call(this,e,t,s)}return u(i,[{key:"bindEvents",value:function(){this.add("pointerdown",this.support.bind(this)),this.add("pointermove",this.change.bind(this)),this.add("pointerup",this._endPress.bind(this)),this.add("pointerleave",this._endPress.bind(this));}},{key:"support",value:function(e){!1===this.isPressed()&&(0===e.pressure||.5===e.pressure||1<e.pressure?this.fail(e,this.runKey):(this._startPress(e),this._changePress(e.pressure,e)));}},{key:"change",value:function(e){this.isPressed()&&0<e.pressure&&.5!==e.pressure&&(this._changePress(e.pressure,e),this.deepPress(e.pressure,e));}}]),i}(),p={polyfill:!0,polyfillSpeedUp:1e3,polyfillSpeedDown:0,preventSelect:!0,only:null,get:function(e,t){return (t.hasOwnProperty(e)?t:this)[e]},set:function(e){for(var t in e)e.hasOwnProperty(t)&&this.hasOwnProperty(t)&&"get"!=t&&"set"!=t&&(this[t]=e[t]);}},y=function(e,t,s){var n=2<arguments.length&&void 0!==s?s:{};if("string"==typeof e||e instanceof String)for(var i=document.querySelectorAll(e),r=0;r<i.length;r++)new c(i[r],t,n);else if(P(e))new c(e,t,n);else for(r=0;r<e.length;r++)new c(e[r],t,n);},P=function(e){return "object"===("undefined"==typeof HTMLElement?"undefined":i(HTMLElement))?e instanceof HTMLElement:e&&"object"===i(e)&&null!==e&&1===e.nodeType&&"string"==typeof e.nodeName},v=function(e,t,s,n,i){return (e-t)*(i-n)/(s-t)+n},b=!1,g=!1,m=!1,w=!1,k=!1;if("undefined"!=typeof window){if("undefined"!=typeof Touch)try{(Touch.prototype.hasOwnProperty("force")||"force"in new Touch)&&(w=!0);}catch(e){}g="ontouchstart"in window.document&&w,b="onmousemove"in window.document&&"onwebkitmouseforcechanged"in window.document&&!g,m="onpointermove"in window.document,k="ontouchforcechange"in window.document;}return h});
});

/**
 * Helper used to replace code in a script tag based on a search regex.
 * To inject code without erasing original string, using capturing groups; e.g.
 * ```js
 * inject(/(some string)/,'injected before $1 injected after');
 * ```
 * @param searcher Regex to search and replace
 * @param replacer Replacer string/fn
 */
function inject(searcher, replacer) {
    // find the relevant script tag
    var scriptTags = document.getElementsByTagName('script');
    var scriptTag;
    var code = '';
    for (var i = 0; i < scriptTags.length; ++i) {
        scriptTag = scriptTags[i];
        if (!scriptTag.textContent)
            continue;
        var matchesSearch = scriptTag.textContent.search(searcher) !== -1;
        var isCurrentScript = scriptTag === document.currentScript;
        if (matchesSearch && !isCurrentScript) {
            code = scriptTag.textContent;
            break;
        }
    }
    // error-handling
    if (!code || !scriptTag) {
        throw new Error('Couldn\'t find "' + searcher + '" in script tags');
    }
    // modify the content
    code = code.replace(searcher, replacer);
    // replace the old script tag with a new one using our modified code
    var newScriptTag = document.createElement('script');
    newScriptTag.textContent = code;
    scriptTag.insertAdjacentElement('afterend', newScriptTag);
    scriptTag.remove();
}
/**
 * Helper for getting an array with unique elements
 * @param  {Array} array Original array
 * @return {Array}       Copy of array, excluding duplicates
 */
function unique(array) {
    return array.filter(function (item, idx) {
        return array.indexOf(item) === idx;
    });
}
// Ex: inject(/(names.sprite.set\( name, id \);)/, '$1console.dir(names)');
/** test */
function kitsyInject(searcher, replacer) {
    if (!kitsy.queuedInjectScripts.some(function (script) {
        return searcher.toString() === script.searcher.toString() && replacer === script.replacer;
    })) {
        kitsy.queuedInjectScripts.push({
            searcher: searcher,
            replacer: replacer,
        });
    }
    else {
        console.warn('Ignored duplicate inject');
    }
}
// Ex: before('load_game', function run() { alert('Loading!'); });
//     before('show_text', function run(text) { return text.toUpperCase(); });
//     before('show_text', function run(text, done) { done(text.toUpperCase()); });
function before$1(targetFuncName, beforeFn) {
    kitsy.queuedBeforeScripts[targetFuncName] = kitsy.queuedBeforeScripts[targetFuncName] || [];
    kitsy.queuedBeforeScripts[targetFuncName].push(beforeFn);
}
// Ex: after('load_game', function run() { alert('Loaded!'); });
function after(targetFuncName, afterFn) {
    kitsy.queuedAfterScripts[targetFuncName] = kitsy.queuedAfterScripts[targetFuncName] || [];
    kitsy.queuedAfterScripts[targetFuncName].push(afterFn);
}
function applyInjects() {
    kitsy.queuedInjectScripts.forEach(function (injectScript) {
        inject(injectScript.searcher, injectScript.replacer);
    });
}
function applyHooks(root) {
    var allHooks = unique(Object.keys(kitsy.queuedBeforeScripts).concat(Object.keys(kitsy.queuedAfterScripts)));
    allHooks.forEach(applyHook.bind(this, root || window));
}
function applyHook(root, functionName) {
    var functionNameSegments = functionName.split('.');
    var obj = root;
    while (functionNameSegments.length > 1) {
        obj = obj[functionNameSegments.shift()];
    }
    var lastSegment = functionNameSegments[0];
    var superFn = obj[lastSegment];
    var superFnLength = superFn ? superFn.length : 0;
    var functions = [];
    // start with befores
    functions = functions.concat(kitsy.queuedBeforeScripts[functionName] || []);
    // then original
    if (superFn) {
        functions.push(superFn);
    }
    // then afters
    functions = functions.concat(kitsy.queuedAfterScripts[functionName] || []);
    // overwrite original with one which will call each in order
    obj[lastSegment] = function () {
        var returnVal;
        var args = [].slice.call(arguments);
        var i = 0;
        function runBefore() {
            // All outta functions? Finish
            if (i === functions.length) {
                return returnVal;
            }
            // Update args if provided.
            if (arguments.length > 0) {
                args = [].slice.call(arguments);
            }
            if (functions[i].length > superFnLength) {
                // Assume funcs that accept more args than the original are
                // async and accept a callback as an additional argument.
                return functions[i++].apply(this, args.concat(runBefore.bind(this)));
            }
            // run synchronously
            returnVal = functions[i++].apply(this, args);
            if (returnVal && returnVal.length) {
                args = returnVal;
            }
            return runBefore.apply(this, args);
        }
        return runBefore.apply(this, arguments);
    };
}
/**
@file kitsy-script-toolkit
@summary Monkey-patching toolkit to make it easier and cleaner to run code before and after functions or to inject new code into script tags
@license WTFPL (do WTF you want)
@author Original by mildmojo; modified by Sean S. LeBlanc
*/
var kitsy = (window.kitsy = window.kitsy || {
    queuedInjectScripts: [],
    queuedBeforeScripts: {},
    queuedAfterScripts: {},
    inject: kitsyInject,
    before: before$1,
    after,
    /**
     * Applies all queued `inject` calls.
     *
     * An object that instantiates an class modified via injection will still refer to the original class,
     * so make sure to reinitialize globals that refer to injected scripts before calling `applyHooks`.
     */
    applyInjects,
    /** Apples all queued `before`/`after` calls. */
    applyHooks,
});

if (!kitsy.hooked) {
	kitsy.hooked = true;
	const startOriginal = flickguy__default['default'].start;
	flickguy__default['default'].start = () => {
		kitsy.applyHooks(flickguy__default['default']);
		startOriginal.call(flickguy__default['default']);
	};
}

/** @see kitsy.inject */
kitsy.inject;
/** @see kitsy.before */
var before = kitsy.before;
/** @see kitsy.after */
kitsy.after;





before('Editor.prototype.init', function () {
	const optionLabel = document.createElement('label');
	optionLabel.style.display = 'flex';
	optionLabel.style.alignItems = 'center';
	optionLabel.style.justifyContent = 'center';
	optionLabel.style.color = '#000';
	optionLabel.style.fontWeight = 'bold';
	optionLabel.title = 'pressure sensitivity';
	optionLabel.dataset.editorOnly = true;
	const optionInput = document.createElement('input');
	optionInput.type = 'checkbox';
	optionInput.id = 'pressure';
	optionInput.name = 'pressure';
	optionInput.value = 'pressure';
	optionInput.style.appearance = 'none';
	optionInput.style.mozAppearance = 'none';
	optionInput.style.webkitAppearance = 'none';
	optionInput.style.margin = '0';
	optionInput.style.borderRadius = 'inherit';
	optionInput.style.position = 'absolute';
	optionInput.style.width = '100%';
	optionInput.style.height = '100%';
	optionLabel.appendChild(optionInput);
	const optionIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	optionIcon.setAttributeNS(null, 'width', 16);
	optionIcon.setAttributeNS(null, 'height', 16);
	optionIcon.setAttributeNS(null, 'fill', 'currentColor');
	optionIcon.setAttributeNS(null, 'viewBox', '0 0 16 16');
	optionIcon.innerHTML = '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/><path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>';
	optionLabel.appendChild(optionIcon);

	document.getElementById('brush-select').appendChild(optionLabel);

	const pressureInput = optionInput;
	pressureInput.onchange = () => {
		if (pressureInput.checked) {
			pressureInput.style.background = 'blue';
			pressureInput.nextSibling.style.color = '#FFF';
		} else {
			pressureInput.style.background = 'none';
			pressureInput.nextSibling.style.color = 'inherit';
		}
	};
	pressureInput.checked = hackOptions.enabled;
	pressureInput.onchange();
	const brushes = this.brushSelect.inputs;
	const toolSelect = this.toolSelect;
	pressure_min.set(
		'#renderer',
		{
			change: function (force) {
				// re-enable (user may be switching between devices)
				if (pressureInput.disabled) {
					pressureInput.disabled = false;
					pressureInput.parentElement.title = 'pressure sensitivity';
					pressureInput.parentElement.style.opacity = 1;
				}

				// if painting + pressure enabled
				if (toolSelect.selectedIndex === 0 && pressureInput.checked) {
					// change brush selection based on pressure
					const idx = Math.min(Math.floor(force * brushes.length), brushes.length - 1);
					brushes[idx].checked = true;
				}
			},
			unsupported: function () {
				// disable the pressure input if you can't use it
				pressureInput.disabled = true;
				pressureInput.parentElement.title = 'device does not support pressure sensitivity';
				pressureInput.parentElement.style.opacity = 0.4;
			},
		},
		{
			// pressurejs's polyfill behaviour is a bit weird, especially for drawing
			polyfill: false,
		},
	);
});

exports.hackOptions = hackOptions;

Object.defineProperty(exports, '__esModule', { value: true });

}(this.hacks.pressure = this.hacks.pressure || {}, flickguy));
