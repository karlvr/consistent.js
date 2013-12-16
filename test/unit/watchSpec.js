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

	it("Watch for array property", function() {
		var changedKeys = [];

		var scope = Consistent();
		scope.todos = [ "Learn Portugese", "Wash dog", "Wash car" ];
		scope.$.watch("todos", function(scope, key) {
			changedKeys.push(key);
		});
		scope.$.apply(); // Fires the watch handler as the todos array is added

		expect(changedKeys.length).toBe(1);
		expect(changedKeys[0]).toBe("todos");

		scope.todos.shift(); // Removes the first todo
		scope.$.apply(); // Fires the watch handler again, another change
		expect(changedKeys.length).toBe(2);
		expect(changedKeys[1]).toBe("todos");
	});

	/**
	 * This simulates a repeating block. This tests that we can handle scopes as changed things.
	 */
	it("Watch for nested scopes", function() {
		var changedKeys = [];

		var scope = Consistent();
		scope.todos = [ new Consistent(scope), new Consistent(scope), new Consistent(scope) ];
		scope.$.watch("todos", function(localScope, key) {
			if (localScope === scope) {
				changedKeys.push(key);
			}
		});
		scope.$.apply(); // Fires the watch handler as the todos array is added

		expect(changedKeys.length).toBe(1);
		expect(changedKeys[0]).toBe("todos");

		scope.todos[0].value = true;
		scope.$.apply();

		expect(changedKeys.length).toBe(2);
		expect(changedKeys[1]).toBe("todos");
	});

	it("Watch an array index", function() {
		var scope = Consistent();
		scope.strings = [ "a", "b", "c" ];
		scope.$.apply();

		var changes = 0;
		scope.$.watch("strings[1]", function() {
			changes++;
		});

		scope.strings[0] = "d";
		scope.$.apply();

		expect(changes).toBe(0);

		scope.strings[1] = "e";
		scope.$.apply();

		expect(changes).toBe(1);
	});

});
