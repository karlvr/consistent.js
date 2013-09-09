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

	it("Expressions with value functions", function() {
		var scope = Consistent();
		scope.a = function() {
			return 101;
		};

		expect(scope.$.evaluate("a")).toBe(101);
		expect(scope.$.evaluate("a * 2")).toBe(202);
	});

	it("Grouped expressions", function() {
		var scope = Consistent();
		scope.a = 3;
		scope.b = 7;
		scope.c = 11;

		expect(scope.$.evaluate("a + b * 5")).toBe(38);
		expect(scope.$.evaluate("(a + b) * 5")).toBe(50);
		expect(scope.$.evaluate("((a + b) * (a + c))")).toBe(140);
		expect(scope.$.evaluate("(a + (b * c))")).toBe(80);
	});

	it("Invalid grouped expressions", function() {
		expect(function() { Consistent.expressionToFunction(") + a"); }).toThrow();
		expect(function() { Consistent.expressionToFunction("((a + b) * b"); }).toThrow();
	});

	it("Grouped statements", function() {
		var scope = Consistent();
		scope.a = 3;
		scope.b = 7;
		scope.c = 11;

		expect(scope.$.exec("a + b * 5")).toBe(38);
		expect(scope.$.exec("(a + b) * 5")).toBe(50);
		expect(scope.$.exec("((a + b) * (a + c))")).toBe(140);
		expect(scope.$.exec("(a + (b * c))")).toBe(80);
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

	it("Statements with value functions", function() {
		var scope = Consistent();
		scope.a = function() {
			return 101;
		};

		expect(scope.$.exec("a")).toBe(101);
		expect(scope.$.exec("a * 2")).toBe(202);
	});

	it("Scope.$.get doesn't return scope functions", function() {
		var scope = Consistent({
			valueFunctionPrefix: "get" /* So the scope doesn't try to evaluate the functions */
		});

		expect(scope.$.get("$")).toBe(undefined);
		expect(scope.$.get("$.get")).toBe(undefined);
	});

	it("Expressions and statements can't execute functions", function() {
		var scope = Consistent({
			valueFunctionPrefix: "get" /* So the scope doesn't try to evaluate the functions */
		});
		scope.a = function() {
			return 67;
		};

		expect(function() { scope.$.evaluate("a()") }).toThrow();
		expect(function() { scope.$.evaluate("a(1)") }).toThrow();
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
