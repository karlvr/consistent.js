'use strict';

describe('Repeat tests', function() {

	beforeEach(function () {
		loadFixture("nodes.html");
	});

	var pages = [
		{ url: "/x", name: "a" },
		{ url: "/y", name: "b" },
		{ url: "/z", name: "c" }
	];

	it("repeat", function() {
		var scope = $("#fixture").consistent();
		scope.pages = pages;
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(3);
		expect(nodeText(nodes["A"][0])).toBe("a");
		expect(nodes["A"][0].href).toMatch(/x$/);
		expect(nodeText(nodes["A"][1])).toBe("b");
		expect(nodes["A"][1].href).toMatch(/y$/);
		expect(nodeText(nodes["A"][2])).toBe("c");
		expect(nodes["A"][2].href).toMatch(/z$/);
	});

	it("repeat with deletion of first", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.shift();
		expect(scope.pages.length).toBe(2);

		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(2);
		expect(nodeText(nodes["A"][0])).toBe("b");
		expect(nodes["A"][0].href).toMatch(/y$/);
		expect(nodeText(nodes["A"][1])).toBe("c");
		expect(nodes["A"][1].href).toMatch(/z$/);
	});

	it("repeat with deletion of middle", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.splice(1, 1);
		expect(scope.pages.length).toBe(2);

		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(2);
		expect(nodeText(nodes["A"][0])).toBe("a");
		expect(nodes["A"][0].href).toMatch(/x$/);
		expect(nodeText(nodes["A"][1])).toBe("c");
		expect(nodes["A"][1].href).toMatch(/z$/);
	});

	it("repeat with deletion of last", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.pop();
		expect(scope.pages.length).toBe(2);

		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(2);
		expect(nodeText(nodes["A"][0])).toBe("a");
		expect(nodes["A"][0].href).toMatch(/x$/);
		expect(nodeText(nodes["A"][1])).toBe("b");
		expect(nodes["A"][1].href).toMatch(/y$/);
	});

	it("repeat with addition at the start", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.unshift({ name: "q", url: "/r" });
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(4);
		expect(nodeText(nodes["A"][0])).toBe("q");
		expect(nodes["A"][0].href).toMatch(/r$/);
		expect(nodeText(nodes["A"][1])).toBe("a");
		expect(nodes["A"][1].href).toMatch(/x$/);
	});

	it("repeat with addition at the end", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.push({ name: "q", url: "/r" });
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(4);
		expect(nodeText(nodes["A"][0])).toBe("a");
		expect(nodes["A"][0].href).toMatch(/x$/);
		expect(nodeText(nodes["A"][2])).toBe("c");
		expect(nodes["A"][2].href).toMatch(/z$/);
		expect(nodeText(nodes["A"][3])).toBe("q");
		expect(nodes["A"][3].href).toMatch(/r$/);
	});

	it("repeat with addition in the middle", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.splice(1, 0, { name: "q", url: "/r" });
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(4);
		expect(nodeText(nodes["A"][0])).toBe("a");
		expect(nodes["A"][0].href).toMatch(/x$/);
		expect(nodeText(nodes["A"][1])).toBe("q");
		expect(nodes["A"][1].href).toMatch(/r$/);
		expect(nodeText(nodes["A"][3])).toBe("c");
		expect(nodes["A"][3].href).toMatch(/z$/);
	});

	it("repeat with rearrangement", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		var temp = scope.pages[0];
		scope.pages[0] = scope.pages[2];
		scope.pages[2] = temp;
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(3);
		expect(nodeText(nodes["A"][2])).toBe("a");
		expect(nodes["A"][2].href).toMatch(/x$/);
		expect(nodeText(nodes["A"][1])).toBe("b");
		expect(nodes["A"][1].href).toMatch(/y$/);
		expect(nodeText(nodes["A"][0])).toBe("c");
		expect(nodes["A"][0].href).toMatch(/z$/);
	});

	it("repeat reuses nodes", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		var nodes1 = nodesByName($("#fixture ul li a"));

		var temp = scope.pages[0];
		scope.pages[0] = scope.pages[2];
		scope.pages[2] = temp;
		scope.$.apply();

		var nodes2 = nodesByName($("#fixture ul li a"));
		expect(nodes2["A"][0]).toBe(nodes1["A"][2]);
		expect(nodes2["A"][1]).toBe(nodes1["A"][1]);
		expect(nodes2["A"][2]).toBe(nodes1["A"][0]);
	});

});
