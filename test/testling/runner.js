console.log("Runner init");
if (typeof runnerHasRun === "undefined") {
	runnerHasRun = true;

	console.log("Runner start")
	var env = jasmine.getEnv();
	var reporter = new jasmine.TapReporter();
	env.addReporter(reporter);
	env.execute();
}
