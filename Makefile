# Consistent.js Makefile

# To install uglify-js:
# npm install uglify-js -g

# To install jslint:
# brew install jslint

SOURCE=src/consistent.js
MINIFIED=$(SOURCE:src/%.js=lib/%.min.js)
GZIPPED=$(MINIFIED:.min.js=.min.js.gz)

PLUGINS=$(shell find src -type f -name "*.consistent.js")
PLUGINS_MINIFIED=$(PLUGINS:src/%.consistent.js=lib/consistent-for-%.min.js)
PLUGINS_GZIPPED=$(PLUGINS_MINIFIED:.min.js=.min.js.gz)

UGLIFY_FLAGS=-m --comments '/\/*!/'

all: lib

clean:
	rm -f lib/*.js
	rm -f lib/*.js.gz

lib: libdir $(MINIFIED) $(GZIPPED) $(PLUGINS_MINIFIED) $(PLUGINS_GZIPPED)
	ls -l lib

libdir:
	mkdir -p lib

lib/%.min.js: src/%.js
	uglifyjs $(UGLIFY_FLAGS) $< -o $@

lib/consistent-for-%.min.js: src/%.consistent.js src/consistent.js
	uglifyjs $(UGLIFY_FLAGS) -o $@ -- src/consistent.js $< 

lib/%.min.js.gz: lib/%.min.js
	gzip -c -n $< > $@

lint:
	find src -name "*.js" -exec jsl -process \{\} \;

test:
	karma start test/karma.conf.js --single-run

.PHONY: all test clean
