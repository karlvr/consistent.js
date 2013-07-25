/*! 
 * consistent.js 0.1
 * @author Karl von Randow
 */

(function($, undefined) {
	var defaultOptions = {

	};

	var scopes = {};

	$.consistent = function(scopeName, options) {
		options = $.extend({}, defaultOptions, options);
		
		if (typeof scopeName === typeof undefined) {
			console.log("no scope");
		} else {
			var scope = scopes[scopeName];
			if (typeof scope === typeof undefined) {
				scope = new ConsistentScope(scopeName);
				scopes[scopeName] = scope;
			}
			return scope._model;
		}
	};

	var $consistent = $.consistent;

	$.extend($.consistent, {
		settings: {
			defaultKeyDataAttribute: "data-consistent-key"
		}
	});


	/* DOM node acquisition */
	/* TODO consider whether we should have separate defaultDOMOptions for the different nodeNames,
	   rather than detecting at runtime.
	 */

	var defaultDOMOptions = {

		/** Apply the given model object to the given dom object */
		'apply': function(dom, model) {
			var key = this.key(dom);
			if (typeof key !== typeof undefined) {
				this.applyValue(dom, model[key]);
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
		'update': function(dom, model) {
			var key = this.key(dom);
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
		'key': function(dom) {
			var nodeName = dom.nodeName;
			if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
				return dom.getAttribute("name");
			} else {
				var key = dom.getAttribute($consistent.settings.defaultKeyDataAttribute);
				if (typeof key !== typeof undefined) {
					return key;
				}
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


	/* Scope */

	var internalScopeKeys = [
		"apply"
	];

	ConsistentScope.prototype = new Object();

	function ConsistentScope(scopeName) {
		this._scopeName = scopeName;
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
			console.log("applying to", node.dom);
			node.options.apply(node.dom, this._model);
		}
	};

	ConsistentScope.prototype.acquire = function(dom, options) {
		this._nodes.push({ 'dom': dom, 'options': options });

		var nodeName = dom.nodeName;
		if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
			var self = this;

			dom.addEventListener("change", function(ev) {
				console.log("change event", ev);
				options.update(dom, self._model);
				self.apply();
			}, false);
		}
	};

})(jQuery);
