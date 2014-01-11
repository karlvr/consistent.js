/*!
 * Consistent.js 0.12.1
 * @author Karl von Randow
 * @license Apache License, Version 2.0
 */
/*jshint newcap: false, smarttabs: true */
/*
    Copyright 2013 Karl von Randow

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
  */

/**
 * Set global configuration:
 * eg. Consistent.defaultOptions.templateEngine = Hogan;
 */
(function(window, undefined) {
	"use strict";

	var document = window.document;

	/**
	 * Single point of entry for Consistent.
	 * Arguments can be:
	 * * None, just create a new Consistent scope and return it.
	 * * An existing Consistent scope, create a child scope and return it. Optionally followed by a second argument for options.
	 * * An object containing key value pairs, used for the configuration of the new scope.
	 * * A dom node; returns the scope that bound that node, or null.
	 */
	var Consistent = window.Consistent = function(arg0) {
		if (arguments.length === 0) {
			/* No arguments */
			return Consistent.createScope();
		}

		if (typeof arg0 === "string") {
			return Consistent.findScopeByName(arg0);
		}
		if (arg0.nodeName !== undefined) {
			/* DOM node */
			return Consistent.findScopeForNode(arg0);
		}

		var parentScope;
		var options;
		var controller;
		var argIndex = 0;

		if (Consistent.isScope(arg0)) {
			/* Parent scope */
			parentScope = arg0;
			argIndex++;
		}
		if (typeof arguments[argIndex] === "object") {
			options = arguments[argIndex];
			argIndex++;
		}
		if (typeof arguments[argIndex] === "function") {
			controller = arguments[argIndex];
			argIndex++;
		}
		if (arguments[argIndex] !== undefined) {
			throw exception("Unexpected argument to Consistent(): " + arg0);
		}

		return Consistent.createScope(parentScope, options, controller);
	};

	var scopeManagers = {};
	var scopeManagersByName = {};
	var SCOPE_TYPE = "ConsistentScope";

	var support = (function() {
		var result = {};

		/* IE6 and 7 have a strange setAttribute implementation that needs the property name for
		 * some properties.
		 */
		var div = document.createElement("div");
		div.setAttribute("className", "test");
		result.badGetSetAttribute = (div.className === "test");

		result.needChangeEventForActiveOnSubmit = result.needAggressiveChangeHandlingOnInputElements = !!document.createEventObject;

		return result;
	})();

	merge(Consistent, {
		settings: {
			attributes: {
				key: [ "data-ct", "ct" ],
				show: [ "data-ct-show", "ct-show" ],
				hide: [ "data-ct-hide", "ct-hide" ],
				enabled: [ "data-ct-enabled", "ct-enabled" ],
				disabled: [ "data-ct-disabled", "ct-disabled" ],
				readOnly: [ "data-ct-readonly", "ct-readonly" ],
				readWrite: [ "data-ct-readwrite", "ct-readwrite" ],
				options: [ "data-ct-options", "ct-options" ],

				template: [ "data-ct-tmpl", "ct-tmpl" ],
				templateId: [ "data-ct-tmpl-id", "ct-tmpl-id" ],

				attributes: [ "data-ct-attrs", "ct-attrs" ],
				attributePrefix: [ "data-ct-attr-", "ct-attr-" ],
				properties: [ "data-ct-props", "ct-props" ],
				propertyPrefix: [ "data-ct-prop-", "ct-prop-" ],
				templateAttributePrefix: [ "data-ct-tmpl-attr-", "ct-tmpl-attr-" ],
				templateIdAttributePrefix: [ "data-ct-tmpl-id-attr-", "ct-tmpl-id-attr-" ],
				classAttribute: [ "data-ct-class", "ct-class" ],
				classAddAttribute: [ "data-ct-add-class", "ct-add-class" ],

				on: [ "data-ct-do", "ct-do" ],
				onPrefix: [ "data-ct-on-", "ct-on-" ],

				repeat: [ "data-ct-repeat", "ct-repeat" ],
				repeatContainerId: [ "data-ct-repeat-container-id", "ct-repeat-container-id" ],

				noBind: [ "data-ct-nobind", "ct-nobind" ],
				scope: [ "data-ct-scope", "ct-scope" ],
				init: [ "data-ct-init", "ct-init" ],
				initFunc: [ "data-ct-init-func", "ct-init-func" ],
				controller: [ "data-ct-controller", "ct-controller" ],

				warningPrefix: [ "data-ct-", "ct-" ]
			},

			scopeIdKey: "__ConsistentScopeID",
			functionIdKey: "__ConsistentFunctionID",
			oldDisplayKey: "__ConsistentOldDisplay",
			addedClassesKey: "__ConsistentAddedClasses",

			maxWatcherLoops: 100,
			autoCreateScopes: true
		},

		isScope: function(object) {
			return object !== undefined && object.$ !== undefined && object.$._type === SCOPE_TYPE;
		},

		createScope: function(parentScope, options, controller) {
			/* Create scope */
			options = mergeOptions({}, Consistent.defaultOptions, options);

			var scopeManager = new ConsistentScopeManager(parentScope, options);
			scopeManagers[scopeManager._id] = scopeManager;
			if (scopeManager._name) {
				scopeManagersByName[scopeManager._name] = scopeManager;
			}
			var scope = scopeManager._scope;
			if (controller) {
				if (typeof controller === "function") {
					scopeManager.replaceController(new controller(scope));
				} else {
					throw exception("Invalid argument type for controller: " + typeof controller);
				}
			}
			return scope;
		},

		autoCreateScopes: function() {
			var root = document;
			var scopeDeclarationAttributes = Consistent.settings.attributes.scope;
			var controllerDeclarationAttributes = Consistent.settings.attributes.controller;
			var initDeclarationAttributes = Consistent.settings.attributes.init;
			var initFuncDeclarationAttributes = Consistent.settings.attributes.initFunc;
			var n = scopeDeclarationAttributes.length;
			var m = controllerDeclarationAttributes.length;
			var o = initDeclarationAttributes.length;
			var p = initFuncDeclarationAttributes.length;

			visit(root);

			function visit(dom) {
				var scopeName, controllerName;
				var i;
				if (dom.hasAttribute) {
					/* This is a node that can have attributes, so look for our declarations */
					for (i = 0; i < n; i++) {
						if (dom.hasAttribute(scopeDeclarationAttributes[i])) {
							scopeName = dom.getAttribute(scopeDeclarationAttributes[i]);
							break;
						}
					}
					for (i = 0; i < m; i++) {
						if (dom.hasAttribute(controllerDeclarationAttributes[i])) {
							controllerName = dom.getAttribute(controllerDeclarationAttributes[i]);
							break;
						}
					}
				}
				if (typeof scopeName === "string" || controllerName) {
					var controller;
					if (controllerName) {
						controller = getNestedProperty(window, controllerName);
					}

					var scope = Consistent.createScope(null, scopeName ? { name: scopeName } : null, controller);
					scope.$.bind(dom);

					var initValue;
					for (i = 0; i < o; i++) {
						initValue = dom.getAttribute(initDeclarationAttributes[i]);
						if (initValue) {
							break;
						}
					}

					var initFunc;
					for (i = 0; i < p; i++) {
						var initFuncValue = dom.getAttribute(initFuncDeclarationAttributes[i]);
						if (initFuncValue) {
							initFunc = getNestedProperty(window, initFuncValue);
							if (typeof initFunc !== "function") {
								throw exception("Consistent scope init function attribute referenced a function that was not found: " + initFuncValue);
							}
							break;
						}
					}

					if (!initValue) {
						if (!initFunc && !controller) {
							scope.$.update();
						}
						if (initFunc) {
							initFunc.call(scope);
						}
						scope.$.apply();
					} else if (initValue === "update") {
						scope.$.update();
						if (initFunc) {
							initFunc.call(scope);
						}
						scope.$.apply();
					} else if (initValue === "none") {
						if (initFunc) {
							initFunc.call(scope);
						}
					} else if (initValue) {
						/* If the string isn't empty then we evaluate it as a function */
						var func = Consistent.statementToFunction(initValue);
						evaluateStatement(func, scope);
						if (initFunc) {
							initFunc.call(scope);
						}
						scope.$.apply();
					}
				} else {
					var child = dom.firstChild;
					while (child !== null) {
						if (child.nodeType === 1) {
							visit(child);
						}
						child = child.nextSibling;
					}
				}
			}
		},

		destroyScope: function(scope) {
			var scopeManager = scope.$._manager();
			scopeManager.destroy();
			delete scopeManagers[scopeManager._id];
			if (scopeManager._name) {
				delete scopeManagersByName[scopeManager._name];
			}
		},

		findScope: function(name) {
			var scopeManager = scopeManagersByName[name];
			if (scopeManager) {
				return scopeManager._scope;
			} else {
				return null;
			}
		},

		/** Returns the scope for the given DOM node, or null */
		findScopeForNode: function(dom) {
			var scopeId = dom[Consistent.settings.scopeIdKey];
			if (scopeId && scopeManagers[scopeId]) {
				return scopeManagers[scopeId]._scope;
			} else {
				return null;
			}
		},

		expressionToFunction: function(value) {
			throw exception("Expression support requires consistent-expressions.js");
		},

		statementToFunction: function(value) {
			throw exception("Expression support requires consistent-expressions.js");
		},

		merge: merge

	});

	var _plainObject = {};

	function isArray(object) {
		return _plainObject.toString.call(object) === "[object Array]";
	}

	function isEmptyObject(object) {
		for (var i in object) {
			return false;
		}
		return true;
	}

	var arrayIndexOf;
	if (typeof [].indexOf === "function") {
		arrayIndexOf = function(array, searchElement, fromIndex) {
			return array.indexOf(searchElement, fromIndex);
		};
	} else {
		arrayIndexOf = function(array, searchElement, fromIndex) {
			if (fromIndex === undefined) {
				fromIndex = 0;
			}
			if (fromIndex < 0) {
				fromIndex += array.length;
				if (fromIndex < 0) {
					fromIndex = 0;
				}
			}
			for (var i = fromIndex; i < array.length; i++) {
				if (array[i] === searchElement) {
					return i;
				}
			}
			return -1;
		};
	}
	Consistent.arrayIndexOf = arrayIndexOf;

	/**
	 * Merge objects passed as arguments. If the first parameter is a boolean that specifies whether to do a deep
	 * copy.
	 */
	function merge() {
		/* Support cycles */
		var seen = [];
		var merged = [];

		function _merge() {
			var objectsStart = 0;
			var deep = false;
			if (typeof arguments[0] === "boolean") {
				deep = arguments[0];
				objectsStart++;
			}
			var target = arguments[objectsStart];
			if (typeof target !== "object" && typeof target !== "function") {
				throw exception("Target object argument to merge is not appropriate: " + typeof target);
			}
			if (target === null) {
				throw exception("Target object argument to merge is not appropriate: " + target);
			}
			for (var i = objectsStart + 1; i < arguments.length; i++) {
				var source = arguments[i];
				if (source === undefined) {
					continue;
				}

				if (typeof source !== "object" && typeof source !== "function") {
					throw exception("Argument " + (i+1) + " to merge is not appropriate: " + typeof source);
				}

				seen.push(source);
				merged.push(target);

				for (var name in source) {
					var value = source[name];
					if (value !== undefined) {
						if (deep && typeof value === "object" && value !== null) {
							var found = arrayIndexOf(seen, value);
							if (found === -1) {
								var deepTarget = target[name];
								if (deepTarget === undefined) {
									deepTarget = isArray(value) ? [] : {};
								}
								value = _merge(true, deepTarget, value);
							} else {
								value = merged[found];
							}
						}
						target[name] = value;
					}
				}
			}
			return target;
		}

		return _merge.apply(null, arguments);
	}

	/**
	 * A special merge that also does a merge on the objects under the $ keys. This is so that the
	 * user can supply some replacement functions under the $ key and still have the default ones inserted.
	 */
	function mergeOptions() {
		var $s = [];
		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (arg) {
				$s.push(arguments[i].$);
			}
		}

		/* Correct the first element, as if it is null or undefined the merge will throw an exception */
		if (!$s[0]) {
			$s[0] = {};
		}

		var result = merge.apply(null, arguments);
		/* We replace the $ property from the first merge, with the result of merging all of the $s
		 * themselves. Note that this isn't a deep merge, but we have to specifically do the merge of
		 * the $s so we merge their contents. If we didn't do this each $ property in the arguments
		 * would clobber the next.
		 */
		result.$ = merge.apply(null, $s);
		return result;
	}

	function mungeBadAttributeProperty(name) {
		if (!support.badGetSetAttribute) {
			return name;
		}

		if (name === "class") {
			return "className";
		} else {
			return name;
		}
	}

	/**
	 * Makes nested properties more presentable. Changes array index properties from array.0
	 * to array[0].
	 */
	function presentNestedProperty(property) {
		return property.replace(/\.([0-9]+)(\.|$)/g, "[$1]$2");
	}

	function presentNestedProperties(properties) {
		var result = [];
		for (var i = 0; i < properties.length; i++) {
			result.push(presentNestedProperty(properties[i]));
		}
		return result;
	}

	/**
	 * Undoes the work on presentNestedProperty.
	 */
	function unpresentNestedProperty(property) {
		return property.replace(/\[([0-9]+)\]/g, ".$1");
	}

	function getNestedProperty(object, property) {
		var parts = property.split(".");
		var current = object;
		var i;
		for (i = 0; i < parts.length && current !== undefined && current !== null; i++) {
			if (parts[i] === "constructor") {
				/* Expression security; don't allow to access constructors which can be
				 * used to execute arbitrary code. Based on expression security in Angular:
				 * https://github.com/angular/angular.js/blob/master/src/ng/parse.js
				 */
				throw exception("Illegal attempt to access 'constructor' keyword for property: " + property);
			}
			if (current && current.constructor === current) {
				/* Expression security; don't allow access to the Function constructor which
				 * can be used to execute arbitrary code. Based on expression security in Angular:
				 * https://github.com/angular/angular.js/blob/master/src/ng/parse.js
				 * This is their nifty check if the object is Function.
				 */
				throw exception("Illegal attempt to access Function constructor for property: " + property);
			}
			current = current[parts[i]];
		}
		if (i === parts.length) {
			if (current && current.constructor === current) {
				/* Expression security; don't allow access to the Function constructor which
				 * can be used to execute arbitrary code. Based on expression security in Angular:
				 * https://github.com/angular/angular.js/blob/master/src/ng/parse.js
				 * This is their nifty check if the object is Function.
				 */
				throw exception("Illegal attempt to access Function constructor for property: " + property);
			}
			return current;
		} else {
			return undefined;
		}
	}

	function getNestedPropertyNames(object, prefix) {
		if (prefix === undefined) {
			prefix = "";
		}

		var result = [];
		for (var i in object) {
			if (typeof object[i] === "object" && object[i] !== null) {
				result = result.concat(getNestedPropertyNames(object[i], prefix + i + "."));
			} else {
				result.push(prefix + i);
			}
		}
		return result;
	}

	function setNestedProperty(object, property, value) {
		var parts = property.split(".");
		var current = object;
		for (var i = 0; i < parts.length - 1; i++) {
			if (current[parts[i]] === undefined) {
				current[parts[i]] = {};
			}
			current = current[parts[i]];
		}
		current[parts[parts.length - 1]] = value;
	}

	/** Helper function to get the value of an <option> tag. IE doesn't set the value if there isn't one in the DOM. */
	function inputOptionValue(option) {
		var optionValue = option.value;
		if (!optionValue) {
			optionValue = option.text;
		}
		return optionValue;
	}

	function evaluateExpression(func, snapshot) {
		return func({
			"get": function(name) {
				return getNestedProperty(snapshot, name);
			}
		});
	}

	function evaluateStatement(func, scope) {
		return func({
			"get": function(name) {
				return scope.$.get(name);
			},
			"set": function(name, value) {
				return scope.$.set(name, value);
			}
		});
	}

	/**
	  * Default options for Consistent.js. This includes the "$" key which contains the functionality used to apply
	  * the scope to the DOM.
	  */
	Consistent.defaultOptions = {

		templateEngine: null,
		autoListenToChange: true,
		autoListenToKeyEvents: true,
		eventHandlerPrefix: "",
		valueFunctionPrefix: "",

		$: {
			getNodeOptions: function(node, options) {
				return Consistent.getNodeOptions(node, options);
			},

			/** Apply the given snapshot to the given dom object */
			apply: function(dom, snapshot, options) {
				var name, value, i;
				var bindings = options.bindings;

				/* Select options */
				if (bindings.selectOptions) {
					/* This must come before the setValue, as the select's options need to be setup before
					 * its value can be set.
					 */
					value = getNestedProperty(snapshot, bindings.selectOptions);
					if (value !== undefined) {
						if (!value) {
							value = [];
						}
						var selectedValue = dom.selectedIndex !== -1 ? inputOptionValue(dom.options[dom.selectedIndex]) : undefined;
						dom.length = value.length;
						for (i = 0; i < value.length; i++) {
							var newOption;
							if (typeof value[i] === "object") {
								var optionText = value[i].text;
								var optionValue = value[i].value;
								newOption = new Option(optionText !== undefined ? optionText : "",
									optionValue !== undefined ? optionValue : "",
									false, optionValue == selectedValue);
								if (value[i].label !== undefined) {
									newOption.label = value[i].label;
								}
								if (value[i].disabled !== undefined) {
									newOption.disabled = !!value[i].disabled;
								}
							} else {
								newOption = new Option(value[i], value[i], false, value[i] == selectedValue);
							}
							dom.options[i] = newOption;
						}
					}
				}

				/* Value */
				if (bindings.key) {
					/* Key */
					value = getPropertyOrEvaluateExpression(bindings.key);
					if (value !== undefined) {
						this.setValue(dom, value);
					}
				} else if (bindings.template !== undefined && bindings.template !== null) {
					/* Template - note that "" is a valid template, so we have to use this longer check in the if condition */
					this.setValue(dom, bindings.template.render(snapshot));
				}

				/* Attributes */
				if (bindings.attributes) {
					var attrs = bindings.attributes;
					for (i = 0; i < attrs.length; i++) {
						if (attrs[i].key !== undefined) {
							value = getPropertyOrEvaluateExpression(attrs[i].key);
						} else if (attrs[i].template !== undefined) {
							value = attrs[i].template.render(snapshot);
						} else {
							value = null;
						}

						if (value !== undefined) {
							this.setAttributeValue(dom, attrs[i].name, value);
						}
					}
				}
				if (bindings.allAttributes) {
					value = getNestedProperty(snapshot, bindings.allAttributes);
					for (name in value) {
						if (value[name] !== undefined) {
							value = value[name];
							/* class is a reserved word in IE so we accept className in the attributes object. */
							if (name === "className") {
								name = "class";
							}
							this.setAttributeValue(dom, name, value);
						}
					}
				}
				if (bindings.classAttribute) {
					value = getPropertyOrEvaluateExpression(bindings.classAttribute);
					if (value !== undefined) {
						if (isArray(value)) {
							value = value.join(" ");
						}
						this.setAttributeValue(dom, "class", value);
					}
				}
				if (bindings.classAddAttribute) {
					value = getPropertyOrEvaluateExpression(bindings.classAddAttribute);
					if (value !== undefined)  {
						this.addRemoveClasses(dom, value);
					}
				}

				/* Properties */
				if (bindings.properties) {
					var props = bindings.properties;
					for (i = 0; i < props.length; i++) {
						value = getPropertyOrEvaluateExpression(props[i].key);
						if (value !== undefined) {
							this.setPropertyValue(dom, props[i].name, value);
						}
					}
				}
				if (bindings.allProperties) {
					value = getNestedProperty(snapshot, bindings.allProperties);
					var names = getNestedPropertyNames(value);
					for (i = 0; i < names.length; i++) {
						var propertyValue = getNestedProperty(value, names[i]);
						if (propertyValue !== undefined) {
							this.setPropertyValue(dom, names[i], propertyValue);
						}
					}
				}

				/* Visibility */
				if (bindings.show) {
					value = getPropertyOrEvaluateExpression(bindings.show);
					if (value !== undefined) {
						if (value) {
							this.show(dom);
						} else {
							this.hide(dom);
						}
					}
				}
				if (bindings.hide) {
					value = getPropertyOrEvaluateExpression(bindings.hide);
					if (value !== undefined) {
						if (!value) {
							this.show(dom);
						} else {
							this.hide(dom);
						}
					}
				}

				/* Enabled / disabled */
				if (bindings.enabled) {
					value = getPropertyOrEvaluateExpression(bindings.enabled);
					if (value !== undefined) {
						this.setPropertyValue(dom, "disabled", !value);
					}
				}
				if (bindings.disabled) {
					value = getPropertyOrEvaluateExpression(bindings.disabled);
					if (value !== undefined) {
						this.setPropertyValue(dom, "disabled", !!value);
					}
				}

				/* Read only */
				if (bindings.readOnly) {
					value = getPropertyOrEvaluateExpression(bindings.readOnly);
					if (value !== undefined) {
						this.setPropertyValue(dom, "readOnly", !!value);
					}
				}
				if (bindings.readWrite) {
					value = getPropertyOrEvaluateExpression(bindings.readWrite);
					if (value !== undefined) {
						this.setPropertyValue(dom, "readOnly", !value);
					}
				}

				function getPropertyOrEvaluateExpression(propertyOrExpression) {
					if (typeof propertyOrExpression === "function") {
						return evaluateExpression(propertyOrExpression, snapshot);
					} else {
						return getNestedProperty(snapshot, propertyOrExpression);
					}
				}
			},

			/** Called after apply has completed on the given scope.
			 */
			afterApply: function(scope, snapshot) {

			},

			/** Set the given value in the given dom object.
			  */
			setValue: function(dom, value) {
				var currentValue = this.getValue(dom);
				if (currentValue === value) {
					return;
				}

				var nodeName = dom.nodeName;
				if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
					if (dom.type === "checkbox") {
						/* defaultChecked is set as well, as in IE 6 when moving elements in the DOM (such as in the repeat functionality)
						 * the checked property gets reset.
						 */
						if (isArray(value)) {
							dom.checked = dom.defaultChecked = (arrayIndexOf(value, dom.value) !== -1);
						} else if (typeof value === "boolean") {
							dom.checked = dom.defaultChecked = value;
						} else {
							dom.checked = dom.defaultChecked = (value == dom.value);
						}
					} else if (dom.type === "radio") {
						dom.checked = dom.defaultChecked = (value == dom.value);
					} else {
						if (value === null) {
							/* These elements change null into empty string on modern browsers 
							 * and leave it as null on IE. Standardise on setting "".
							 */
							value = "";
						}
						dom.value = value;
					}
				} else if (nodeName === "SELECT") {
					if (value === null) {
						value = "";
					}

					var i;
					if (isArray(value)) {
						for (i = 0; i < dom.options.length; i++) {
							dom.options[i].selected = (arrayIndexOf(value, inputOptionValue(dom.options[i])) !== -1);
						}
					} else {
						for (i = 0; i < dom.options.length; i++) {
							if (inputOptionValue(dom.options[i]) == value) {
								dom.selectedIndex = i;
								return;
							}
						}

						/* Nothing matched so deselect */
						dom.selectedIndex = -1;
					}
				} else if (nodeName === "IMG") {
					dom.src = value;
				} else {
					dom.innerHTML = value;
				}
			},

			setAttributeValue: function(dom, name, value) {
				name = mungeBadAttributeProperty(name);
				if (value) {
					dom.setAttribute(name, value);
				} else {
					dom.removeAttribute(name);
				}
			},

			setPropertyValue: function(dom, name, value) {
				setNestedProperty(dom, name, value);
			},

			/** Update the given scope with the given dom object */
			update: function(dom, scope, options) {
				var value, i;
				var bindings = options.bindings;

				/* Select options */
				if (updatableBinding(bindings.selectOptions)) {
					var selectOptions = dom.options;
					value = [];
					for (i = 0; i < selectOptions.length; i++) {
						var option = selectOptions[i];
						value.push({
							"text": option.text,
							"value": option.value,
							"label": option.label,
							"disabled": option.disabled
						});
					}
					scope.$.set(bindings.selectOptions, value);
				}

				/* Value */
				if (updatableBinding(bindings.key)) {
					value = this.getValue(dom);
					if (value !== undefined) {
						if (dom.nodeName === "INPUT" && dom.type === "checkbox") {
							/* Special checkbox support */
							var scopeValue = scope.$.get(bindings.key);
							if (isArray(scopeValue)) {
								i = arrayIndexOf(scopeValue, dom.value);
								if (value) {
									if (i === -1) {
										scopeValue.push(dom.value);
									}
								} else {
									if (i !== -1) {
										scopeValue.splice(i, 1);
									}
								}
							} else if (dom.value !== "on" && (scopeValue === undefined || scopeValue === null)) {
								/* If there's nothing in the scope for the checkbox, and it doesn't have the
								 * default value of "on" then we put it in as the dom.value.
								 * This will be graduated to an array later if another checkbox is set.
								 */
								if (value) {
									scope.$.set(bindings.key, dom.value);
								}
							} else if (typeof scopeValue === "boolean" || dom.value === "on") {
								/* If the scope already contains a boolean, or this checkbox has a
								 * default value of "on" then we put a boolean into the scope.
								 */
								scope.$.set(bindings.key, value);
							} else if (value && scopeValue !== dom.value) {
								/* If the scope already contains a scalar value, and it's not the same as
								 * our checkbox's value, then graduate to an array in the scope.
								 */
								scope.$.set(bindings.key, [ scopeValue, dom.value ]);
							}
						} else {
							scope.$.set(bindings.key, value);
						}
					}
				}

				/* Attributes */
				if (updatableBinding(bindings.attributes)) {
					var attrs = bindings.attributes;
					for (i = 0; i < attrs.length; i++) {
						if (attrs[i].key !== undefined) {
							value = this.getAttributeValue(dom, attrs[i].name);
							scope.$.set(attrs[i].key, value);
						}
					}
				}
				if (updatableBinding(bindings.allAttributes)) {
					value = scope.$.get(bindings.allAttributes);
					if (value !== undefined) {
						for (i in value) {
							value[i] = this.getAttributeValue(dom, i);
						}
						scope.$.set(bindings.allAttributes, value);
					}
				}
				if (updatableBinding(bindings.classAttribute)) {
					value = this.getAttributeValue(dom, "class");
					if (isArray(scope.$.get(bindings.classAttribute))) {
						/* Convert to array */
						value = value.split(" ");
					} 
					scope.$.set(bindings.classAttribute, value);
				}

				/* Properties */
				if (updatableBinding(bindings.properties)) {
					var props = bindings.properties;
					for (i = 0; i < props.length; i++) {
						value = this.getPropertyValue(dom, props[i].name);
						scope.$.set(props[i].key, value);
					}
				}
				if (updatableBinding(bindings.allProperties)) {
					value = scope.$.get(bindings.allProperties);
					if (value !== undefined) {
						var names = getNestedPropertyNames(value);
						for (i = 0; i < names.length; i++) {
							setNestedProperty(value, names[i], this.getPropertyValue(dom, names[i]));
						}
						scope.$.set(bindings.allProperties, value);
					}
				}

				/* Visibility */
				if (updatableBinding(bindings.show)) {
					value = this.isShowing(dom);
					scope.$.set(bindings.show, value);
				}
				if (updatableBinding(bindings.hide)) {
					value = this.isShowing(dom);
					scope.$.set(bindings.hide, !value);
				}

				/* Enabled / disabled */
				if (updatableBinding(bindings.enabled)) {
					value = this.getPropertyValue(dom, "disabled");
					scope.$.set(bindings.enabled, !value);
				}
				if (updatableBinding(bindings.disabled)) {
					value = this.getPropertyValue(dom, "disabled");
					scope.$.set(bindings.disabled, value);
				}

				/* Read only */
				if (updatableBinding(bindings.readOnly)) {
					value = this.getPropertyValue(dom, "readOnly");
					scope.$.set(bindings.readOnly, value);
				}
				if (updatableBinding(bindings.readWrite)) {
					value = this.getPropertyValue(dom, "readOnly");
					scope.$.set(bindings.readWrite, !value);
				}

				function updatableBinding(binding) {
					/* Check if the given binding exists, and is not a function.
					 * If it's a function, it's an expression. We cannot update
					 * the scope from the DOM through a function as we do not
					 * have a way to invert functions.
					 */
					return (binding && typeof binding !== "function");
				}
			},

			/** Get the current value from the given dom object */
			getValue: function(dom) {
				var nodeName = dom.nodeName;
				if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
					if (dom.type === "checkbox") {
						return dom.checked;
					} else if (dom.type === "radio") {
						/* Returning undefined means don't change the value in the scope */
						return dom.checked ? dom.value : undefined;
					} else {
						return dom.value;
					}
				} else if (nodeName === "SELECT") {
					if (dom.multiple) {
						var values = [];
						for (var i = 0; i < dom.options.length; i++) {
							if (dom.options[i].selected) {
								values.push(inputOptionValue(dom.options[i]));
							}
						}
						return values;
					} else if (dom.selectedIndex !== -1) {
						return inputOptionValue(dom.options[dom.selectedIndex]);
					} else {
						return undefined;
					}
				} else if (nodeName === "IMG") {
					return dom.src;
				} else {
					return dom.innerHTML;
				}
			},

			getAttributeValue: function(dom, name) {
				name = mungeBadAttributeProperty(name);
				return dom.getAttribute(name);
			},

			getPropertyValue: function(dom, name) {
				return getNestedProperty(dom, name);
			},

			addRemoveClasses: function(dom, classesStringOrArray) {
				var newClasses = classesStringOrArrayToArray(classesStringOrArray);
				var existingClasses = classesStringOrArrayToArray(this.getAttributeValue(dom, "class"));
				var addedClasses = dom[Consistent.settings.addedClassesKey];
				if (!addedClasses) {
					addedClasses = [];
					dom[Consistent.settings.addedClassesKey] = addedClasses;
				}

				var i, j, k;
				/* Find classes we've added previously that are not in the new array of classes,
				 * and remove them.
				 */
				for (i = 0; i < addedClasses.length; i++) {
					j = arrayIndexOf(newClasses, addedClasses[i]);
					if (j === -1) {
						/* No longer in list of classes, so remove */
						k = arrayIndexOf(existingClasses, addedClasses[i]);
						if (k !== -1) {
							existingClasses.splice(k, 1);
						}
						addedClasses.splice(i, 1);
						i--;
					}
				}

				/* Find new classes to add */
				for (i = 0; i < newClasses.length; i++) {
					var newClass = newClasses[i];
					j = arrayIndexOf(addedClasses, newClass);
					if (j === -1) {
						/* New class to add */
						k = arrayIndexOf(existingClasses, newClass);
						if (k === -1) {
							/* Not existing */
							existingClasses.push(newClass);
							addedClasses.push(newClass);
						}
					}
				}

				this.setAttributeValue(dom, "class", existingClasses.join(" "));

				function classesStringOrArrayToArray(ob) {
					if (ob === null || !ob) {
						/* Nulls and empty strings mean no classes, as splitting an
						 * empty string returns one element in the array, an empty string.
						 */
						return [];
					} else if (typeof ob === "string") {
						return ob.split(" ");
					} else if (isArray(ob)) {
						return ob;
					} else {
						throw exception("Unsupported value for add class: " + typeof ob);
					}
				}
			},

			show: function(dom) {
				if (dom.style.display !== "none") {
					return;
				}

				var restore = dom[Consistent.settings.oldDisplayKey];
				if (restore === undefined) {
					restore = "";
				}
				dom.style.display = restore;
			},

			hide: function(dom) {
				if (dom.style.display === "none") {
					return;
				}

				dom[Consistent.settings.oldDisplayKey] = dom.style.display;
				dom.style.display = "none";
			},

			isShowing: function(dom) {
				return (dom.style.display !== "none");
			},

			/** Called after the given node has been added to the DOM. */
			added: function(dom) {

			},

			/** Called to remove the given node from the DOM. */
			remove: function(dom) {
				dom.parentNode.removeChild(dom);
			}

		}

	};

	/** Default get node options function. This extends the provided options with options derived from the dom node such as
	  * in data attributes. This function may be overriden to implement a custom way to discover options from a dom node.
	  * @param options The options given when the scope's bind method was called and the scope's own options.
	  * @return The merged options based on options discovered from the dom and the given options.
	  */
	Consistent.getNodeOptions = Consistent.defaultGetNodeOptions = function(dom, options) {
		var result = mergeOptions({ bindings: {} }, options);
		var bindings = result.bindings;

		var nodeName = dom.nodeName;
		if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT") {
			if (bindings.key === undefined) {
				/* Default key for input and textarea elements */
				bindings.key = dom.getAttribute("name");
			}
		}

		var settings = Consistent.settings;
		var attrs = dom.attributes;
		if (attrs === undefined) {
			throw exception("Unexpected object, expected DOM node: " + dom);
		}
		for (var i = 0; i < attrs.length; i++) {
			var name = attrs[i].name;

			var matched = findDeclarationAttribute(name);
			if (matched) {
				var value = trim(attrs[i].value);
				if (!value && (matched.name !== "noBind")) {
					/* If the value is empty and the match doesn't support that,
					 * then ignore this declaration.
					 */
					continue;
				}

				switch (matched.name) {
					case "key": {
						/* Body */
						bindings.key = propertyNameOrExpression(value);
						break;
					}
					case "attributePrefix": {
						/* Attribute */
						addAttribute(matched.suffix, propertyNameOrExpression(value));
						break;
					}
					case "attributes": {
						/* Attributes */
						bindings.allAttributes = value;
						break;
					}
					case "template": {
						/* Template */
						assertTemplateEngine();
						bindings.template = options.templateEngine.compile(value);
						break;
					}
					case "templateId": {
						/* Template by id */
						assertTemplateEngine();
						bindings.template = options.templateEngine.compile(templateById(value));
						break;
					}
					case "templateAttributePrefix": {
						/* Attribute template */
						assertTemplateEngine();
						addAttributeTemplate(matched.suffix, options.templateEngine.compile(value));
						break;
					}
					case "templateIdAttributePrefix": {
						/* Attribute template by id */
						assertTemplateEngine();
						addAttributeTemplate(matched.suffix, options.templateEngine.compile(templateById(value)));
						break;
					}
					case "propertyPrefix": {
						/* Property */
						addProperty(matched.suffix.replace(/-/g, "."), propertyNameOrExpression(value));
						break;
					}
					case "properties": {
						bindings.allProperties = value;
						break;
					}
					case "on": {
						/* Bind default event */
						addEvent(defaultEventName(dom), handlerNameOrStatement(value));
						break;
					}
					case "onPrefix": {
						/* Bind events */
						addEvent(matched.suffix.toLowerCase(), handlerNameOrStatement(value));
						break;
					}
					case "show": {
						/* Show */
						bindings.show = propertyNameOrExpression(value);
						break;
					}
					case "hide": {
						/* Hide */
						bindings.hide = propertyNameOrExpression(value);
						break;
					}
					case "repeat": {
						/* Repeat */
						bindings.repeat = value;
						break;
					}
					case "repeatContainerId": {
						/* Repeat container id */
						bindings.repeatContainerId = value;
						break;
					}
					case "enabled": {
						/* Enabled */
						bindings.enabled = propertyNameOrExpression(value);
						break;
					}
					case "disabled": {
						/* Disabled */
						bindings.disabled = propertyNameOrExpression(value);
						break;
					}
					case "readOnly": {
						/* Read Only */
						bindings.readOnly = propertyNameOrExpression(value);
						break;
					}
					case "readWrite": {
						/* Read Write */
						bindings.readWrite = propertyNameOrExpression(value);
						break;
					}
					case "options": {
						/* Select options */
						bindings.selectOptions = value;
						break;
					}
					case "classAttribute": {
						bindings.classAttribute = propertyNameOrExpression(value);
						break;
					}
					case "classAddAttribute": {
						bindings.classAddAttribute = propertyNameOrExpression(value);
						break;
					}
					case "noBind": {
						bindings.noBind = (!value || value === "true");
						break;
					}
					case "scope": 
					case "init":
					case "initFunc":
					case "controller": {
						/* NOOP, this is used in autoCreateScopes */
						break;
					}
					case "warningPrefix": {
						/* Catch all at the end. Catches any attributes that look like they're for Consistent, but
						 * weren't recognized. Log these out to help developers catch errors.
						 */
						if (typeof console !== "undefined" && console.log !== undefined) {
							console.log("Warning: Unrecognised Consistent attribute \"" + name + "\" on " + dom.nodeName + " element.");
						}
						break;
					}
					default: {
						/* In the future this can be used for custom attributes, as the developer has added a key
						 * into the settings.attributes.
						 */
						throw exception("Unhandled consistent declaration attribute: " + name);
					}
				}
			}
		}

		function findDeclarationAttribute(name) {
			for (var declAttr in settings.attributes) {
				var attributes = settings.attributes[declAttr];
				var i;
				var foundPrefix = declAttr.lastIndexOf("Prefix");
				if (foundPrefix !== -1 && foundPrefix === declAttr.length - "Prefix".length) {
					if (isArray(attributes)) {
						for (i = 0; i < attributes.length; i++) {
							if (name.indexOf(attributes[i]) === 0) {
								return { name: declAttr, suffix: name.substring(attributes[i].length) };
							}
						}
					} else if (name.indexOf(attributes) === 0) {
						return { name: declAttr, suffix: name.substring(attributes.length) };
					}
				} else {
					if (isArray(attributes)) {
						for (i = 0; i < attributes.length; i++) {
							if (name === attributes[i]) {
								return { name: declAttr };
							}
						}
					} else if (name === attributes) {
						return { name: declAttr };
					}
				}
			}

			return false;
		}

		function assertTemplateEngine() {
			if (!options.templateEngine) {
				throw exception("templateEngine not configured in options");
			}
		}

		function templateById(templateId) {
			var templateElement = document.getElementById(templateId);
			if (templateElement !== null) {
				return templateElement.innerHTML;
			} else {
				throw exception("Template not found with id: " + templateId);
			}
		}

		function prepareAttributes() {
			if (bindings.attributes === undefined) {
				bindings.attributes = [];
			}
		}

		function addAttribute(name, key) {
			prepareAttributes();

			bindings.attributes.push({
				"name": name,
				"key": key
			});
		}

		function addAttributeTemplate(name, template) {
			prepareAttributes();
			bindings.attributes.push({
				"name": name,
				"template": template
			});
		}

		function addProperty(name, key) {
			if (bindings.properties === undefined) {
				bindings.properties = [];
			}

			bindings.properties.push({
				"name": name,
				"key": key
			});
		}

		function addEvent(eventName, eventHandlerKey) {
			if (bindings.events === undefined) {
				bindings.events = {};
			}
			if (bindings.events[eventName] === undefined) {
				bindings.events[eventName] = { keys: [] };
			}
			bindings.events[eventName].keys.push(eventHandlerKey);
		}

		function defaultEventName(dom) {
			var nodeName = dom.nodeName;
			if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT") {
				return "change";
			} else if (nodeName === "FORM") {
				return "submit";
			} else {
				return "click";
			}
		}

		function trim(str) {
			return str.replace(/^\s*(.*)\s*$/, "$1");
		}

		function isPropertyName(str) {
			return str.match(/^[a-zA-Z_$][a-zA-Z_$0-9\.]*$/);
		}

		function propertyNameOrExpression(value) {
			/* Determine whether this is a plain property name or an expression */
			if (isPropertyName(value)) {
				return value;
			} else {
				return Consistent.expressionToFunction(value);
			}
		}

		function handlerNameOrStatement(value) {
			/* Determine whether this is a plain property name or a statement */
			if (isPropertyName(value)) {
				return value;
			} else {
				return Consistent.statementToFunction(value);
			}
		}

		return result;
	};


	/* Scope */

	/**
	 * Evaluate value functions. Recursive to handle nested objects in the scope.
	 */
	function processSnapshot(snapshot, baseScope, scope, seen) {
		if (seen === undefined) {
			seen = [];
		}
		if (arrayIndexOf(seen, snapshot) !== -1) {
			return true;
		}
		seen.push(snapshot);

		var options = scope.$.options();
		var valueFunctionPrefix = options.valueFunctionPrefix;
		var propertyName;

		var skip = [];
		var invalid = 0;
		for (var name in snapshot) {
			if (arrayIndexOf(skip, name) !== -1) {
				continue;
			}

			var value = snapshot[name];

			if (typeof value === "function") {
				/* Evaluate value functions */
				if (!valueFunctionPrefix) {
					snapshot[name] = value.call(scope, baseScope);
				} else if (name.indexOf(valueFunctionPrefix) === 0) {
					propertyName = propertyNameFromPrefixed(name, valueFunctionPrefix);
					snapshot[propertyName] = value.call(scope, baseScope);

					/* Delete the original value function */
					delete snapshot[name];

					if (propertyName !== name) {
						/* Skip the new property if we encounter it in this loop, which
						 * can happen in IE6, maybe other browsers.
						 */
						skip.push(propertyName);
					}
				}
			} else if (typeof value === "object" && value !== null) {
				if (Consistent.isScope(value)) {
					/* The snapshot contains a scope. We create a snapshot of the scope to go in our snapshot.
					 * But only if the base scope is the owner of this snapshot. If we've come from a child scope
					 * then we blank these out to prevent child scopes getting themselves in their snapshot.
					 * See snapshotSpec.js's Snapshot with nested scopes with value functions that respond to scope
					 * test.
					 */
					if (baseScope === scope) {
						/* Note that even though "value" is a copy of the original scope, created by the deep merge
						 * in the snapshot function, when we call value.$.snapshot(), the snapshot function gets the
						 * scope by calling its _scope(), which returns the original. So we will be executing any
						 * value functions with the original scope.
						 */
						snapshot[name] = value.$.snapshot();
					} else {
						delete snapshot[name];
						invalid++;
					}
				} else {
					/* Go deep recursively processing snapshot */
					var keep = processSnapshot(value, baseScope, scope, seen);
					if (!keep) {
						delete snapshot[name];
					}
				}
			}
		}

		if (invalid > 0 && isArray(snapshot) && invalid === snapshot.length) {
			/* If snapshot is an array and we've declared all of its contents invalid, then
			 * we remove the whole array from the snapshot.
			 */
			return false;
		}
		return true;
	}

	Consistent.defaultEmptyScope = {
		$: {
			_type: SCOPE_TYPE,

			/* Function returning the root of the scope */
			_scope: null,

			/* Function returning the controller */
			_controller: null,

			/* Function returning the manager */
			_manager: null,

			/* The index of this scope in a repeating section */
			index: undefined,

			apply: function(options, func, includeChildren) {
				if (typeof options === "function") {
					if (typeof func === "boolean") {
						includeChildren = func;
						func = undefined;
					}
					func = options;
					options = undefined;
				} else if (typeof options === "boolean") {
					includeChildren = options;
					options = undefined;
				} else if (typeof func === "boolean") {
					includeChildren = func;
					func = undefined;
				}

				var scope = this._scope();
				if (func !== undefined) {
					func.call(scope, options, includeChildren);
				}

				this._manager().apply(options, includeChildren);
				return scope;
			},
			applyLater: function(options, func, includeChildren) {
				if (typeof options === "function") {
					if (typeof func === "boolean") {
						includeChildren = func;
						func = undefined;
					}
					func = options;
					options = undefined;
				} else if (typeof options === "boolean") {
					includeChildren = options;
					options = undefined;
				} else if (typeof func === "boolean") {
					includeChildren = func;
					func = undefined;
				}

				var scope = this._scope();
				if (func !== undefined) {
					func.call(scope, options, includeChildren);
				}

				window.clearTimeout(this._applyLaterTimeout);
				this._applyLaterTimeout = window.setTimeout(function() {
					scope.$.apply(options, includeChildren);
				}, 0);
				return scope;
			},
			needsApply: function() {
				return this._manager().needsApply();
			},
			update: function(dom, includeChildren) {
				this._manager().update(dom, includeChildren);
				return this._scope();
			},
			bind: function(dom, options) {
				this._manager().bind(dom, options);
				return this._scope();
			},
			unbind: function(dom) {
				this._manager().unbind(dom);
				return this._scope();
			},
			merge: function(object, keys) {
				var scope = this._scope();
				var temp;
				if (typeof object === "boolean") {
					/* merge(boolean, object) 
					 * Note below that "object" is the boolean, and "keys" is the object supplied to be merged into us.
					 * We need to do our first merge to remove any "$" property from the incoming object, and we
					 * must do that deep, if this merge is deep, so that we preserve any cyclic structures etc.
					 */
					temp = merge(object, {}, keys);
					delete temp.$;
					return merge(object, scope, temp);
				} else if (keys === undefined) {
					/* merge(object) */
					temp = merge({}, object);
					delete temp.$;
					return merge(scope, temp);
				} else if (isArray(keys)) {
					/* merge(object, keys) */
					for (var i = 0; i < keys.length; i++) {
						setNestedProperty(scope, keys[i], getNestedProperty(object, keys[i]));
					}
					return scope;
				} else if (typeof keys !== "object") {
					/* merge(object, key) */
					setNestedProperty(scope, keys, getNestedProperty(object, keys));
					return scope;
				} else {
					throw exception("Invalid keys argument to merge: " + keys);
				}
			},
			clear: function() {
				var scope = this._scope();
				for (var i in scope) {
					if (i !== "$") {
						delete scope[i];
					}
				}
			},

			scope: function(newScope) {
				if (newScope === undefined) {
					return this._scope();
				} else if (typeof newScope === "object") {
					return this._manager().replaceScope(newScope);
				} else {
					throw exception("Invalid argument type to scope(newScope): " + typeof newScope);
				}
			},

			controller: function(newControllerOrFunctionName) {
				if (newControllerOrFunctionName === undefined) {
					/* controller() - returns the controller */
					return this._controller();
				} else if (typeof newControllerOrFunctionName === "object") {
					/* controller(object) - sets the controller */
					this._manager().replaceController(newControllerOrFunctionName);
					return this._scope();
				} else if (typeof newControllerOrFunctionName === "string") {
					/* controller(string) - gets or sets a function in the controller */
					var name = addPrefixToPropertyName(newControllerOrFunctionName, this.options().eventHandlerPrefix);
					var funcOrIncludeParents = arguments[1];

					if (typeof funcOrIncludeParents === "function") {
						/* controller(string, function) - sets a function in the controller */
						setNestedProperty(this._controller(), name, funcOrIncludeParents);
						return this._scope();
					} else {
						/* controller(string [, boolean]) - gets a function from the controller, with optional include parents */
						var includeParents = true;
						if (typeof funcOrIncludeParents === "boolean") {
							includeParents = funcOrIncludeParents;
						} else if (funcOrIncludeParents !== undefined) {
							throw exception("Invalid argument type for get or set controller function: " + typeof func);
						}

						var controller = this._controller();
						var value = getNestedProperty(controller, name);
						if (value !== undefined) {
							if (typeof value === "function") {
								return function() {
									return value.apply(controller, arguments);
								};
							} else {
								return value;
							}
						} else if (includeParents && this.parent()) {
							return this.parent().$.controller(newControllerOrFunctionName);
						} else {
							return undefined;
						}
					}
				} else {
					throw exception("Invalid argument type for controller(): " + typeof newController);
				}
			},

			/**
			 * Return a plain object with a snapshot of the values from the scope, excluding the $ object
			 * that contains Consistent functionality, and replacing any value functions with their current value.
			 * If there is a parent scope, the values from that scope are merged in.
			 * @param includeParents If false, only include the local scope in the snapshot
			 * @param childScope internal use
			 */
			snapshot: function(includeParents, childScope) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw exception("Invalid argument type for includeParents: " + typeof includeParents);
				}

				var scope = this._scope();
				var temp = merge(true, {}, scope);
				delete temp.$;

				processSnapshot(temp, childScope !== undefined ? childScope : scope, scope);

				if (includeParents !== false && this.parent()) {
					temp = merge(this.parent().$.snapshot(includeParents, childScope !== undefined ? childScope : scope), temp);
				}

				return temp;
			},

			nodes: function(includeParents) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw exception("Invalid argument type for includeParents: " + typeof includeParents);
				}

				var result = this._manager()._domNodes;
				if (includeParents !== false) {
					var children = this.children();
					for (var i = 0; i < children.length; i++) {
						result = result.concat(children[i].$.nodes());
					}
				}
				return result;
			},
			roots: function() {
				return this._manager()._rootDomNodes;
			},

			parent: function() {
				var parentScopeManager = this._manager()._parentScopeManager;
				if (parentScopeManager !== null) {
					return parentScopeManager._scope;
				} else {
					return null;
				}
			},
			children: function() {
				var result = [];
				var childScopeManagers = this._manager()._childScopeManagers;
				for (var i = 0; i < childScopeManagers.length; i++) {
					result.push(childScopeManagers[i]._scope);
				}
				return result;
			},
			watch: function(key, handler) {
				this._manager().watch(key, handler);
				return this._scope();
			},
			unwatch: function(key, handler) {
				this._manager().unwatch(key, handler);
				return this._scope();
			},

			get: function(key, includeParents, childScope) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw exception("Invalid argument type for includeParents: " + typeof includeParents);
				}
				if (key === "$" || key.substring(0, 2) === "$.") {
					/* Do not allow access to $ object via get. The $ object is not part
					 * of the model of the scope. This also prevents expression statements
					 * from accessing scope functions.
					 */
					return undefined;
				}

				var valueFunctionPrefix = this.options().valueFunctionPrefix;
				var scope = this._scope();

				var unpresentedKey = unpresentNestedProperty(key);
				var value = getNestedProperty(scope, unpresentedKey);
				if (value !== undefined) {
					if (!valueFunctionPrefix && typeof value === "function") {
						return value.call(scope, childScope !== undefined ? childScope : scope);
					} else {
						return value;
					}
				} else {
					var prefixedPropertyName;
					if (valueFunctionPrefix) {
						prefixedPropertyName = addPrefixToPropertyName(unpresentedKey, valueFunctionPrefix);
						value = getNestedProperty(scope, prefixedPropertyName);
						if (typeof value === "function") {
							return value.call(scope, scope);
						}
					}
				}
				
				if (includeParents !== false && this.parent()) {
					return this.parent().$.get(key, includeParents, childScope !== undefined ? childScope : scope);
				} else {
					return undefined;
				}
			},
			set: function(key, value) {
				var scope = this._scope();
				var current = getNestedProperty(scope, key);

				if (typeof current === "undefined") {
					/* If nothing with this name is defined in this scope we look for 
					 * a value function that we should call to set this value.
					 * This also searches parent scopes looking for value functions
					 * as that function is inherited by this scope, so when setting
					 * we need to find it - otherwise we'll create a new value in the
					 * local scope that will override it.
					 */
					var valueFunction = this.getValueFunction(key);
					if (valueFunction !== undefined) {
						/* Note that we do not need to set this, as getValueFunction forces this to be bound
						 * to the declaring scope.
						 */
						valueFunction.call(null, scope, value);
						return scope;
					}
				}

				/* Set value in the local scope */
				if (typeof current !== "function") {
					setNestedProperty(scope, key, value);
				} else if (!this.options().valueFunctionPrefix) {
					/* Value function - note we must set this as we are calling it directly */
					current.call(scope, scope, value);
				} else {
					/* Overwrite the function with a scalar value. It is not valid to reference value functions
					 * by their name including prefix, as the snapshot does not contain values like that
					 */
					setNestedProperty(scope, key, value);
				}
				return scope;
			},

			fire: function(name) {
				var func = this.controller(name);
				var scope = this._scope();
				if (func !== undefined) {
					/* Call the function, note that "this" is forced to be the controller by the controller()
					 * implementation.
					 */
					var newArguments = [ scope ].concat(Array.prototype.slice.call(arguments, 1));
					return func.apply(null, newArguments);
				} else {
					return undefined;
				}
			},

			getValueFunction: function(key, includeParents) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw exception("Invalid argument type for includeParents: " + typeof includeParents);
				}

				var scope = this._scope();
				var valueFunctionPrefix = this.options().valueFunctionPrefix;
				if (valueFunctionPrefix && getNestedProperty(scope, key) !== undefined) {
					/* If there is a property which shadows a prefixed value function
					 * we cannot see the value function.
					 */
					return undefined;
				}

				var value = getNestedProperty(scope, addPrefixToPropertyName(key, valueFunctionPrefix));
				if (value !== undefined) {
					if (typeof value === "function") {
						return function() {
							return value.apply(scope, arguments);
						};
					} else {
						return undefined;
					}
				} else if (includeParents !== false && this.parent()) {
					return this.parent().$.getValueFunction(key);
				} else {
					return undefined;
				}
			},
			setValueFunction: function(key, value) {
				key = addPrefixToPropertyName(key, this.options().valueFunctionPrefix);
				var scope = this._scope();
				setNestedProperty(scope, key, value);
				return scope;
			},

			options: function(dom) {
				return this._manager().getOptions(dom);
			},

			evaluate: function(expression) {
				var func = Consistent.expressionToFunction(expression);
				var snapshot = this.snapshot();
				return evaluateExpression(func, snapshot);
			},
			exec: function(statements) {
				var func = Consistent.statementToFunction(statements);
				return evaluateStatement(func, this._scope());
			}
		}
	};

	/**
	 * Some property names require a prefix, and these get added to the final part of the
	 * property name where the parts are separated by dots. If the prefix ends with a letter
	 * then the name will be initial-capped to provide a camel-casing.
	 */
	function addPrefixToPropertyName(name, prefix) {
		if (!prefix) {
			return name;
		}

		var parts = name.split(".");
		var result = "";
		for (var i = 0; i < parts.length - 1; i++) {
			result += parts[i] + ".";
		}
		var lastPart = parts[parts.length - 1];
		if (prefixRequiresNextInitialCap(prefix)) {
			result += prefix + lastPart.substring(0, 1).toUpperCase() + lastPart.substring(1);
		} else {
			result += prefix + lastPart;
		}
		return result;
	}

	function propertyNameFromPrefixed(name, prefix) {
		if (prefix === undefined) {
			return name;
		}
		if (prefixRequiresNextInitialCap(prefix)) {
			var propertyName = name.substring(prefix.length);
			return propertyName.substring(0, 1).toLowerCase() + propertyName.substring(1);
		} else {
			return name.substring(prefix.length);
		}
	}

	function prefixRequiresNextInitialCap(prefix) {
		if (!prefix) {
			return false;
		}
		var c = prefix.charAt(prefix.length - 1);
		return (c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z');
	}

	/**
	 * Compares two objects and returns an array of keys with values that don't match between
	 * the two of them.
	 */
	function differentKeys(aObject, bObject, prefix, depth, result, seen) {
		if (prefix === undefined) {
			prefix = "";
		}
		if (depth === undefined) {
			depth = 0;
		}
		if (result === undefined) {
			result = [];
		}
		if (seen === undefined) {
			seen = [];
		}

		/* Prevent an infinite loop if there is a cycle in the graph */
		if (arrayIndexOf(seen, aObject) !== -1 || arrayIndexOf(seen, bObject) !== -1) {
			return result;
		}
		seen.push(aObject);
		seen.push(bObject);

		if (aObject === bObject) {
			return result;
		}

		var key;
		if (bObject !== null) {
			for (key in aObject) {
				if (aObject[key] !== bObject[key]) {
					if (typeof aObject[key] === "object" && typeof bObject[key] === "object" && aObject[key] && bObject[key]) {
						/* Nested objects */
						differentKeys(aObject[key], bObject[key], prefix + key + ".", depth + 1, result, seen);
					} else {
						result.push(prefix + key);
					}
				}
			}
		} else {
			for (key in aObject) {
				result.push(prefix + key);
			}
		}

		/* Collect anything that exists in bObject but isn't in aObject */
		for (key in bObject) {
			if (aObject === null || aObject[key] === undefined) {
				result.push(prefix + key);
			}
		}

		return result;
	}

	/** Compare two values for equality. For objects it checks for any keys that are different. */
	function isEqual(a, b) {
		var atype = typeof a;
		if (atype !== typeof b) {
			return false;
		}

		if (atype === "function") {
			return a === b;
		} else if (atype === "object") {
			var keys = differentKeys(a, b);
			return keys.length === 0;
		} else {
			return true;
		}
	}

	function removeAttributes(dom, attributes) {
		for (var i = 0; i < attributes.length; i++) {
			dom.removeAttribute(attributes[i]);
		}
	}

	ConsistentScopeManager.prototype = {};

	var scopeId = 0;
	var functionId = 0;
	var WATCH_ALL_KEY = "$all";

	function ConsistentScopeManager(parentScope, options) {
		this._id = "ConsistentScope" + scopeId;
		scopeId++;

		if (options.name) {
			this._name = options.name;
		}

		if (parentScope) {
			this._parentScopeManager = parentScope.$._manager();
			this._parentScopeManager._childScopeManagers.push(this);
		} else {
			this._parentScopeManager = null;
		}
		this._childScopeManagers = [];
		this._options = options;
		this._nodes = [];
		this._domNodes = [];
		this._repeatNodes = [];
		this._rootDomNodes = [];
		this._watchers = {};
		this._nodesDirty = false;
		this._applying = false;
		this._repeatNodeScope = false;

		this._scope = mergeOptions({}, Consistent.defaultEmptyScope);
		this._controller = { "$": this._scope.$ };

		var self = this;
		this._scope.$._manager = function() {
			return self;
		};
		this._scope.$._scope = function() {
			return self._scope;
		};
		this._scope.$._controller = function() {
			return self._controller;
		};

		this._cleanScopeSnapshot = this._scope.$.snapshot();
	}

	/**
	 * Apply the scope to the DOM.
	 */
	ConsistentScopeManager.prototype.apply = function(options, includeChildren) {
		/* Prevent re-entry into apply */
		if (this._applying) {
			return;
		}
		this._applying = true;

		var i, n;

		if (this._updateCleanScopeAndFireWatchers() || this._nodesDirty) {
			/* Apply to the DOM */
			n = this._nodes.length;
			var nodeOptions;
			for (i = 0; i < n; i++) {
				var node = this._nodes[i];
				nodeOptions = options !== undefined ? mergeOptions({}, node.options, options) : node.options;

				nodeOptions.$.apply(node.dom, this._cleanScopeSnapshot, nodeOptions);
			}

			/* Handle repeated nodes */
			n = this._repeatNodes.length;
			for (i = 0; i < n; i++) {
				var repeatData = this._repeatNodes[i];
				nodeOptions = options !== undefined ? mergeOptions({}, repeatData.options, options) : repeatData.options;
				this._handleRepeat(repeatData, nodeOptions, this._cleanScopeSnapshot);
			}

			/* Cascade to children */
			if (includeChildren !== false) {
				/* As we've already set _applying in this scope, each child scope will
				 * attempt to call apply on its parent and we'll return immediately.
				 * So we then come back and apply this scope after all the children are
				 * done.
				 */
				var childScopes = this._scope.$.children();
				for (i = 0, n = childScopes.length; i < n; i++) {
					var childScope = childScopes[i];

					/* Check that the child isn't a repeat node, which is applied
					 * below as part of the normal behaviour.
					 */
					if (childScope.$._manager()._repeatNodeScope) {
						continue;
					}

					childScope.$.apply(true);
				}
			}

			this._nodesDirty = false;

			/* Apply parent scope */
			if (this._parentScopeManager) {
				this._parentScopeManager._scope.$.apply(options);
			}

			var scopeOptions = options !== undefined ? mergeOptions({}, this._options, options) : this._options;
			scopeOptions.$.afterApply(this._scope, this._cleanScopeSnapshot);
		}

		this._applying = false;
	};

	ConsistentScopeManager.prototype._handleRepeat = function(repeatData, options, snapshot) {
		/* Repeat data is an object containing:
		 * {
		 *     domNodes: an array of top-level DOM nodes to use to repeat,
		 *     version: version counter to track deletions,
		 *     insertBefore: the DOM node to insert before,
		 *     items: [
		 *         object: the data object,
		 *         domNodes: an array of top-level DOM nodes created,
		 *         scope: the child scope created,
		 *         version: version counter to track deletions,
		 *		   before: dom node this appears before (or null if it's last)
		 *     ]
		 * }
		 */
		var repeatKey = options.bindings.repeat;
		var i;

		var repeatContext = this._scope.$.get(repeatKey);
		var repeatSnapshot = getNestedProperty(snapshot, repeatKey);

		if (repeatSnapshot === undefined) {
			/* Do nothing */
			return;
		}

		/* Sanity check */
		if (typeof repeatSnapshot !== "object") {
			throw exception("Repeat for key \"" + repeatKey +
				"\" is not an object in the scope, found " + typeof repeatSnapshot);
		}

		/* Find new and old objects in repeatContext */
		repeatData.version++;

		var version = repeatData.version;
		var insertBefore = repeatData.insertBefore;
		var insertInside = insertBefore.parentNode;
		var previousNode = null;
		var item;
		var currentActiveElement = document.activeElement;
		var needToRestoreFocus = false;

		for (i = repeatContext.length - 1; i >= 0; i--) {
			var object = repeatContext[i];
			item = findRepeatItemForObject(object);

			var wasNew = false;
			if (item === undefined) {
				/* New object */
				var domNodes = newDomNodes();

				var childScope = Consistent(this._scope, this._options);
				childScope.$._manager()._repeatNodeScope = true;
				childScope.$.bind(domNodes);
				childScope = childScope.$.scope(object);

				item = {
					object: object,
					domNodes: domNodes,
					scope: childScope,
					version: version
				};
				repeatData.items.push(item);
				wasNew = true;
			} else {
				item.version = version;
			}

			var lastNode = item.domNodes[item.domNodes.length - 1];
			if (wasNew || lastNode.nextSibling !== insertBefore) {
				insertDomNodesBefore(item.domNodes, insertBefore, insertInside);
			}
		
			if (wasNew) {
				for (var j = 0; j < item.domNodes.length; j++) {
					options.$.added(item.domNodes[j]);
				}
			}

			item.before = insertBefore;
			previousNode = insertBefore = item.domNodes[0];

			item.scope.$.index = i;
			item.scope.$.apply();
		}

		/* Find deleted objects */
		var nodesToRemove = [];
		for (i = repeatData.items.length - 1; i >= 0; i--) {
			item = repeatData.items[i];
			if (item.version !== version) {
				/* Maintain the position of this node in the DOM in case we animated
				 * the removal.
				 */
				insertDomNodesBefore(item.domNodes, item.before, insertInside);
				
				item.scope.$.unbind(item.domNodes);
				/* We queue the objects to remove them from the DOM after this loop
				 * as we reposition the nodes relative to each other in this loop.
				 */
				nodesToRemove = nodesToRemove.concat(item.domNodes);
				repeatData.items.splice(i, 1);

				item.scope.$.index = undefined;
			}
		}
		if (nodesToRemove.length) {
			for (i = nodesToRemove.length - 1; i >= 0; i--) {
				options.$.remove(nodesToRemove[i]);
			}
		}

		if (needToRestoreFocus && currentActiveElement) {
			currentActiveElement.focus();
		}

		function findRepeatItemForObject(object) {
			var n = repeatData.items.length;
			for (var i = 0; i < n; i++) {
				var item = repeatData.items[i];
				if (item.object === object) {
					return item;
				}
			}
			return undefined;
		}

		function newDomNodes() {
			var result = [];
			var n = repeatData.domNodes.length;
			for (var i = 0; i < n; i++) {
				result.push(repeatData.domNodes[i].cloneNode(true));
			}
			return result;
		}

		function insertDomNodesBefore(domNodes, insertBefore, parentNode) {
			var n = domNodes.length;
			for (var i = 0; i < n; i++) {
				var node = domNodes[i];
				parentNode.insertBefore(node, insertBefore);
				if (node === currentActiveElement) {
					needToRestoreFocus = true;
				}
			}
		}
	};

	/**
	  * Update the scope from the DOM.
	  */
	ConsistentScopeManager.prototype.update = function(dom, includeChildren) {
		var i, n, node;
		if (dom === undefined) {
			/* Update all */
			n = this._nodes.length;
			for (i = 0; i < n; i++) {
				node = this._nodes[i];
				node.options.$.update(node.dom, this._scope, node.options);
			}
		} else {
			if (isArray(dom) || isMaybeArrayDefinitelyNotDom(dom)) {
				n = dom.length;
				for (i = 0; i < n; i++) {
					this.update(dom[i], includeChildren);
				}
			} else {
				i = arrayIndexOf(this._domNodes, dom);
				if (i !== -1) {
					node = this._nodes[i];
					node.options.$.update(node.dom, this._scope, node.options);
				}

				if (includeChildren) {
					/* Update children */
					var child = dom.firstChild;
					while (child !== null) {
						if (child.nodeType === 1) {
							this.update(child, includeChildren);
						}
						child = child.nextSibling;
					}
				}
			}
		}
	};

	ConsistentScopeManager.prototype.needsApply = function() {
		if (this._nodesDirty) {
			return true;
		}

		return this.isDirty();
	};

	ConsistentScopeManager.prototype.isDirty = function() {
		return differentKeys(this._scope.$.snapshot(), this._cleanScopeSnapshot).length !== 0;
	};

	ConsistentScopeManager.prototype._updateCleanScopeAndFireWatchers = function() {
		var someDirty = false;
		var dirty;
		var notified = true;
		var loops = 0;
		var currentCleanScopeSnapshot = this._cleanScopeSnapshot;
		var notifyingState = {};

		while (notified) {
			var nextCleanScopeSnapshot = this._scope.$.snapshot();

			dirty = [];

			while (notified) {
				notified = false;
				if (loops >= Consistent.settings.maxWatcherLoops) {
					throw exception("Too many loops while notifying watchers. There is likely to be an infinite loop caused by watcher functions continously changing the scope. You may otherwise increase Consistent.settings.maxWatcherLoops if this is not the case.");
				}

				var keys = differentKeys(nextCleanScopeSnapshot, currentCleanScopeSnapshot);
				keys = expandNestedKeys(keys);
				for (var i = 0; i < keys.length; i++) {
					var key = keys[i];
					if (arrayIndexOf(dirty, key) === -1) {
						dirty.push(key);
					}
					notified |= this._notifyWatchers(key, getNestedProperty(nextCleanScopeSnapshot, key),
						getNestedProperty(currentCleanScopeSnapshot, key),
						this._scope, notifyingState);
				}

				loops++;
			}

			if (dirty.length > 0) {
				notified |= this._notifyWatchAlls(dirty, this._scope, nextCleanScopeSnapshot, currentCleanScopeSnapshot, notifyingState);
				someDirty = true;
			}

			currentCleanScopeSnapshot = nextCleanScopeSnapshot;
		}

		if (someDirty) {
			this._cleanScopeSnapshot = this._scope.$.snapshot();
			return true;
		} else {
			return false;
		}

		function expandNestedKeys(keys) {
			var result = [].concat(keys);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];

				while (true) {
					/* If the key is a nested property, then strip off the last part and look for watchers again */
					var lastNestingSeparator = key.lastIndexOf(".");
					if (lastNestingSeparator !== -1) {
						key = key.substring(0, lastNestingSeparator);

						if (arrayIndexOf(result, key) === -1) {
							result.push(key);
						} else {
							break;
						}
					} else {
						break;
					}
				}
			}
			return result;
		}
	};

	ConsistentScopeManager.prototype._notifyWatchers = function(key, newValue, oldValue, scope, notifyingState) {
		var notified = false;
		var watchers = this._watchers[key];
		if (watchers !== undefined) {
			for (var i = 0; i < watchers.length; i++) {
				var notifying = notifyingState[key];
				if (notifying === undefined) {
					notifyingState[key] = notifying = {};
				}

				var watcher = watchers[i];
				var watcherId = watcher[Consistent.settings.functionIdKey];
				if (watcherId === undefined) {
					watcherId = watcher[Consistent.settings.functionIdKey] = "ConsistentFunction" + functionId;
					functionId++;
				}

				/* Manage loops. Don't notify again if the value hasn't changed since after the last time we
				 * called this watcher. So it won't be notified of its own changes.
				 */
				if (notifying[watcherId] === undefined || !isEqual(notifying[watcherId].cleanValue, newValue)) {
					watcher.call(this._scope, scope, presentNestedProperty(key), newValue, oldValue);

					/* Record clean value from the actual scope, as that will contain any changes this function made */
					notifying[watcherId] = { cleanValue: getNestedProperty(scope.$.snapshot(), key) };
					notified = true;
				}
			}
		}

		if (this._parentScopeManager) {
			notified |= this._parentScopeManager._notifyWatchers(key, newValue, oldValue, scope, notifyingState);
		}

		return notified;
	};

	ConsistentScopeManager.prototype._notifyWatchAlls = function(keys, scope, scopeSnapshot, oldScopeSnapshot, notifyingState) {
		var notified = false;
		var watchers = this._watchers[WATCH_ALL_KEY];
		if (watchers !== undefined) {
			for (var i = 0; i < watchers.length; i++) {
				var notifying = notifyingState[WATCH_ALL_KEY];
				if (notifying === undefined) {
					notifyingState[WATCH_ALL_KEY] = notifying = {};
				}

				var watcher = watchers[i];
				var watcherId = watcher[Consistent.settings.functionIdKey];
				if (watcherId === undefined) {
					watcherId = watcher[Consistent.settings.functionIdKey] = "ConsistentFunction" + functionId;
					functionId++;
				}

				/* Manage loops. Don't notify again if the scope hasn't changed since after the last time we
				 * called this watcher. So it won't be notified of its own changes.
				 */
				if (notifying[watcherId] === undefined || !isEqual(scopeSnapshot, notifying[watcherId].cleanScopeSnapshot)) {
					watchers[i].call(this._scope, scope, presentNestedProperties(keys), scopeSnapshot, oldScopeSnapshot);

					/* Record clean snapshot from the actual scope, as that will contain any changes this function made */
					notifying[watcherId] = { cleanScopeSnapshot: scope.$.snapshot() };
					notified = true;
				}
			}
		}

		if (this._parentScopeManager) {
			notified |= this._parentScopeManager._notifyWatchAlls(keys, scope, scopeSnapshot, oldScopeSnapshot, notifyingState);
		}

		return notified;
	};

	function addEventListener(dom, eventName, listener) {
		if (dom.addEventListener) {
			dom.addEventListener(eventName, listener, false);
		} else if (dom.attachEvent) {
			dom.attachEvent("on" + eventName, listener);
		} else {
			throw exception("Unable to attach event to DOM node. Cannot find supported method.");
		}
	}

	function enhanceEvent(ev) {
		if (!ev.preventDefault) {
			/* IE */
			ev.preventDefault = function() {
				this.returnValue = false;
			};
		}
	}

	function dispatchSimpleEvent(dom, name) {
		var ev;
		if (document.createEvent) {
			ev = document.createEvent("HTMLEvents");
			ev.initEvent(name, true, true);
			dom.dispatchEvent(ev);
		} else if (document.createEventObject) {
			/* IE support */
			dom.fireEvent("on" + name);
		} else {
			throw exception("Unable to fire a DOM event. Cannot find supported method.");
		}
		return ev;
	}

	function isMaybeArrayDefinitelyNotDom(dom) {
		return dom.length !== undefined && dom.attributes === undefined;
	}

	/**
	 * Acquire a new DOM node in this scope.
	 */
	ConsistentScopeManager.prototype.bind = function(dom, options, parentDom) {
		var i;
		if (isArray(dom) || isMaybeArrayDefinitelyNotDom(dom)) {
			for (i = 0; i < dom.length; i++) {
				this.bind(dom[i], options, parentDom);
			}
			return;
		}

		var nodeOptions;

		/* Check this node is not already bound */
		if (dom[Consistent.settings.scopeIdKey] !== this._id) {
			nodeOptions = mergeOptions({}, this._options, options);
			nodeOptions = nodeOptions.$.getNodeOptions(dom, nodeOptions);

			if (nodeOptions.bindings.noBind) {
				return;
			}

			/* Mark the node as being part of this scope, although we do nothing with it.
			 * That way you can still ask which scope it's a part of and find out.
			 */	
			dom[Consistent.settings.scopeIdKey] = this._id;
			/* Also record root nodes, as for the roots it doesn't matter if we've actually
			 * bound them or not, we simply want to know which nodes were the roots of our
			 * binding.
			 */
			if (parentDom === undefined) {
				this._rootDomNodes.push(dom);
			}

			/* Check that are some bindings to apply */
			if (!isEmptyObject(nodeOptions.bindings)) {
				if (nodeOptions.bindings.repeat !== undefined) {
					/* Repeat nodes */
					var repeatData = { version: 0, items: [], options: nodeOptions };
					var repeatKey = nodeOptions.bindings.repeat;

					if (nodeOptions.bindings.repeatContainerId) {
						var source = document.getElementById(nodeOptions.bindings.repeatContainerId);
						if (source !== null) {
							repeatData.domNodes = source.children;
						} else {
							throw exception("Couldn't find element with id \"" + nodeOptions.bindings.repeatContainerId + "\" for repeat container.");
						}
					} else {
						repeatData.domNodes = [ dom.cloneNode(true) ];
					}
					for (i = 0; i < repeatData.domNodes.length; i++) {
						removeAttributes(repeatData.domNodes[i], Consistent.settings.attributes.repeat);
						removeAttributes(repeatData.domNodes[i], Consistent.settings.attributes.repeatContainerId);
					}

					var replacement = document.createComment("Consistent repeat " + repeatKey);
					dom.parentNode.insertBefore(replacement, dom);
					dom.parentNode.removeChild(dom);
					replacement[Consistent.settings.scopeIdKey] = this._id;

					repeatData.insertBefore = document.createComment("/Consistent repeat " + repeatKey);
					replacement.parentNode.insertBefore(repeatData.insertBefore, replacement.nextSibling);

					this._repeatNodes.push(repeatData);
					this._nodesDirty = true;
				} else {
					/* Normal nodes */
					this._nodes.push({ dom: dom, options: nodeOptions });
					this._domNodes.push(dom);
					this._nodesDirty = true;

					var self = this;

					/* Bind special Consistent events before declared events */
					var nodeName = dom.nodeName;
					var listener;
					if (nodeOptions.autoListenToChange && (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT")) {
						/* For input, textarea and select nodes we bind to their change event */
						listener = function(ev) {
							enhanceEvent(ev);
							nodeOptions.$.update(dom, self._scope, nodeOptions);
							self._nodesDirty = true; // TODO this is brute force, could be more narrow
							self._scope.$.apply();
						};
						addEventListener(dom, "change", listener, false);
						if (support.needAggressiveChangeHandlingOnInputElements && (nodeName === "INPUT" && (dom.type === "checkbox" || dom.type === "radio"))) {
							addEventListener(dom, "click", listener, false);
						}

						nodeOptions.$._changeListener = listener;
					}
					if (nodeOptions.autoListenToKeyEvents && (nodeName === "INPUT" || nodeName === "TEXTAREA")) {
						/* For input and textarea nodes we bind to their key events */
						listener = function(ev) {
							enhanceEvent(ev);
							nodeOptions.$.update(dom, self._scope, nodeOptions);
							self._nodesDirty = true; // TODO this is brute force, could be more narrow
							self._scope.$.apply();
						};
						addEventListener(dom, "keyup", listener, false);
						nodeOptions.$._keyListener = listener;
					}

					/* Bind events */
					for (var eventName in nodeOptions.bindings.events) {
						/*jshint loopfunc: true */
						(function(eventName, keys) {
							var listener = function(ev) {
								var i;

								enhanceEvent(ev);

								if (support.needChangeEventForActiveOnSubmit && eventName === "submit" && dom.nodeName === "FORM") {
									/* When you use return to submit a form from an input element it doesn't fire the
									 * change event on the element before submitting, so the scope isn't updated. So we
									 * simulate the change event if there is an active element.
									 */
									for (i = 0; i < dom.elements.length; i++) {
										if (document.activeElement === dom.elements[i]) {
											dispatchSimpleEvent(dom.elements[i], "change");
										}
									}
								}

								for (i = 0; i < keys.length; i++) {
									var key = keys[i];

									var func;
									var result;
									if (typeof key === "function") {
										/* Statements */
										result = evaluateStatement(key, self._scope);
										if (typeof result !== "function") {
											ev.preventDefault();
											self._scope.$.apply();
											continue;
										} else {
											// TODO we don't have a clear path to returning a function to go on to call
											func = result;
										}
									}

									if (func === undefined) {
										/* Lookup event handler in the scope */
										func = self._scope.$.controller(key);
									}
									if (func !== undefined) {
										/* If the func is defined but "falsey" then we simply don't invoke the function,
										 * but this is not an error.
										 */
										if (func) {
											result = func(self._scope, ev, dom);
											if (result === false)
												break;
										}
									} else {
										/* An error has occured, so prevent the event from doing anything and throw an error.
										 * If we don't prevent default and this is an <a> tag then the browser will navigate away
										 * and blank the error console and it will be hard to see this error.
										 */
										ev.preventDefault();

										var eventHandlerPrefix = self._options.eventHandlerPrefix;
										throw exception("Bound \"" + eventName +
												"\" event cannot find an event handler function in \"" + addPrefixToPropertyName(key, eventHandlerPrefix) +
												"\"");
									}
								}
							};
							nodeOptions.bindings.events[eventName].listener = listener;
							addEventListener(dom, eventName, listener);
						})(eventName, nodeOptions.bindings.events[eventName].keys);
					}
				}
			}
		}

		/* Bind children */
		if (nodeOptions === undefined || !nodeOptions.bindings.repeat) {
			/* Skip children of a node which is a repeating node, as we will be duplicating that DOM. */
			var child = dom.firstChild;
			while (child !== null) {
				if (child.nodeType === 1) {
					this.bind(child, options, dom);
				}
				child = child.nextSibling;
			}
		}
	};

	ConsistentScopeManager.prototype.unbind = function(dom) {
		var i;
		if (isArray(dom) || isMaybeArrayDefinitelyNotDom(dom)) {
			for (i = 0; i < dom.length; i++) {
				this.unbind(dom[i]);
			}
			return;
		}

		i = arrayIndexOf(this._domNodes, dom);
		if (i !== -1) {
			var node = this._nodes[i];
			var options = node.options;

			/* Unbind events */
			for (var eventName in options.bindings.events) {
				dom.removeEventListener(eventName, options.bindings.events[eventName].listener, false);
			}

			/* Unbind changes */
			if (options.$._changeListener !== undefined) {
				dom.removeEventListener("change", options.$._changeListener, false);
			}
			/* Unbind keys */
			if (options.$._keyListener !== undefined) {
				dom.removeEventListener("keyup", options.$._keyListener, false);
			}

			this._domNodes.splice(i, 1);
			this._nodes.splice(i, 1);
		}

		/* Unbind children */
		var child = dom.firstChild;
		while (child !== null) {
			if (child.nodeType === 1) {
				this.unbind(child);
			}
			child = child.nextSibling;
		}
	};

	ConsistentScopeManager.prototype.watch = function(key, callback) {
		if (typeof key === "function" && callback === undefined) {
			/* Watch all */
			callback = key;
			key = WATCH_ALL_KEY;
		} else {
			key = unpresentNestedProperty(key);
		}

		var watchers = this._watchers[key];
		if (watchers === undefined) {
			watchers = [];
			this._watchers[key] = watchers;
		}
		watchers.push(callback);
	};

	ConsistentScopeManager.prototype.unwatch = function(key, callback) {
		if (typeof key === "function" && callback === undefined) {
			/* Watch all */
			callback = key;
			key = WATCH_ALL_KEY;
		} else {
			key = unpresentNestedProperty(key);
		}

		var watchers = this._watchers[key];
		if (watchers !== undefined) {
			var i = arrayIndexOf(watchers, callback);
			watchers.splice(i, 1);
		}
	};

	ConsistentScopeManager.prototype.getOptions = function(dom) {
		if (dom === undefined) {
			return this._options;
		}

		for (var i = 0; i < this._nodes.length; i++) {
			if (this._nodes[i].dom === dom) {
				return this._nodes[i].options;
			}
		}
		return null;
	};

	ConsistentScopeManager.prototype.replaceScope = function(newScope) {
		newScope.$ = this._scope.$;
		this._scope = newScope;
		return newScope;
	};

	ConsistentScopeManager.prototype.replaceController = function(newController) {
		newController.$ = this._scope.$;
		this._controller = newController;
	};

	ConsistentScopeManager.prototype.destroy = function() {
		this.unbind(this._rootDomNodes);
	};


	/* Exceptions */

	function exception(message) {
		return new ConsistentException(message);
	}

	ConsistentException.prototype = {};

	function ConsistentException(message) {
		this.name = "ConsistentException";
		this.message = message;
	}

	ConsistentException.prototype.toString = function() {
		return "Consistent.js exception: " + this.message;
	};

})(window);
/*!
 * Consistent.js Expressions 0.12.1
 * @author Karl von Randow
 * @license Apache License, Version 2.0
 */
 /*
    Copyright 2013 Karl von Randow

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
  */

(function(window, undefined) {
	if (typeof Consistent === "undefined") {
		throw "Consistent must be included before consistent-expressions.js";
	}

	Consistent.expressionToFunction = function(value) {
		var tokens = parseTokens(value);
		var safeExpression = tokensToSafeJavascript(tokens, false, value);

		try {
			return new Function("ctx", safeExpression);
		} catch (e) {
			throw "Error compiling expression: " + value + " => " + safeExpression + " (" + e + ")";
		}
	};

	Consistent.statementToFunction = function(value) {
		var tokens = parseTokens(value);
		var safeStatements = tokensToSafeJavascript(tokens, true, value);

		try {
			return new Function("ctx", safeStatements);
		} catch (e) {
			throw "Error compiling statements: " + value + " => " + safeStatements + " (" + e + ")";
		}
	};

	var TYPE_END_TOKEN = 0;
	var TYPE_PROPERTY = 1;
	var TYPE_OPERATOR = 2;
	var TYPE_GROUP = 3;
	var TYPE_STRING = 4;
	var TYPE_VALUE = 5;
	var TYPE_SEPARATOR = 6;

	function parseTokens(expression) {
		var tokens = [];
		var i = 0;
		var n = expression.length;

		var mode = TYPE_END_TOKEN;
		var cur = "";

		while (i < n) {
			var c = expression.charAt(i);
			if (mode === TYPE_END_TOKEN) {
				if (isPropertyStartChar(c)) {
					mode = TYPE_PROPERTY;
				} else if (isStringDelimiterChar(c)) {
					mode = TYPE_STRING;
				} else if (isOperatorChar(c)) {
					mode = TYPE_OPERATOR;
				} else if (isGroupChar(c)) {
					mode = TYPE_GROUP;
				} else if (isNumberStartChar(c)) {
					mode = TYPE_VALUE;
				} else if (isSeparatorChar(c)) {
					mode = TYPE_SEPARATOR;
				} else if (isEscapeChar(c)) {
					throw "Illegal escape character at " + i + ": " + expression;
				} else if (isWhiteChar(c)) {
					i++;
					continue;
				} else {
					throw "Invalid character '" + c + "' at " + i + ": " + expression;
				}
			} else if (mode === TYPE_PROPERTY) {
				/* Property */
				if (!isPropertyChar(c)) {
					appendCurrentToken();
					continue;
				}
			} else if (mode === TYPE_OPERATOR) {
				/* Operator */
				if (!isOperatorChar(c)) {
					appendCurrentToken();
					continue;
				}
			} else if (mode === TYPE_GROUP) {
				/* Group - can only be a single character */
				appendCurrentToken();
				continue;
			} else if (mode === TYPE_STRING) {
				/* String */
				if (isStringDelimiterChar(c)) {
					cur += c;
					i++;
					appendCurrentToken();
					continue;
				} else if (isEscapeChar(c)) {
					cur += c;
					i++;
					c = expression.charAt(i);
				}
			} else if (mode === TYPE_VALUE) {
				/* Number */
				if (!isNumberChar(c)) {
					appendCurrentToken();
					continue;
				}
			} else if (mode === TYPE_SEPARATOR) {
				/* Separator */
				appendCurrentToken();
				continue;
			}
			
			cur += c;
			i++;
		}

		function appendCurrentToken() {
			if (cur.length > 0) {
				if (mode === TYPE_PROPERTY && isReservedWord(cur)) {
					var op = reservedWordToOperator(cur);
					if (op !== null) {
						tokens.push({ type: TYPE_OPERATOR, text: op });
					} else {
						tokens.push({ type: TYPE_VALUE, text: cur });
					}
				} else {
					tokens.push({ type: mode, text: cur });
				}
			}
			cur = "";
			mode = TYPE_END_TOKEN;
		}

		appendCurrentToken();
		return tokens;
	}

	function tokensToSafeJavascript(tokens, isStatement, originalText) {
		var head = [];
		var bodies = [[]];
		var tails = [[]];
		var groupId = 0;
		var i, n = tokens.length;
		for (i = 0; i < n; i++) {
			var body = bodies[bodies.length - 1];
			var tail = tails[tails.length - 1];
			var token = tokens[i];
			var tokenType = token.type;
			if (tokenType === TYPE_PROPERTY) {
				if (isStatement) {
					var nextToken = i + 1 < n ? tokens[i + 1] : null;
					if (nextToken !== null && nextToken.type === TYPE_OPERATOR && 
						isMutatingOperator(nextToken.text)) {
						body.push("ctx.set(\"" + addSlashes(token.text) + "\", ");
						tail.unshift(")");
						
						var suboperator = mutationOperatorSuboperator(nextToken.text);
						if (suboperator) {
							body.push("ctx.get(\"" + addSlashes(token.text) + "\")");
							body.push(suboperator);
						}

						i++;
						continue;
					}
				}

				body.push("ctx.get(\"" + addSlashes(token.text) + "\")");
			} else if (tokenType === TYPE_OPERATOR) {
				if (isMutatingOperator(token.text)) {
					/* It's not critical to catch these, as they will just result in an invalid
					 * and harmless expression. Even when we're allow mutation, these tokens
					 * should be consumed in relation to a property. Assignment to anything else
					 * is invalid.
					 */
					throw "Assignment is invalid in expression: " + originalText;
				} else {
					body.push(token.text);
				}
			} else if (tokenType === TYPE_STRING || tokenType === TYPE_VALUE) {
				body.push(token.text);
			} else if (tokenType === TYPE_GROUP) {
				if (token.text === "(") {
					/* Start group */
					bodies.push([]);
					tails.push([]);
				} else {
					/* End group */
					if (!body.length || bodies.length < 2) {
						throw "Invalid bracketed expression in expression: " + originalText;
					}
					head.push("var __group" + groupId + " = " + body.join(" ") + tail.join(" ") + ";");
					bodies.pop();
					tails.pop();
					body = bodies[bodies.length - 1];
					body.push("__group" + groupId);
					groupId++;
				}
			} else if (tokenType === TYPE_SEPARATOR) {
				if (isStatement) {
					body.push(tails[0].join(" ") + ";");
					tails[0] = [];

					var subsequentStatements = tokensToSafeJavascript(tokens.slice(i + 1), true, originalText);
					body.push(subsequentStatements);
					break;
				} else {
					throw "Invalid multiple statements in expression: " + originalText;
				}
			}
		}

		if (bodies.length !== 1) {
			throw "Unbalanced bracketed expressions in expression: " + originalText;
		}

		return head.join(" ") + (i == n ? " return " : "") + bodies[0].join(" ") + tails[0].join(" ") + ";";
	}

	function addSlashes(str) {
		return str.replace(/"/g, "\\\"");
	}

	function isPropertyStartChar(c) {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
	}

	function isPropertyChar(c) {
		return isPropertyStartChar(c) || c === '.' || (c >= '0' && c <= '9');
	}

	function isStringDelimiterChar(c) {
		return c === "'" || c === '"';
	}

	function isEscapeChar(c) {
		return c === '\\';
	}

	function isOperatorChar(c) {
		return c === '!' || c === '%' || c === '=' || c === '<' || c === '>' ||
			c === '*' || c === '/' || c === '+' || c === '-' ||
			c === '^' || c === '&' || c === '?' || c === ':';
	}

	function isGroupChar(c) {
		return c === '(' || c === ')';
	}

	function isAssignmentOperator(str) {
		return str === "=" || str === "+=" || str === "-=" || 
			str === "*=" || str === "/=" || str === "%=";
	}

	function isMutatingOperator(str) {
		return isAssignmentOperator(str) || str === "++" || str === "--";
	}

	function mutationOperatorSuboperator(str) {
		if (str === "=") {
			return null;
		} else if (str.length == 2 && str.indexOf("=") === 1) {
			return str.charAt(0);
		} else if (str === "++") {
			return "+1";
		} else if (str === "--") {
			return "-1";
		} else {
			throw "Unsupported mutation operator: " + str;
		}
	}

	function isSeparatorChar(c) {
		return c === ';';
	}

	function isNumberStartChar(c) {
		return (c >= '0' && c <= '9');
	}

	function isNumberChar(c) {
		return isNumberStartChar(c) || c == '.';
	}

	function isWhiteChar(c) {
		return c <= ' ';
	}

	function isReservedWord(str) {
		return str === "true" || str === "false" || str === "null" || str === "undefined" ||
			str === "and" || str === "or" || str === "not" ||
			str === "lt" || str === "le" || str === "gt" || str === "ge" || str === "eq" || str === "ne";
	}

	function reservedWordToOperator(str) {
		if (str === "and") {
			return "&&";
		} else if (str === "or") {
			return "||";
		} else if (str === "not") {
			return "!";
		} else if (str === "lt") {
			return "<";
		} else if (str === "le") {
			return "<=";
		} else if (str === "gt") {
			return ">";
		} else if (str === "ge") {
			return ">=";
		} else if (str === "eq") {
			return "==";
		} else if (str === "ne") {
			return "!=";
		} else {
			return null;
		}
	}
})(window);
/*! 
 * Consistent.js jQuery plugin 0.12.1
 * @author Karl von Randow
 * @license Apache License, Version 2.0
 */
 /*
    Copyright 2013 Karl von Randow

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
  */

(function($, window, undefined) {
	var Consistent = $.consistent = window.Consistent;

	/**
	 * Argument scenarios:
	 * 1) $(...).consistent(): create a new scope, bind the selected nodes and return the new scope
	 * 2) $(...).consistent(aScope): bind the selected nodes for the given scope and return the scope
	 * 3) $(...).consistent(options): create a new scope with the given options, bind the selected nodes and return the new scope.
	 * 4) $(...).consistent(aScope, options): bind the selected nodes for the given scope with the given options and return the scope.
	*/
	$.fn.consistent = function() {
		var scope, options;
		if (arguments.length === 0) {
			/* Check whether the given nodes have an existing scope */
			this.each(function() {
				var nodeScope = Consistent.findScopeForNode(this);
				if (nodeScope) {
					if (scope && scope !== nodeScope) {
						/* The given nodes have multiple different scopes */
						throw "The given nodes have multiple different scopes";
					}
					scope = nodeScope;
				} else if (scope) {
					/* Some of the given nodes have scopes and others don't */
					throw "Some of the given nodes have scopes and others don't";
				}
			});

			if (scope) {
				/* Already bound to a scope */
				return scope;
			} else {
				/* Create a new default scope */
				scope = Consistent();
			}
		} else {
			var arg0 = arguments[0];
			if (Consistent.isScope(arg0)) {
				/* Existing scope to bind to, and maybe bind options */
				scope = arg0;
				options = arguments.length > 1 ? arguments[1] : null;
			} else {
				scope = Consistent.apply(window, arguments);
				options = null; /* No bind specific options */
			}
		}

		this.each(function() {
			scope.$.bind(this, options);
		});

		return scope;
	};

	$(function() {
		if (Consistent.settings.autoCreateScopes) {
			Consistent.autoCreateScopes();
		}
	});

})(jQuery, window);
