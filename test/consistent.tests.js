function loadFixture(name) {
	$('#fixture').remove();
	$.ajax({
  		async: false, // must be synchronous to guarantee that no tests are run before fixture is loaded
  		dataType: 'html',
  		url: '/base/test/html/' + name,
		success: function(data) {
			$('body').append($("<div id='fixture'></div>"));
			$('#fixture').append($(data));
		}
	});
}
