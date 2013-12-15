# Consistent.js Makefile

# To install uglify-js:
# npm install uglify-js -g

# To install jslint:
# brew install jslint

SOURCE=src/consistent.js src/consistent-expressions.js
MINIFIED=$(SOURCE:src/%.js=lib/%.min.js)
GZIPPED=$(MINIFIED:.min.js=.min.js.gz)

PLUGINS=$(shell find src -type f -name "*.consistent.js")
PLUGINS_COMBINED=$(PLUGINS:src/%.consistent.js=lib/consistent-for-%.js)
PLUGINS_MINIFIED=$(PLUGINS:src/%.consistent.js=lib/consistent-for-%.min.js)
PLUGINS_GZIPPED=$(PLUGINS_MINIFIED:.min.js=.min.js.gz)

UGLIFY_FLAGS=-m --comments '/\/*!/'

all: lib

clean:
	rm -f lib/*.js
	rm -f lib/*.js.gz
	rm -f lib/*.map

lib: libdir $(MINIFIED) $(GZIPPED) $(PLUGINS_COMBINED) $(PLUGINS_MINIFIED) $(PLUGINS_GZIPPED)
	ls -l lib

libdir:
	mkdir -p lib

lib/%.min.js: src/%.js
	uglifyjs $(UGLIFY_FLAGS) -o $@ --source-map $@.map -p relative -- $<

lib/consistent-for-%.js: src/%.consistent.js $(SOURCE)
	cat $(SOURCE) $< > $@

lib/consistent-for-%.min.js: src/%.consistent.js $(SOURCE)
	uglifyjs $(UGLIFY_FLAGS) -o $@ --source-map $@.map -p relative -- $(SOURCE) $<

lib/%.min.js.gz: lib/%.min.js
	gzip -c -n $< > $@

lint:
	find src -name "*.js" -exec jshint --verbose \{\} \;

test:
	karma start test/karma/karma.conf.js --single-run

test1:
	karma start test/karma/karma.conf.js --single-run --browsers PhantomJS

citest:
	karma start test/karma/karma.conf.js

testie6:
	testem -f test/testem/testem.json -l bs_ie_6

testie7:
	testem -f test/testem/testem.json -l bs_ie_7

testie8:
	testem -f test/testem/testem.json -l bs_ie_8

testie9:
	testem -f test/testem/testem.json -l bs_ie_9

testie10:
	testem -f test/testem/testem.json -l bs_ie_10

.PHONY: all test test1 citest clean testie6 testie7 testie8 testie9 testie10
