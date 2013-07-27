/*! 
 * consistent.js 0.1
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

(function(window, undefined) {

	/**
	 * Single point of entry for Consistent.
	 * @argument None, just create a new Consistent scope and return it.
	 * @argument An existing Consistent scope, create a child scope and return it. Optionally followed by a second argument for options.
	 * @argument An object containing key value pairs, used for the configuration of the new scope.
	 */
	var Consistent = window.Consistent = function(parentScope, options) {
		if (parentScope !== undefined) {
			if (parentScope["$type"] != "ConsistentScope") {
				if (options === undefined) {
					options = parentScope;
					parentScope = null;
				}
			}
		} else {
			parentScope = null;
		}

		if (typeof parentScope !== "object") {
			throw new ConsistentException("First argument to Consistent was neither a parent scope or an options object.");
		}

		options = merge({}, Consistent.defaultOptions, options);

		var scope = new ConsistentScope(parentScope, options);
		return scope._model;
	};

	merge(Consistent, {
		settings: {
			defaultKeyDataAttribute: "data-consistent-key",
			defaultTemplateDataAttribute: "data-consistent-template",
			defaultAttributeDataAttributePrefix: "data-consistent-attribute-",
			defaultTemplateAttributeDataAttributePrefix: "data-consistent-template-attribute-"
		}
	});

	function merge() {
		var target = arguments[0];
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var name in source) {
				var value = source[name];
				if (value !== undefined) {
					target[name] = value;
				}
			}
		}
		return target;
	}

	/* Node data */

	Consistent.defaultNodeOptions = function(dom, options) {
		var result = merge({}, options);

		var attrs = dom.attributes;
		for (var i = 0; i < attrs.length; i++) {
			var name = attrs[i].name;
			if (name == Consistent.settings.defaultKeyDataAttribute) {
				/* Key */
				result.key = attrs[i].value;
			} else if (name.indexOf(Consistent.settings.defaultAttributeDataAttributePrefix) === 0) {
				/* Attribute */
				var targetAttribute = name.substring(Consistent.settings.defaultAttributeDataAttributePrefix.length);
				if (result.attributes === undefined)
					result.attributes = [];
				result.attributes.push({
					"name": targetAttribute,
					"key": attrs[i].value
				});
			} else if (name == Consistent.settings.defaultTemplateDataAttribute) {
				/* Template */
				if (options.templateEngine != null) {
					result.template = options.templateEngine.compile(attrs[i].value);
				} else {
					throw new ConsistentException("Template specified but no templateEngine configured in options");
				}
			} else if (name.indexOf(Consistent.settings.defaultTemplateAttributeDataAttributePrefix) === 0) {
				/* Attribute template */
				if (options.templateEngine != null) {
					var targetAttribute = name.substring(Consistent.settings.defaultTemplateAttributeDataAttributePrefix.length);
					if (result.attributes === undefined)
						result.attributes = [];
					result.attributes.push({
						"name": targetAttribute,
						"template": options.templateEngine.compile(attrs[i].value)
					});
				} else {
					throw new ConsistentException("Attribute template specified but no templateEngine configured in options");
				}
			}
		}
			
		return result;
	};

	/* DOM node acquisition */
	/* TODO consider whether we should have separate defaultDOMOptions for the different nodeNames,
	   rather than detecting at runtime.
	 */

	Consistent.defaultOptions = {

		templateEngine: null,

		"$": {
			nodeOptions: function(node, options) {
				return Consistent.defaultNodeOptions(node, options);
			},

			/** Apply the given model object to the given dom object */
			apply: function(dom, model, options) {
				// TODO key is the only thing we allow a function to override, should allow override for other data points?
				var key = this.key(dom, options);
				if (typeof key !== typeof undefined) {
					this.applyValue(dom, model[key]);
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

				/* Template */
				if (options.template != null) {
					this.applyValue(dom, options.template.render(model));
				}
			},

			/** Apply the given value to the given dom object */
			applyValue: function(dom, value) {
				var nodeName = dom.nodeName;
				if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
					dom.value = value;
				} else {
					dom.innerHTML = value;
				}
			},

			/** Update the given model with the given dom object */
			update: function(dom, model, options) {
				var key = this.key(dom, options);
				if (typeof key !== typeof undefined) {
					var value = this.getValue(dom);
					model[key] = value;
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

			/** Get the model key from the given dom object */
			key: function(dom, options) {
				if (options.key !== undefined)
					return options.key;

				var nodeName = dom.nodeName;
				if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
					return dom.getAttribute("name");
				} else {
					return undefined;
				}
			}
		}

	};


	/* Scope */

	ConsistentScope.prototype = new Object();

	function ConsistentScope(parentScope, options) {
		this["$type"] = "ConsistentScope";
		this._parentScope = parentScope;
		this._options = options;
		this._nodes = [];
		this._domNodes = [];
		this._watchers = {};

		var self = this;
		this._model = {
			"$": {
				apply: function() {
					self.apply();
				},
				applyLater: function() {
					window.clearTimeout(self._model.$._applyLaterTimeout);
					self._model.$._applyLaterTimeout = window.setTimeout(self._model.$.apply, 0);
				},
				acquire: function(dom, options) {
					self.acquire(dom, options);
				},
				nodes: function() {
					return self._domNodes;
				},
				watch: function(key, callback) {
					return self.watch(key, callback);
				},
				unwatch: function(key, callback) {
					return self.unwatch(key, callback);
				}
			}
		};
		this._cleanModel = this._model;
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
				this.notifyWatchers(key, value, cleanValue);
			}
		}

		this._cleanModel = merge({}, this._model);
	};

	ConsistentScope.prototype.notifyWatchers = function(key, newValue, oldValue) {
		var watchers = this._watchers[key];
		if (watchers !== undefined) {
			for (var i = 0; i < watchers.length; i++) {
				watchers[i].call(this._model, key, newValue, oldValue);
			}
		}
	};

	/**
	  * Update the scope from the DOM.
	  */
	ConsistentScope.prototype.update = function() {
		// TODO
	};

	/**
	 * Acquire a new DOM node in this scope.
	 */
	ConsistentScope.prototype.acquire = function(dom, options) {
		options = merge({}, this._options, options);
		options = options.$.nodeOptions(dom, options);

		this._nodes.push({ 'dom': dom, 'options': options });
		this._domNodes.push(dom);

		var nodeName = dom.nodeName;
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
			var self = this;

			dom.addEventListener("change", function(ev) {
				options.$.update(dom, self._model, options);
				self.apply();
			}, false);
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
