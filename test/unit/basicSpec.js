'use strict';

describe('Basic tests', function() {

	beforeEach(function () {
		loadFixture("basic.html");
	});

	Consistent.defaultOptions.templateEngine = Hogan;

	it("Substitution", function() {
		var scope = $("#container").consistent();
		scope.title = "Consistent.js";
		scope.$.apply();

		expect($("#container h1").text()).toBe("Consistent.js");
	});

	it("Updating", function() {
		var scope = $("#container").consistent();
		scope.$.update();

		expect(scope.title).toBe("Default title");
	});

	it("Templating", function() {
		var scope = $("#container").consistent();
		scope.adjective = "best";
		scope.noun = "pond";
		scope.$.apply();

		expect($("#container h2").text()).toBe("The best in the pond.");
	});

	it("Template id", function() {
		var scope = $("#container").consistent();
		scope.second = "ipsum";
		scope.$.apply();

		/* Lower-case the HTML as IE 6 uppercases the tags */
		expect($.trim($("#container #content").html().toLowerCase())).toBe("<p>lorem ipsum.</p>");
	});

	it("Scope does not contain a cycle", function() {
		var scope = Consistent();
		expect(function() { JSON.stringify(scope); }).not.toThrow();
	});

});
