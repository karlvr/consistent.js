'use strict';

describe('Scope options tests', function() {

	it("No value function prefix", function() {
		var scope = Consistent();
		scope.value = function() {
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

	it("Value function prefix with valid function", function() {
		var options = {
			valueFunctionPrefix: "get"
		};
		var scope = Consistent(options);
		scope.getValue = function() {
			return "success";
		};

		var snapshot = scope.$.snapshot();
		expect(snapshot.getValue).toBe("success");
	});

});
