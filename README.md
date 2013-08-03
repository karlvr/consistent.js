Consistent.js
=============

Consistent is a small and simple Javascript framework to enable an abstract model to be synced with the DOM. Consistent is designed to be easy to use and understand for developers already using jQuery, and it doesn’t prevent you from using jQuery at the same time.

Introduction
------------
Use Consistent to create a _scope_, and then bind DOM nodes to it. Consistent inspects the DOM nodes (and their children) to learn how to relate them to the scope.

The scope starts with no properties. You add properties to the scope and then apply them to the DOM. In your HTML markup you add `data-ct-*` attributes to tell Consistent how to use the scope’s properties.

The scope contains a `$` property in which Consistent keeps its functions and scope. For example, when you want to apply the scope you call `scope.$.apply()`. This `$` property separates the properties you add to the scope from Consistent, so you can add properties with any other name. Note that this `$` is nothing to do with jQuery and doesn’t interfere with it as it is contained in the scope.

The scope contains scalar values, such as booleans, strings and numbers, and value functions, that return a calculated value. The scope also contains any event handler functions you create. To separate these event handlers from your values they are stored in properties beginning with a `$`, e.g. `$handleClick`.

Consistent includes a jQuery plugin, and the examples below show this approach. Consistent does not however require jQuery and can be used without it.

```html
<script src="consistent.js"></script>
<script src="jquery.consistent.js"></script>
```

### Substitution
Bind an `h1` element to the key `title` in the scope.

```html
<h1 data-ct="title"></h1>
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
<h1 data-ct-tmpl="Welcome to {{name}}"></h1>
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
<h1 data-ct-tmpl-id="h1-template"></h1>

<script id="h1-template" type="text/x-hogan-template">
	Welcome to {{name}}
</script>
```

Note that Consistent will re-render the templates and thus recreate the DOM nodes each time the scope is applied.

If you need to create a large DOM structure and then have it bound to a scope, consider creating it first using templating and then binding it with Consistent.

### Visibility

Consistent can show and hide nodes based on the scope.

```html
<h1 data-ct-show="showTitle">My title</h1>
```

You can also use `data-ct-hide` to hide the element when the scope property is true.

Now create a scope and set the showTitle property. Consistent will show or hide the element using a `display:none` style. Consistent also restores the old value of `display` when re-showing, in case it was set to something specifically.

```javascript
var scope = $("h1").consistent();
scope.showTitle = true;
scope.$.apply();
```

You can override the behaviour of showing and hiding elements. For example, you may want to fade elements in and out. See the Options section for more information.

### Form elements
Form elements work as you would expect: Consistent updates their values from scope.

```html
<input type="text" name="email">
<input type="checkbox" name="optin">
```

Now create a scope and set the input element’s value.

```javascript
var scope = $("input").consistent();
scope.email = "example@example.com";
scope.optin = true;
scope.$.apply();
```

All form elements are supported; including text fields, checkboxes, radio buttons, select lists and textareas.

Consistent automatically listens to the `change` event on form elements. When the `change` event fires, Consistent updates and then applies the scope. You can turn off this behaviour by setting `autoListenToChange` to false in the `options` object, either when the scope is created or when you bind the form elements.

### Events

Consistent can add event listeners to DOM nodes which call functions in the scope. When you put an event handler function into the scope its name gets prefixed with a `$` in order to distinguish it from model values and functions. You don’t have to include the `$` prefix when specifying the function in the DOM.

```html
<a href="#" data-ct-bind-click="handleClick">Click me</a>
```

Now create a scope and provide the click handler. Note that in the DOM the handler is `handleClick` but to define it in the scope it is `$handleClick`.

```javascript
var scope = $("a").consistent();
scope.$handleClick = function(ev) {
	ev.preventDefault();
	alert("Click!");
};
```

The handler function is called with `this` as the element that received the event, as in jQuery. There is also a second argument to the function which is the scope, in case you need it.

```javascript
scope.$handleClick = function(ev, scope) {
	scope.clickCount++;
	scope.$.apply();
};
```

Note that we don’t need to call `apply` after defining the event handler in the scope, as we don’t need to change the DOM. The event listeners are added when the DOM nodes are bound to the scope, you just have to make sure the handler functions are defined by the time they are invoked.

#### Shortcut

There is a shortcut for binding events, which is to omit the event name. This chooses the `click` event for most elements:

```html
<a href="#" data-ct-bind="handleClick">Click me</a>
```

The following special cases apply:
  * `<input>` and `<textarea>` elements bind the `change` event
  * `<form>` elements bind the `submit` event

### Repeating blocks

If your scope contains array values, you can repeat blocks of DOM nodes to represent them.

```html
<ul>
	<li data-ct-rep="people" data-ct="name"></li>
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
scope.people.splice(0, 1);
scope.$.apply();
```

Consistent only creates new nodes when new items are added to the array. So any changes you make to the DOM outside of Consistent will be preserved, such as applying classes.

Consistent creates a child scope for each repeated block, and the object in the array becomes its scope. Therefore each object in the array will have a `$` property added containing Consistent’s scope functionality. As the objects in the array are the child scopes, you can access the child scopes if you need to via the original array in the original scope.

Repeating clones the repeated element, including all of its children:

```html
<table>
	<tr data-ct-rep="people">
		<td>Person #<span data-ct="_ct_index"></span></td>
		<td data-ct="name"></td>
		<td data-ct="address"></td>
	</tr>
</table>
```

Note above that a special property is added to the scope called `_ct_index` which contains the 0-based index of the current iteration. If you want to format that number differently, use a value function that accesses and modifies it.

It is also possible to repeat a collection of elements. See Repeating multiple elements in the Advanced section.

### Value functions

As well as adding values to the scope, you can also add functions. In this case the function is executed each time the scope is applied and its return value is used.

```html
<div id="container">
	<p>The number of people is <span data-ct="numberOfPeople">&nbsp;</span>.</p>
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

### Attributes

You can set DOM element attributes from the scope.

```html
<h1 data-ct-attr-class="titleClass">Title</h1>
```

Now create a scope and set the heading’s class.

```javascript
var scope = $("h1").consistent();
scope.titleClass = "large";
scope.$.apply();
```

The `h1` element will now have a class of "large" applied.

You can also set DOM element properties, see the Properties section below.

#### Templating

You can also use templates to update attributes.

```html
<h1 data-ct-tmpl-attr-class="heading {{titleClass}}">Title</h1>

<h1 data-ct-tmpl-id-attr-class="h1-class-template">Title</h1>
<script id="h1-class-template" type="text/x-hogan-template">heading {{titleClass}}</script>
```

### Binding to DOM nodes

In the examples above we’ve specifically targeted the example nodes, this isn’t very realistic in practice. When you bind a DOM node to Consistent, all of its child nodes are bound as well. So typically you bind a container element.

```html
<div id="container">
	<h3 data-ct="name"></h3>
	<p data-ct="body"></p>
</div>
```

Now bind the scope.

```javascript
$("#container").consistent();
```

Often you will have multiple blocks on the page and you’ll need to have an individual scope for each of them.

```html
<div class="container">
	<p data-ct="body"></p>
</div>
<div class="container">
	<p data-ct="body"></p>
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

The snapshots passed to the watch handler function for the whole scope are created using the `scope.$.snapshot` function, and therefore do not have the `$` object, event handlers, and value functions have been replaced with their value.

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

### Snapshotting the scope to a Javascript object

The scope contains some extra properties required for Consistent. Particularly the `$` object where all of Consistent’s functionality lives (e.g. `scope.$.apply()`). It also contains event handler functions (property names prefixed with a `$`), which aren’t part of your model data. Finally, it contains value functions that are evaluated to determine their current value.

In order to obtain a Javascript object with just the model properties use the `snapshot` function. It will return a new object excluding the `$` object and any keys starting with a `$` symbol. It will also evaluate all value functions and include their current value.

```javascript
var scope = $("#item").consistent();
scope.$.update();
$.ajax({
	data: scope.$.snapshot()
});
```

The `snapshot` function includes properties from parent scopes. If you don’t want to include parent scopes use `snapshotLocal` instead.

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
<h1 data-ct="person.fullName"></h1>
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

Note that `get` will fall back to a parent scope, if there is one. See below for Parent scopes. If you don’t want to fall back to a parent scope use `getLocal` instead.

### Parent scopes

You can create child scopes. Child scopes will look to their parent if they don’t contain a value for a given property key, in order to populate a DOM node or when looking for an event handler function.

When a child scope is applied it automatically applies its parent scope.

Watch handler functions added to parent scopes will be fired for changes in child scopes.

```javascript
var rootScope = $.consistent(); /* Create the root scope */
var childScope = $.consistent(rootScope); /* Create a child scope */
$("#item").consistent(childScope); /* Bind a DOM node to the child scope */
```

Note that we have to create the scope and then bind the DOM node, rather than doing that at the same time as we have in other examples. This is because if you pass a scope as a parameter to the form with the selector it treats that as the scope to bind to. You have to call the `$.consistent` function in order to create a new scope with a parent. Note that `$.consistent` and `Consistent` are the same function.

Now the following will work.

```html
<div id="item">
	<h2 data-ct="title"></h2>
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
	<h2 data-ct="title" data-ct-bind-click="handleClick"></h2>
</div>
```

```javascript
rootScope.$handleClick = function(ev, scope) {
	// scope === childScope
	scope.title += ".";
};
```

### Getting the nodes bound to a scope

If you need to get the DOM nodes that have been bound to a scope, you can either use `nodes`, which returns all of the DOM nodes that are bound, or `roots`, which only returns the DOM nodes explicitly bound – as opposed to those that were bound as they are children of the explicitly bound nodes.

```javascript
$(scope.$.nodes()).addClass("found");
$(scope.$.roots()).addClass("found");
```

### Repeating multiple root elements

The Repeating blocks section above introduces repeating. In that example you can only repeat a single root element, such as an `<li>` or a `<tr>`. Consistent also supports repeating a block of multiple root elements, which is useful if you want to add multiple table rows to a table for each block.

```html
<table>
	<tr data-ct-rep="people" data-ct-rep-container-id="rows"></tr>
</table>

<table style="display:none">
	<tbody id="rows">
		<tr>
			<td>Name</td>
			<td data-ct="name"></td>
		</tr>
		<tr>
			<td>Address</td>
			<td data-ct="address"></td>
		</tr>
	</tbody>
</table>
```

Using the `data-ct-rep-container-id` attribute you can identify nodes elsewhere in the DOM that should be cloned and used in the repeating block. Note that tables automatically get a `<tbody>` element created, even if it isn’t in the markup, therefore you should attach the id to an explicit `<tbody>` otherwise if the id is on the `<table>`, the repeating block will include the automatically created `<tbody>`.

### Properties

You can set DOM element properties from the scope. Properties are DOM node Javascript properties, as opposed to attributes which are declared in the markup. The most common property to use is the `style` property, which exposes an object containing the DOM element’s style.

```html
<p data-ct-prop-style-display="showHide">Lorem ipsum</p>
```

Note that properties may be nested, as in the case of `style.display` above, and we can specify this by `-` separating the property name when we declare the `data-ct-prop-` attribute.

```javascript
var scope = $("p").consistent();
scope.showHide = "none";
scope.$.apply();
```

This sets the `style.display` property of the `<p>` element to "none", causing it not to be displayed.

See the Visibility section above for a better way to show and hide elements.

Options
-------

### Visibility

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

### Repeating blocks

If you want to animate the appearance and disappearance of elements in repeating block, you can override the behaviour after adding nodes, and for removing nodes.

```javascript
var options = { $: {} };
options.$.added = function(dom) {
	// jQuery hide and fadeIn
	$(dom).hide().fadeIn();
};
options.$.remove = function(dom) {
	// jQuery fade then remove
	$(dom).fadeOut(function() {
		this.remove();
	});
};
var scope = $("#container").consistent(options);
```

Reference
---------

### DOM attributes

#### Binding values

* `data-ct` the name of a property in the scope to use to set the value of this element. Where setting the value means setting the `innerHTML`, or other properties as appropriate to the element type.
* `data-ct-tmpl` a template that will be rendered with the scope as its context, and then used to set the value of this element.
* `data-ct-tmpl-id` the id of a DOM element that contains template text, e.g. a `<script type="text/x-hogan-template">` element.

#### Attributes and properties

The `NAME` segment in the following list represents the name of the attribute or property. In the case of properties, the name will have -s changed to .s to enable access to nested properties, e.g. `data-ct-prop-style-display` affects the `style.display` property.

* `data-ct-attr-NAME` the name of a property in the scope to use to set the value of the given attribute on this element.
* `data-ct-prop-NAME` the name of a property in the scope to use to set the value of the given property on this element.
* `data-ct-tmpl-attr-NAME` a template that will be rendered with the scope as its context, and then used to set the value of the given attribute on this element.
* `data-ct-tmpl-id-attr-NAME` the id of a DOM element that contains template text.

#### Visibility

* `data-ct-show` show this element when the named property in the scope is true, otherwise hide it.
* `data-ct-hide` the opposite of show.

#### Event handlers

* `data-ct-bind` binds the default event for this element to the named event handler function in the scope.
* `data-ct-bind-EVENT` binds the event named EVENT for this element to the named event handler function in the scope.

#### Repeating blocks

* `data-ct-rep` repeats this element, and all of its children, for each item in the array in the named property in the scope.
* `data-ct-rep-container-id` the id of a DOM element that contains DOM nodes to be repeated in place of this element.


### Scope functions

All scope functions are nested inside the `$` object, and therefore you call them, e.g. `scope.$.apply()`.

#### DOM

* `apply([options, ] [function])` applies the scope to the DOM. If the optional options are provided they augment each node’s options before applying. If the function argument is provided, the function is called with `this` set to the scope before the scope is applied.
* `applyLater([options, ] [function])` as for `apply` but rather than applying immediately it creates a `setTimeout` with a 0 time so it will be called after the current Javascript event handling finishes. The function, if supplied, is called immediately. It is safe to call this multiple times, the scope will only be applied once.
* `needsApply()` returns true if the scope has been changed and needs to be applied to the DOM. Changes include properties changed in the scope or new nodes bound to the scope.
* `update()` updates the scope by reading keys and values from the DOM.
* `bind(dom [, options])` binds the given DOM node to the scope. See the options section for the optional options argument.
* `nodes()` returns an array of DOM nodes that are bound to this scope.
* `roots()` returns an array of the DOM nodes explicitly bound to this scope, that is the nodes that were passed to the `bind` function.

#### Scope properties
* `snapshot()` returns a Javascript object containing the scope’s model properties, excluding the Consistent `$` object, any properties prefixed with a `$` (event handlers) and evaluating value functions and replacing with their current values.
* `snapshotLocal()` as for `snapshot` but doesn’t include parent scopes.
* `merge(object)` merges properties in the given object into the scope.
* `replace(object)` replaces the scope with the given object. The given object is actually used as the scope, and Consistent’s `$` object is added into this new object. The return value is the object.
* `get(key)` returns the value in the scope for the given key. Supports nested keys (i.e. that contain dot notation) and falls back to parent scopes. If the scope contains a value function for the given key, it is evaluated and its result returned.
* `getLocal(key)` as for `get` but doesn’t fall back to parent scopes.
* `set(key, value)` sets the value in the scope for the given key. Supports nested keys.
* `getEventHandler(key)` returns the event handler in the scope for the given key. Supports nested keys and falls back to parent scopes. Adds the `$` prefix to the last component of the key, as event handlers are stored with a `$` prefix, e.g. `people.$handleClick`.
* `getLocalEventHandler(key)` as for `getEventHandler` but doesn’t fall back to parent scopes.
* `setEventHandler(key)` sets the event handler in the scope for the given key. Supports nested keys. Adds the `$` prefix to the last component of the key.

#### Watch
* `watch([key,] function)` adds the given handler function as a watch function to the key, if provided, otherwise to the whole scope.
* `unwatch([key,] function)` unbinds the watch function.

#### General
* `parent()` returns the parent scope, or null if there is no parent scope.
* `options(node)` returns the options object for the given node.

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

Consistent doesn’t do any Ajax. Consistent scopes can be easily populated from an Ajax JSON response, and their data can be easily snapshoted for sending to a server. Look at the `scope.$.merge(object)` and `scope.$.snapshot()` functions, respectively.
