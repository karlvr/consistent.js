console.log("Runner init");
if (typeof runnerHasRun === "undefined") {
	runnerHasRun = true;

	fixtureBase = "test/html/";

	console.log("Runner start")
	var env = jasmine.getEnv();
	var reporter = new jasmine.TapReporter();
	env.addReporter(reporter);
	env.execute();
}
