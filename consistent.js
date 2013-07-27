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
	 * * A dom node; returns the scope that acquired that node, or null.
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

	merge(Consistent, {
		settings: {
			defaultKeyDataAttribute: "data-ct",
			defaultTemplateDataAttribute: "data-ct-tmpl",
			defaultTemplateIdDataAttribute: "data-ct-tmpl-id",
			defaultAttributeDataAttributePrefix: "data-ct-attr-",
			defaultTemplateAttributeDataAttributePrefix: "data-ct-tmpl-attr-",
			defaultTemplateIdAttributeDataAttributePrefix: "data-ct-tmpl-id-attr-",
			defaultBindDataAttributePrefix: "data-ct-bind-",

			scopeIdKey: "__ConsistentScopeID"
		},

		isScope: function(object) {
			return object !== undefined && object.$ !== undefined && object.$.type === "ConsistentScope";
		},

		createScope: function(parentScope, options) {
			/* Create scope */
			options = merge({}, Consistent.defaultOptions, options);

			var scope = new ConsistentScope(parentScope, options);
			scopes[scope._id] = scope;
			return scope._model;
		},

		findScopeForNode: function(dom) {
			var scopeId = dom[Consistent.settings.scopeIdKey];
			if (scopeId !== undefined) {
				return scopes[scopeId]._model;
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
	  * Default options for Consistent.js. This includes the "$" key which contains the functionality used to apply
	  * the model to the DOM.
	  */
	Consistent.defaultOptions = {

		templateEngine: null,

		"$": {
			nodeOptions: function(node, options) {
				return Consistent.nodeOptions(node, options);
			},

			/** Apply the given model object to the given dom object */
			apply: function(dom, model, options) {
				if (options.key !== undefined) {
					/* Key */
					this.applyValue(dom, model[options.key]);
				} else if (options.template !== undefined) {
					/* Template */
					this.applyValue(dom, options.template.render(model));
				}

				/* Apply to attributes */
				if (options.attributes != null) {
					var attrs = options.attributes;
					for (var i = 0; i < attrs.length; i++) {
						var value;
						if (attrs[i].key !== undefined) {
							value = model[attrs[i].key];
						} else if (attrs[i].template !== undefined) {
							value = attrs[i].template.render(model);
						} else {
							value = null;
						}

						if (value != null) {
							dom.setAttribute(attrs[i].name, value);
						} else {
							dom.removeAttribute(attrs[i].name);
						}
					}
				}
			},

			/** Apply the given value to the given dom object */
			applyValue: function(dom, value) {
				if (value === undefined)
					return;

				var nodeName = dom.nodeName;
				if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
					dom.value = value;
				} else {
					dom.innerHTML = value;
				}
			},

			/** Update the given model with the given dom object */
			update: function(dom, model, options) {
				if (options.key !== undefined) {
					var value = this.getValue(dom);
					model[options.key] = value;
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
			}

		}

	};

	/** Default node options function. This extends the provided options with options derived from the dom node such as
	  * in data attributes. This function may be overriden to implement a custom way to discover options from a dom node.
	  * @param options The options given when the scope's acquire method was called and the scope's own options.
	  * @return The merged options based on options discovered from the dom and the given options.
	  */
	Consistent.nodeOptions = Consistent.defaultNodeOptions = function(dom, options) {
		var result = merge({}, options);

		var nodeName = dom.nodeName;
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
			if (result.key === undefined) {
				/* Default key for input and textarea elements */
				result.key = dom.getAttribute("name");
			}
		}

		var attrs = dom.attributes;
		for (var i = 0; i < attrs.length; i++) {
			var name = attrs[i].name;
			var value = attrs[i].value;
			if (name == Consistent.settings.defaultKeyDataAttribute) {
				/* Body */
				result.key = value;
			} else if (name.indexOf(Consistent.settings.defaultAttributeDataAttributePrefix) === 0) {
				/* Attribute */
				var targetAttribute = name.substring(Consistent.settings.defaultAttributeDataAttributePrefix.length);
				prepareAttributes();
				result.attributes.push({
					"name": targetAttribute,
					"key": value
				});
			} else if (name == Consistent.settings.defaultTemplateDataAttribute) {
				/* Template */
				assertTemplateEngine();

				result.template = options.templateEngine.compile(value);
			} else if (name == Consistent.settings.defaultTemplateIdDataAttribute) {
				/* Template by id */
				assertTemplateEngine();

				result.template = options.templateEngine.compile(templateById(value));
			} else if (name.indexOf(Consistent.settings.defaultTemplateAttributeDataAttributePrefix) === 0) {
				/* Attribute template */
				assertTemplateEngine();

				var targetAttribute = name.substring(Consistent.settings.defaultTemplateAttributeDataAttributePrefix.length);
				prepareAttributes();
				result.attributes.push({
					"name": targetAttribute,
					"template": options.templateEngine.compile(value)
				});
			} else if (name.indexOf(Consistent.settings.defaultTemplateIdAttributeDataAttributePrefix) === 0) {
				/* Attribute template by id */
				assertTemplateEngine();

				var targetAttribute = name.substring(Consistent.settings.defaultTemplateIdAttributeDataAttributePrefix.length);
				prepareAttributes();
				result.attributes.push({
					"name": targetAttribute,
					"template": options.templateEngine.compile(templateById(value))
				});
			} else if (name.indexOf(Consistent.settings.defaultBindDataAttributePrefix) === 0) {
				/* Bind events */
				var eventName = name.substring(Consistent.settings.defaultBindDataAttributePrefix.length).toLowerCase();
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

	ConsistentScope.prototype = new Object();

	var scopeId = 0;
	function ConsistentScope(parentScope, options) {
		this._id = "ConsistentScope" + (scopeId++);
		this._parentScope = parentScope;
		this._options = options;
		this._nodes = [];
		this._domNodes = [];
		this._watchers = {};

		var self = this;
		this._model = {
			"$": {
				type: "ConsistentScope",

				apply: function(callback) {
					if (callback !== undefined) {
						callback.call(self._model);
					}

					self.apply();
					return self._model;
				},
				applyLater: function(callback) {
					if (callback !== undefined) {
						callback.call(self._model);
					}

					window.clearTimeout(self._model.$._applyLaterTimeout);
					self._model.$._applyLaterTimeout = window.setTimeout(self._model.$.apply, 0);
					return self._model;
				},
				update: function() {
					self.update();
					return self._model;
				},
				acquire: function(dom, options) {
					self.acquire(dom, options);
					return self._model;
				},
				merge: function(object) {
					return merge(self._model, object);
				},
				export: function(object) {
					var temp = merge({}, self._model);
					delete temp.$;
					return merge(object || {}, temp);
				},
				nodes: function() {
					return self._domNodes;
				},
				parent: function() {
					return self._parentScope;
				},
				watch: function(key, callback) {
					self.watch(key, callback);
					return self._model;
				},
				unwatch: function(key, callback) {
					self.unwatch(key, callback);
					return self._model;
				}
			}
		};
		this._cleanModel = merge({}, this._model);
	}

	/**
	 * Apply the scope's model to the DOM.
	 */
	ConsistentScope.prototype.apply = function() {
		var n = this._nodes.length;
		for (var i = 0; i < n; i++) {
			var node = this._nodes[i];
			node.options.$.apply(node.dom, this._model, node.options);
		}

		/* Look for dirty */
		for (var key in this._model) {
			var value = this._model[key];
			var cleanValue = this._cleanModel[key];
			if (value !== cleanValue) {
				this._notifyWatchers(key, value, cleanValue);
			}
		}

		this._cleanModel = merge({}, this._model);
	};

	/**
	  * Update the scope from the DOM.
	  */
	ConsistentScope.prototype.update = function() {
		var n = this._nodes.length;
		for (var i = 0; i < n; i++) {
			var node = this._nodes[i];
			node.options.$.update(node.dom, this._model, node.options);
		}
	};

	ConsistentScope.prototype._notifyWatchers = function(key, newValue, oldValue) {
		var watchers = this._watchers[key];
		if (watchers !== undefined) {
			for (var i = 0; i < watchers.length; i++) {
				watchers[i].call(this._model, key, newValue, oldValue);
			}
		}
	};

	/**
	 * Acquire a new DOM node in this scope.
	 */
	ConsistentScope.prototype.acquire = function(dom, options) {
		if (dom[Consistent.settings.scopeIdKey] === this._id) {
			/* Already acquired */
			return;
		}

		options = merge({}, this._options, options);
		options = options.$.nodeOptions(dom, options);

		this._nodes.push({ dom: dom, options: options });
		this._domNodes.push(dom);

		dom[Consistent.settings.scopeIdKey] = this._id;

		var self = this;

		/* Bind events */
		for (var eventName in options.events) {
			(function(eventName, keys) {
				var listener = function(ev) {
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						var func = self._model[key];
						if (func !== undefined) {
							var result = self._model[key].call(dom, ev);
							if (result === false)
								break;
						} else {
							throw new ConsistentException("Bound " + eventName + " event wanted model function in key: " + key);
						}
					}
				};
				options.events[eventName].listener = listener;
				dom.addEventListener(eventName, listener, false);
			})(eventName, options.events[eventName].keys);
		}

		/* Bind to changes */
		var nodeName = dom.nodeName;
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
			var listener = function(ev) {
				options.$.update(dom, self._model, options);
				self._model.$.apply();
			};
			dom.addEventListener("change", listener, false);

			options.$._changeListener = listener;
		}

		/* Acquire children */
		var child = dom.firstChild;
		while (child !== null) {
			if (child.nodeType == 1) {
				this.acquire(child, options);
			}
			child = child.nextSibling;
		}
	};

	ConsistentScope.prototype.unacquire = function(dom) {
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

	ConsistentScope.prototype.nodes = function() {
		return _domNodes;
	};

	ConsistentScope.prototype.watch = function(key, callback) {
		var watchers = this._watchers[key];
		if (watchers === undefined) {
			watchers = [];
			this._watchers[key] = watchers;
		}
		watchers.push(callback);
	};

	ConsistentScope.prototype.unwatch = function(key, callback) {
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
