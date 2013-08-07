'use strict';

describe('Merge tests', function() {

	var object1 = {
		a: 1,
		b: "success",
		c: function() {
			return "function value";
		},
		d: {
			a: 2,
			b: "deep",
			c: function() {
				return "deep function value";
			}
		}
	};

	it("Simple object merge", function() {
		var scope = Consistent();

		expect(scope.a).not.toBeDefined();
		
		expect(scope.$.merge(object1)).toBe(scope); /* Chaining */

		expect(scope.a).toBe(object1.a);
		expect(scope.b).toBe(object1.b);
		expect(scope.c).toBe(object1.c);
		expect(scope.d).toBeDefined();
		expect(scope.d.a).toBe(object1.d.a);
		expect(scope.d.b).toBe(object1.d.b);
		expect(scope.d.c).toBe(object1.d.c);
	});

	it("Simple object merge 2", function() {
		var scope = Consistent();
		scope.$.merge(object1);

		/* The scope is not the object1 as it's a new object */
		expect(scope).not.toBe(object1);

		/* But once we remove the $ the scope should be equal to the object */
		delete scope.$;
		expect(scope).toEqual(object1);
	});

	it("Shallow object merge", function() {
		var scope = Consistent();
		scope.d = {
			z: 1
		};
		scope.$.merge(object1);

		/* scope.d.z will have been overwritten by the shallow merge */
		expect(scope.d.z).not.toBeDefined();
	});

	it("Deep object merge", function() {
		var scope = Consistent();
		scope.d = {
			z: 1
		};
		expect(scope.$.merge(true, object1)).toBe(scope); /* Chaining */

		/* scope.d.z will NOT have been overwritten by the shallow merge */
		expect(scope.d.z).toBeDefined();
	});

	it("Keyed object merge", function() {
		var scope = Consistent();

		expect(scope.$.merge(object1, [ "a", "c" ])).toBe(scope);

		expect(scope.a).toBe(object1.a);
		expect(scope.b).not.toBeDefined();
		expect(scope.c).toBe(object1.c);
		expect(scope.d).not.toBeDefined();
	});

	it("Deep keyed object merge", function() {
		var scope = Consistent();

		scope.$.merge(object1, [ "d" ]);

		expect(scope.a).not.toBeDefined();
		expect(scope.b).not.toBeDefined();
		expect(scope.c).not.toBeDefined();

		/* Merge just copies in objects, it doesn't do a deep merge */
		expect(scope.d).toBe(object1.d);
	});

	it("Deep keyed object merge 2", function() {
		var scope = Consistent();

		scope.$.merge(object1, [ "d.a" ]);

		expect(scope.a).not.toBeDefined();
		expect(scope.b).not.toBeDefined();
		expect(scope.c).not.toBeDefined();

		/* Because we're specifying a deep key, the object d isn't just copied */
		expect(scope.d).not.toBe(object1.d);

		expect(scope.d.a).toBe(object1.d.a);
		expect(scope.d.b).not.toBeDefined();
	});

	it("Incorrect keys object merge", function() {
		var scope = Consistent();
		scope.$.merge(object1, [ "z" ]);
		expect(scope.$.snapshot()).toEqual({});
	});

	it("Single key object merge", function() {
		var scope = Consistent();
		expect(scope.$.merge(object1, "a")).toBe(scope);
		expect(scope.a).toEqual(object1.a);
	});

	it("Merge no faults", function() {
		var scope = Consistent();

		/* None of these should cause an error */
		expect(function() { scope.$.merge(); }).not.toThrow();
		expect(function() { scope.$.merge(null); }).not.toThrow();
		expect(function() { scope.$.merge(undefined); }).not.toThrow();
		expect(function() { scope.$.merge(undefined, [ "a" ]); }).not.toThrow();
	});

	it("Merge allowed faults", function() {
		var scope = Consistent();

		expect(function() { scope.$.merge(undefined, null); }).toThrow();
		expect(function() { scope.$.merge(object1, null); }).toThrow();
		expect(function() { scope.$.merge(object1, { a: 1 }); }).toThrow();
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

	it("Merge cyclic structure", function() {
		var scope = Consistent();
		scope.$.merge(cyclic1);
		expect(scope.a).toBe(cyclic1.a);
		expect(scope.b).toBe(cyclic1.b);

		/* Merge isn't deep so the cycle is not touched */
		expect(scope.cycle).toBe(cyclic1);
		expect(scope.cycle.b).toBe(cyclic1.b);
	});

	it("Deep merge cyclic structure", function() {
		var scope = Consistent();
		scope.$.merge(true, cyclic1);
		expect(scope.a).toBe(cyclic1.a);

		/* Deep so b is a new object rather than a copy */
		expect(scope.b).not.toBe(cyclic1.b);

		/* Merge IS deep so the cycle is not touched */
		expect(scope.cycle).toBe(scope);
		expect(scope.cycle.b).toBe(scope.b);
	});

	it ("Raw cyclic merge test", function() {
		var result = {};
		Consistent.merge(true, result, cyclic1);

		/* The result.cycle should be result itself */
		expect(result.cycle).toBeDefined();
		expect(result.cycle).toBe(result);

		expect(result.cycle.b).toBe(result.b);

		/* Deep objects are merged into new objects */
		expect(result.cycle.b).not.toBe(cyclic1.b);

		expect(result.cycle.c).toBe(result.c);

		/* Functions are copied */
		expect(result.cycle.c).toBe(cyclic1.c);
	});
});
