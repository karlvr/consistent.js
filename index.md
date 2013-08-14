---
layout: "default"
---

What is it?
===========

Consistent is a small and simple Javascript framework to enable an abstract model to be synced with the DOM. Consistent is designed to be easy to use and understand for developers already using jQuery, and it doesn’t prevent you from using jQuery at the same time.

Give me an example
==================

Working with forms
------------------

```html
<form id="exampleForm" ct-on="handleForm">
    Full name: <input type="text" name="fullname"><br>
    Gender: <input type="radio" name="gender" value="M"> Male <input type="radio" name="gender" value="F"> Female<br>
    Optin: <input type="checkbox" name="optin"><br>
    How did you hear about us?
    <select name="referral">
        <option></option>
        <option value="friend">A friend</option>
        <option value="search">A search engine</option>
    </select>
    <input type="submit">
</form>
```


```javascript
var scope = $("#exampleForm").consistent();
scope.$handleForm = function(ev) {
    scope.$.update();
    $.ajax("submit", {
        data: scope.$.model()
    });
};
```
