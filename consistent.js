/*! 
 * Consistent.js 0.1
 * @author Karl von Randow
 */
 /*!
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
	 * Arguments be be:
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

	merge(Consistent, {
		settings: {
			keyDataAttribute: "data-ct",
			templateDataAttribute: "data-ct-tmpl",
			templateIdDataAttribute: "data-ct-tmpl-id",
			attributeDataAttributePrefix: "data-ct-attr-",
			propertyDataAttributePrefix: "data-ct-prop-",
			templateAttributeDataAttributePrefix: "data-ct-tmpl-attr-",
			templateIdAttributeDataAttributePrefix: "data-ct-tmpl-id-attr-",
			bindDataAttributePrefix: "data-ct-bind-",

			scopeIdKey: "__ConsistentScopeID"
		},

		isScope: function(object) {
			return object !== undefined && object.$ !== undefined && object.$._type === SCOPE_TYPE;
		},

		createScope: function(parentScope, options) {
			/* Create scope */
			options = mergeOptions({}, Consistent.defaultOptions, options);

			var scope = new ConsistentScopeManager(parentScope, options);
			scopes[scope._id] = scope;
			return scope._scope;
		},

		findScopeForNode: function(dom) {
			var scopeId = dom[Consistent.settings.scopeIdKey];
			if (scopeId !== undefined) {
				return scopes[scopeId]._scope;
			} else {
				return null;
			}
		},

		merge: merge

	});

	function merge() {
		var target = arguments[0];
		if (typeof target !== "object" && typeof target !== "function") {
			throw new ConsistentException("First argument to merge is not appropriate: " + typeof target);
		}
		if (target === null) {
			throw new ConsistentException("First argument to merge is not appropriate: " + target);
		}
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			if (source === undefined) {
				continue;
			}

			if (typeof source !== "object" && typeof source !== "function") {
				throw new ConsistentException("Argument " + (i+1) + " to merge is not appropriate: " + typeof source);
			}
			for (var name in source) {
				var value = source[name];
				if (value !== undefined) {
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
			if (arg != null) {
				$s.push(arguments[i].$);
			}
		}

		/* Correct the first element, as if it is null or undefined the merge will throw an exception */
		if ($s[0] == null) {
			$s[0] = {};
		}

		var result = merge.apply(this, arguments);
		result.$ = merge.apply(this, $s);
		return result;
	}

	/**
	  * Default options for Consistent.js. This includes the "$" key which contains the functionality used to apply
	  * the scope to the DOM.
	  */
	Consistent.defaultOptions = {

		templateEngine: null,

		"$": {
			getNodeOptions: function(node, options) {
				return Consistent.getNodeOptions(node, options);
			},

			/** Apply the given scope object to the given dom object */
			apply: function(dom, scope, options) {
				if (options.key !== undefined) {
					/* Key */
					var value = scope.$.get(options.key);
					if (value !== undefined) {
						this.applyValue(dom, value);
					}
				} else if (options.template !== undefined) {
					/* Template */
					this.applyValue(dom, options.template.render(scope.$.export()));
				}

				/* Apply to attributes */
				if (options.attributes != null) {
					var attrs = options.attributes;
					for (var i = 0; i < attrs.length; i++) {
						var value;
						if (attrs[i].key !== undefined) {
							value = scope.$.get(attrs[i].key);
						} else if (attrs[i].template !== undefined) {
							value = attrs[i].template.render(scope.$.export());
						} else {
							value = null;
						}

						if (value !== undefined) {
							this.applyAttributeValue(dom, attrs[i].name, value);
						}
					}
				}

				/* Apply to properties */
				if (options.properties != null) {
					var props = options.properties;
					for (var i = 0; i < props.length; i++) {
						var value = scope.$.get(props[i].key);
						if (value !== undefined) {
							this.applyPropertyValue(dom, props[i].name, value);
						}
					}
				}
			},

			/** Apply the given value to the given dom object.
			  */
			applyValue: function(dom, value) {
				var nodeName = dom.nodeName;
				if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
					dom.value = value;
				} else {
					dom.innerHTML = value;
				}
			},

			applyAttributeValue: function(dom, name, value) {
				if (value != null) {
					dom.setAttribute(name, value);
				} else {
					dom.removeAttribute(name);
				}
			},

			applyPropertyValue: function(dom, name, value) {
				var parts = name.split(".");
				var current = dom;
				for (var i = 0; i < parts.length - 1; i++) {
					current = current[parts[i]];
				}
				current[parts[parts.length - 1]] = value;
			},

			/** Update the given scope with the given dom object */
			update: function(dom, scope, options) {
				if (options.key !== undefined) {
					var value = this.getValue(dom);
					scope.$.set(options.key, value);
				}

				if (options.attributes != null) {
					var attrs = options.attributes;
					for (var i = 0; i < attrs.length; i++) {
						if (attrs[i].key !== undefined) {
							var value = this.getAttributeValue(dom, attrs[i].name);
							scope.$.set(attrs[i].key, value);
						}
					}
				}

				if (options.properties != null) {
					var props = options.properties;
					for (var i = 0; i < props.length; i++) {
						var value = this.getPropertyValue(dom, props[i].name);
						scope.$.set(props[i].key, value);
					}
				}
			},

			/** Get the current value from the given dom object */
			getValue: function(dom) {
				var nodeName = dom.nodeName;
				if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
					return dom.value;
				} else {
					return dom.innerHTML;
				}
			},

			getAttributeValue: function(dom, name) {
				return dom.getAttribute(name);
			},

			getPropertyValue: function(dom, name) {
				var parts = name.split(".");
				var current = dom;
				for (var i = 0; i < parts.length; i++) {
					current = current[parts[i]];
				}
				return current;
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
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
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
			if (name == settings.keyDataAttribute) {
				/* Body */
				result.key = value;
			} else if (name.indexOf(settings.attributeDataAttributePrefix) === 0) {
				/* Attribute */
				var targetAttribute = name.substring(settings.attributeDataAttributePrefix.length);
				prepareAttributes();
				result.attributes.push({
					"name": targetAttribute,
					"key": value
				});
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

				var targetAttribute = name.substring(settings.templateAttributeDataAttributePrefix.length);
				prepareAttributes();
				result.attributes.push({
					"name": targetAttribute,
					"template": options.templateEngine.compile(value)
				});
			} else if (name.indexOf(settings.templateIdAttributeDataAttributePrefix) === 0) {
				/* Attribute template by id */
				assertTemplateEngine();

				var targetAttribute = name.substring(settings.templateIdAttributeDataAttributePrefix.length);
				prepareAttributes();
				result.attributes.push({
					"name": targetAttribute,
					"template": options.templateEngine.compile(templateById(value))
				});
			} else if (name.indexOf(settings.propertyDataAttributePrefix) === 0) {
				/* Property */
				var targetProperty = name.substring(settings.propertyDataAttributePrefix.length);
				targetProperty = targetProperty.replace(/-/g, ".");

				prepareProperties();
				result.properties.push({
					"name": targetProperty,
					"key": value
				});
			} else if (name.indexOf(settings.bindDataAttributePrefix) === 0) {
				/* Bind events */
				var eventName = name.substring(settings.bindDataAttributePrefix.length).toLowerCase();
				prepareEvents(eventName);
				result.events[eventName].keys.push(value);
			}
		}

		function assertTemplateEngine() {
			if (options.templateEngine == null) {
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

		function prepareProperties() {
			if (result.properties === undefined) {
				result.properties = [];
			}
		}

		function prepareEvents(eventName) {
			if (result.events === undefined) {
				result.events = {};
			}
			if (result.events[eventName] === undefined) {
				result.events[eventName] = { keys: [] };
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

			apply: function(callback) {
				if (callback !== undefined) {
					callback.call(this._scope);
				}

				this._manager.apply();
				return this._scope;
			},
			applyLater: function(callback) {
				if (callback !== undefined) {
					callback.call(this._scope);
				}

				window.clearTimeout(this._scope.$._applyLaterTimeout);
				this._scope.$._applyLaterTimeout = window.setTimeout(this._scope.$.apply, 0);
				return this._scope;
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

			/**
			 * Export a plain object with the values from the scope, excluding the $ object.
			 * If there is a parent scope, the values from that scope are merged in.
			 */
			export: function(object) {
				var temp;
				if (this._manager._parentScope != null) {
					temp = merge(this._manager._parentScope.$.export(), this._scope);
				} else {
					temp = merge({}, this._scope);
				}
				delete temp.$;
				return merge(object || {}, temp);
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
			watch: function(key, callback) {
				this._manager.watch(key, callback);
				return this._scope;
			},
			unwatch: function(key, callback) {
				this._manager.unwatch(key, callback);
				return this._scope;
			},
			get: function(key) {
				var local = this.getLocal(key);
				if (local !== undefined) {
					return local;
				} else if (this._manager._parentScope != null) {
					return this._manager._parentScope.$.get(key);
				} else {
					return undefined;
				}
			},
			getLocal: function(key) {
				var parts = key.split(".");
				var current = this._scope;
				for (var i = 0; i < parts.length && current !== undefined; i++) {
					current = current[parts[i]];
				}
				return current;
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
			}
		}
	};

	ConsistentScopeManager.prototype = new Object();

	var scopeId = 0;

	function ConsistentScopeManager(parentScope, options) {
		this._id = "ConsistentScope" + (scopeId++);
		this._parentScope = parentScope;
		this._options = options;
		this._nodes = [];
		this._domNodes = [];
		this._rootDomNodes = [];
		this._watchers = {};

		this._scope = mergeOptions({}, Consistent.defaultEmptyScope);
		this._scope.$._manager = this;
		this._scope.$._scope = this._scope;

		this._cleanScope = merge({}, this._scope);
	}

	/**
	 * Apply the scope to the DOM.
	 */
	ConsistentScopeManager.prototype.apply = function() {
		var n = this._nodes.length;
		for (var i = 0; i < n; i++) {
			var node = this._nodes[i];
			node.options.$.apply(node.dom, this._scope, node.options);
		}

		/* Look for dirty */
		for (var key in this._scope) {
			var value = this._scope[key];
			var cleanValue = this._cleanScope[key];
			if (value !== cleanValue) {
				this._notifyWatchers(key, value, cleanValue);
			}
		}

		this._cleanScope = merge({}, this._scope);
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

	ConsistentScopeManager.prototype._notifyWatchers = function(key, newValue, oldValue) {
		var watchers = this._watchers[key];
		if (watchers !== undefined) {
			for (var i = 0; i < watchers.length; i++) {
				watchers[i].call(this._scope, key, newValue, oldValue);
			}
		}
	};

	/**
	 * Acquire a new DOM node in this scope.
	 */
	ConsistentScopeManager.prototype.bind = function(dom, options, parentDom) {
		if (dom[Consistent.settings.scopeIdKey] === this._id) {
			/* Already bound */
			return;
		}

		options = mergeOptions({}, this._options, options);
		options = options.$.getNodeOptions(dom, options);

		this._nodes.push({ dom: dom, options: options });
		this._domNodes.push(dom);
		if (parentDom === undefined) {
			this._rootDomNodes.push(dom);
		}

		dom[Consistent.settings.scopeIdKey] = this._id;

		var self = this;

		/* Bind events */
		for (var eventName in options.events) {
			(function(eventName, keys) {
				var listener = function(ev) {
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						var func = self._scope.$.get(key);
						if (func !== undefined) {
							var result = func.call(dom, ev, self._scope);
							if (result === false)
								break;
						} else {
							throw new ConsistentException("Bound " + eventName + " event wanted scope function in key: " + key);
						}
					}
				};
				options.events[eventName].listener = listener;
				dom.addEventListener(eventName, listener, false);
			})(eventName, options.events[eventName].keys);
		}

		/* Handle specific nodes differently */
		var nodeName = dom.nodeName;
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
			/* For input and textarea nodes we bind to their change event by default, and we need to use an
			 * alternative applyValue method.
			 */
			var listener = function(ev) {
				options.$.update(dom, self._scope, options);
				self._scope.$.apply();
			};
			dom.addEventListener("change", listener, false);

			options.$._changeListener = listener;
		}

		/* Acquire children */
		var child = dom.firstChild;
		while (child !== null) {
			if (child.nodeType == 1) {
				this.bind(child, options, dom);
			}
			child = child.nextSibling;
		}
	};

	ConsistentScopeManager.prototype.unbind = function(dom) {
		var i = this._domNodes.indexOf(dom);
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
	};

	ConsistentScopeManager.prototype.nodes = function() {
		return _domNodes;
	};

	ConsistentScopeManager.prototype.watch = function(key, callback) {
		var watchers = this._watchers[key];
		if (watchers === undefined) {
			watchers = [];
			this._watchers[key] = watchers;
		}
		watchers.push(callback);
	};

	ConsistentScopeManager.prototype.unwatch = function(key, callback) {
		var watchers = this._watchers[key];
		if (watchers !== undefined) {
			var i = watchers.indexOf(callback);
			watchers.splice(i, 1);
		}
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
