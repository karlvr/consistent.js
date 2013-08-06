'use strict';

describe('Scope nodes function tests', function() {

	beforeEach(function () {
		loadFixture("nodes.html");
	});

	it("Nodes only returns nodes with bindings", function() {
		var scope = $("#fixture").consistent();
		
		var nodes = scope.$.nodes();
		for (var i = 0; i < nodes.length; i++) {
			expect(nodes[i].nodeName).not.toBe("SECTION");
			expect(nodes[i].nodeName).not.toBe("NAV");
			expect(nodes[i].nodeName).not.toBe("UL");

			/* Repeat nodes are not included */
			expect(nodes[i].nodeName).not.toBe("LI");
		}
	});

	it("Roots only returns the root and doesn't have to have bindings", function() {
		var scope = $("#fixture").consistent();

		var roots = scope.$.roots();
		expect(roots.length).toBe(1);
		expect(roots[0].nodeName).toBe("DIV");
	});

});
