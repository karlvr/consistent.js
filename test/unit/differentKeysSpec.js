'use strict';

describe('Different keys tests', function() {

	it("Simple different keys", function() {
		var scope = Consistent();
		scope.a = "a";

		expect(scope.$.needsApply()).toBe(true);
		scope.$.apply();
		expect(scope.$.needsApply()).toBe(false);

		scope.a = "b";
		expect(scope.$.needsApply()).toBe(true);
		scope.$.apply();
		expect(scope.$.needsApply()).toBe(false);
	});

	it("Null different keys", function() {
		/* This test demonstrates the fix to differentKeys when handling nulls. */
		var scope = Consistent();

		scope.b = null;
		expect(scope.$.needsApply()).toBe(true);
		scope.$.apply();
		expect(scope.$.needsApply()).toBe(false);

		scope.b = { c: "c" };
		expect(scope.$.needsApply()).toBe(true);
		scope.$.apply();
		expect(scope.$.needsApply()).toBe(false);

		scope.b = null;
		expect(scope.$.needsApply()).toBe(true);
		scope.$.apply();
		expect(scope.$.needsApply()).toBe(false);
	});

});
