'use strict';

describe('Auto tests', function() {

	beforeEach(function () {
		loadFixtures("auto.html");
		Consistent.autoCreateScopes();
	});

	it("Default initialisation", function() {
		var $root = $("#test-default");
		var scope = $root.consistent();
		expect(scope).not.toBe(null);
		expect(scope.title).toBe("Consistent.js last wins");

		expect($root.find("h2").text()).toBe(scope.title);
	});

	it("Named scopes", function() {
		var scope = Consistent.findScope("myScope");
		expect(scope).not.toBe(null);
		expect(scope.title).toBe("Consistent.js named scope");
		expect($("#test-named h2").text()).toBe(scope.title);

		scope.title = "Named scopes can be easily found in script";
		scope.$.apply();

		expect($("#test-named h2").text()).toBe(scope.title);
	});

	it("Explicit default initialisation", function() {
		var $root = $("#test-explicit-default");
		var scope = $root.consistent();
		expect(scope).not.toBe(null);
		expect(scope.title).toBe("Consistent.js last wins");

		expect($root.find("h2").text()).toBe(scope.title);
	});

	it("No initialisation", function() {
		var $root = $("#test-no-init");
		expect($root.find("h2").text()).toBe("Consistent.js scope with no update or apply");
		expect($root.find("input").val()).toBe("");

		var scope = $root.consistent();
		expect(scope).not.toBe(null);
		expect(scope.title).toBe(undefined);
	});

	it("No initialisation, init with script", function() {
		var $root = $("#test-no-init-with-script");

		var scope = Consistent.findScope("myScopeWithNoInit");
		expect(scope).not.toBe(null);
		expect(scope.title).toBe(undefined); // because Consistent has not called update and apply.
		scope.title = "Initted the named scope";
		scope.$.apply();

		expect($root.find("h2").text()).toBe(scope.title);
		expect($root.find("input").val()).toBe(scope.title);
	});

	it("Init statement", function() {
		var $root = $("#test-init-statement");
		var scope = $root.consistent();
		expect(scope.title).toBe("The init statement worked");
		expect(scope.content).toBe("Body content too.");
		expect($root.find("h2").text()).toBe(scope.title);
		expect($root.find("input").val()).toBe(scope.title);
		expect($root.find("p").text()).toBe(scope.content);
	});

	it("Init function", function() {
		var $root = $("#test-init-func");
		var scope = $root.consistent();
		expect(scope.title).toBe("The init function worked");
		expect($root.find("h2").text()).toBe(scope.title);
		expect($root.find("input").val()).toBe(scope.title);
	});

	it("Nested init function", function() {
		var $root = $("#test-nested-init-func");
		var scope = $root.consistent();
		expect(scope.title).toBe("The nested init function worked");
		expect($root.find("h2").text()).toBe(scope.title);
		expect($root.find("input").val()).toBe(scope.title);
	});

});
