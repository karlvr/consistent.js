/*!
 * Consistent.js Expressions 0.8.1
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
		var tokens = parseTokens(value);
		var safeExpression = tokensToSafeJavascriptExpression(tokens, value);

		try {
			return new Function("ctx", "return " + safeExpression + ";");
		} catch (e) {
			throw "Error compiling expression: " + value + " => " + safeExpression + " (" + e + ")";
		}
	};

	Consistent.statementToFunction = function(value) {
		var tokens = parseTokens(value);
		var safeStatements = tokensToSafeJavascriptStatements(tokens, value);

		try {
			return new Function("scope", safeStatements + ";");
		} catch (e) {
			throw "Error compiling statements: " + value + " => " + safeStatements + " (" + e + ")";
		}
	};

	var TYPE_END_TOKEN = 0;
	var TYPE_PROPERTY = 1;
	var TYPE_OPERATOR = 2;
	var TYPE_STRING = 3;
	var TYPE_VALUE = 4;
	var TYPE_SEPARATOR = 5;

	function parseTokens(expression) {
		var tokens = [];
		var i = 0;
		var n = expression.length;

		var mode = TYPE_END_TOKEN;
		var cur = "";

		while (i < n) {
			var c = expression.charAt(i);
			if (mode === TYPE_END_TOKEN) {
				if (isPropertyStartChar(c)) {
					mode = TYPE_PROPERTY;
				} else if (isStringDelimiterChar(c)) {
					mode = TYPE_STRING;
				} else if (isOperatorChar(c)) {
					mode = TYPE_OPERATOR;
				} else if (isNumberStartChar(c)) {
					mode = TYPE_VALUE;
				} else if (isSeparatorChar(c)) {
					mode = TYPE_SEPARATOR;
				} else if (isEscapeChar(c)) {
					throw "Illegal escape character at " + i + ": " + expression;
				} else if (isWhiteChar(c)) {
					i++;
					continue;
				} else {
					throw "Invalid character '" + c + "' at " + i + ": " + expression;
				}
			} else if (mode === TYPE_PROPERTY) {
				/* Property */
				if (!isPropertyChar(c)) {
					appendCurrentToken();
					continue;
				}
			} else if (mode === TYPE_OPERATOR) {
				/* Operator */
				if (!isOperatorChar(c)) {
					appendCurrentToken();
					continue;
				}
			} else if (mode === TYPE_STRING) {
				/* String */
				if (isStringDelimiterChar(c)) {
					cur += c;
					i++;
					appendCurrentToken();
					continue;
				} else if (isEscapeChar(c)) {
					cur += c;
					i++;
					c = expression.charAt(i);
				}
			} else if (mode === TYPE_VALUE) {
				/* Number */
				if (!isNumberChar(c)) {
					appendCurrentToken();
					continue;
				}
			} else if (mode === TYPE_SEPARATOR) {
				/* Separator */
				appendCurrentToken();
				continue;
			}
			
			cur += c;
			i++;
		}

		function appendCurrentToken() {
			if (cur.length > 0) {
				if (mode === TYPE_PROPERTY && isReservedWord(cur)) {
					var op = reservedWordToOperator(cur);
					if (op !== null) {
						tokens.push({ type: TYPE_OPERATOR, text: op });
					} else {
						tokens.push({ type: TYPE_VALUE, text: cur });
					}
				} else {
					tokens.push({ type: mode, text: cur });
				}
			}
			cur = "";
			mode = TYPE_END_TOKEN;
		}

		appendCurrentToken();
		return tokens;
	}

	function tokensToSafeJavascriptExpression(tokens, expression) {
		var head = [];
		var i, n = tokens.length;
		for (i = 0; i < n; i++) {
			var token = tokens[i];
			if (token.type === TYPE_PROPERTY) {
				head.push("ctx.get(\"" + slashes(token.text) + "\")");
			} else if (token.type === TYPE_OPERATOR) {
				if (isMutatingOperator(token.text)) {
					/* It's not critical to catch these, as they will just result in an invalid
					 * and harmless expression.
					 */
					throw "Assignment is invalid in expression: " + expression;
				} else {
					head.push(token.text);
				}
			} else if (token.type === TYPE_STRING || token.type === TYPE_VALUE) {
				head.push(token.text);
			} else if (token.type === TYPE_SEPARATOR) {
				throw "Expressions may not contain multiple statements in expression: " + expression;
			}
		}

		return head.join(" ");
	}

	function tokensToSafeJavascriptStatements(tokens, statement) {
		var head = "";
		var body = [];
		var tail = "";
		var i, n = tokens.length;
		for (i = 0; i < n; i++) {
			var token = tokens[i];
			if (token.type === TYPE_PROPERTY) {
				var nextToken = i + 1 < n ? tokens[i + 1] : null;
				if (nextToken !== null && nextToken.type === TYPE_OPERATOR && 
					isMutatingOperator(nextToken.text)) {
					body.push("this.$.set(\"" + slashes(token.text) + "\", ");
					tail = ")";
					
					var suboperator = mutationOperatorSuboperator(nextToken.text);
					if (suboperator) {
						body.push("this.$.get(\"" + slashes(token.text) + "\")");
						body.push(suboperator);
					}

					i++;
				} else {
					body.push("this.$.get(\"" + slashes(token.text) + "\")");
				}
			} else if (token.type === TYPE_OPERATOR) {
				body.push(token.text);
			} else if (token.type === TYPE_STRING || token.type === TYPE_VALUE) {
				body.push(token.text);
			} else if (token.type === TYPE_SEPARATOR) {
				head += " " + body.join(" ") + " " + tail + ";";
				body = [];
				tail = "";
			}
		}

		return head + " return " + body.join(" ") + " " + tail;
	}

	function slashes(str) {
		return str.replace(/"/g, "\\\"");
	}

	function isPropertyStartChar(c) {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
	}

	function isPropertyChar(c) {
		return isPropertyStartChar(c) || c === '.' || (c >= '0' && c <= '9');
	}

	function isStringDelimiterChar(c) {
		return c === "'" || c === '"';
	}

	function isEscapeChar(c) {
		return c === '\\';
	}

	function isOperatorChar(c) {
		return c === '!' || c === '%' || c === '=' || c === '<' || c === '>' ||
			c === "*" || c === "/" || c === "+" || c === "-" || c === "(" || c === ")" ||
			c === "^" || c === "&" || c === "?" || c === ":";
	}

	function isAssignmentOperator(str) {
		return str === "=" || str === "+=" || str === "-=" || 
			str === "*=" || str === "/=";
	}

	function isMutatingOperator(str) {
		return isAssignmentOperator(str) || str === "++" || str === "--";
	}

	function mutationOperatorSuboperator(str) {
		if (str === "=") {
			return null;
		} else if (str.length == 2 && str.indexOf("=") === 1) {
			return str.charAt(0);
		} else if (str === "++") {
			return "+1";
		} else if (str === "--") {
			return "-1";
		} else {
			throw "Unsupported mutation operator: " + str;
		}
	}

	function isSeparatorChar(c) {
		return c === ';';
	}

	function isNumberStartChar(c) {
		return (c >= '0' && c <= '9');
	}

	function isNumberChar(c) {
		return isNumberStartChar(c) || c == '.';
	}

	function isWhiteChar(c) {
		return c <= ' ';
	}

	function isReservedWord(str) {
		return str === "true" || str === "false" || str === "and" || str === "or" || str === "not" ||
			str === "lt" || str === "le" || str === "gt" || str === "ge" || str === "eq" || str === "ne";
	}

	function reservedWordToOperator(str) {
		if (str === "and") {
			return "&&";
		} else if (str === "or") {
			return "||";
		} else if (str === "not") {
			return "!";
		} else if (str === "lt") {
			return "<";
		} else if (str === "le") {
			return "<=";
		} else if (str === "gt") {
			return ">";
		} else if (str === "ge") {
			return ">=";
		} else if (str === "eq") {
			return "==";
		} else if (str === "ne") {
			return "!=";
		} else {
			return null;
		}
	}
})(window);
