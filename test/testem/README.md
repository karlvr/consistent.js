Testem
------

```
npm install -g testem
npm install -g browserstack-cli
```

### Run CI tests

Runs the test once and reports the results in TAP format.

```
testem -f test/testem/testem.json ci
```

### Run development tests

Runs tests whenever you save a change.

```
testem -f test/testem/testem.json
```

Or with specific *launchers*:

```
testem -f test/testem/testem.json -l bs_ie_7,bs_ie_8
```

Setting up BrowserStack
=======================

Create your BrowserStack account; note the username, password and Local testing command line tunnel API key (which is found at the bottom of http://www.browserstack.com/automated-browser-testing-api).

```
browserstack-cli setup
```

The input that information. It will also ask for a private key, which I don't think you need.

Test BrowserStack by launching an instance. You should be able to see this job appear in the Automate tab on the BrowserStack website after logging in.

```
browserstack launch safari:6 http://www.google.com/
```

The BrowserStack configuration is in `testem.json`, it opens a tunnel to BrowserStack to enable the browser there to connect to testem running a local webserver. We specify a longer timeout than the default, as it appears to often take longer than expected to connect.

If you get an error relating to the `BrowserStackTunnel.jar` being corrupt, download a new copy of it from http://www.browserstack.com/local-testing and copy it to `~/.browserstack/BrowserStackTunnel.jar`.
