'use strict';

describe('Get/set tests', function() {

	it("Simple get", function() {
		var scope = Consistent();

		scope.a = 1;
		expect(scope.$.get("a")).toBe(1);
	});

	it("Simple set", function() {
		var scope = Consistent();

		scope.a = 1;
		expect(scope.$.get("a")).toBe(1);

		scope.$.set("a", 2);
		expect(scope.$.get("a")).toBe(2);
	});

	it("Get with value function", function() {
		var scope = Consistent();

		scope.a = function() {
			return 1;
		};

		expect(scope.$.get("a")).toBe(1);
	});

	it("Set with value function", function() {
		var scope = Consistent();

		scope.a = function() {
			return 1;
		};

		expect(scope.$.get("a")).toBe(1);

		scope.$.set("a", 2);
		// Expect it not to change as value function doesn't support set
		expect(scope.$.get("a")).toBe(1);
	});

	it("Set with value function that supports setting", function() {
		var scope = Consistent();

		var myValue = 1;
		scope.a = function(scope, newValue) {
			if (newValue !== undefined) {
				myValue = newValue;
			} else {
				return myValue;
			}
		};

		expect(scope.$.get("a")).toBe(1);

		scope.$.set("a", 2);
		expect(scope.$.get("a")).toBe(2);
	});

	it("Parent scope get", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);

		scope.a = 1;

		expect(childScope.$.get("a")).toBe(1);
	});

	it("Parent scope set", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);

		scope.a = 1;

		expect(childScope.$.get("a")).toBe(1);

		childScope.$.set("a", 2);
		expect(childScope.$.get("a")).toBe(2);

		// But it has created the property in the childScope, so the parent scope still exists

		expect(scope.$.get("a")).toBe(1);
	});

	it("Parent scope get with value function", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);
		
		scope.a = function() {
			return 1;
		};

		expect(childScope.$.get("a")).toBe(1);
	});

	it("Parent scope set with value function", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);
		
		scope.a = function() {
			return 1;
		};

		expect(childScope.$.get("a")).toBe(1);

		childScope.$.set("a", 2);
		// As the value function exists, it attempts to set it (and can't) but doesn't create a new
		// property to override
		expect(childScope.$.get("a")).toBe(1);		
	});

	it("Parent scope set with value function that supports setting", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);
		
		var myValue = 1;
		scope.a = function(localScope, newValue) {
			if (newValue !== undefined) {
				myValue = newValue;
			} else {
				return myValue;
			}
		};

		expect(childScope.$.get("a")).toBe(1);

		childScope.$.set("a", 2);
		expect(childScope.$.get("a")).toBe(2);	
		expect(scope.$.get("a")).toBe(2);		
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
		expect(scope.$.get("a")).toBe(21);
	});

	it("Parent scope set with scope accessing value function", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);
		
		scope.b = 3;
		childScope.b = 5;
		scope.a = function(localScope, newValue) {
			if (newValue !== undefined) {
				localScope.b = newValue / 7;
			} else {
				return localScope.b * 7;
			}
		};

		expect(childScope.$.get("a")).toBe(35);

		childScope.$.set("a", 49);
		expect(childScope.$.get("a")).toBe(49);

		expect(scope.$.get("a")).toBe(21);
	});

	it("Get with nested properties", function() {
		var scope = Consistent();
		scope.a = {
			b: 3,
			c: 5
		};

		expect(scope.$.get("a.b")).toBe(3);
		expect(scope.$.get("a.c")).toBe(5);
	});

	it("Get with nested array properties", function() {
		var scope = Consistent();
		scope.a = [ 3, 5 ];

		expect(scope.$.get("a.0")).toBe(3);
		expect(scope.$.get("a.1")).toBe(5);
	});

	it("Get with nested array properties with nicer presentation", function() {
		var scope = Consistent();
		scope.a = [ 3, 5 ];

		expect(scope.$.get("a[0]")).toBe(3);
		expect(scope.$.get("a[1]")).toBe(5);
	});

});
