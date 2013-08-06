/*!
 * Consistent.js 0.6.2
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

/**
 * Set global configuration:
 * eg. Consistent.defaultOptions.templateEngine = Hogan;
 */
(function(window, undefined) {

	/**
	 * Single point of entry for Consistent.
	 * Arguments can be:
	 * * None, just create a new Consistent scope and return it.
	 * * An existing Consistent scope, create a child scope and return it. Optionally followed by a second argument for options.
	 * * An object containing key value pairs, used for the configuration of the new scope.
	 * * A dom node; returns the scope that bound that node, or null.
	 */
	var Consistent = window.Consistent = function() {
		/* Parse arguments */
		var arg0 = arguments[0];
		if (arg0 !== undefined) {
			if (Consistent.isScope(arg0)) {
				/* Parent scope */
				if (arguments[1] !== undefined) {
					/* with options */
					return Consistent.createScope(arg0, arguments[1]);
				} else {
					return Consistent.createScope(arg0, null);
				}
			} else if (arg0.nodeName !== undefined) {
				/* DOM node */
				return Consistent.findScopeForNode(arg0);
			} else if (typeof arg0 === "object") {
				/* Options only */
				return Consistent.createScope(null, arg0);
			} else {
				throw new ConsistentException("Unexpected argument to Consistent(): " + arg0);
			}
		} else {
			/* No arguments */
			return Consistent.createScope(null, null);
		}
	};

	var scopes = {};
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

				on: [ "data-ct-on", "ct-on", /* Legacy */, "data-ct-bind", "ct-bind" ],
				onPrefix: [ "data-ct-on-", "ct-on-", /* Legacy */, "data-ct-bind-", "ct-bind-" ],

				repeat: [ "data-ct-repeat", "ct-repeat" ],
				repeatContainerId: [ "data-ct-repeat-container-id", "ct-repeat-container-id" ],

				warningPrefix: [ "data-ct-", "ct-" ]
			},

			scopeIdKey: "__ConsistentScopeID",
			functionIdKey: "__ConsistentFunctionID",
			oldDisplayKey: "__ConsistentOldDisplay",

			maxWatcherLoops: 100
		},

		isScope: function(object) {
			return object !== undefined && object.$ !== undefined && object.$._type === SCOPE_TYPE;
		},

		createScope: function(parentScope, options) {
			/* Create scope */
			options = mergeOptions({}, Consistent.defaultOptions, options);

			var scope = new ConsistentScopeManager(parentScope, options);
			scopes[scope._id] = scope._scope;
			return scope._scope;
		},

		/** Returns the scope for the given DOM node, or null */
		findScopeForNode: function(dom) {
			var scopeId = dom[Consistent.settings.scopeIdKey];
			if (scopeId && scopes[scopeId]) {
				return scopes[scopeId];
			} else {
				return null;
			}
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

	function arrayIndexOf(array, searchElement, fromIndex) {
		if (typeof array.indexOf === "function") {
			return array.indexOf(searchElement, fromIndex);
		} else {
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
		}
	}

	/**
	 * Merge objects passed as arguments. If the first parameter is a boolean that specifies whether to do a deep
	 * copy.
	 * Note that merge does not merge keys that are "$". This is because Consistent puts its functionality in the
	 * $ object and there are pointers in there that cause cycles.
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
				throw new ConsistentException("Target object argument to merge is not appropriate: " + typeof target);
			}
			if (target === null) {
				throw new ConsistentException("Target object argument to merge is not appropriate: " + target);
			}
			for (var i = objectsStart + 1; i < arguments.length; i++) {
				var source = arguments[i];
				if (source === undefined) {
					continue;
				}

				if (typeof source !== "object" && typeof source !== "function") {
					throw new ConsistentException("Argument " + (i+1) + " to merge is not appropriate: " + typeof source);
				}

				seen.push(source);
				merged.push(target);

				for (var name in source) {
					/* Do not merge any key "$" */
					if (name === "$") {
						continue;
					}

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

		return _merge.apply(this, arguments);
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

		var result = merge.apply(this, arguments);
		result.$ = merge.apply(this, $s);
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

	function getNestedProperty(object, property) {
		var parts = property.split(".");
		var current = object;
		var i;
		for (i = 0; i < parts.length && current !== undefined && current !== null; i++) {
			current = current[parts[i]];
		}
		if (i === parts.length) {
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

	/**
	  * Default options for Consistent.js. This includes the "$" key which contains the functionality used to apply
	  * the scope to the DOM.
	  */
	Consistent.defaultOptions = {

		templateEngine: null,
		autoListenToChange: true,
		eventHandlerPrefix: "$",
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
					value = getNestedProperty(snapshot, bindings.key);
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
							value = getNestedProperty(snapshot, attrs[i].key);
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

				/* Properties */
				if (bindings.properties) {
					var props = bindings.properties;
					for (i = 0; i < props.length; i++) {
						value = getNestedProperty(snapshot, props[i].key);
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
					value = getNestedProperty(snapshot, bindings.show);
					if (value !== undefined) {
						if (value) {
							this.show(dom);
						} else {
							this.hide(dom);
						}
					}
				}
				if (bindings.hide) {
					value = getNestedProperty(snapshot, bindings.hide);
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
					value = getNestedProperty(snapshot, bindings.enabled);
					if (value !== undefined) {
						this.setPropertyValue(dom, "disabled", !value);
					}
				}
				if (bindings.disabled) {
					value = getNestedProperty(snapshot, bindings.disabled);
					if (value !== undefined) {
						this.setPropertyValue(dom, "disabled", !!value);
					}
				}

				/* Read only */
				if (bindings.readOnly) {
					value = getNestedProperty(snapshot, bindings.readOnly);
					if (value !== undefined) {
						this.setPropertyValue(dom, "readOnly", !!value);
					}
				}
				if (bindings.readWrite) {
					value = getNestedProperty(snapshot, bindings.readWrite);
					if (value !== undefined) {
						this.setPropertyValue(dom, "readOnly", !value);
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

				/* Value */
				if (bindings.key) {
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
				if (bindings.attributes) {
					var attrs = bindings.attributes;
					for (i = 0; i < attrs.length; i++) {
						if (attrs[i].key !== undefined) {
							value = this.getAttributeValue(dom, attrs[i].name);
							scope.$.set(attrs[i].key, value);
						}
					}
				}
				if (bindings.allAttributes) {
					value = scope.$.get(bindings.allAttributes);
					if (value !== undefined) {
						for (i in value) {
							value[i] = this.getAttributeValue(dom, i);
						}
					}
				}

				/* Properties */
				if (bindings.properties) {
					var props = bindings.properties;
					for (i = 0; i < props.length; i++) {
						value = this.getPropertyValue(dom, props[i].name);
						scope.$.set(props[i].key, value);
					}
				}
				if (bindings.allProperties) {
					value = scope.$.get(bindings.allProperties);
					if (value !== undefined) {
						var names = getNestedPropertyNames(value);
						for (i = 0; i < names.length; i++) {
							setNestedProperty(value, names[i], this.getPropertyValue(dom, names[i]));
						}
					}
				}

				/* Visibility */
				if (bindings.show) {
					value = this.isShowing(dom);
					scope.$.set(bindings.show, value);
				}
				if (bindings.hide) {
					value = this.isShowing(dom);
					scope.$.set(bindings.hide, !value);
				}

				/* Enabled / disabled */
				if (bindings.enabled) {
					value = this.getPropertyValue(dom, "disabled");
					scope.$.set(bindings.enabled, !value);
				}
				if (bindings.disabled) {
					value = this.getPropertyValue(dom, "disabled");
					scope.$.set(bindings.disabled, value);
				}

				/* Read only */
				if (bindings.readOnly) {
					value = this.getPropertyValue(dom, "readOnly");
					scope.$.set(bindings.readOnly, value);
				}
				if (bindings.readWrite) {
					value = this.getPropertyValue(dom, "readOnly");
					scope.$.set(bindings.readWrite, !value);
				}
			},

			/** Get the current value from the given dom object */
			getValue: function(dom) {
				var nodeName = dom.nodeName;
				if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
					if (dom.type === "checkbox") {
						return dom.checked;
					} else if (dom.type === "radio") {
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

	Consistent.defaultOptions.$.$original = Consistent.defaultOptions.$;

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
		for (var i = 0; i < attrs.length; i++) {
			var name = attrs[i].name;
			var value = attrs[i].value;

			var matched = findDeclarationAttribute(name);
			if (matched) {
				switch (matched.name) {
					case "key": {
						/* Body */
						bindings.key = value;
						break;
					}
					case "attributePrefix": {
						/* Attribute */
						addAttribute(matched.suffix, value);
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
						addProperty(matched.suffix.replace(/-/g, "."), value);
						break;
					}
					case "properties": {
						bindings.allProperties = value;
						break;
					}
					case "on": {
						/* Bind default event */
						addEvent(defaultEventName(dom), value);
						break;
					}
					case "onPrefix": {
						/* Bind events */
						addEvent(matched.suffix.toLowerCase(), value);
						break;
					}
					case "show": {
						/* Show */
						bindings.show = value;
						break;
					}
					case "hide": {
						/* Hide */
						bindings.hide = value;
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
						bindings.enabled = value;
						break;
					}
					case "disabled": {
						/* Disabled */
						bindings.disabled = value;
						break;
					}
					case "readOnly": {
						/* Read Only */
						bindings.readOnly = value;
						break;
					}
					case "readWrite": {
						/* Read Write */
						bindings.readWrite = value;
						break;
					}
					case "options": {
						/* Select options */
						bindings.selectOptions = value;
						break;
					}
					case "warningPrefix": {
						/* Catch all at the end. Catches any attributes that look like they're for Consistent, but
						 * weren't recognized. Log these out to help developers catch errors.
						 */
						if (console.log !== undefined) {
							console.log("Warning: Unrecognised Consistent attribute \"" + name + "\" on " + dom.nodeName + " element.");
						}
						break;
					}
					default: {
						/* In the future this can be used for custom attributes, as the developer has added a key
						 * into the settings.attributes.
						 */
						throw new ConsistentException("Unhandled consistent declaration attribute: " + name);
					}
				}
			}
		}

		function findDeclarationAttribute(name) {
			for (var declAttr in settings.attributes) {
				var attributes = settings.attributes[declAttr];
				var i;
				if (declAttr.lastIndexOf("Prefix") === declAttr.length - "Prefix".length) {
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
				throw new ConsistentException("templateEngine not configured in options");
			}
		}

		function templateById(templateId) {
			var templateElement = document.getElementById(templateId);
			if (templateElement !== null) {
				return templateElement.innerHTML;
			} else {
				throw new ConsistentException("Template not found with id: " + templateId);
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

		return result;
	};


	/* Scope */

	/**
	 * Remove event handler functions and evaluate value functions. Recursive to handle nested
	 * objects in the scope.
	 */
	function processSnapshot(snapshot, scope, seen) {
		if (seen === undefined) {
			seen = [];
		}
		if (arrayIndexOf(seen, snapshot) !== -1) {
			return;
		}
		seen.push(snapshot);

		var options = scope.$.options();
		var eventHandlerPrefix = options.eventHandlerPrefix;
		var valueFunctionPrefix = options.valueFunctionPrefix;

		for (var name in snapshot) {
			if (name.indexOf(eventHandlerPrefix) === 0) {
				/* Remove handler functions */
				delete snapshot[name];
			} else if (typeof snapshot[name] === "function") {
				/* Evaluate value functions */
				if (!valueFunctionPrefix) {
					snapshot[name] = snapshot[name].call(scope);
				} else if (name.indexOf(valueFunctionPrefix) === 0) {
					var propertyName;
					if (prefixRequiresNextInitialCap(valueFunctionPrefix)) {
						propertyName = name.substring(valueFunctionPrefix.length);
						propertyName = propertyName.substring(0, 1).toLowerCase() + propertyName.substring(1);
					} else {
						propertyName = name.substring(valueFunctionPrefix.length);
					}
					snapshot[propertyName] = snapshot[name].call(scope);

					/* Delete the original value function */
					delete snapshot[name];
				} else {
					/* Delete other functions as they are presumed to be foreign and not intended to
					 * be used in the scope.
					 */
					delete snapshot[name];
				}
			} else if (typeof snapshot[name] === "object" && snapshot[name] !== null) {
				/* Go deep recursively processing snapshot */
				processSnapshot(snapshot[name], scope, seen);
			}
		}
	}

	Consistent.defaultEmptyScope = {
		$: {
			_type: SCOPE_TYPE,

			/* Function returning the root of the scope */
			_scope: null,

			/* Function returning the manager */
			_manager: null,

			/* The index of this scope in a repeating section */
			index: undefined,

			apply: function(options, func) {
				if (typeof options === "function") {
					func = options;
					options = undefined;
				}

				var scope = this._scope();
				if (func !== undefined) {
					func.call(scope, options);
				}

				this._manager().apply(options);
				return scope;
			},
			applyLater: function(options, func) {
				if (typeof options === "function") {
					func = options;
					options = undefined;
				}

				var scope = this._scope();
				if (func !== undefined) {
					func.call(scope, options);
				}

				window.clearTimeout(this._applyLaterTimeout);
				this._applyLaterTimeout = window.setTimeout(function() {
					scope.$.apply(options);
				}, 0);
				return scope;
			},
			needsApply: function() {
				return this._manager().needsApply();
			},
			update: function() {
				this._manager().update();
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
				if (typeof object === "boolean") {
					/* merge(true, object) */
					return merge(object, scope, keys);
				} else if (keys === undefined) {
					/* merge(object) */
					return merge(scope, object);
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
					throw new ConsistentException("Invalid keys argument to merge: " + keys);
				}
			},
			replace: function(object) {
				return this._manager().replaceScope(object);
			},
			clear: function() {
				var scope = this._scope();
				for (var i in scope) {
					if (i !== "$") {
						delete scope[i];
					}
				}
			},

			/**
			 * Return a plain object with a snapshot of the values from the scope, excluding the $ object
			 * that contains Consistent functionality, any properties with a $ prefix (event handlers) and
			 * replacing any value functions with their current value.
			 * If there is a parent scope, the values from that scope are merged in.
			 * @param includeParents If false, only include the local scope in the snapshot
			 * @param childScope internal use
			 */
			snapshot: function(includeParents, childScope) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw new ConsistentException("Invalid type for includeParents: " + typeof includeParents);
				}

				var scope = this._scope();
				var temp = merge(true, {}, scope);
				processSnapshot(temp, childScope !== undefined ? childScope : scope);

				if (includeParents !== false && this.parent()) {
					temp = merge(this.parent().$.snapshot(false, childScope !== undefined ? childScope : scope), temp);
				}
				return temp;
			},

			nodes: function(includeParents) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw new ConsistentException("Invalid type for includeParents: " + typeof includeParents);
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
			get: function(key, includeParents) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw new ConsistentException("Invalid type for includeParents: " + typeof includeParents);
				}

				var value = getNestedProperty(this._scope(), key);
				if (value !== undefined) {
					return value;
				} else if (includeParents !== false && this.parent()) {
					return this.parent().$.get(key);
				} else {
					return undefined;
				}
			},
			set: function(key, value) {
				var scope = this._scope();

				var parts = key.split(".");
				var current = scope;
				for (var i = 0; i < parts.length - 1; i++) {
					var next = current[parts[i]];
					if (next === undefined) {
						current = current[parts[i]] = {};
					} else {
						current = next;
					}
				}
				var lastPart = parts[parts.length - 1];
				var valueFunctionPrefix = this.options().valueFunctionPrefix;
				if (typeof current[lastPart] !== "function") {
					if (valueFunctionPrefix) {
						/* Check for possible value function */
						var possibleValueFunction = mungePropertyName(lastPart, valueFunctionPrefix);
						if (typeof current[possibleValueFunction] === "function") {
							current[possibleValueFunction].call(scope, value);
							return scope;
						}
					}

					current[lastPart] = value;
				} else if (!valueFunctionPrefix) {
					/* Value function */
					current[lastPart].call(scope, value);
				} else {
					/* Overwrite the function with a scalar value. It is not valid to reference value functions
					 * by their name including prefix, as the snapshot does not contain values like that
					 */
					current[lastPart] = value;
				}
				return scope;
			},
			getEventHandler: function(key, includeParents) {
				if (includeParents !== undefined && typeof includeParents !== "boolean") {
					throw new ConsistentException("Invalid type for includeParents: " + typeof includeParents);
				}

				var value = this.get(mungePropertyName(key, this.options().eventHandlerPrefix), false);
				if (value !== undefined) {
					return value;
				} else if (includeParents !== false && this.parent()) {
					return this.parent().$.getEventHandler(key);
				} else {
					return undefined;
				}
			},
			setEventHandler: function(key, value) {
				key = mungePropertyName(key, this.options().eventHandlerPrefix);
				return this.set(key, value);
			},
			options: function(dom) {
				return this._manager().getOptions(dom);
			}
		}
	};

	/**
	 * Some property names require a prefix, and these get added to the final part of the
	 * property name where the parts are separated by dots. If the prefix ends with a letter
	 * then the name will be initial-capped to provide a camel-casing.
	 */
	function mungePropertyName(name, prefix) {
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

		var key;
		for (key in aObject) {
			if (aObject[key] !== bObject[key]) {
				if (typeof aObject[key] === "object" && typeof bObject[key] === "object") {
					/* Nested objects */
					differentKeys(aObject[key], bObject[key], prefix + key + ".", depth + 1, result, seen);
				} else {
					result.push(prefix + key);
				}
			}
		}

		/* Collect anything that exists in bObject but isn't in aObject */
		for (key in bObject) {
			if (aObject[key] === undefined) {
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

	ConsistentScopeManager.prototype = new Object();

	var scopeId = 0;
	var functionId = 0;
	var WATCH_ALL_KEY = "$all";

	function ConsistentScopeManager(parentScope, options) {
		this._id = "ConsistentScope" + scopeId;
		scopeId++;

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

		var self = this;
		this._scope = mergeOptions({}, Consistent.defaultEmptyScope);
		this._scope.$._manager = function() {
			return self;
		};
		this._scope.$._scope = function() {
			return self._scope;
		};

		this._cleanScopeSnapshot = this._scope.$.snapshot();
	}

	/**
	 * Apply the scope to the DOM.
	 */
	ConsistentScopeManager.prototype.apply = function(options) {
		/* Prevent re-entry into apply */
		if (this._applying) {
			return;
		}
		this._applying = true;

		if (this._updateCleanScopeAndFireWatchers() || this._nodesDirty) {
			/* Apply to the DOM */
			var n = this._nodes.length;
			var i, nodeOptions;
			for (i = 0; i < n; i++) {
				var node = this._nodes[i];
				nodeOptions = options !== undefined ? mergeOptions({}, node.options, options) : node.options;

				nodeOptions.$.apply(node.dom, this._cleanScopeSnapshot, nodeOptions);
			}

			n = this._repeatNodes.length;
			for (i = 0; i < n; i++) {
				var repeatData = this._repeatNodes[i];
				nodeOptions = options !== undefined ? mergeOptions({}, repeatData.options, options) : repeatData.options;
				this._handleRepeat(repeatData, nodeOptions, this._cleanScopeSnapshot);
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
		 *		   after: dom node this appears after (or null if it's first)
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
			throw new ConsistentException("Repeat for key \"" + repeatKey +
				"\" is not an object in the scope, found " + typeof repeatSnapshot);
		}

		/* Find new and old objects in repeatContext */
		repeatData.version++;

		var version = repeatData.version;
		var insertBefore = repeatData.insertBefore;
		var previousNode = null;
		var item;

		for (i = 0; i < repeatContext.length; i++) {
			var object = repeatContext[i];
			item = findRepeatItemForObject(object);

			var wasNew = false;
			if (item === undefined) {
				/* New object */
				var domNodes = newDomNodes();

				var childScope = Consistent(this._scope, this._options);
				childScope.$.bind(domNodes);
				childScope = childScope.$.replace(object);

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

			insertDomNodesBefore(item.domNodes, insertBefore, insertBefore.parentNode);
			if (wasNew) {
				for (var j = 0; j < item.domNodes.length; j++) {
					options.$.added(item.domNodes[j]);
				}
			}

			item.after = previousNode;
			previousNode = item.domNodes[item.domNodes.length - 1];

			item.scope.$.index = i;
			item.scope.$.apply();
		}

		/* Find deleted objects */
		for (i = 0; i < repeatData.items.length; i++) {
			item = repeatData.items[i];
			if (item.version !== version) {
				if (item.after) {
					/* Maintain the position of this node in the DOM in case we animated
					 * the removal.
					 */
					insertDomNodesBefore(item.domNodes, item.after.nextSibling, insertBefore.parentNode);
				}
				removeDomNodes(item.domNodes, item.scope);
				repeatData.items.splice(i, 1);

				item.scope.$.index = undefined;
				i--;
			}
		}

		function findRepeatItemForObject(object) {
			for (var i = 0; i < repeatData.items.length; i++) {
				if (repeatData.items[i].object === object) {
					return repeatData.items[i];
				}
			}
			return undefined;
		}

		function newDomNodes() {
			var result = [];
			for (var i = 0; i < repeatData.domNodes.length; i++) {
				result.push(repeatData.domNodes[i].cloneNode(true));
			}
			return result;
		}

		function removeDomNodes(domNodes, scope) {
			for (var i = 0; i < domNodes.length; i++) {
				scope.$.unbind(domNodes[i]);
				options.$.remove(domNodes[i]);
			}
		}

		function insertDomNodesBefore(domNodes, insertBefore, parentNode) {
			for (var i = 0; i < domNodes.length; i++) {
				parentNode.insertBefore(domNodes[i], insertBefore);
			}
		}
	};

	/**
	  * Update the scope from the DOM.
	  */
	ConsistentScopeManager.prototype.update = function() {
		var n = this._nodes.length;
		for (var i = 0; i < n; i++) {
			var node = this._nodes[i];
			node.options.$.update(node.dom, this._scope, node.options);
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
					throw new ConsistentException("Too many loops while notifying watchers. There is likely to be an infinite loop caused by watcher functions continously changing the scope. You may otherwise increase Consistent.settings.maxWatcherLoops if this is not the case.");
				}

				var keys = differentKeys(nextCleanScopeSnapshot, currentCleanScopeSnapshot);
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
					watcher.call(scope, key, newValue, oldValue);

					/* Record clean value from the actual scope, as that will contain any changes this function made */
					notifying[watcherId] = { cleanValue: scope.$.get(key) };
					notified = true;
				}
			}
		}

		if (this._parentScopeManager) {
			this._parentScopeManager._notifyWatchers(key, newValue, oldValue, scope, notifyingState);
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
					watchers[i].call(scope, keys, scopeSnapshot, oldScopeSnapshot);

					/* Record clean snapshot from the actual scope, as that will contain any changes this function made */
					notifying[watcherId] = { cleanScopeSnapshot: scope.$.snapshot() };
					notified = true;
				}
			}
		}

		if (this._parentScopeManager) {
			this._parentScopeManager._notifyWatchAlls(keys, scope, scopeSnapshot, oldScopeSnapshot, notifyingState);
		}

		return notified;
	};

	function addEventListener(dom, eventName, listener) {
		if (dom.addEventListener) {
			dom.addEventListener(eventName, listener, false);
		} else if (dom.attachEvent) {
			dom.attachEvent("on" + eventName, listener);
		} else {
			throw new ConsistentException("Unable to attach event to DOM node. Cannot find supported method.");
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
			throw new ConsistentException("Unable to fire a DOM event. Cannot find supported method.");
		}
		return ev;
	}

	/**
	 * Acquire a new DOM node in this scope.
	 */
	ConsistentScopeManager.prototype.bind = function(dom, options, parentDom) {
		var i;
		if (isArray(dom)) {
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
							throw new ConsistentException("Couldn't find element with id \"" + nodeOptions.bindings.repeatContainerId + "\" for repeat container.");
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

					/* Bind events */
					for (var eventName in nodeOptions.bindings.events) {
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
									var func = self._scope.$.getEventHandler(key);
									if (func !== undefined) {
										var result = func.call(dom, ev, self._scope);
										if (result === false)
											break;
									} else {
										/* An error has occured, so prevent the event from doing anything and throw an error.
										 * If we don't prevent default and this is an <a> tag then the browser will navigate away
										 * and blank the error console and it will be hard to see this error.
										 */
										ev.preventDefault();

										func = self._scope.$.get(key);
										var eventHandlerPrefix = self._options.eventHandlerPrefix;
										if (typeof func === "function") {
											throw new ConsistentException("Bound \"" + eventName +
												"\" event cannot find an event handler function in \"" + mungePropertyName(key, eventHandlerPrefix) +
												"\". There is a function in \"" + key + "\", which is missing the " + eventHandlerPrefix +
												" prefix and is possibly a mistake?");
										} else {
											throw new ConsistentException("Bound \"" + eventName +
												"\" event cannot find an event handler function in \"" + mungePropertyName(key, eventHandlerPrefix) +
												"\"");
										}
									}
								}
							};
							nodeOptions.bindings.events[eventName].listener = listener;
							addEventListener(dom, eventName, listener);
						})(eventName, nodeOptions.bindings.events[eventName].keys);
					}

					/* Handle specific nodes differently */
					var nodeName = dom.nodeName;
					if (nodeOptions.autoListenToChange && (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT")) {
						/* For input and textarea nodes we bind to their change event by default. */
						var listener = function(ev) {
							enhanceEvent(ev);
							nodeOptions.$.update(dom, self._scope, nodeOptions);
							self._scope.$.apply();
						};
						addEventListener(dom, "change", listener, false);
						if (support.needAggressiveChangeHandlingOnInputElements && (nodeName === "INPUT" && (dom.type === "checkbox" || dom.type === "radio"))) {
							addEventListener(dom, "click", listener, false);
						}

						nodeOptions.$._changeListener = listener;
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
		if (isArray(dom)) {
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


	/* Exceptions */

	ConsistentException.prototype = new Object();

	function ConsistentException(message) {
		this._message = message;
	}

	ConsistentException.prototype.toString = function() {
		return "Consistent.js exception: " + this._message;
	};

})(window);
