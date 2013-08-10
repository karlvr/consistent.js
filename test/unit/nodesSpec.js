'use strict';

describe('Nodes tests', function() {

	beforeEach(function () {
		loadFixtures("nodes.html");
	});

	var pages = [
		{ url: "a", name: "b" },
		{ url: "c", name: "d" }
	];

	it("nodes() only returns nodes with bindings", function() {
		var scope = $("#fixture").consistent();
		
		var nodes = scope.$.nodes();

		/* Repeat nodes are not included */
		expect(nodes.length).toBe(1);

		nodes = nodesByName(nodes);
		expect(nodes["H1"].length).toBe(1);
	});

	it("nodes() includes child scope nodes", function() {
		var scope = $("#fixture").consistent();
		scope.pages = pages;
		scope.$.apply();
		
		var nodes = nodesByName(scope.$.nodes());

		expect(nodes["H1"].length).toBe(1);

		expect(nodes["SECTION"]).not.toBeDefined();
		expect(nodes["NAV"]).not.toBeDefined();
		expect(nodes["UL"]).not.toBeDefined();
		expect(nodes["DIV"]).not.toBeDefined();

		/* Repeat section nodes are not included */
		expect(nodes["ARTICLE"]).not.toBeDefined();
		expect(nodes["H2"]).not.toBeDefined();

		/* But no LI elements, as they don't have any bindings as far as Consistent is concerned,
		 * even though they have ct-repeat on them, they lose that when we consume them.
		 */
		expect(nodes["LI"]).not.toBeDefined();

		/* But, now that we've applied we should have some repeated child nodes */
		expect(nodes["A"].length).toBe(pages.length);
	});

	it("nodes() doesn't include repeat elements that don't have other bindings", function() {
		var scope = $("#fixture").consistent();
		scope.articles = pages;
		scope.$.apply();

		var nodes = nodesByName(scope.$.nodes());

		/* li tags just have repeat binding */
		expect(nodes["LI"]).not.toBeDefined();

		/* article tags have another binding */
		expect(nodes["ARTICLE"]).toBeDefined();
		if (nodes["ARTICLE"] !== undefined) {
			expect(nodes["ARTICLE"].length).toBe(pages.length);
		}
	});

	it("nodes(false) does not include child scope nodes", function() {
		var scope = $("#fixture").consistent();
		scope.pages = pages;
		scope.$.apply();

		var nodes = scope.$.nodes(false);
		expect(nodes.length).toBe(1);

		nodes = nodesByName(nodes);
		expect(nodes["H1"].length).toBe(1);
	});

	it("roots() only returns the root nodes and don't have to have bindings", function() {
		var scope = $("#fixture").consistent();

		var roots = scope.$.roots();
		expect(roots.length).toBe(1);
		expect(roots[0].nodeName).toBe("DIV");
	});

});
