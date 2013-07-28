Consistent.js
=============

Consistent is a small Javascript framework to enable an abstract model to be synced with the DOM.

Introduction
------------
Use Consistent to create a _scope_, and then bind DOM nodes to it. Consistent inspects the DOM nodes (and their children)
to learn how to relate them to the scope.

Consistent includes a jQuery plugin, and the examples below show this approach. Consistent does not however require jQuery
and can be used easily without it.

### Simple example
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

Notice that after changing properties in the scope you need to call _apply_ to instruct Consistent to update the DOM.
You can also apply changes to the scope like this, which is equivalent:

```javascript
var scope = $("h1").consistent();
scope.$.apply(function() {
	this.title = "Consistent.js";
});
```

Or even:

```javascript
$("h1").consistent().$.apply(function() {
	this.title = "Consistent.js";
});
```

### Form elements
Form elements work as you would expect. Consistent updates their values.

```html
<input type="text" name="email">
```

Now create a scope and set the input element’s value.

```javascript
var scope = $("input").consistent();
scope.email = "example@example.com";
scope.$.apply();
```

### Attributes
You can also set attributes from the scope.

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

### Templating

Consistent supports pluggable templating engines. The examples use [Hogan](http://twitter.github.io/hogan.js/). Any templating
engine that provides `compile(string)` and `render(object)` methods will work.

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

You can also references templates by an id, rather than writing them inline.

```html
<h1 data-ct-tmpl-id="h1-template"></h1>

<script id="h1-template" type="text/x-hogan-template">
	Welcome to {{name}}
</script>
```

You can also use templates to update attributes.

```html
<h1 data-ct-tmpl-attr-class="heading {{titleClass}}">Title</h1>

<h1 data-ct-tmpl-id-attr-class="h1-class-template">Title</h1>
<script id="h1-class-template" type="text/x-hogan-template">heading {{titleClass}}</script>
```

### Events

Consistent can add event listeners to DOM nodes which call functions in the scope.

```html
<a href="#" data-ct-bind-click="handleClick">Click me</a>
```

Now create a scope and provide the click handler.

```javascript
var scope = $("a").consistent();
scope.handleClick = function(ev) {
	ev.preventDefault();
	alert("Click!");
};
```

The handler function is called with `this` as the element that received the event, as in jQuery. There is also a second
argument to the function which is the scope, in case you need it.

```javascript
scope.handleClick = function(ev, scope) {
	scope.clickCount++;
	scope.$.apply();
};
```

Note that we don’t need to call `apply` as we don’t need to change the DOM. The event listeners are added when the DOM nodes
are bound, you just have to make sure the handler functions are defined by the time they are needed.

### Binding to DOM nodes

In the examples above we’ve specifically targetted the example nodes, this isn’t very realistic in practice.
When you bind a DOM node to Consistent, all of its child nodes are bound as well. So typically you bind a container
element.

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

### Finding the scope for a DOM node

If you need to get the existing scope for a node, you can follow the exact same pattern. Calling `.consistent()` again
will return the existing scope.

```javascript
$(".container").each(function() {
	var scope = $(this).consistent();
	scope.body = "Change the body";
	scope.$.apply();
});
```

You can also call the `Consistent.findScopeForNode(node)` function, if you just want to check if there’s a scope rather than
create one.

### Updating the scope from the DOM

Consistent can inspect the DOM to populate the scope.

```javascript
var scope = $("#container").consistent();
scope.$.update();
```

Note this doesn’t work for any properties that are using templates.

### Watching for changes in the scope

Register a handler function to watch for changes to a particular property, or to the scope as a whole. Watch handler
functions are called when `apply` is called on the scope, **before** the DOM has been updated.

```javascript
scope.$.watch("title", function(key, newValue, oldValue) {
	this.shortTitle = this.title.substring(0, 10);
});

scope.$.watch(function(changedKeys, newScope, oldScope) {
	this.changeSummary = "The following keys were changed: " + changedKeys;
});
```

Notice that you do not need to call `apply` if you change the scope inside a watch handler. A watch handler may be called
multiple times in a single `apply` if the scope is changed by _other_ watch handlers.

It is possible for watch handlers to cause an infinite loop, if the scope does not reach a steady state. Consistent detects
excessive looping through the watch handler list and throws an exception to break it. The number of loops is set in
`Consistent.settings.maxWatcherLoops`; the default should be good enough.

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

Watch handler functions will be called with the `key` as the nested property name, eg. `person.fullName`. For convenience
the scope declares two functions for working with nested property names.

```javascript
var nestedPropertyName = "person.fullName";
scope.$.get(nestedPropertyName);
scope.$.set(nestedPropertyName, value);
```

If the appropriate intermediate objects don’t exist, when calling `set`, they are created and added to the scope for you.


What Consistent doesn’t do
--------------------------

Consistent doesn’t create DOM nodes. There are great tools for creating DOM nodes, such as simply using jQuery or using a templating
engine such as Mustache or Hogan (which I’ve used in the examples). You can easily create new DOM nodes and then bind a new Consistent
scope to them.

Consistent doesn’t do any Ajax. Consistent scopes provide easy access to populate from an Ajax JSON response or to extract data for sending
to a server. Look at the `scope.$.merge(object)` and `scope.$.export()` functions.
