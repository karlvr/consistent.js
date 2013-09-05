/*!
 * Consistent.js 0.8.1
 * @author Karl von Randow
 * @license Apache License, Version 2.0
 */
 /*
    Copyright 2013 Karl von Randow

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
  */

(function(window, undefined) {
	if (typeof Consistent === "undefined") {
		throw "Consistent must be included before consistent-expressions.js";
	}

	Consistent.expressionToFunction = function(value) {
		try {
			/* Convert to a valid expression */
			value = value.replace(/(\s|\))and(\s|\()/g, "$1&&$2"); /* and => && */
			value = value.replace(/(\s|\))or(\s|\()/g, "$1||$2"); /* or => || */

			return new Function("snapshot", "with (snapshot) { return " + value + "; }");
		} catch (e) {
			if (typeof console !== "undefined") {
				console.log("Expression syntax error: " + value + " (" + e + ")");
			}
			return value;
		}
	}
})(window);
