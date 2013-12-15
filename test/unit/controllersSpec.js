'use strict';

describe('Controller tests', function() {

	beforeEach(function () {
		loadFixtures("controllers.html");
	});

	it("Default controller", function() {
		var scope = $("#container").consistent();
		var buttonClicks = 0;
		scope.$.controller("handleButtonClick", function(ev) {
			buttonClicks++;
		});
		
		dispatchMouseEvent($("#container button"));

		expect(buttonClicks).toBe(1);
	});

	it("Set controller function directly", function() {
		var scope = $("#container").consistent();
		var buttonClicks = 0;
		scope.$.controller().handleButtonClick = function(ev) {
			buttonClicks++;
		};
		
		dispatchMouseEvent($("#container button"));

		expect(buttonClicks).toBe(1);
	});

	it("Controller class", function() {
		var buttonClicks = 0;

		function MyController(scope) {
			this.scope = scope;
		}

		MyController.prototype.handleButtonClick = function(ev) {
			buttonClicks++;
		};

		var scope = $("#container").consistent(MyController);
		
		dispatchMouseEvent($("#container button"));

		expect(buttonClicks).toBe(1);
	});

	it("Controller object", function() {
		var buttonClicks = 0;

		function MyController(scope) {
			this.scope = scope;

			this.handleButtonClick = function(ev) {
				buttonClicks++;
			};
		}

		var scope = $("#container").consistent(MyController);
		
		dispatchMouseEvent($("#container button"));

		expect(buttonClicks).toBe(1);
	});

});
