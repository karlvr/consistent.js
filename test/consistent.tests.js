jasmine.getFixtures().containerId = "fixture";
jasmine.getFixtures().fixturesPath = fixtureBase;

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
		var nodeName = nodes[i].nodeName.toUpperCase();
		/* NB. standardise nodeName as upper-case, as IE6 gives its new elements (eg. article)
		 * lowercase names while the others are upper-case
		 */
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
document.createElement("header");
document.createElement("footer");
