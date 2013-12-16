'use strict';

describe('Watch tests', function() {

	it("Simple watch", function() {
		var watchFired = 0;

		var scope = Consistent();
		scope.title = "Consistent.js";
		scope.$.watch("title", function() {
			watchFired++;
		});
		scope.$.apply();

		expect(watchFired).toBe(1);

		scope.title = "Changed";
		expect(watchFired).toBe(1);
		scope.$.apply();
		expect(watchFired).toBe(2);
	});

	it("Watch with parent scope", function() {
		var watchFired = 0;

		var scope = Consistent();
		scope.title = "Consistent.js";
		scope.$.watch("title", function() {
			watchFired++;
		});
		var childScope = Consistent(scope);
		scope.$.apply();

		expect(watchFired).toBe(1);

		childScope.title = "Changed";
		childScope.$.apply();
		// The watch function will be called as it will match the "title" property even in the childScope
		expect(watchFired).toBe(2);

		childScope.subtitle = "New";
		childScope.$.apply();
		expect(watchFired).toBe(2);
	});

});
