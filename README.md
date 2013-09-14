Consistent.js
=============

Consistent is a small and simple Javascript framework to enable an abstract model to be synced with the DOM. Consistent is designed to be easy to use and understand for developers already using jQuery, and it doesn’t prevent you from using jQuery at the same time.

[![Build Status](https://travis-ci.org/karlvr/consistent.js.png)](https://travis-ci.org/karlvr/consistent.js)

Introduction
------------
Use Consistent to create a _scope_, and then bind DOM nodes to it. Consistent inspects the DOM nodes (and their children) to learn how to relate them to the scope.

The scope starts with no properties. You add properties to the scope and then apply them to the DOM. In your HTML markup you add `ct...` attributes to declare to Consistent how to use the scope’s properties. You can also use `data-ct...` instead of `ct...` if you prefer.

The scope contains a `$` property in which Consistent keeps its functions and scope. For example, when you want to apply the scope you call `scope.$.apply()`. This `$` property separates the properties you add to the scope from Consistent, so you can add properties with any other name. Note that this `$` is nothing to do with jQuery and doesn’t interfere with it as it is contained in the scope.

The scope contains scalar values, such as booleans, strings and numbers, and value functions, that return a calculated value. The scope also contains any event handler functions you create. To separate these event handlers from your values they are stored in properties beginning with a `$`, e.g. `$handleClick`.

Consistent includes a jQuery plugin, and the examples below show this approach. Consistent does not however require jQuery and can be used without it.

```html
<script src="src/consistent.js"></script>
<script src="src/jquery.consistent.js"></script>
```

Or use a minified and combined version. The minified and combined script for Consistent and the jQuery plugin is around 9KB.

```html
<script src="lib/consistent-for-jquery.min.js"></script>
```

### Substitution
Set the contents of an `h1` element with the `title` property in the scope.

```html
<h1 ct="title"></h1>
```

Now create a scope using the jQuery plugin, and assign a value to it.

```javascript
var scope = $("h1").consistent();
scope.title = "Consistent.js";
scope.$.apply();
```

The `h1` element will now have its body changed to "Consistent.js".

Notice that after changing properties in the scope you need to call _apply_ to instruct Consistent to update the DOM. You can also apply changes to the scope like this, which is equivalent:

```javascript
var scope = $("h1").consistent();
scope.$.apply(function() {
	this.title = "Consistent.js";
});
```

Or even the following, as most things in Consistent are chainable:

```javascript
$("h1").consistent().$.apply(function() {
	this.title = "Consistent.js";
});
```

Note that if a scope property is undefined, Consistent does not change the DOM.

How Consistent applies the scope value to the DOM depends upon the element. For most elements the `innerHTML` is set to the scope value. There are the following exceptions:
* `<input>`, `select` and `textarea` elements have their value set, or are checked, as appropriate. See Forms below.
* `<img>` has its `src` attribute set

### Templating

Consistent supports pluggable templating engines. The examples use [Hogan](http://twitter.github.io/hogan.js/). Any templating engine that provides `compile(string)` and `render(object)` methods will work.

```html
<h1 ct-tmpl="Welcome to {{name}}"></h1>
```

Now configure Consistent to use Hogan as its templating engine, and populate the scope.

```javascript
Consistent.defaultOptions.templateEngine = Hogan;
var scope = $("h1").consistent();
scope.name = "Consistent.js";
scope.$.apply();
```

You can also reference templates by an id, rather than writing them inline:

```html
<h1 ct-tmpl-id="h1-template"></h1>

<script id="h1-template" type="text/x-hogan-template">
	Welcome to {{name}}
</script>
```

Note that Consistent will re-render the templates and thus recreate the DOM nodes each time the scope is applied.

If you need to create a large DOM structure and then have it bound to a scope, consider creating it first using templating and then binding it with Consistent.

### Visibility

Consistent can show and hide nodes based on the scope.

```html
<h1 ct-show="showTitle">My title</h1>
```

You can also use `ct-hide` to hide the element when the scope property is true.

Now create a scope and set the showTitle property. Consistent will show or hide the element using a `display:none` style. Consistent also restores the old value of `display` when re-showing, in case it was set to something specifically.

```javascript
var scope = $("h1").consistent();
scope.showTitle = true;
scope.$.apply();
```

#### Animation

You can override the behaviour of showing and hiding elements. For example, you may want to fade elements in and out. See the Options section for more information.

### Value functions

As well as adding scalar values to the scope, you can also add value functions. In this case the function is executed each time the scope is applied and its return value is used. Value functions allow a scope property to be calculated dynamically.

```html
<div id="container">
	<p>The number of people is <span ct="numberOfPeople">&nbsp;</span>.</p>
</div>
```

The `&nbsp;` above is sometimes necessary for IE 6 (is anyone still?) which will otherwise collapse the whitespace around the `<span>` and you may get strange spacing.

```javascript
var scope = $("#container").consistent();
var people = [ "Albert", "Bob", "Carl", "Donald" ];
scope.numberOfPeople = function() {
	return people.length;
};
scope.$.apply();
```

The value function gets called with `this` set to the scope, and no arguments. As for other scope properties, if the value function returns `undefined` then no changes will be made to the DOM.

When the scope is populated from the DOM using the `scope.$.update` function, or when a scope property is set manually using the `scope.$.set` function, and the scope contains a value function for the affected property; the value function is called with one argument - the incoming value. Your value function can ignore this if it doesn’t support updates.

```javascript
var numberOfPeople = 5;
scope.numberOfPeople = function(newValue) {
	if (typeof newValue !== "undefined") {
		numberOfPeople = parseInt(newValue);
	} else {
		return numberOfPeople;
	}
}
```

### Form elements

Form elements are automatically associated with the scope property with the same name as the element, and Consistent updates the form field’s value from the scope.

```html
<input type="text" name="email">
<input type="checkbox" name="optin">
```

Note that we don’t explicitly specify the scope property, it defaults to the name. You can explicitly specify the scope property using the `ct` attribute.

Now create a scope and set the elements’ values.

```javascript
var scope = $("input").consistent();
scope.email = "example@example.com";
scope.optin = true;
scope.$.apply();
```

All form elements are supported, including:
* text fields
* checkboxes
* radio buttons
* select (single and multiple selection)
* textareas

Checkboxes are usually represented by a boolean value in the scope. For groups of checkboxes with the same name they can be thought of as an array of values (the value attribute from the checkbox). If you have a boolean value in the scope, Consistent will not change it, but you may get some strange results if you have multiple checkboxes bound to the same property (with the same name with the default property binding). If the scope contains an array or no value for a checkbox’s bound property then Consistent will create an array. Consistent can also cope with scalar values for a checkbox, in which case they are matched to the checkbox’s value. Note that in this case Consistent may convert the property to an array if there are multiple checkboxes bound to the same property.

For `<select>` elements that can have multiple options selected, the scope property can be an array.

Consistent automatically listens to the `change` event on form elements. When the `change` event fires, Consistent updates the scope with that element and then applies the scope. Note that the update is just for the element that fired the `change` event, it is not for all of the scope’s DOM nodes as it is if you call `scope.$.update()`. You can turn off this behaviour by setting `autoListenToChange` to false in the `options` object, either when the scope is created or when you bind the form elements.

#### Disabled and Read only

You can control the `disabled` and `readOnly` properties of form elements.

```html
<input type="text" name="email" ct-disabled="locked">
```

```javascript
scope.locked = true;
```

It is often useful to use a value function in this case, so that the disabled state of the form element is calculated dynamically each time the scope is applied.

The above shows how to control the `disabled` property, the full list is:
* `ct-disabled`
* `ct-enabled`
* `ct-readonly`
* `ct-readwrite`

Note that for each of disabled and readonly there is the opposite so that you can best fit the option to the model.

#### Select options

You can set the options array for a `<select>` element from the scope.

```html
<select name="product" ct-options="products"></select>
```

Now set the options array either as an array of scalar values, such as strings:

```javascript
scope.products = [ "", "Lamp", "Bucket", "Axe" ];
```

Or as an array of objects that separate the text and value:

```javascript
scope.products = [
	{},
	{ text: "Lamp", value: "lamp" },
	{ text: "Bucket", value: "bucket" },
	{ text: "Axe", value: "axe" }
];
```

You can also include `label` and `disabled` properties in the objects to set those properties in the created options.

You can of course bind the selected option as well, e.g. `scope.product = "bucket";`.

### Events

Consistent can add event listeners to DOM nodes which call functions in the scope. When you create an event handler function in the scope you prefix its name with a `$` in order to distinguish it from scalar values and value functions. You must not include the `$` prefix when declaring the function in the DOM.

```html
<a href="#" ct-on-click="handleClick">Click me</a>
```

Now create a scope and provide the click handler. Note that in the DOM the handler is `handleClick` but to define it in the scope it is `$handleClick`. You must follow this pattern otherwise Consistent will not find your event handler function.

If you are using nested objects, the `$` prefix must be on the last part, e.g. `person.$handleClick`.

```javascript
var scope = $("a").consistent();
scope.$handleClick = function(ev) {
	ev.preventDefault();
	alert("Click!");
};
```

The handler function is called with `this` as the scope. The event is the first argument, and the second argument is the DOM element that triggered the event.

```javascript
scope.$handleClick = function(ev, dom) {
	this.clickCount++;
	this.$.apply();
};
```

This handler function makes a change to the scope and then calls `apply` to apply the scope to the DOM.

Note that we don’t need to call `apply` after defining the event handler in the scope, as we don’t need to change the DOM. Event listeners are added when the DOM nodes are bound to the scope based on the declarations in the DOM; you just have to make sure the handler functions are defined by the time they are invoked.

#### Shortcut

There is a shortcut for binding events, which is to omit the event name. This chooses the `click` event for most elements:

```html
<a href="#" ct-on="handleClick">Click me</a>
```

The following special cases apply:
  * `<input>`, `<textarea>` and `<select>` elements bind the `change` event
  * `<form>` elements bind the `submit` event

### Repeating blocks

If your scope contains array values, you can repeat blocks of DOM nodes to represent them.

```html
<ul>
	<li ct-repeat="people" ct="name"></li>
</ul>
```

```javascript
var scope = $("ul").consistent();
scope.people = [
	{ name: "Alfred" },
	{ name: "Bob" },
	{ name: "Carl" }
];
scope.$.apply();
```

This will result in a list containing three `<li>` elements, one for each of the people in the `scope.people` array. If you change the array, the DOM will be updated.

```javascript
scope.people.push({ name: "Donald" });
scope.$.apply();
```

Or remove an item:

```javascript
scope.people.shift();
scope.$.apply();
```

Consistent only creates new nodes when new items are added to the array. So any changes you make to the DOM outside of Consistent will be preserved, such as applying classes.

Consistent creates a child scope for each repeated block, and the object in the array becomes its scope. Therefore each object in the array will have a `$` property added containing Consistent’s scope functionality. As the objects in the array are the child scopes, you can access the child scopes if you need to via the original array in the original scope.

See the Parent scopes section for essential information about parent and child scopes.

Repeating clones the repeated element, including all of its children:

```html
<table>
	<tr ct-repeat="people">
		<td>Person #<span ct="index"></span></td>
		<td ct="name"></td>
		<td ct="address"></td>
	</tr>
</table>
```

```javascript
scope.index = function() {
	return this.$.index;
};
```

Note above that the scope contains a property `scope.$.index` that contains the 0-based index of the current repeated block. You can’t access this property directly from the DOM as it is inside the `$` object, but you can use a value function to access it (and to add 1 to it if you want the index to be 1-based!).

Another interesting thing is happening here, which will be clearer after reading the Parent scopes section. The `scope.index` value function is added to the parent scope. Each repeating block gets a child scope, which when it looks for the `index` property falls back to the parent scope. When a value function is called in a parent scope, `this` is set to the child scope. So `return this.$.index` returns the index of the child scope.

It is also possible to repeat a collection of elements. See Repeating multiple elements in the Advanced section.

### Attributes

You can set DOM element attributes from the scope.

```html
<h1 ct-attr-title="headingTitle">Consistent.js</h1>
```

Now create a scope and set the heading’s `title` attribute.

```javascript
var scope = $("h1").consistent();
scope.headingTitle = "Welcome";
scope.$.apply();
```

If you want to set DOM element properties, see the [Properties](#properties) section below.

#### Class attributes

Class attributes can be bound by declaring a `ct-attr-class` attribute, as above, however there is a shortcut for classes: `ct-class`.

```html
<h1 ct-class="headingClass">Consistent.js</h1>
```

```javascript
scope.headingClass = "heading";
scope.headingClass = "heading another-class";
scope.headingClass = [ "heading", "another-class" ];
```

Note that as well as being a shortcut, the `ct-class` supports array values, which are automatically converted to a space-separated string. If the scope contains an array value, `update` will convert the classes into an array when setting the scope.

The alternative `ct-add-class` attribute preserves existing classes. When the scope is applied the scope property determines the set of classes to add to the element in addition to its existing classes. The following example code is applied in order and shows how the class attribute changes.

```html
<h1 class="heading" ct-add-class="headingClass">Consistent.js</h1>
```

```javascript
scope.headingClass = "another-class";
scope.$.apply(); // class attribute is now "heading another-class"

scope.headingClass = "one two";
scope.$.apply(); // "heading one two"

scope.headingClass = null;
scope.$.apply(); // "heading"

scope.headingClass = "heading";
scope.$.apply(); // "heading"
```

If you add classes to an element independent of Consistent, it will treat those classes as if they were existing and will not remove them when the scope is next applied, so everyone can play nicely together.

#### Templating

You can also use templates to update attributes.

```html
<h1 ct-tmpl-attr-title="This is a story about {{subject}}">Title</h1>

<h1 ct-tmpl-id-attr-title="h1-title-template">Title</h1>
<script id="h1-title-template" type="text/x-hogan-template">This is a story about {{subject}}</script>
```

### Expressions

You can use an expression in place of a scope property in a number of declarations. The expression is evaluated each time the scope is applied.

```html
<h1 ct-show="showTitle and enabled">My title</h1>
```

You may use `and` and `or` in place of `&&` and `||` to avoid the need to escape ampersands and to be more conversational. Also supported is `not`, `gt`, `ge`, `lt`, `le`, `eq` and `ne`.

Expressions can also be used to set the value or body of an element:

```html
<h1 ct="title + (titleSuffix ? ': ' + titleSuffix : '')"></h1>
```

Expressions are supported in most declarations. The exceptions are repeat declarations, declarations that specify ids and template declarations.

### Statements

While expressions can be used in place of a scope property, statements can be used in place of an event handler function.

```html
<button ct-on="numberOfClicks++">Count</button>
```

Multiple statements can be combined using the `;` separator.

```html
<button ct-on="clicked=true; numberOfClicks++">Count</button>
```

If the last statement is an expression, and it’s return value is a function then that function will be called as if it was the event handler function. This enables a statement to choose between two event handler functions.

```html
<button ct-on="clicked ? clickedHandler : notClickedHandler">Button</button>
```

### Binding the scope to the DOM

In the examples above we’ve specifically bound the example nodes by their element name, this isn’t very realistic in practice. When you bind a DOM node to Consistent, all of its child nodes are bound as well, so you typically bind a container element:

```html
<div id="container">
	<h3 ct="name"></h3>
	<p ct="body"></p>
</div>
```

Now bind the scope.

```javascript
$("#container").consistent();
```

Often you will have multiple blocks on the page and you’ll need to have an individual scope for each of them.

```html
<div class="container">
	<p ct="body"></p>
</div>
<div class="container">
	<p ct="body"></p>
</div>
```

Now bind each to a new scope.

```javascript
$(".container").each(function() {
	var scope = $(this).consistent();
	scope.body = "Lorem ipsum";
	scope.$.apply();
});
```

### Getting the scope for a DOM node

If you need to get the existing scope for a node, you can follow the exact same pattern. Calling `.consistent()` again will return the existing scope.

```javascript
$(".container").each(function() {
	var scope = $(this).consistent();
	scope.body = "Change the body";
	scope.$.apply();
});
```

You can also call the `Consistent.findScopeForNode(node)` function, if you just want to check if there’s a scope rather than create one.

### Updating the scope from the DOM

Consistent can inspect the DOM to populate the scope.

```javascript
var scope = $("#container").consistent();
scope.$.update();
```

Note this doesn’t work for any properties that are using templates.

### Watching for changes in the scope

Register a handler function to watch for changes to a particular property, or to the scope as a whole. Watch handler functions are called when `apply` is called on the scope, **before** the DOM has been updated.

```javascript
scope.$.watch("title", function(key, newValue, oldValue) {
	this.shortTitle = this.title.substring(0, 10);
});

scope.$.watch(function(changedKeys, snapshot, oldSnapshot) {
	this.changeSummary = "The following keys were changed: " + changedKeys;
});
```

The snapshots passed to the watch handler function for the whole scope are created using the `scope.$.snapshot` function, and therefore do not have the `$` object, and value functions have been replaced with their value.

Notice that you do not need to call `apply` if you change the scope inside a watch handler. A watch handler may be called multiple times in a single `apply` if the scope is changed by _other_ watch handlers.

Value functions are watched based on their value. If the value returned by a value function changes between one apply and the next, the watch handler function will be called.

It is possible for watch handlers to cause an infinite loop, if the scope does not reach a steady state. This is especially likely if you use value functions that return a new value each time they are evaluated. Consistent detects excessive looping through the watch handler list and throws an exception to break it. The number of loops is set in `Consistent.settings.maxWatcherLoops`; the default should be good enough.

### Populating the scope from another object

Often you’ll receive data from an Ajax JSON response as a Javascript object. You can merge these into the scope using the `merge` function.

```javascript
var scope = $("#item").consistent();
$.ajax({
	success: function(data) {
		scope.$.merge(data);
	}
})
```

Note that the merge is a shallow merge. For each key in the given object it adds it to the scope, replacing and values that are already there. If your scope has nested objects, they are replaced rather than merged.

### Exporting the scope to a Javascript object

The scope contains some extra properties required for Consistent. Particularly the `$` property, where all of Consistent’s functionality lives (e.g. `scope.$.apply()`). It also contains event handler functions (property names prefixed with a `$`), and value functions.

#### Snapshot

Use the `snapshot` function to obtain a Javascript object without the `$` property, with properties prefixed with the `$` character (or whatever the `eventHandlerPrefix` option is set to) renamed to exclude the prefix, and with value functions evaluated and replaced with their value. This provides a snapshot of the state of the scope, and can be used to inspect values without being concerned with value functions, and without being concerned with the `$` prefix.

```javascript
scope.title = "My title";
scope.subtitle = function() { return "My subtitle" };
scope.$doNext = function(ev) { ... };
scope.$anotherProperty = "see below";

console.log(scope.$.snapshot());
```

```javascript
{
	title: "My title",
	subtitle: "My subtitle",
	doNext: function(ev) { ... },
	anotherProperty: "see below"
}
```

A snapshot is used when applying the scope to the DOM. This is how the declarations in the DOM can refer to `$` prefixed scope properties without the prefix.

The `snapshot` function includes properties from parent scopes. If you don’t want to include parent scopes, pass `false` for the optional `includeParents` parameter, e.g. `snapshot(false)`.

#### Model

The snapshot includes properties that are not relevant if you want to submit data back to a server using Ajax, or give the data to other code. For this, use the `model` function. The `model` function behaves like `snapshot`, except rather than renaming any properties prefixed with the `$` character (or whatever the `eventHandlerPrefix` option is set to) they are removed.

Following on from the snapshot example above:

```javascript
console.log(scope.$.model());
```

```javascript
{
	title: "My title",
	subtitle: "My subtitle"
}
```

So for use with Ajax, as an example:

```javascript
var scope = $("#item").consistent();
scope.$.update();
$.ajax({
	data: scope.$.model()
});
```

The `model` function includes properties from parent scopes. If you don’t want to include parent scopes, pass false for the optional `includeParents` parameter, e.g. `model(false)`.

#### Private properties

What follows from the implementation of the `model` function, is that if you want to include properties in your scope that you don’t want to export out of the scope for Ajax or other purposes, you can prefix those properties with a `$` (or whatever the `eventHandlerPrefix` option is set to). You still refer to them without the `$` prefix in the binding declarations, so it is quite transparent.

```html
<h1 ct="title"></h1>
```

```javascript
scope.$title = "My title";

// The following are both true
scope.$.snapshot().title === "My title";
scope.$.model().title === undefined;
```

License
-------

Consistent is released under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Compatibility
-------------

Consistent works in all modern browsers. It has also been tested, and works in its entirety, in IE 6, 7 and 8.

Principles
----------

### Undefined

If a scope property is not defined then Consistent will not change the DOM.


Advanced
--------

### Nested properties

You can use nested properties in the scope.

```html
<h1 ct="person.fullName"></h1>
```

```javascript
var scope = $("h1").consistent();
scope.person = {
	fullName: "Nathanial Hornblower"
};
scope.$.apply();
```

Watch handler functions will be called with the `key` as the nested property name, eg. `person.fullName`. For convenience the scope declares two functions for working with nested property names.

```javascript
var nestedPropertyName = "person.fullName";
scope.$.get(nestedPropertyName);
scope.$.set(nestedPropertyName, value);
```

If the appropriate intermediate objects don’t exist, when calling `set`, they are created and added to the scope for you.

Note that `get` will fall back to a parent scope, if there is one. See below for Parent scopes. If you don’t want to fall back to a parent scope pass true for the optional `includeParents` parameter, e.g. `get(key, false)` instead.

### Parent scopes

You can create child scopes. Child scopes will look to their parent if they don’t contain a value for a given property key, in order to populate a DOM node or when looking for an event handler function. This includes value functions. Note that `this` inside the value function will be the child scope, rather than the scope in which it is defined.

When `apply()` is called on a child scope, it automatically calls `apply()` on its parent scope.

Watch handler functions added to parent scopes will be fired for changes in child scopes. Note that `this` inside the watch function will be the child scope, rather than the scope in which it is defined.

```javascript
var rootScope = $.consistent(); /* Create the root scope */
var childScope = $.consistent(rootScope); /* Create a child scope */
$("#item").consistent(childScope); /* Bind a DOM node to the child scope */
```

Note that we have to create the scope and then bind the DOM node, rather than doing that at the same time as we have in other examples. This is because if you pass a scope as a parameter to the form with the selector it treats that as the scope to bind to. You have to call the `$.consistent` function in order to create a new scope with a parent. Note that `$.consistent` and `Consistent` are the same function.

Now the following will work.

```html
<div id="item">
	<h2 ct="title"></h2>
</div>
```

```javascript
rootScope.title = "Default title";
childScope.$.apply();
```

Then if you add a title to the childScope and apply it again, it will override the title property in the parent.

Event handlers also work. Remember that event handlers receive a second argument which is the scope. This is particularly important when using parent scopes, as that argument will contain the originating scope, even if the event handler is declared in a parent scope.

```html
<div id="item">
	<h2 ct="title" ct-on-click="handleClick"></h2>
</div>
```

```javascript
rootScope.$handleClick = function(ev, dom) {
	// this === childScope
	this.title += ".";
};
```

### Getting the nodes bound to a scope

To get an array of DOM nodes that have been bound to a scope, and that have declared bindings (e.g. have `ct...` attributes), you can use the `nodes()` function. Even if a node has been passed to a Consistent scope’s `bind` function, if a node doesn’t declare bindings then it will not be included in the result from `nodes()`.

`nodes()` includes any bound nodes in child scopes as well. If you don’t want to include child scopes, pass true for the optional `includeParents` parameter, e.g. `nodes(false)`.

Note that DOM nodes that define a repeating section (i.e. have a `ct-repeat` declaration) are not included in the result from `nodes()`, as those nodes no longer exist in the DOM. However, as nodes from child scopes are included the result may include the repeated nodes if they declare bindings.

To get an array of the DOM nodes that have been passed to a scope’s bind function use the `roots()` function. Note that the root nodes do not need to have declared Consistent bindings.

```javascript
$(scope.$.nodes()).addClass("found");
$(scope.$.roots()).addClass("found");
```

### Repeating multiple root elements

The Repeating blocks section above introduces repeating. In that example you can only repeat a single root element, such as an `<li>` or a `<tr>`. Consistent also supports repeating a block of multiple root elements, which is useful if you want to add multiple table rows to a table for each block.

```html
<table>
	<tr ct-repeat="people" ct-repeat-container-id="rows"></tr>
</table>

<table style="display:none">
	<tbody id="rows">
		<tr>
			<td>Name</td>
			<td ct="name"></td>
		</tr>
		<tr>
			<td>Address</td>
			<td ct="address"></td>
		</tr>
	</tbody>
</table>
```

Using the `ct-repeat-container-id` attribute you can identify nodes elsewhere in the DOM that should be cloned and used in the repeating block. Note that tables automatically get a `<tbody>` element created, even if it isn’t in the markup, therefore you should attach the id to an explicit `<tbody>` otherwise if the id is on the `<table>`, the repeating block will include the automatically created `<tbody>`.

### Properties

You can set DOM element properties from the scope. Properties are DOM node Javascript properties, as opposed to attributes which are declared in the markup. The most common property to use is the `style` property, which exposes an object containing the DOM element’s style.

```html
<p ct-prop-style-display="showHide">Lorem ipsum</p>
```

Note that properties may be nested, as in the case of `style.display` above, and we can specify this by `-` separating the property name when we declare the `ct-prop-` attribute.

```javascript
var scope = $("p").consistent();
scope.showHide = "none";
scope.$.apply();
```

This sets the `style.display` property of the `<p>` element to "none", causing it not to be displayed.

See the Visibility section above for a better way to show and hide elements.

Options
-------

### Visibility animation

Often you want to use animation to show or hide elements. You can override the behaviour of showing and hiding by specifying options when you create a scope, or bind a node.

```javascript
var scope = $("h1").consistent({
	$: {
		show: function(dom) {
			// jQuery fade
			$(dom).fadeIn();
		},
		hide: function(dom) {
			// jQuery fade
			$(dom).fadeOut();
		}
	}
});
```

You could also specify the show / hide implementation for a specific `apply`:

```javascript
scope.$.apply({
	$: {
		show: function(dom) {
			// jQuery fade
			$(dom).fadeIn();
		}
	}
});
```

### Repeating blocks animation

If you want to animate the appearance and disappearance of blocks in a repeating section, you can override the behaviour after adding nodes, and for removing nodes.

```javascript
var options = { $: {} };
options.$.added = function(dom) {
	// jQuery hide and fadeIn
	$(dom).hide().fadeIn();
};
options.$.remove = function(dom) {
	// jQuery fade then remove
	$(dom).fadeOut(function() {
		$(this).remove();
	});
};
var scope = $("#container").consistent(options);
```

### Change prefix for event handler and value functions

If you’re adding existing objects to your scopes that use naming conventions that don’t fit with Consistent; when Consistent makes a snapshot of the scope (which occurs whenever you apply the scope), you may get unexpected results such as functions in your scope being called unexpectedly. This is because Consistent has interpreted those functions as value functions.

To solve this issue you can pass options to the scope to change the way Consistent identifies value functions and event handler functions.

By default, keys containing event handlers are prefixed with a `$`, e.g. `$handleClick`. You can change this to any string by setting the option `eventHandlerPrefix`. You must still omit the prefix when declaring the event handler to bind to in the DOM.

When you set an event handler prefix ending with a letter, e.g. "do", Consistent will expect the key to be camel-cased and will look for an event handler function specified as `ct-on="click"` in the key `doClick`.

By default, keys containing value functions have no prefix – every function that doesn’t have a key prefixed with a `$` (or whatever the `eventHandlerPrefix` option is set to) is treated as a value function. You can change the value function prefix by setting the option `valueFunctionPrefix`. When there is a `valueFunctionPrefix` set, Consistent will only call functions that match the valuePrefix. Any functions that don’t match the value function prefix will be left untouched.

When you use a value function prefix you must **not** include the prefix when declaring the binding in the DOM (same as for event handlers). The value function prefix is removed when the snapshot is created.

```html
<div id="container">
	<h1 ct="title"></h1>
	<button ct-on="click">Button</button>
</div>
```

```javascript
var options = {
	eventHandlerPrefix: "do",
	valueFunctionPrefix: "get"
};
var scope = $("#container").consistent(options);
scope.getTitle = function() {
	return "Consistent.js"
};
scope.doClick = function(ev) {
	alert("Click!");
};
```

See [Merging only specified keys](#merging-only-specified-keys) below for an alternative to this approach.

### Merging only specified keys

The `merge` function provides an easy way to merge properties from existing objects into the scope. It also has an optional argument, `keys`, which is an array of strings. This enables you to pick and choose which properties from your existing objects you merge into the scope.

The keys array supports nested properties using `.` separators, e.g. `person.name`.

```javascript
var object = {
	title: "Consistent.js",
	subtitle: "A JavaScript framework",
	person: {
		name: "Arthur",
		age: 4,
		gender: "m"
	},
	location: {
		city: "Auckland",
		country: "New Zealand"
	},
	friends: [
		"Bob",
		"Carl"
	]
};

scope.merge(object, [ "title", "person.name", "person.age", "location", friends" ]);
```

The above results in the title, the person’s name and age, and the location and friends arrays all being copied into the scope. The subtitle and the person’s gender are not copied.

### Expressions and Statements

Consistent supports expressions and statements for writing simple functionality into the DOM declarations. Note the term “expressions” is sometimes used to refer to both expressions and statements.

Expressions are parsed then reformed into safe Javascript, ensuring that expressions can only access values in the scope, and then compiled into Javascript functions for quick reuse.

Expressions and statements work with value functions as a consequence of accessing a snapshot (where value functions are replaced by their value) or using `scope.$.get` (which also evaluates value functions), but they cannot themselves call functions. That is, an expression of the form `myProperty()` will not compile.

A statement as an event handler may return a function (but not call it), and that function will then be called as if it was the event handler function.

```html
<button ct-on="clicked ? clickedHandler : notClickedHander">
```

```javascript
scope.$clickedHandler = function(ev) {};
scope.$notClickedHandler = function(ev) {};
```

Expressions enable you to inline simple logic and changes to your scope. However, don’t overuse expressions; they can result in an application that is harder to maintain if the application logic is spread between HTML and Javascript files.

## Reference

### DOM declarations

By default, DOM attributes are used to declare the binding between DOM nodes and the scope. The preferred attributes style starts with `ct`. You can also use `data-ct` instead of `ct`.

#### Binding values

* `ct` the name of a property in the scope to use to set the value of this element. Where setting the value means setting the `innerHTML`, or other properties as appropriate to the element type.
* `ct-tmpl` a template that will be rendered with the scope as its context, and then used to set the value of this element.
* `ct-tmpl-id` the id of a DOM element that contains template text, e.g. a `<script type="text/x-hogan-template">` element.

#### Form properties

* `ct-disabled` make this element disabled when the named property in the scope is true.
* `ct-enabled` make this element enabled when the named property in the scope is true.
* `ct-readonly` make this element read-only when the named property in the scope is true.
* `ct-readwrite` make this element not read-only when the named property in the scope is true.
* `ct-options` set the `<select>` options array based on the array in the named property in the scope. The array should contain either scalar values, or objects each with `text` and `value` properties. Each object may also contain a `disabled` or `label` property to set those properties on the options.

#### Attributes and properties

The `NAME` segment in the following list represents the name of the attribute or property. In the case of properties, the name will have -s changed to .s to enable access to nested properties, e.g. `ct-prop-style-display` affects the `style.display` property.

* `ct-attr-NAME` the name of a property in the scope to use to set the value of the given attribute on this element.
* `ct-prop-NAME` the name of a property in the scope to use to set the value of the given property on this element.
* `ct-tmpl-attr-NAME` a template that will be rendered with the scope as its context, and then used to set the value of the given attribute on this element.
* `ct-tmpl-id-attr-NAME` the id of a DOM element that contains template text.

* `ct-attrs` the name of an object property in the scope with keys and values mapping to attribute names and values. Note that for setting the attribute `class` you should instead use `className` as `class` is sometimes a reserved word.
* `ct-properties` the name of an object property in the scope with keys and values mapping to properties, including support for nested properties.

* `ct-class` the name of a property in the scope to use to set the value of the `class` attribute on this element. Supports string and array values.
* `ct-add-class` the name of a property in the scope to use to add classes to the existing `class` attribute on this element. Supports string and array values.

#### Visibility

* `ct-show` show this element when the named property in the scope is true, otherwise hide it.
* `ct-hide` the opposite of show.

#### Event handlers

* `ct-on` binds the default event for this element to the named event handler function in the scope. Event handler functions are called with `this` set to the scope, the first argument is the event object and the second argument is the DOM node source of the event.
* `ct-on-EVENT` binds the event named EVENT for this element to the named event handler function in the scope.

#### Repeating blocks

* `ct-repeat` repeats this element, and all of its children, for each item in the array in the named property in the scope.
* `ct-repeat-container-id` the id of a DOM element that contains DOM nodes to be repeated in place of this element.

#### Miscellaneous

* `ct-nobind` prevents Consistent from binding this element to a scope, and prevents Consistent from cascading the bind to this element’s children. This declaration can be used to fence off markup that should not acquire Consistent functionality (e.g. any unsafe user-generated markup). This attribute can be declared with no value, e.g. `<div ct-nobind>`, or with the value `"true"`.

### Scope functions

All scope functions are nested inside the `$` object, and therefore you call them, e.g. `scope.$.apply()`. All functions without an explicitly documented return value will return the scope to enable chaining, e.g. `scope.$.update().$.apply()`.

#### DOM

* `apply([options, ] [function, ] [includeChildren])` applies the scope to the DOM. If the optional options are provided they augment each node’s options before applying. If the function argument is provided, the function is called with `this` set to the scope before the scope is applied and the `options` as an argument. If `includeChildren` is true, child scopes will be applied first.
* `applyLater([options, ] [function, ] [includeChildren])` as for `apply` but rather than applying immediately it creates a `setTimeout` with a 0 time so it will be called after the current Javascript event handling finishes. The function, if supplied, is called immediately. It is safe to call this multiple times, the scope will only be applied once.
* `needsApply()` returns true if the scope has been changed and needs to be applied to the DOM. Changes include properties changed in the scope or new nodes bound to the scope.
* `update()` updates the scope by reading keys and values from the DOM.
* `bind(dom [, options])` binds the given DOM node to the scope. See the options section for the optional options argument. The `dom` parameter may also be an array of nodes.
* `unbind(dom)` unbinds the given DOM node from the scope. The `dom` parameter may also be an array of nodes.
* `nodes([includeParents])` returns an array of DOM nodes that have been bound to this scope and have bindings. Includes nodes in child scopes unless the optional `includeParents` parameter is false.
* `roots()` returns an array of the DOM nodes explicitly bound to this scope, that is the nodes that were passed to the `bind` function.

#### Scope
* `snapshot([includeParents])` returns a Javascript object containing the scope’s model properties, excluding the Consistent `$` object, any properties prefixed with a `$` (usually event handlers) and evaluating value functions and replacing with their current values. Includes properties in parent scopes unless the optional `includeParents` parameter is false.
* `merge([deep, ] object)` merges properties from the given object into the scope. If deep is provided it is a boolean indicating whether to do a deep merge. A normal merge simply copies across all of the keys in object, replacing any existing objects, whereas a deep merge will merge objects.
* `merge(object, keys)` merges the properties named in the keys array from the given object into the scope. The keys argument may be an array of key names or a single key, and may include nested properties using dot notation, e.g. `[ "name", "address.street" ]`.
* `replace(object)` replaces the scope with the given object. The given object is actually used as the scope, and Consistent’s `$` object is added into this new object. The return value is the object given.
* `clear()` removes all properties from the scope. This only leaves Consistent’s `$` object.

* `get(key [, includeParents])` returns the value in the scope for the given key. If the scope contains a value function for the given key (after adding the value function prefix, if any), the value function is evaluated and its result returned. If the scope contains an event handler for the given key (after adding the event handler prefix), the event handler function is returned. Supports nested keys (i.e. that contain dot notation) and falls back to parent scopes if the scope doesn’t have a property for the given key itself, unless the optional `includeParents` parameter is false. If no property with the given key is found it returns undefined.
* `set(key, value)` sets the value in the scope for the given key. Supports nested keys. If the target key exists and contains a value function, the value function is called passing the value as the only argument. If no property exists in the scope for the given key, parent scopes are searched for a value function to call. If no value functions are found, a new property is created in the scope with the given value.

* `getEventHandler(key [, includeParents])` returns the event handler in the scope for the given key. Supports nested keys and falls back to parent scopes, unless the optional `includeParents` parameter is false. The event handler prefix (by default `$`) is added to the last component of the key and must not be included in the `key` parameter, e.g. `getEventHandler("people.handleClick")` to access `people.$handleClick`.
* `setEventHandler(key, function)` sets the event handler in the scope for the given key. Supports nested keys. Adds the event handler prefix to the last component of the key.

* `getValueFunction(key [, includeParents])` returns the value function in the scope for the given key. Supports nested keys and falls back to parent scopes, unless the optional `includeParents` parameter is false. The value function prefix (by default empty) is added to the last component of the key and must not be included in the `key` parameter.
* `setValueFunction(key, function)` sets the value function in the scope for the given key. Supports nested keys. Adds the value function prefix to the last component of the key.

#### Watch
* `watch([key,] function)` adds the given handler function as a watch function to the key, if provided, otherwise to the whole scope.
* `unwatch([key,] function)` unbinds the watch function.

#### Expressions and Statements
* `evaluate(expression)` evaluates the given expression string in the context of the scope.
* `exec(statements)` parses and executes the given statements string in the context of the scope.

#### General
* `parent()` returns the parent scope, or null if there is no parent scope.
* `children()` returns an array containing the immediate child scopes of this scope.
* `options([node])` returns the options object for the given node, or for the scope as a whole. Note that you can modify the returned options object, but changes to the scope’s options will not affect node options.

### Scope properties

The scope exposes some properties inside the `$` object, e.g. `scope.$.index`.

* `index` the 0-based index of the given scope within a repeating section, or undefined if not in a repeating section.

### Consistent functions

* `Consistent([options])` returns a new scope. If the options are provided the scope is initialised with them.
* `Consistent(parentScope [, options])` returns a new scope and sets its parent scope. If the options are provided the scope is initialised with them.
* `Consistent(node)` returns the scope the DOM node is bound to, or null.
* `Consistent.isScope(object)` returns true if the given object is a Consistent scope.

### jQuery plugin

* `$.consistent` is synonymous with the `Consistent` function above and can be used in the same way.
* `$(selector).consistent()` checks the selected elements to see if they have been bound to a scope. If they’ve all been bound to the same scope, it returns that scope. If they’ve been bound to different scopes (or some have been bound and some haven’t) this throws an exception. If they haven’t been bound to a scope a new scope is created, the elements are bound and the scope is returned.
* `$(selector).consistent(options)` creates a new scope with the given options, binds the selected elements to it and returns the scope.
* `$(selector).consistent(scope [, options])` binds the selected nodes to the given scope, with the options if provided and returns the scope.

What Consistent doesn’t do
--------------------------

Consistent doesn’t create DOM nodes. There are great tools for creating DOM nodes, such as simply using jQuery or using a templating engine such as Mustache or Hogan (which I’ve used in the examples). You can easily create new DOM nodes and then bind a new Consistent scope to them. Note that Consistent does in fact create DOM nodes if you create them in templates; however see the [templating section](#templating) for advice about that.

Consistent doesn’t do any Ajax. Consistent scopes can be easily populated from an Ajax JSON response, and their data can be easily exported for sending to a server. Look at the `scope.$.merge(object)` and `scope.$.model()` functions, respectively.

Troubleshooting
---------------

### Functions in objects in the scope are called unexpectedly

See the section [Change prefix for event handler and value functions](#change-prefix-for-event-handler-and-value-functions) above for an explanation and a solution to this problem.
