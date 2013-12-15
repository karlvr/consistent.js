'use strict';

describe('Bugs', function() {

	/**
	 * Based on bug report from Mal Curtis 23/8/2013.
	 * https://github.com/karlvr/consistent.js/pull/6
	 */
	it("Snapshot with valueFunctionPrefix", function() {
		var template = $('<tr ct-repeat="subscriptions"><td><input type="checkbox" name="state" ct="active" ct-do="toggleState" ct-hide="toggling" /></td></tr>');
		var scope = template.consistent({valueFunctionPrefix: "get"});
		scope.getActive = function() {
			return this.state == 'active';
		};
		scope.$toggleState = function(ev, dom) {
			if (this.state == 'active') {
				this.state = 'inactive';
			} else {
				this.state = 'active';
			}
			this.$.apply();
		}

		expect(scope.state).not.toBeDefined();
		expect(scope.$.snapshot().active).toBe(false);

		scope.$toggleState(null, scope);
		expect(scope.state).toBe("active");
		expect(scope.$.snapshot().active).toBe(true);

		scope.$toggleState(null, scope);
		expect(scope.state).toBe("inactive");
		expect(scope.$.snapshot().active).toBe(false);
	});

	/* Ensures that the valueFunctionPrefix is applied in the parent scope even
	 * though the snapshot originates in the child scope.
	 */
	it("Snapshot with valueFunctionPrefix with child contexts", function() {
		var template = $('<tr ct-repeat="subscriptions"><td><input type="checkbox" name="state" ct="active" ct-do="toggleState" ct-hide="toggling" /></td></tr>');
		var scope = template.consistent({valueFunctionPrefix: "get"});
		scope.getActive = function(childScope) {
			return childScope.state == 'active';
		};
		scope.$.controller("toggleState", function(ev, dom, childScope) {
			if (childScope.state == 'active') {
				childScope.state = 'inactive';
			} else {
				childScope.state = 'active';
			}
			this.$.apply();
		});

		var childScope = Consistent(scope);

		expect(childScope.$.parent()).toBe(scope);

		expect(childScope.state).not.toBeDefined();
		expect(childScope.$.snapshot().active).toBe(false);

		childScope.$.fire("toggleState");
		expect(childScope.state).toBe("active");
		expect(childScope.$.snapshot().active).toBe(true);

		childScope.$.fire("toggleState");
		expect(childScope.state).toBe("inactive");
		expect(childScope.$.snapshot().active).toBe(false);
	});

	/* This test actually reproduces the issue reported by @snikch and tests
	 * the fix. The issue was that because an input element is toggled, the 
	 * scope's update method is called, which calls the scope's $.set method,
	 * which set a local property in the scope called "active" which shadowed
	 * the value function in the parent. The scope's $.set method now looks for
	 * value functions in the parent and invokes those to set a new value.
	 */
	it("Child contexts with value functions and update", function() {
		loadFixtures("bug-snikch-valueFunctionPrefix.html");

		var template = $('#template');
		var scope = template.consistent({valueFunctionPrefix: "get"});

		scope.getActive = function(childScope) {
		  // console.log("getActive", childScope.state == 'active', childScope.state);
		  return childScope.state == 'active';
		};

		scope.$.controller("toggleState", function(ev, dom, childScope) {
		  // console.log("Toggling state from", childScope.state);
		  if (childScope.state == 'active') {
		    childScope.state = 'inactive';
		  } else {
		    childScope.state = 'active';
		  }
		  this.$.apply();
		});

		scope.subscriptions = [{ name: "One", state: "active"}];

		scope.$.apply();

		var checkbox = template.find("input")[0];
		var childScope = Consistent.findScopeForNode(checkbox);

		expect(childScope.state).toBe('active');
		expect(checkbox.checked).toBe(true);

		/* Mouse events to click checkboxes not working in IE 6 */
		// dispatchMouseEvent([checkbox]);
		childScope.$.fire("toggleState");

		expect(childScope.state).toBe('inactive');
		expect(checkbox.checked).toBe(false);

		// dispatchMouseEvent([checkbox]);
		childScope.$.fire("toggleState");

		expect(childScope.state).toBe('active');
		expect(childScope.$.snapshot().active).toBe(true);
		expect(checkbox.checked).toBe(true);
	});

});
