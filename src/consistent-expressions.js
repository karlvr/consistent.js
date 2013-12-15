/*!
 * Consistent.js Expressions 0.11.0
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
		var safeExpression = tokensToSafeJavascript(tokens, false, value);

		try {
			return new Function("ctx", safeExpression);
		} catch (e) {
			throw "Error compiling expression: " + value + " => " + safeExpression + " (" + e + ")";
		}
	};

	Consistent.statementToFunction = function(value) {
		var tokens = parseTokens(value);
		var safeStatements = tokensToSafeJavascript(tokens, true, value);

		try {
			return new Function("ctx", safeStatements);
		} catch (e) {
			throw "Error compiling statements: " + value + " => " + safeStatements + " (" + e + ")";
		}
	};

	var TYPE_END_TOKEN = 0;
	var TYPE_PROPERTY = 1;
	var TYPE_OPERATOR = 2;
	var TYPE_GROUP = 3;
	var TYPE_STRING = 4;
	var TYPE_VALUE = 5;
	var TYPE_SEPARATOR = 6;

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
				} else if (isGroupChar(c)) {
					mode = TYPE_GROUP;
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
			} else if (mode === TYPE_GROUP) {
				/* Group - can only be a single character */
				appendCurrentToken();
				continue;
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

	function tokensToSafeJavascript(tokens, isStatement, originalText) {
		var head = [];
		var bodies = [[]];
		var tails = [[]];
		var groupId = 0;
		var i, n = tokens.length;
		for (i = 0; i < n; i++) {
			var body = bodies[bodies.length - 1];
			var tail = tails[tails.length - 1];
			var token = tokens[i];
			var tokenType = token.type;
			if (tokenType === TYPE_PROPERTY) {
				if (isStatement) {
					var nextToken = i + 1 < n ? tokens[i + 1] : null;
					if (nextToken !== null && nextToken.type === TYPE_OPERATOR && 
						isMutatingOperator(nextToken.text)) {
						body.push("ctx.set(\"" + addSlashes(token.text) + "\", ");
						tail.unshift(")");
						
						var suboperator = mutationOperatorSuboperator(nextToken.text);
						if (suboperator) {
							body.push("ctx.get(\"" + addSlashes(token.text) + "\")");
							body.push(suboperator);
						}

						i++;
						continue;
					}
				}

				body.push("ctx.get(\"" + addSlashes(token.text) + "\")");
			} else if (tokenType === TYPE_OPERATOR) {
				if (isMutatingOperator(token.text)) {
					/* It's not critical to catch these, as they will just result in an invalid
					 * and harmless expression. Even when we're allow mutation, these tokens
					 * should be consumed in relation to a property. Assignment to anything else
					 * is invalid.
					 */
					throw "Assignment is invalid in expression: " + originalText;
				} else {
					body.push(token.text);
				}
			} else if (tokenType === TYPE_STRING || tokenType === TYPE_VALUE) {
				body.push(token.text);
			} else if (tokenType === TYPE_GROUP) {
				if (token.text === "(") {
					/* Start group */
					bodies.push([]);
					tails.push([]);
				} else {
					/* End group */
					if (!body.length || bodies.length < 2) {
						throw "Invalid bracketed expression in expression: " + originalText;
					}
					head.push("var __group" + groupId + " = " + body.join(" ") + tail.join(" ") + ";");
					bodies.pop();
					tails.pop();
					body = bodies[bodies.length - 1];
					body.push("__group" + groupId);
					groupId++;
				}
			} else if (tokenType === TYPE_SEPARATOR) {
				if (isStatement) {
					body.push(tails[0].join(" ") + ";");
					tails[0] = [];

					var subsequentStatements = tokensToSafeJavascript(tokens.slice(i + 1), true, originalText);
					body.push(subsequentStatements);
					break;
				} else {
					throw "Invalid multiple statements in expression: " + originalText;
				}
			}
		}

		if (bodies.length !== 1) {
			throw "Unbalanced bracketed expressions in expression: " + originalText;
		}

		return head.join(" ") + (i == n ? " return " : "") + bodies[0].join(" ") + tails[0].join(" ") + ";";
	}

	function addSlashes(str) {
		return str.replace(/"/g, "\\\"");
	}

	function isPropertyStartChar(c) {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
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
			c === '*' || c === '/' || c === '+' || c === '-' ||
			c === '^' || c === '&' || c === '?' || c === ':';
	}

	function isGroupChar(c) {
		return c === '(' || c === ')';
	}

	function isAssignmentOperator(str) {
		return str === "=" || str === "+=" || str === "-=" || 
			str === "*=" || str === "/=" || str === "%=";
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
		return str === "true" || str === "false" || str === "null" || str === "undefined" ||
			str === "and" || str === "or" || str === "not" ||
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
