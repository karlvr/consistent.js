'use strict';

describe('Class tests', function() {

	beforeEach(function () {
		loadFixture("class.html");
	});

	it("Class attribute", function() {
		var scope = $("#container").consistent();

		expect($("#container section").attr("class")).not.toBeDefined();

		scope.sectionClass = "addedClass";
		scope.$.apply();

		expect($("#container section").attr("class")).toBe("addedClass");

		scope.sectionClass = "changedClass";
		scope.$.apply();

		expect($("#container section").attr("class")).toBe("changedClass");
	});

	it("Class attribute with array", function() {
		var scope = $("#container").consistent();

		expect($("#container section").attr("class")).not.toBeDefined();

		scope.sectionClass = [ "addedClass" ];
		scope.$.apply();

		expect($("#container section").attr("class")).toBe("addedClass");

		scope.sectionClass = [ "changedClass" ];
		scope.$.apply();

		expect($("#container section").attr("class")).toBe("changedClass");

		scope.sectionClass = [ "changedClass", "one", "two" ];
		scope.$.apply();

		expect($("#container section").attr("class")).toBe("changedClass one two");
	});

	it("Class attribute replaces existing", function() {
		var scope = $("#container").consistent();

		expect($("#container content").attr("class")).toBe("existingClass");

		scope.contentClass = "addedClass";
		scope.$.apply();

		expect($("#container content").attr("class")).toBe("addedClass");

		scope.contentClass = "changedClass";
		scope.$.apply();

		expect($("#container content").attr("class")).toBe("changedClass");

		/* Setting to the empty string also removes all classes */
		scope.contentClass = "";
		scope.$.apply();

		expect($("#container content").attr("class")).not.toBeDefined();

		scope.contentClass = null;
		scope.$.apply();

		expect($("#container content").attr("class")).not.toBeDefined();
	});

	it("Add class attribute", function() {
		var scope = $("#container").consistent();

		expect($("#container blockquote").attr("class")).not.toBeDefined();

		scope.blockquoteClass = "addedClass";
		scope.$.apply();

		expect($("#container blockquote").attr("class")).toBe("addedClass");

		scope.blockquoteClass = "changedClass";
		scope.$.apply();

		expect($("#container blockquote").attr("class")).toBe("changedClass");

		scope.blockquoteClass = "";
		scope.$.apply();

		expect($("#container blockquote").attr("class")).not.toBeDefined();

		scope.blockquoteClass = null;
		scope.$.apply();

		expect($("#container blockquote").attr("class")).not.toBeDefined();
	});

	it("Add class attribute multiple", function() {
		var scope = $("#container").consistent();

		expect($("#container blockquote").attr("class")).not.toBeDefined();

		scope.blockquoteClass = "addedClass anotherClass";
		scope.$.apply();

		expect($("#container blockquote").attr("class")).toBe("addedClass anotherClass");

		scope.blockquoteClass = "changedClass anotherClass";
		scope.$.apply();

		/* Note that because anotherClass was already there it jumps to the front of the order */
		expect($("#container blockquote").attr("class")).toBe("anotherClass changedClass");

		scope.blockquoteClass = "changedClass";
		scope.$.apply();

		expect($("#container blockquote").attr("class")).toBe("changedClass");

		scope.blockquoteClass = null;
		scope.$.apply();

		expect($("#container blockquote").attr("class")).not.toBeDefined();
	});

	it("Add class attribute with array", function() {
		var scope = $("#container").consistent();

		expect($("#container blockquote").attr("class")).not.toBeDefined();

		scope.blockquoteClass = [ "addedClass", "anotherClass" ];
		scope.$.apply();

		expect($("#container blockquote").attr("class")).toBe("addedClass anotherClass");

		scope.blockquoteClass = [ "changedClass", "anotherClass" ];
		scope.$.apply();

		/* Note that because anotherClass was already there it jumps to the front of the order */
		expect($("#container blockquote").attr("class")).toBe("anotherClass changedClass");

		scope.blockquoteClass = [ "changedClass" ];
		scope.$.apply();

		expect($("#container blockquote").attr("class")).toBe("changedClass");

		scope.blockquoteClass = [];
		scope.$.apply();

		expect($("#container blockquote").attr("class")).not.toBeDefined();
	});

	it("Add class attribute multiple with existing", function() {
		var scope = $("#container").consistent();

		expect($("#container nav").attr("class")).toBe("existingClass");

		scope.navClass = "addedClass anotherClass";
		scope.$.apply();

		expect($("#container nav").attr("class")).toBe("existingClass addedClass anotherClass");

		scope.navClass = "changedClass anotherClass";
		scope.$.apply();

		/* Note that because anotherClass was already there it jumps to the front of the order */
		expect($("#container nav").attr("class")).toBe("existingClass anotherClass changedClass");

		scope.navClass = "changedClass";
		scope.$.apply();

		expect($("#container nav").attr("class")).toBe("existingClass changedClass");

		scope.navClass = null;
		scope.$.apply();

		expect($("#container nav").attr("class")).toBe("existingClass");
	});

});
