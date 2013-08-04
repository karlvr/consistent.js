/*! 
 * Consistent.js 0.2.1
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
			} else if (typeof arg0 == "object") {
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

		return result;
	})();

	merge(Consistent, {
		settings: {
			keyDataAttribute: "data-ct",
			showDataAttribute: "data-ct-show",
			hideDataAttribute: "data-ct-hide",
			enabledDataAttribute: "data-ct-enabled",
			disabledDataAttribute: "data-ct-disabled",
			readOnlyDataAttribute: "data-ct-readonly",
			readWriteDataAttribute: "data-ct-readwrite",
			optionsDataAttribute: "data-ct-options",
			templateDataAttribute: "data-ct-tmpl",
			templateIdDataAttribute: "data-ct-tmpl-id",
			attributeDataAttributePrefix: "data-ct-attr-",
			propertyDataAttributePrefix: "data-ct-prop-",
			templateAttributeDataAttributePrefix: "data-ct-tmpl-attr-",
			templateIdAttributeDataAttributePrefix: "data-ct-tmpl-id-attr-",
			bindDataAttribute: "data-ct-bind",
			bindDataAttributePrefix: "data-ct-bind-",
			repeatDataAttribute: "data-ct-rep",
			repeatContainerIdDataAttribute: "data-ct-rep-container-id",
			warningDataAttributePrefix: "data-ct-",

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

	/**
	 * Merge objects passed as arguments. If the first parameter is a boolean that specifies whether to do a deep
	 * copy.
	 * Note that merge does not merge keys that are "$". This is because Consistent puts its functionality in the
	 * $ object and there are pointers in there that cause cycles.
	 */
	function merge() {
		var objectsStart = 0;
		var deep = false;
		if (typeof arguments[0] === "boolean") {
			deep = arguments[0];
			objectsStart++;
		}
		var target = arguments[objectsStart];
		if (typeof target !== "object" && typeof target !== "function") {
			throw new ConsistentException("First object argument to merge is not appropriate: " + typeof target);
		}
		if (target === null) {
			throw new ConsistentException("First object argument to merge is not appropriate: " + target);
		}
		for (var i = objectsStart + 1; i < arguments.length; i++) {
			var source = arguments[i];
			if (source === undefined) {
				continue;
			}

			if (typeof source !== "object" && typeof source !== "function") {
				throw new ConsistentException("Argument " + (i+1) + " to merge is not appropriate: " + typeof source);
			}
			for (var name in source) {
				/* Do not merge any key "$" */
				if (name === "$") {
					continue;
				}

				var value = source[name];
				if (value !== undefined) {
					if (deep && typeof value === "object" && value !== null) {
						value = merge(true, isArray(value) ? [] : {}, value);
					}
					target[name] = value;
				}
			}
		}
		return target;
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
		if (i == parts.length) {
			return current;
		} else {
			return undefined;
		}
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

	/**
	  * Default options for Consistent.js. This includes the "$" key which contains the functionality used to apply
	  * the scope to the DOM.
	  */
	Consistent.defaultOptions = {

		templateEngine: null,
		autoListenToChange: true,

		$: {
			getNodeOptions: function(node, options) {
				return Consistent.getNodeOptions(node, options);
			},

			/** Apply the given snapshot to the given dom object */
			apply: function(dom, snapshot, options) {
				var value, i;

				/* Select options */
				if (options.selectOptions) {
					/* This must come before the setValue, as the select's options need to be setup before
					 * its value can be set.
					 */
					value = getNestedProperty(snapshot, options.selectOptions);
					if (value !== undefined) {
						var selectedValue = dom.selectedIndex !== -1 ? dom.options[dom.selectedIndex].value : undefined;
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
				if (options.key) {
					/* Key */
					value = getNestedProperty(snapshot, options.key);
					if (value !== undefined) {
						this.setValue(dom, value);
					}
				} else if (options.template !== undefined && options.template !== null) {
					/* Template - note that "" is a valid template, so we have to use this longer check in the if condition */
					this.setValue(dom, options.template.render(snapshot));
				}

				/* Attributes */
				if (options.attributes) {
					var attrs = options.attributes;
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

				/* Properties */
				if (options.properties) {
					var props = options.properties;
					for (i = 0; i < props.length; i++) {
						value = getNestedProperty(snapshot, props[i].key);
						if (value !== undefined) {
							this.setPropertyValue(dom, props[i].name, value);
						}
					}
				}

				/* Visibility */
				if (options.show) {
					value = getNestedProperty(snapshot, options.show);
					if (value !== undefined) {
						if (value) {
							this.show(dom);
						} else {
							this.hide(dom);
						}
					}
				} else if (options.hide) {
					value = getNestedProperty(snapshot, options.hide);
					if (value !== undefined) {
						if (!value) {
							this.show(dom);
						} else {
							this.hide(dom);
						}
					}
				}

				/* Enabled / disabled */
				if (options.enabled) {
					value = getNestedProperty(snapshot, options.enabled);
					if (value !== undefined) {
						this.setPropertyValue(dom, "disabled", !value);
					}
				}
				if (options.disabled) {
					value = getNestedProperty(snapshot, options.disabled);
					if (value !== undefined) {
						this.setPropertyValue(dom, "disabled", !!value);
					}
				}

				/* Read only */
				if (options.readOnly) {
					value = getNestedProperty(snapshot, options.readOnly);
					if (value !== undefined) {
						this.setPropertyValue(dom, "readOnly", !!value);
					}
				}
				if (options.readWrite) {
					value = getNestedProperty(snapshot, options.readWrite);
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
						dom.checked = (value ? true : false);
					} else if (dom.type === "radio") {
						dom.checked = (value == dom.value);
					} else {
						dom.value = value;
					}
				} else if (nodeName === "SELECT") {
					if (value === null) {
						value = "";
					}
					
					for (var i = 0; i < dom.options.length; i++) {
						if (dom.options[i].value == value) {
							dom.selectedIndex = i;
							break;
						}
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

				if (options.key) {
					value = this.getValue(dom);
					if (value !== undefined) {
						scope.$.set(options.key, value);
					}
				}

				if (options.attributes) {
					var attrs = options.attributes;
					for (i = 0; i < attrs.length; i++) {
						if (attrs[i].key !== undefined) {
							value = this.getAttributeValue(dom, attrs[i].name);
							scope.$.set(attrs[i].key, value);
						}
					}
				}

				if (options.properties) {
					var props = options.properties;
					for (i = 0; i < props.length; i++) {
						value = this.getPropertyValue(dom, props[i].name);
						scope.$.set(props[i].key, value);
					}
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
					return dom.options[dom.selectedIndex].value;
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
		var result = mergeOptions({}, options);

		var nodeName = dom.nodeName;
		if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT") {
			if (result.key === undefined) {
				/* Default key for input and textarea elements */
				result.key = dom.getAttribute("name");
			}
		}

		var settings = Consistent.settings;
		var attrs = dom.attributes;
		for (var i = 0; i < attrs.length; i++) {
			var name = attrs[i].name;
			var value = attrs[i].value;
			var targetAttribute, targetProperty, eventName;
			if (name == settings.keyDataAttribute) {
				/* Body */
				result.key = value;
			} else if (name.indexOf(settings.attributeDataAttributePrefix) === 0) {
				/* Attribute */
				targetAttribute = name.substring(settings.attributeDataAttributePrefix.length);
				addAttribute(targetAttribute, value);
			} else if (name == settings.templateDataAttribute) {
				/* Template */
				assertTemplateEngine();

				result.template = options.templateEngine.compile(value);
			} else if (name == settings.templateIdDataAttribute) {
				/* Template by id */
				assertTemplateEngine();

				result.template = options.templateEngine.compile(templateById(value));
			} else if (name.indexOf(settings.templateAttributeDataAttributePrefix) === 0) {
				/* Attribute template */
				assertTemplateEngine();

				targetAttribute = name.substring(settings.templateAttributeDataAttributePrefix.length);
				addAttributeTemplate(targetAttribute, options.templateEngine.compile(value));
			} else if (name.indexOf(settings.templateIdAttributeDataAttributePrefix) === 0) {
				/* Attribute template by id */
				assertTemplateEngine();

				targetAttribute = name.substring(settings.templateIdAttributeDataAttributePrefix.length);
				addAttributeTemplate(targetAttribute, options.templateEngine.compile(templateById(value)));
			} else if (name.indexOf(settings.propertyDataAttributePrefix) === 0) {
				/* Property */
				targetProperty = name.substring(settings.propertyDataAttributePrefix.length);
				targetProperty = targetProperty.replace(/-/g, ".");
				addProperty(targetProperty, value);
			} else if (name === settings.bindDataAttribute) {
				/* Bind default event */
				eventName = defaultEventName(dom);
				addEvent(eventName, value);
			} else if (name.indexOf(settings.bindDataAttributePrefix) === 0) {
				/* Bind events */
				eventName = name.substring(settings.bindDataAttributePrefix.length).toLowerCase();
				addEvent(eventName, value);
			} else if (name === settings.showDataAttribute) {
				/* Show */
				result.show = value;
			} else if (name === settings.hideDataAttribute) {
				/* Hide */
				result.hide = value;
			} else if (name === settings.repeatDataAttribute) {
				/* Repeat */
				result.repeat = value;
			} else if (name === settings.repeatContainerIdDataAttribute) {
				/* Repeat container id */
				result.repeatContainerId = value;
			} else if (name === settings.enabledDataAttribute) {
				/* Enabled */
				result.enabled = value;
			} else if (name === settings.disabledDataAttribute) {
				/* Disabled */
				result.disabled = value;
			} else if (name === settings.readOnlyDataAttribute) {
				/* Read Only */
				result.readOnly = value;
			} else if (name === settings.readWriteDataAttribute) {
				/* Read Write */
				result.readWrite = value;
			} else if (name === settings.optionsDataAttribute) {
				/* Select options */
				result.selectOptions = value;
			} else if (name.indexOf(settings.warningDataAttributePrefix) === 0) {
				/* Catch all at the end. Catches any attributes that look like they're for Consistent, but
				 * weren't recognized. Log these out to help developers catch errors.
				 */
				if (console.log !== undefined) {
					console.log("Warning: Unrecognised Consistent attribute \"" + name + "\" on " + dom.nodeName + " element.");
				}
			}
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
			if (result.attributes === undefined) {
				result.attributes = [];
			}
		}

		function addAttribute(name, key) {
			prepareAttributes();

			result.attributes.push({
				"name": name,
				"key": key
			});
		}

		function addAttributeTemplate(name, template) {
			prepareAttributes();
			result.attributes.push({
				"name": name,
				"template": template
			});
		}

		function addProperty(name, key) {
			if (result.properties === undefined) {
				result.properties = [];
			}

			result.properties.push({
				"name": name,
				"key": key
			});
		}

		function addEvent(eventName, eventHandlerKey) {
			if (result.events === undefined) {
				result.events = {};
			}
			if (result.events[eventName] === undefined) {
				result.events[eventName] = { keys: [] };
			}
			result.events[eventName].keys.push(eventHandlerKey);
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

	Consistent.defaultEmptyScope = {
		$: {
			_type: SCOPE_TYPE,

			/* The root of the scope */
			_scope: null,

			/* The manager */
			_manager: null,

			/* The index of this scope in a repeating section */
			index: undefined,

			apply: function(options, func) {
				if (typeof options === "function") {
					func = options;
					options = undefined;
				}

				if (func !== undefined) {
					func.call(this._scope, options);
				}

				this._manager.apply(options);
				return this._scope;
			},
			applyLater: function(options, func) {
				if (typeof options === "function") {
					func = options;
					options = undefined;
				}

				if (func !== undefined) {
					func.call(this._scope, options);
				}

				window.clearTimeout(this._scope.$._applyLaterTimeout);
				var self = this;
				this._scope.$._applyLaterTimeout = window.setTimeout(function() {
					self._scope.$.apply(options);
				}, 0);
				return this._scope;
			},
			needsApply: function() {
				return this._manager.needsApply();
			},
			update: function() {
				this._manager.update();
				return this._scope;
			},
			bind: function(dom, options) {
				this._manager.bind(dom, options);
				return this._scope;
			},
			merge: function(object) {
				return merge(this._scope, object);
			},
			replace: function(object) {
				return this._manager.replaceScope(object);
			},
			clear: function() {
				for (var i in this._scope) {
					if (i !== "$") {
						delete this._scope[i];
					}
				}
			},

			/**
			 * Return a plain object with a snapshot of the values from the scope, excluding the $ object
			 * that contains Consistent functionality, any properties with a $ prefix (event handlers) and
			 * replacing any value functions with their current value.
			 * If there is a parent scope, the values from that scope are merged in.
			 */
			snapshot: function(childScope) {
				var temp = this._scope.$.snapshotLocal(childScope);
				if (this.parent()) {
					temp = merge(this.parent().$.snapshot(childScope !== undefined ? childScope : this._scope), temp);
				}
				return temp;
			},

			snapshotLocal: function(childScope) {
				var temp = merge(true, {}, this._scope);

				for (var i in temp) {
					if (i.indexOf("$") === 0) {
						/* Remove handler functions */
						delete temp[i];
					} else if (typeof temp[i] === "function") {
						/* Evaluate value functions */
						temp[i] = temp[i].call(childScope !== undefined ? childScope : this._scope);
					}
				}
				return temp;
			},
			nodes: function() {
				return this._manager._domNodes;
			},
			roots: function() {
				return this._manager._rootDomNodes;
			},
			parent: function() {
				return this._manager._parentScope;
			},
			watch: function(key, handler) {
				this._manager.watch(key, handler);
				return this._scope;
			},
			unwatch: function(key, handler) {
				this._manager.unwatch(key, handler);
				return this._scope;
			},
			get: function(key) {
				var local = this.getLocal(key);
				if (local !== undefined) {
					return local;
				} else if (this.parent()) {
					return this.parent().$.get(key);
				} else {
					return undefined;
				}
			},
			getLocal: function(key, evaluateFunctions) {
				var value = getNestedProperty(this._scope, key);

				/* Evaluate value functions */
				if (evaluateFunctions && typeof value === "function") {
					value = value.call(this._scope);
				}

				return value;
			},
			set: function(key, value) {
				var parts = key.split(".");
				var current = this._scope;
				for (var i = 0; i < parts.length - 1; i++) {
					var next = current[parts[i]];
					if (next === undefined) {
						current = current[parts[i]] = {};
					} else {
						current = next;
					}
				}
				current[parts[parts.length - 1]] = value;
				return this._scope;
			},
			getEventHandler: function(key) {
				var local = this.getLocalEventHandler(key);
				if (local !== undefined) {
					return local;
				} else if (this.parent()) {
					return this.parent().$.getEventHandler(key);
				} else {
					return undefined;
				}
			},
			getLocalEventHandler: function(key) {
				key = mungeEventHandlerPropertyName(key);
				return this.getLocal(key, false);
			},
			setEventHandler: function(key, value) {
				key = mungeEventHandlerPropertyName(key);
				return this.set(key, value);
			},
			options: function(dom) {
				return this._manager.getOptions(dom);
			}
		}
	};

	/**
	 * Event handler property names get the final part (parts are separated by dots) prefixes
	 * with a $, so we can distinguish from other value-functions in the scope.
	 */
	function mungeEventHandlerPropertyName(name) {
		var parts = name.split(".");
		var result = "";
		for (var i = 0; i < parts.length - 1; i++) {
			result += parts[i] + ".";
		}
		var lastPart = parts[parts.length - 1];
		if (lastPart.indexOf("$") !== 0) {
			result += "$" + lastPart;
		} else {
			result += lastPart;
		}
		return result;
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
		if (seen.indexOf(aObject) !== -1 || seen.indexOf(bObject) !== -1) {
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

	function cloneScope(scope) {
		var result = mergeOptions({}, scope);
		result.$._scope = result;
		return result;
	}

	ConsistentScopeManager.prototype = new Object();

	var scopeId = 0;
	var functionId = 0;
	var WATCH_ALL_KEY = "$all";

	function ConsistentScopeManager(parentScope, options) {
		this._id = "ConsistentScope" + scopeId;
		scopeId++;

		this._parentScope = parentScope;
		this._options = options;
		this._nodes = [];
		this._domNodes = [];
		this._rootDomNodes = [];
		this._watchers = {};
		this._nodesDirty = false;
		this._applying = false;

		this._scope = mergeOptions({}, Consistent.defaultEmptyScope);
		this._scope.$._manager = this;
		this._scope.$._scope = this._scope;

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
			for (var i = 0; i < n; i++) {
				var node = this._nodes[i];
				var nodeOptions = options !== undefined ? mergeOptions({}, node.options, options) : node.options;
				nodeOptions.$.apply(node.dom, this._cleanScopeSnapshot, nodeOptions);

				/* Repeating */
				if (nodeOptions.repeat) {
					this._handleRepeat(node, nodeOptions, this._cleanScopeSnapshot);
				}
			}

			this._nodesDirty = false;

			/* Apply parent scope */
			if (this._parentScope) {
				this._parentScope.$.apply(options);
			}

			var scopeOptions = options !== undefined ? mergeOptions({}, this._options, options) : this._options;
			scopeOptions.$.afterApply(this._scope, this._cleanScopeSnapshot);
		}

		this._applying = false;
	};

	ConsistentScopeManager.prototype._handleRepeat = function(node, options, snapshot) {
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
		var repeatKey = options.repeat;
		var i;

		var repeatData = node.repeatData;
		if (repeatData === undefined) {
			/* Initialise repeat for this node */
			repeatData = { version: 0, items: [] };

			if (options.repeatContainerId) {
				var source = document.getElementById(options.repeatContainerId);
				if (source !== null) {
					repeatData.domNodes = source.children;
				} else {
					throw new ConsistentException("Couldn't find element with id \"" + options.repeatId + "\" for repeat container.");
				}
			} else {
				repeatData.domNodes = [ node.dom.cloneNode(true) ];
			}
			for (i = 0; i < repeatData.domNodes.length; i++) {
				repeatData.domNodes[i].removeAttribute(Consistent.settings.repeatDataAttribute);
				repeatData.domNodes[i].removeAttribute(Consistent.settings.repeatContainerIdDataAttribute);
			}
			node.repeatData = repeatData;

			var replacement = document.createComment("Consistent repeat " + repeatKey);
			node.dom.parentNode.insertBefore(replacement, node.dom);
			node.dom.parentNode.removeChild(node.dom);
			replacement[Consistent.settings.scopeIdKey] = this._id;
			node.dom = replacement;

			repeatData.insertBefore = document.createComment("/Consistent repeat " + repeatKey);
			node.dom.parentNode.insertBefore(repeatData.insertBefore, replacement.nextSibling);
		}

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
				removeDomNodes(item.domNodes);
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

		function removeDomNodes(domNodes) {
			for (var i = 0; i < domNodes.length; i++) {
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
					if (dirty.indexOf(key) === -1) {
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
				if (notifying[watcherId] === undefined || notifying[watcherId].cleanValue !== newValue) {
					watcher.call(scope, key, newValue, oldValue);

					/* Record clean value from the actual scope, as that will contain any changes this function made */
					notifying[watcherId] = { cleanValue: scope.$.get(key) };
					notified = true;
				}
			}
		}

		if (this._parentScope) {
			this._parentScope.$._manager._notifyWatchers(key, newValue, oldValue, scope, notifyingState);
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
				if (notifying[watcherId] === undefined || differentKeys(scopeSnapshot, notifying[watcherId].cleanScopeSnapshot).length !== 0) {
					watchers[i].call(scope, keys, scopeSnapshot, oldScopeSnapshot);
					
					/* Record clean snapshot from the actual scope, as that will contain any changes this function made */
					notifying[watcherId] = { cleanScopeSnapshot: scope.$.snapshot() };
					notified = true;
				}
			}
		}

		if (this._parentScope) {
			this._parentScope.$._manager._notifyWatchAlls(keys, scope, scopeSnapshot, oldScopeSnapshot, notifyingState);
		}

		return notified;
	};

	/**
	 * Acquire a new DOM node in this scope.
	 */
	ConsistentScopeManager.prototype.bind = function(dom, options, parentDom) {
		if (isArray(dom)) {
			for (var i = 0; i < dom.length; i++) {
				this.bind(dom[i], options, parentDom);
			}
			return;
		}

		/* Check this node is not already bound */
		if (dom[Consistent.settings.scopeIdKey] !== this._id) {
			var nodeOptions = mergeOptions({}, this._options, options);
			nodeOptions = nodeOptions.$.getNodeOptions(dom, nodeOptions);

			this._nodes.push({ dom: dom, options: nodeOptions });
			this._domNodes.push(dom);
			if (parentDom === undefined) {
				this._rootDomNodes.push(dom);
			}
			this._nodesDirty = true;

			dom[Consistent.settings.scopeIdKey] = this._id;

			var self = this;

			/* Bind events */
			for (var eventName in nodeOptions.events) {
				(function(eventName, keys) {
					var listener = function(ev) {
						for (var i = 0; i < keys.length; i++) {
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
								if (typeof func === "function") {
									throw new ConsistentException("Bound \"" + eventName + 
										"\" event wanted scope function in key \"" + mungeEventHandlerPropertyName(key) + 
										"\", there was one in \"" + key + "\" which is missing the $ and is possibly a mistake.");
								} else {
									throw new ConsistentException("Bound \"" + eventName + 
										"\" event wanted scope function in key \"" + mungeEventHandlerPropertyName(key) +
										"\"");
								}
							}
						}
					};
					nodeOptions.events[eventName].listener = listener;
					if (dom.addEventListener) {
						dom.addEventListener(eventName, listener, false);
					} else if (dom.attachEvent) {
						dom.attachEvent("on" + eventName, listener);
					} else {
						throw new ConsistentException("Unable to attach event to DOM node. Cannot find supported method.");
					}
				})(eventName, nodeOptions.events[eventName].keys);
			}

			/* Handle specific nodes differently */
			var nodeName = dom.nodeName;
			if (nodeOptions.autoListenToChange && (nodeName === "INPUT" || 
				nodeName === "TEXTAREA" || nodeName === "SELECT")) {
				/* For input and textarea nodes we bind to their change event by default. */
				var listener = function(ev) {
					nodeOptions.$.update(dom, self._scope, nodeOptions);
					self._scope.$.apply();
				};
				dom.addEventListener("change", listener, false);

				nodeOptions.$._changeListener = listener;
			}
		}

		/* Bind children */
		var child = dom.firstChild;
		while (child !== null) {
			if (child.nodeType === 1) {
				this.bind(child, options, dom);
			}
			child = child.nextSibling;
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

		i = this._domNodes.indexOf(dom);
		if (i !== -1) {
			var node = this._nodes[i];
			var options = node.options;

			/* Unbind events */
			for (var eventName in options.events) {
				dom.removeEventListener(eventName, options.events[eventName].listener, false);
			}

			/* Unbind changes */
			if (options.$._changeListener !== undefined) {
				dom.removeEventListener("change", options.$._changeListener, false);
			}

			this._domNodes.slice(i, 1);
			this._nodes.slice(i, 1);
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

	ConsistentScopeManager.prototype.nodes = function() {
		return _domNodes;
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
			var i = watchers.indexOf(callback);
			watchers.splice(i, 1);
		}
	};

	ConsistentScopeManager.prototype.getOptions = function(dom) {
		for (var i = 0; i < this._nodes.length; i++) {
			if (this._nodes[i].dom === dom) {
				return this._nodes[i].options;
			}
		}
		return null;
	};

	ConsistentScopeManager.prototype.replaceScope = function(newScope) {
		newScope.$ = this._scope.$;
		newScope.$._scope = newScope;
		this._scope = newScope;
		return newScope;
	};


	/* Exceptions */

	ConsistentException.prototype = new Error();

	function ConsistentException(message) {
		this._message = message;
	}

	ConsistentException.prototype.toString = function() {
		return "Consistent.js exception: " + this._message;
	};

})(window);

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++) {
            if (i in this && this[i]===find) {
                return i;
            }
        }
        return -1;
    };
}
