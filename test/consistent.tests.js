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

function dispatchHTMLEvent(domNodes, name) {
	for (var i = 0; i < domNodes.length; i++) {
		var ev = document.createEvent("HTMLEvents");
		ev.initEvent(name, true, true);
		domNodes[i].dispatchEvent(ev);
	}
}

function nodesByName(nodes) {
	var result = {};
	for (var i = 0; i < nodes.length; i++) {
		var nodeName = nodes[i].nodeName;
		if (result[nodeName] === undefined) {
			result[nodeName] = [];
		}
		result[nodeName].push(nodes[i]);
	}
	return result;
}
