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

		/* Functions that aren't a value function and not an eventHandlerPrefix are not removed */
		expect(snapshot.value).toBe(scope.value);
	});

	it("Set value function with no value function prefix", function() {
		var scope = Consistent();
		var actualValue = "success";
		scope.value = function(scope, newValue) {
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
		scope.getValue = function(scope, newValue) {
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

		/* Functions that don't match an eventHandlerPrefix or valueFunctionPrefix are not removed
		 * from the snapshot.
		 */
		expect(scope.$.snapshot().value).not.toBe(undefined);

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
		scope.$.controller("handleClick", func);
		expect(scope.$.controller("handleClick")).not.toBe(undefined);

		/* Can't request with the prefix */
		expect(scope.$.controller("$handleClick")).toBe(undefined);
	});

	it("Event handler function prefix", function() {
		var options = { eventHandlerPrefix: "do" };
		var scope = Consistent(options);
		var func = function() {};
		scope.$.controller().doHandleClick = func;
		expect(scope.$.controller("handleClick")).not.toBe(undefined);
		expect(scope.$.controller("HandleClick")).not.toBe(undefined);

		/* Can't request with the prefix */
		expect(scope.$.controller("doHandleClick")).toBe(undefined);

		/* Not the right prefix */
		expect(scope.$.controller("$handleClick")).toBe(undefined);
	});

	it("Event handler function prefix is implicit", function() {
		var options = { eventHandlerPrefix: "do" };
		var scope = Consistent(options);
		var func = function() {};
		scope.$.controller("handleClick", func);
		expect(scope.$.controller("handleClick")).not.toBe(undefined);
		expect(scope.$.controller("HandleClick")).not.toBe(undefined);

		/* Can't request with the prefix */
		expect(scope.$.controller("doHandleClick")).toBe(undefined);

		/* Not the right prefix */
		expect(scope.$.controller("$handleClick")).toBe(undefined);
	});

	it("Event handler function prefix not respecting camel-case", function() {
		var options = { eventHandlerPrefix: "do" };
		var scope = Consistent(options);
		var func = function() {};
		scope.dohandleClick = func;
		expect(scope.$.controller("handleClick")).not.toBe(func);
		expect(scope.$.controller("HandleClick")).not.toBe(func);

		/* Can't request with the prefix */
		expect(scope.$.controller("dohandleClick")).toBe(undefined);
	});

});
