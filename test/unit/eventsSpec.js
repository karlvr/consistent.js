'use strict';

describe('Events tests', function() {

	if (window.navigator.userAgent.indexOf("PhantomJS") !== -1) {
		console.log("PhantomJS cannot run the events tests as events do not appear to fire");
		return;
	}

	beforeEach(function () {
		loadFixtures("events.html");
	});

	it("Default click events", function() {
		var scope = $("#container").consistent();
		var titleClicks = 0, buttonClicks = 0;
		scope.$handleTitleClick = function(ev) {
			titleClicks++;
		};
		scope.$handleButtonClick = function(ev) {
			buttonClicks++;
		};
		
		/* No need to apply as events are attached in bind */
		dispatchClickEvent($("#container h1"));

		expect(titleClicks).toBe(1);
		expect(buttonClicks).toBe(0);
		
		dispatchClickEvent($("#container button"));

		expect(titleClicks).toBe(1);
		expect(buttonClicks).toBe(1);
	});

	it("Nested event handlers", function() {
		var scope = $("#container").consistent();
		scope.events = {};
		var sectionClicks = 0;
		scope.events.$handleSectionClick = function(ev) {
			sectionClicks++;
		};

		dispatchClickEvent($("#container section"));

		expect(sectionClicks).toBe(1);
	});

	it("Event handlers must not be declared with the prefix", function() {
		var scope = $("#bad").consistent();
		var buttonClicks = 0;
		scope.$$handleButtonClick = function() {
			buttonClicks++;
		};

		dispatchClickEvent($("#bad button"));

		expect(buttonClicks).toBe(1);
	});

	it("Bind specific click event", function() {
		var scope = $("#container").consistent();
		var navClicks = 0;
		scope.$handleNavClick = function() {
			navClicks++;
		};

		dispatchClickEvent($("#container nav"));

		expect(navClicks).toBe(1);
	});

	it("Bind specific other event", function() {
		var scope = $("#container").consistent();
		var contentFocuses = 0;
		scope.$handleContentFocus = function() {
			contentFocuses++;
		};

		dispatchHTMLEvent($("#container input"), "focus");

		expect(contentFocuses).toBe(1);
	});

	it("Bind multiple events", function() {
		var scope = $("#container").consistent();
		var abbrClicks = 0;
		var abbrFocuses = 0;
		scope.$handleAbbrClick = function() {
			abbrClicks++;
		};
		scope.$handleAbbrFocus = function() {
			abbrFocuses++;
		};

		dispatchHTMLEvent($("#container abbr"), "focus");
		expect(abbrClicks).toBe(0);
		expect(abbrFocuses).toBe(1);

		dispatchHTMLEvent($("#container abbr"), "click");
		expect(abbrClicks).toBe(1);
		expect(abbrFocuses).toBe(1);

		dispatchHTMLEvent($("#container abbr"), "click");
		dispatchHTMLEvent($("#container abbr"), "focus");
		dispatchHTMLEvent($("#container abbr"), "click");
		expect(abbrClicks).toBe(3);
		expect(abbrFocuses).toBe(2);
	});

});
