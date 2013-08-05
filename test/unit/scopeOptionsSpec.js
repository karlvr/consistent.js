'use strict';

describe('Scope options tests', function() {

	/* Value functions */

	it("No value function prefix", function() {
		var scope = Consistent();
		scope.value = function() {
			return "success";
		};

		var snapshot = scope.$.snapshot();
		expect(snapshot.value).toBe("success");
	});

	it("Value function prefix with valid function", function() {
		var options = {
			valueFunctionPrefix: "get"
		};
		var scope = Consistent(options);
		scope.getValue = function() {
			return "success";
		};

		var snapshot = scope.$.snapshot();
		expect(snapshot.value).toBe("success");
	});

	it("Value function prefix with mismatched function", function() {
		var options = {
			valueFunctionPrefix: "get"
		};
		var scope = Consistent(options);
		scope.value = function() {
			return "success";
		};

		var snapshot = scope.$.snapshot();
		expect(snapshot.value).toBe(undefined);
	});

	it("Set value function with no value function prefix", function() {
		var scope = Consistent();
		var actualValue = "success";
		scope.value = function(newValue) {
			if (newValue === undefined) {
				return actualValue;
			} else {
				actualValue = newValue;
			}
		};

		expect(scope.$.snapshot().value).toBe("success");

		scope.$.set("value", "better");
		expect(scope.$.snapshot().value).toBe("better");

		actualValue = "best";
		expect(scope.$.snapshot().value).toBe("best");
	});

	it("Set value function prefix with valid function", function() {
		var options = {
			valueFunctionPrefix: "get"
		};
		var scope = Consistent(options);
		var actualValue = "success";
		scope.getValue = function(newValue) {
			if (newValue === undefined) {
				return actualValue;
			} else {
				actualValue = newValue;
			}
		};

		expect(scope.$.snapshot().value).toBe("success");

		scope.$.set("value", "better");
		expect(scope.$.snapshot().value).toBe("better");

		actualValue = "best";
		expect(scope.$.snapshot().value).toBe("best");
	});

	it("Set value function prefix with mismatched function", function() {
		var options = {
			valueFunctionPrefix: "get"
		};
		var scope = Consistent(options);
		var actualValue = "success";
		scope.value = function(newValue) {
			if (newValue === undefined) {
				return actualValue;
			} else {
				actualValue = newValue;
			}
		};

		expect(scope.$.snapshot().value).toBe(undefined);

		/* As the value function is invalid, this will actually replace it */
		scope.$.set("value", "better");
		expect(scope.$.snapshot().value).toBe("better");

		/* To prove the value function is no longer in the scope */
		actualValue = "worse";
		expect(scope.$.snapshot().value).toBe("better");
	});

	/* Event handler */

	it("Default event handler function prefix", function() {
		var scope = Consistent();
		var func = function() {};
		scope.$handleClick = func;
		expect(scope.$.getEventHandler("handleClick")).toBe(func);

		/* Can also request with the prefix */
		expect(scope.$.getEventHandler("$handleClick")).toBe(func);
	});

	it("Event handler function prefix", function() {
		var options = { eventHandlerPrefix: "do" };
		var scope = Consistent(options);
		var func = function() {};
		scope.doHandleClick = func;
		expect(scope.$.getEventHandler("handleClick")).toBe(func);
		expect(scope.$.getEventHandler("HandleClick")).toBe(func);

		/* Can also request with the prefix */
		expect(scope.$.getEventHandler("doHandleClick")).toBe(func);

		/* Not the right prefix */
		expect(scope.$.getEventHandler("$handleClick")).not.toBe(func);
	});

	it("Event handler function prefix not respecting camel-case", function() {
		var options = { eventHandlerPrefix: "do" };
		var scope = Consistent(options);
		var func = function() {};
		scope.dohandleClick = func;
		expect(scope.$.getEventHandler("handleClick")).not.toBe(func);
		expect(scope.$.getEventHandler("HandleClick")).not.toBe(func);

		/* Can also request with the prefix */
		expect(scope.$.getEventHandler("dohandleClick")).toBe(func);
	});

});
