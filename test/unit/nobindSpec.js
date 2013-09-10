'use strict';

describe('No bind tests', function() {

	beforeEach(function () {
		loadFixtures("nobind.html");
	});

	it("No bind", function() {
		var scope = $("#container").consistent();
		scope.title = "Consistent.js";
		scope.content = "Fox";
		scope.$.apply();

		expect($("#container h1").text()).toBe("Consistent.js");
		expect($("#container #content1").text()).toBe("Fox");
		expect($("#container #content2").text()).toBe("Original");
		expect($("#container #content3").text()).toBe("Original");
		expect($("#container #content4").text()).toBe("Fox");
	});

});
