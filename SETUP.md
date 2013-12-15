# Getting started

These instructions are for setting up your development environment to build Consistent.js.

I use the [Homebrew](http://brew.sh) package manager to install `npm`, the Node package manager. You can get `npm` installed however you prefer. We will then use `npm` to install any other dependencies.

## Testing

```
brew install npm
npm -g install karma
npm -g install karma-safari-launcher
```

You can now run `make test` to test Consistent.js.

## Linting

```
npm -g install jshint
```

## Packaging

We use Uglify to munge and combine the source files.

```
npm -g install uglify-js
```
