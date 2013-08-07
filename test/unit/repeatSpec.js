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
		expect(nodes["A"][0].textContent).toBe("a");
		expect(nodes["A"][0].pathname).toBe("/x");
		expect(nodes["A"][1].textContent).toBe("b");
		expect(nodes["A"][1].pathname).toBe("/y");
		expect(nodes["A"][2].textContent).toBe("c");
		expect(nodes["A"][2].pathname).toBe("/z");
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
		expect(nodes["A"][0].textContent).toBe("b");
		expect(nodes["A"][0].pathname).toBe("/y");
		expect(nodes["A"][1].textContent).toBe("c");
		expect(nodes["A"][1].pathname).toBe("/z");
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
		expect(nodes["A"][0].textContent).toBe("a");
		expect(nodes["A"][0].pathname).toBe("/x");
		expect(nodes["A"][1].textContent).toBe("c");
		expect(nodes["A"][1].pathname).toBe("/z");
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
		expect(nodes["A"][0].textContent).toBe("a");
		expect(nodes["A"][0].pathname).toBe("/x");
		expect(nodes["A"][1].textContent).toBe("b");
		expect(nodes["A"][1].pathname).toBe("/y");
	});

	it("repeat with addition at the start", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.unshift({ name: "q", url: "/r" });
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(4);
		expect(nodes["A"][0].textContent).toBe("q");
		expect(nodes["A"][0].pathname).toBe("/r");
		expect(nodes["A"][1].textContent).toBe("a");
		expect(nodes["A"][1].pathname).toBe("/x");
	});

	it("repeat with addition at the end", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.push({ name: "q", url: "/r" });
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(4);
		expect(nodes["A"][0].textContent).toBe("a");
		expect(nodes["A"][0].pathname).toBe("/x");
		expect(nodes["A"][2].textContent).toBe("c");
		expect(nodes["A"][2].pathname).toBe("/z");
		expect(nodes["A"][3].textContent).toBe("q");
		expect(nodes["A"][3].pathname).toBe("/r");
	});

	it("repeat with addition in the middle", function() {
		var scope = $("#fixture").consistent();
		scope.pages = Consistent.merge([], pages);
		scope.$.apply();

		scope.pages.splice(1, 0, { name: "q", url: "/r" });
		scope.$.apply();

		var nodes = nodesByName($("#fixture ul li a"));

		expect(nodes["A"].length).toBe(4);
		expect(nodes["A"][0].textContent).toBe("a");
		expect(nodes["A"][0].pathname).toBe("/x");
		expect(nodes["A"][1].textContent).toBe("q");
		expect(nodes["A"][1].pathname).toBe("/r");
		expect(nodes["A"][3].textContent).toBe("c");
		expect(nodes["A"][3].pathname).toBe("/z");
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
		expect(nodes["A"][2].textContent).toBe("a");
		expect(nodes["A"][2].pathname).toBe("/x");
		expect(nodes["A"][1].textContent).toBe("b");
		expect(nodes["A"][1].pathname).toBe("/y");
		expect(nodes["A"][0].textContent).toBe("c");
		expect(nodes["A"][0].pathname).toBe("/z");
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
