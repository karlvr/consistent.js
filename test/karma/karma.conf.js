// Karma configuration
// Generated on Sat Aug 03 2013 21:55:22 GMT+1200 (NZST)

 module.exports = function(config) {
    config.set({
      // your config

      // base path, that will be used to resolve files and exclude
      basePath: '../../',

      frameworks: ["jasmine"],

      // list of files / patterns to load in the browser
      files: [
        'src/consistent.js',
        'src/consistent-expressions.js',
        'bower_components/jquery/jquery.js',
        'bower_components/hogan/web/builds/2.0.0/hogan-2.0.0.js',
        'src/jquery.consistent.js',
        'test/lib/jasmine-jquery/jasmine-jquery.js',
        'test/karma/config.js',
        'test/consistent.tests.js',
        'test/**/*Spec.js',
        { pattern: 'test/html/*.html', included:false }
      ],

      // disable preprocessors to allow us to serve html
      preprocessors: { },

      // list of files to exclude
      exclude: [
        
      ],


      // test results reporter to use
      // possible values: 'dots', 'progress', 'junit'
      reporters: ['progress'],


      // web server port
      port: 9876,


      // cli runner port
      runnerPort: 9100,


      // enable / disable colors in the output (reporters and logs)
      colors: true,


      // level of logging
      // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
      logLevel: config.LOG_INFO,


      // enable / disable watching file and executing tests whenever any file changes
      autoWatch: true,


      // Start these browsers, currently available:
      // - Chrome
      // - ChromeCanary
      // - Firefox
      // - Opera
      // - Safari (only Mac)
      // - PhantomJS
      // - IE (only Windows)
      browsers: ['Safari', 'Chrome', 'Firefox', 'PhantomJS'],


      // If browser does not capture in given timeout [ms], kill it
      captureTimeout: 60000,


      // Continuous Integration mode
      // if true, it capture browsers, run tests and exit
      singleRun: false
    });
  };
