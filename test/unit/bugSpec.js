'use strict';

describe('Bugs', function() {

	/**
	 * Based on bug report from Mal Curtis 23/8/2013.
	 * https://github.com/karlvr/consistent.js/pull/6
	 */
	it("Snapshot with valueFunctionPrefix", function() {
		var template = $('<tr ct-repeat="subscriptions"><td><input type="checkbox" name="state" ct="active" ct-on="toggleState" ct-hide="toggling" /></td></tr>');
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
		var template = $('<tr ct-repeat="subscriptions"><td><input type="checkbox" name="state" ct="active" ct-on="toggleState" ct-hide="toggling" /></td></tr>');
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

		var childScope = Consistent(scope);

		expect(childScope.$.parent()).toBe(scope);

		expect(childScope.state).not.toBeDefined();
		expect(childScope.$.snapshot().active).toBe(false);

		scope.$toggleState.call(childScope);
		expect(childScope.state).toBe("active");
		expect(childScope.$.snapshot().active).toBe(true);

		scope.$toggleState.call(childScope);
		expect(childScope.state).toBe("inactive");
		expect(childScope.$.snapshot().active).toBe(false);
	});

});
