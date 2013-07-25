/*! 
 * consistent.js 0.1
 * @author Karl von Randow
 */

(function($, undefined) {
	var defaultOptions = {
		templateEngine: null
	};

	var scopes = {};

	$.consistent = function(scopeName, options) {
		
		if (typeof scopeName === typeof undefined) {
			console.log("no scope");
		} else {
			var scope = scopes[scopeName];
			if (typeof scope === typeof undefined) {
				options = $.extend({}, defaultOptions, options);

				scope = new ConsistentScope(scopeName, options);
				scopes[scopeName] = scope;
			} else if (options !== undefined) {
				throw new ConsistentException("Scope \"" + scopeName + "\" already created, but attempted to recreate with options.");
			}
			return scope._model;
		}
	};

	var $consistent = $.consistent;

	$.extend($.consistent, {
		settings: {
			defaultKeyDataAttribute: "data-consistent-key",
			defaultTemplateDataAttribute: "data-consistent-template",
			defaultAttributeDataAttributePrefix: "data-consistent-attribute-"
		}
	});


	/* DOM node acquisition */
	/* TODO consider whether we should have separate defaultDOMOptions for the different nodeNames,
	   rather than detecting at runtime.
	 */

	var defaultDOMOptions = {

		/** Apply the given model object to the given dom object */
		'apply': function(dom, data, model, options) {
			var key = this.key(dom, data);
			if (typeof key !== typeof undefined) {
				this.applyValue(dom, model[key]);
			}

			/* Apply to attributes */
			if (data.attributes != null) {
				var attrs = data.attributes;
				for (var i = 0; i < attrs.length; i++) {
					var value = model[attrs[i].key];
					if (value != null) {
						dom.setAttribute(attrs[i].name, value);
					} else {
						dom.removeAttribute(attrs[i].name);
					}
				}
			}

			/* Template */
			if (data.template != null) {
				this.applyValue(dom, data.template.render(model));
			}
		},

		/** Apply the given value to the given dom object */
		'applyValue': function(dom, value) {
			var nodeName = dom.nodeName;
			if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
				dom.value = value;
			} else {
				dom.innerHTML = value;
			}
		},

		/** Update the given model with the given dom object */
		'update': function(dom, data, model, options) {
			var key = this.key(dom, data);
			if (typeof key !== typeof undefined) {
				var value = this.getValue(dom);
				model[key] = value;
			}
		},

		/** Get the current value from the given dom object */
		'getValue': function(dom) {
			var nodeName = dom.nodeName;
			if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
				return dom.value;
			} else {
				return dom.innerHTML;
			}
		},

		/** Get the model key from the given dom object */
		'key': function(dom, data) {
			if (data.key !== null)
				return data.key;

			var nodeName = dom.nodeName;
			if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
				return dom.getAttribute("name");
			} else {
				return undefined;
			}
		}
	};

	$.fn.consistent = function(scopeName, options) {
		options = $.extend({}, defaultDOMOptions, options);

		var self = this;
		if (typeof scopeName === typeof undefined) {
			console.log("no scope");
		} else {
			var scope = scopes[scopeName];
			if (typeof scope !== typeof undefined) {
				self.each(function() {
					scope.acquire(this, options);
				});
			} else {
				console.log("no such scope " + scopeName);
			}
		}
	};

	function nodeData(dom, options) {
		var data = {};

		var attrs = dom.attributes;
		for (var i = 0; i < attrs.length; i++) {
			var name = attrs[i].name;
			if (name == $consistent.settings.defaultKeyDataAttribute) {
				/* Key */
				data.key = attrs[i].value;
			} else if (name.indexOf($consistent.settings.defaultAttributeDataAttributePrefix) === 0) {
				/* Attribute */
				var targetAttribute = name.substring($consistent.settings.defaultAttributeDataAttributePrefix.length);
				if (data.attributes == null)
					data.attributes = [];
				data.attributes.push({
					"name": targetAttribute,
					"key": attrs[i].value
				});
			} else if (name == $consistent.settings.defaultTemplateDataAttribute) {
				/* Template */
				if (options.templateEngine != null) {
					data.template = options.templateEngine.compile(attrs[i].value);
				} else {
					throw new ConsistentException("Template specified but no templateEngine configured in options");
				}
			}
		}
			
		return data;
	}


	/* Scope */

	var internalScopeKeys = [
		"apply"
	];

	ConsistentScope.prototype = new Object();

	function ConsistentScope(scopeName, options) {
		this._scopeName = scopeName;
		this._options = options;
		this._nodes = [];

		var self = this;
		this._model = {
			'apply': function() {
				self.apply();
			}
		};
	}

	ConsistentScope.prototype.apply = function() {
		var n = this._nodes.length;
		for (var i = 0; i < n; i++) {
			var node = this._nodes[i];
			node.options.apply(node.dom, node.data, this._model, this._options);
		}
	};

	ConsistentScope.prototype.acquire = function(dom, options) {
		var data = nodeData(dom, $.extend({}, this._options, options));

		this._nodes.push({ 'dom': dom, 'data': data, 'options': options });

		var nodeName = dom.nodeName;
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
			var self = this;

			dom.addEventListener("change", function(ev) {
				options.update(dom, data, self._model, self._options);
				self.apply();
			}, false);
		}
	};

	ConsistentException.prototype = new Object();

	function ConsistentException(message) {
		this._message = message;
	}

	ConsistentException.prototype.toString = function() {
		return "Consistent.js exception: " + this._message;
	};

})(jQuery);
