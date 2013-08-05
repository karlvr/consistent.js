#!/bin/sh

./node_modules/.bin/karma start test/karma.conf.js --single-run --browsers PhantomJS,Firefox
./node_modules/.bin/karma start test/karma.min.conf.js --single-run --browsers PhantomJS,Firefox
