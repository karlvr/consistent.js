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

		expect($.trim($("#container #content").html())).toBe("<p>Lorem ipsum.</p>");
	});

	it("Form", function() {
		var scope = $("#form").consistent();
		scope.name = "Nathanial Hornblower";
		scope.optin = true;
		scope.gender = "m";
		scope.referrer = "Friend";
		scope.comments = "OK";
		scope.$.apply();

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&optin=on&gender=m&referrer=Friend&comments=OK");

		scope.$.apply(function() {
			this.optin = false;
		});

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&gender=m&referrer=Friend&comments=OK");

		scope.$.apply(function() {
			/* Setting radio button to unsupported value, unsets gender entirely */
			this.gender = "unknown";
		});

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&referrer=Friend&comments=OK");

		scope.$.apply(function() {
			/* Setting select to unsupported value doesn't change DOM */
			this.referrer = "Nobody";
		});

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&referrer=Friend&comments=OK");

		scope.$.apply(function() {
			/* Null to a select selects the empty option */
			this.referrer = null;
		});

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&referrer=&comments=OK");

		scope.$.apply(function() {
			this.comments = null;
		});

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&referrer=&comments=");

		scope.$.apply(function() {
			this.name = "Anonymous";
			this.optin = true;
			this.gender = "f";
			this.referrer = "Website";
		});

		expect($("#form").serialize()).toBe("name=Anonymous&optin=on&gender=f&referrer=Website&comments=");
	});

	it("Update form", function() {
		var scope = $("#form").consistent();
		scope.$.update();

		expect(scope.name).toBe("Adam Bones");
		expect(scope.optin).toBe(true);
		expect(scope.gender).toBe("m");
		expect(scope.referrer).toBe("Other");
		expect(scope.comments).toBe("No comment");

		dispatchHTMLEvent($("#form input[name=name]").val("Bob Carl"), "change");

		expect(scope.name).toBe("Bob Carl");

		$("#form input[name=optin]")[0].checked = false;
		dispatchHTMLEvent($("#form input[name=optin]"), "change");

		expect(scope.optin).toBe(false);

		$("#form input[name=gender]").each(function() {
			this.checked = (this.value == "f");
		});
		dispatchHTMLEvent($("#form input[name=gender]"), "change");

		expect(scope.gender).toBe("f");

		$("#form select[name=referrer]")[0].selectedIndex = 1;
		dispatchHTMLEvent($("#form select[name=referrer]"), "change");

		expect(scope.referrer).toBe("Website");

		$("#form textarea[name=comments]").val("Go on then");
		dispatchHTMLEvent($("#form textarea[name=comments]"), "change");

		expect(scope.comments).toBe("Go on then");
	});

});
