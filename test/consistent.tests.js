if (typeof fixtureBase === "undefined") {
	fixtureBase = '/base/test/html/';
}

function loadFixture(name) {
	$('#fixture').remove();
	$.ajax({
  		async: false, // must be synchronous to guarantee that no tests are run before fixture is loaded
  		dataType: 'html',
  		url: fixtureBase + name,
		success: function(data) {
			$('body').append($("<div id='fixture'></div>"));
			$('#fixture').append($(data));
		},
		error: function(jqXHR, textStatus, error) {
			console.log("Fixture load failed: " + name + ": " + textStatus);
		}
	});
}

function dispatchSimpleEvent(dom, name) {
	var ev;
	if (document.createEvent) {
		ev = document.createEvent("HTMLEvents");
		ev.initEvent(name, true, true);
		dom.dispatchEvent(ev);
	} else if (document.createEventObject) {
		/* IE support */
		dom.fireEvent("on" + name);
	}
	return ev;
}

function dispatchHTMLEvent(domNodes, name) {
	for (var i = 0; i < domNodes.length; i++) {
		dispatchSimpleEvent(domNodes[i], name);
	}
}

function dispatchClickEvent(domNodes) {
	for (var i = 0; i < domNodes.length; i++) {
		if (domNodes[i].click) {
			domNodes[i].click();
		} else {
			var evt = document.createEvent("MouseEvents"); 
			evt.initMouseEvent("click", true, true, window, 
          		0, 0, 0, 0, 0, false, false, false, false, 0, null);
			domNodes[i].dispatchEvent(evt);
		}
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

function nodeText(node) {
	if (node.textContent) {
		return node.textContent;
	}

	/* IE */
	return node.innerText;
}

/* Create elements for IE6 compatibility */
document.createElement("content");
document.createElement("article");
document.createElement("abbr");
document.createElement("nav");
document.createElement("section");
