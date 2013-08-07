'use strict';

describe('Form tests', function() {

	beforeEach(function () {
		loadFixture("form.html");
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
			/* Setting select to unsupported selects nothing */
			this.referrer = "Nobody";
		});

		expect($("#form").serialize()).toBe("name=Nathanial+Hornblower&comments=OK");

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

	it("Scope does not contain a cycle", function() {
		var scope = Consistent();
		expect(function() { JSON.stringify(scope); }).not.toThrow();
	});

});
