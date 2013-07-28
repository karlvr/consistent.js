Consistent.js
=============

Consistent is a small Javascript framework to enable an abstract model to be synced with the DOM.

Introduction
------------
Use Consistent to create a _scope_, and then bind DOM nodes to it. Consistent inspects the DOM nodes (and their children)
to learn how to relate them to the scope.

### Simple example
Bind an `h1` element to the key `title` in the scope.

	<h1 data-ct="title"></h1>

Now create a scope using the jQuery plugin, and assign a value to it.

	var scope = $("h1").consistent();
	scope.title = "Consistent.js";
	scope.$.apply();

The `h1` element will now have its body changed to "Consistent.js".

Notice that after changing properties in the scope you need to call _apply_ to instruct Consistent to update the DOM.
You can also apply changes to the scope like this, which is equivalent:

	var scope = $("h1").consistent();
	scope.$.apply(function() {
		this.title = "Consistent.js";
	});

Or even:

	$("h1").consistent().$.apply(function() {
		this.title = "Consistent.js";
	});

### Form elements
Form elements work as you would expect. Consistent updates their values.

	<input type="text" name="email">

Now create a scope and set the input element’s value.

	var scope = $("input").consistent();
	scope.email = "example@example.com";
	scope.$.apply();

### Attributes
You can also set attributes from the scope.

	<h1 data-ct-attr-class="titleClass">Title</h1>

Now create a scope and set the heading’s class.

	var scope = $("h1").consistent();
	scope.titleClass = "large";
	scope.$.apply();

The `h1` element will now have a class of "large" applied.

### Templating

Consistent supports pluggable templating engines. The examples use [Hogan](http://twitter.github.io/hogan.js/). Any templating
engine that provides `compile(string)` and `render(object)` methods will work.

	<h1 data-ct-tmpl="Welcome to {{name}}"></h1>

Now configure Consistent to use Hogan as its templating engine, and populate the scope.

	Consistent.defaultOptions.templateEngine = Hogan;
	var scope = $("h1").consistent();
	scope.name = "Consistent.js";
	scope.$.apply();
	

What Consistent doesn’t do
--------------------------

Consistent doesn’t create DOM nodes. There are great tools for creating DOM nodes, such as simply using jQuery or using a templating
engine such as Mustache or Hogan (which I’ve used in the examples). You can easily create new DOM nodes and then bind a new Consistent
scope to them.

Consistent doesn’t do any Ajax. Consistent scopes provide easy access to populate from an Ajax JSON response or to extract data for sending
to a server. Look at the `scope.$.merge(object)` and `scope.$.export()` functions.
