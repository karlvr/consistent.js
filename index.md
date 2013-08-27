---
layout: "default"
---

What is it?
===========

Consistent is a small and simple Javascript framework for syncing an abstract model with the DOM. Consistent is designed to be easy to learn and use for anyone already using jQuery to manipulate the DOM. Consistent simplifies your code, and doesn’t prevent you from using jQuery at the same time.



Give me an example
==================

Here are some simple examples of how you might use Consistent.

Updating text on a page
-----------------------

When you have data in JavaScript that you want to put into the DOM, Consistent removes the need to manipulate the DOM directly. Use a declarative style to direct Consistent.

```html
<h1>Welcome <span ct="name"></span></h1>
<button>Sign out <span ct="name"></span></button>
```

```javascript
var scope = $('body').consistent();
scope.name = "guest";
scope.$.apply();
```

Working with forms
------------------

<form id="exampleForm" ct-on="handleForm">
    Full name: <input type="text" name="fullname"><br>
    Gender: <label><input type="radio" name="gender" value="M"> Male</label>
            <label><input type="radio" name="gender" value="F"> Female</label>
    <br>
    <input type="submit">
</form>
<script>
var scope = $("#exampleForm").consistent();
scope.$handleForm = function(ev) {
    this.$.update();
    var data = this.$.model();
    alert("Full name: " + data.fullname + "\nGender: " + data.gender);
    ev.preventDefault();
};
</script>

```html
<form id="exampleForm" ct-on="handleForm">
    Full name: <input type="text" name="fullname"><br>
    Gender: <label><input type="radio" name="gender" value="M"> Male</label>
            <label><input type="radio" name="gender" value="F"> Female</label>
    <br>
    <input type="submit">
</form>
```

```javascript
var scope = $("#exampleForm").consistent();
scope.$handleForm = function(ev) {
    this.$.update();
    var data = this.$.model();
    alert("Full name: " + data.fullname + "\nGender: " + data.gender);
    ev.preventDefault();
};
```
