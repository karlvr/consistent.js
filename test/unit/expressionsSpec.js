'use strict';

describe('Expression tests', function() {

	it("Simple expressions", function() {
		var scope = Consistent();
		scope.a = "apple";
		scope.b = 7;
		scope.c = true;
		scope.d = {
			e: 11,
			f: "orange"
		};

		expect(scope.$.evaluate("b * 3")).toBe(21);
		expect(scope.$.evaluate("a + ' juice'")).toBe("apple juice");
		expect(scope.$.evaluate("!c")).toBe(false);
		expect(scope.$.evaluate("d.e + 1")).toBe(12);
		expect(scope.$.evaluate("a + ' and ' + d.f")).toBe("apple and orange");
	});

	it("Simple statements", function() {
		var scope = Consistent();
		scope.a = "apple";
		scope.b = 7;
		scope.c = true;
		scope.d = {
			e: 11,
			f: "orange"
		};

		expect(scope.$.exec("b = b + 1; b")).toBe(8);
		expect(scope.$.exec("b++; b")).toBe(9);
	})

	it("Scope.$.get doesn't return scope functions", function() {
		var scope = Consistent({
			valueFunctionPrefix: "get" /* So the scope doesn't try to evaluate the functions */
		});

		expect(scope.$.get("$")).toBe(undefined);
		expect(scope.$.get("$.get")).toBe(undefined);
	});

	it("Constructor abuse", function() {
		var scope = Consistent();
		scope.a = {};

		expect(function() { scope.$.evaluate("a.constructor"); }).toThrow();
	});

	it("Function abuse", function() {
		var scope = Consistent({
			valueFunctionPrefix: "get"
		});
		scope.a = Function;

		expect(function() { scope.$.exec("((a)(\"return 42\"))()") }).toThrow();
	});

});
