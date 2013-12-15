'use strict';

describe('Get/set tests', function() {

	it("Simple get", function() {
		var scope = Consistent();

		scope.a = 1;

		expect(scope.$.get("a")).toBe(1);
	});

	it("Get with value function", function() {
		var scope = Consistent();

		scope.a = function() {
			return 1;
		};

		expect(scope.$.get("a")).toBe(1);
	});

	it("Parent scope get", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);

		scope.a = 1;

		expect(childScope.$.get("a")).toBe(1);
	});

	it("Parent scope get with value function", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);
		
		scope.a = function() {
			return 1;
		};

		expect(childScope.$.get("a")).toBe(1);
	});

	it("Parent scope get with scope accessing value function", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);
		
		scope.b = 3;
		childScope.b = 5;
		scope.a = function(localScope) {
			return localScope.b * 7;
		};

		expect(childScope.$.get("a")).toBe(35);
	});

});
