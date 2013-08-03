'use strict';

describe('Basic tests', function() {

	beforeEach(function () {
		loadFixture("basic.html");
	});

	var scope = Consistent();
	it("Substitution", function() {
		expect($("#container h1").text()).toBe("");

		var scope = $("#container").consistent();
		scope.title = "Consistent.js";
		scope.$.apply();

		expect($("#container h1").text()).toBe("Consistent.js");
	});
});
