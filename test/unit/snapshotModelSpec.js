'use strict';

describe('Snapshot tests', function() {

	it("Snapshot", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);

		scope.a = 1;
		scope.b = 2;
		childScope.a = 3;
		childScope.c = 4;

		var snapshot = childScope.$.snapshot();
		expect(snapshot.a).toBe(3);
		expect(snapshot.b).toBe(2);
		expect(snapshot.c).toBe(4);
	});

	it("Snapshot local", function() {
		var scope = Consistent();
		var childScope = Consistent(scope);

		scope.a = 1;
		scope.b = 2;
		childScope.a = 3;
		childScope.c = 4;

		var snapshot = childScope.$.snapshot(false);
		expect(snapshot.a).toBe(3);
		expect(snapshot.b).not.toBeDefined();
		expect(snapshot.c).toBe(4);
	});

	it("Snapshot value function", function() {
		var scope = Consistent();

		scope.a = function() { return 9; }

		var snapshot = scope.$.snapshot();
		expect(snapshot.a).toBe(9);
	});

	// it("Snapshot event handler function", function() {
	// 	var scope = Consistent();

	// 	scope.$a = function(ev) {
	// 		return true;
	// 	};

	// 	var snapshot = scope.$.snapshot();
	// 	expect(snapshot.$a).not.toBeDefined();
	// });

	// it("Snapshot event handler function 2", function() {
	// 	var scope = Consistent();

	// 	scope.$a = function(ev) {
	// 		return true;
	// 	};

	// 	var snapshot = scope.$.snapshot();

	// 	/* Event handler function is returned in the snapshot as a */
	// 	expect(snapshot.a).toBe(scope.$a);
	// });

	// it("Snapshot event handler function 3", function() {
	// 	var scope = Consistent();

	// 	scope.$a = function(ev) {
	// 		return true;
	// 	};

	// 	expect(scope.$a).toBe(scope.$a);
	// });

	// it("Snapshot event handler function 4", function() {
	// 	var scope = Consistent();

	// 	scope.$a = function(ev) {
	// 		return true;
	// 	};

	// 	expect(typeof scope.$a).toBe("function");
	// });

	// it("Model event handler function", function() {
	// 	var scope = Consistent();

	// 	scope.$a = function(ec) {}

	// 	var model = scope.$.model();
	// 	expect(model.$a).not.toBeDefined();

	// 	/* Event handler function is not returned in the model */
	// 	expect(model.a).not.toBeDefined();
	// });

	// it("Snapshot event handler prefix", function() {
	// 	var scope = Consistent();

	// 	scope.$a = "abc";

	// 	var snapshot = scope.$.snapshot();
	// 	expect(snapshot.$a).not.toBeDefined();
	// 	expect(snapshot.a).toBe("abc");
	// });

	// it("Model event handler prefix", function() {
	// 	var scope = Consistent();

	// 	scope.$a = "abc";

	// 	var model = scope.$.model();
	// 	expect(model.$a).not.toBeDefined();
	// 	expect(model.a).not.toBeDefined();
	// });

	it("Snapshot value function in parent", function() {
		var parentScope = Consistent();
		var scope = Consistent(parentScope);

		parentScope.a = function() { return this === scope; }

		var snapshot = scope.$.snapshot();

		/* In a value function, this is the originating scope */
		expect(snapshot.a).toBe(true);

		var parentSnapshot = parentScope.$.snapshot();
		expect(parentSnapshot.a).toBe(false);
	});

	it("Snapshot multiple parents", function() {
		var grandScope = Consistent();
		var parentScope = Consistent(grandScope);
		var scope = Consistent(parentScope);

		grandScope.a = function() { return "nope"; }
		grandScope.b = function() { return "grand b"; }
		grandScope.c = "grand c";
		grandScope.d = "grand d";
		parentScope.a = function() { return this === scope; }
		parentScope.b = "parent b";
		scope.c = "child c";

		var snapshot = scope.$.snapshot();

		/* In a value function, "this" is the originating scope */
		expect(snapshot.a).toBe(true);

		var parentSnapshot = parentScope.$.snapshot();
		expect(parentSnapshot.a).toBe(false);

		expect(snapshot.b).toBe("parent b");
		expect(snapshot.c).toBe("child c");
		expect(snapshot.d).toBe("grand d");
	});

	/* Cycles */

	var cyclic1 = {
		a: 9,
		b: {
			c: "success"
		},
		c: function() {}
	};
	cyclic1.cycle = cyclic1;

	it("Snapshot cyclic structure", function() {
		var scope = Consistent();
		/* It is critical that we do a deep merge, otherwise we just copy cyclic1.cycle
		 * into the scope, rather than notice that it's a cycle back to the root.
		 * See Snapshot cyclic structure with non-deep merge.
		 */
		scope.$.merge(true, cyclic1);

		expect(scope.cycle).toBe(scope);

		var snapshot = scope.$.snapshot();
		expect(snapshot.a).toBe(cyclic1.a);
		expect(snapshot.cycle.a).toBe(cyclic1.a);

		/* b is a new object because snapshot makes new objects */
		expect(snapshot.cycle.b).not.toBe(cyclic1.b);

		/* b is in the cycle so the cycled version is the same object, in the snapshot */
		expect(snapshot.cycle.b).toBe(snapshot.b);

		/* The cycle should be the snapshot itself */
		expect(snapshot.cycle.cycle).toBe(snapshot.cycle);
		expect(snapshot.cycle).toBe(snapshot);
	});

	it("Snapshot cyclic structure with non-deep merge", function() {
		var scope = Consistent();
		scope.$.merge(cyclic1); /* Note this isn't deep */

		/* The cycle isn't the scope */
		expect(scope.cycle).not.toBe(scope);

		/* ... it is the original cyclic1 */
		expect(scope.cycle).toBe(cyclic1);

		var snapshot = scope.$.snapshot();

		/* So the cycle is also not the snapshot itself */
		expect(snapshot.cycle).not.toBe(snapshot);

		/* But the cycle is still handled correctly so the deep cycle is itself */
		expect(snapshot.cycle.cycle).toBe(snapshot.cycle);
	});

});
