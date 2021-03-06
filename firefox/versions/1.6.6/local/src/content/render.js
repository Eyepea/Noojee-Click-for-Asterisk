noojeeClick.ns(function() { with (noojeeClick.LIB) {

theApp.render =
{

// List of tags whose children we will scan looking for phone numbers
tagsOfInterest: [ "a", "abbr", "acronym", "address", "applet", "b", "bdo",
		"big", "blockquote", "body", "caption", "center", "cite", "code", "dd",
		"del", "div", "dfn", "dt", "em", "fieldset", "font", "form", "h1",
		"h2", "h3", "h4", "h5", "h6", "i", "iframe", "ins", "kdb", "li",
		"object", "pre", "p", "q", "samp", "small", "span", "strike", "s",
		"strong", "sub", "sup", "td", "th", "tt", "u", "var" ],


//njClickElementType: "IMG",
njClickElementType: "INPUT",

njClickElementName: "noojeeClickImg",

onRefresh: function()
{
	var documentList = theApp.util.getWindowList();

	for ( var i = 0; i < documentList.length; i++)
		this.onRefreshOne(documentList[i]);

},


onRefreshOne: function (doc)
{
	theApp.util.njdebug("render", "onRefresh called for doc=" + doc);
	try
	{
		// First remove any clicks.
		var spans = doc.getElementsByName("noojeeClick");
		theApp.util.njdebug("render", "spans=" + spans);
		theApp.util.njdebug("render", "span.length=" + spans.length);

		var removalSpanArray = [];
		var removedSpanItemCount = 0;
		for ( var i = spans.length - 1; i >= 0; i--)
		{
			var removalImageArray = [];
			var removedImageItemCount = 0;
			var span = spans[i];
			var parent = span.parentNode;

			var children = span.childNodes;
			var insertionPoint = span;
			for ( var j = children.length - 1; j >= 0; j--)
			{
				var child = children[j];
				theApp.util.njdebug("render", "child.nodeName=" + child.nodeName);
				theApp.util.njdebug("render", "child.name=" + child.name);

				var deleted = false;
				if (child.nodeName == this.njClickElementType)
				{
					if (child.name == this.njClickElementName)
					{
						removalImageArray[removedImageItemCount++] = child;
						deleted = true;
					}
				}
				if (deleted == false)
				{
					parent.insertBefore(child, insertionPoint);
					insertionPoint = child;
				}
			}

			for ( var k = 0; k < removedImageItemCount; k++)
			{
				span.removeChild(removalImageArray[k]);
			}
			removalSpanArray[removedSpanItemCount++] = span;
		}

		for ( var l = 0; l < removedSpanItemCount; l++)
		{
			if (removalSpanArray[l].parentNode != null)
				removalSpanArray[l].parentNode.removeChild(removalSpanArray[l]);
			else
				theApp.util.njdebug("render", "unexpected null parentNode for: "
						+ removalSpanArray[l]);
		}

		// Now add the Noojee Dial icons back in.
		if (theApp.prefs.getBoolValue("enabled") == true)
		{
			this.addClickToDialLinks(doc);
		}

	} catch (e)
	{
		theApp.util.njlog(e);
		theApp.util.showException("onRefreshOne", e);
	}
},


addClickToDialLinks: function (document)
{
	if (this.excluded(document) == true)
		theApp.util.njdebug("render", "excluded=" + document.location.href);
	else
	{
		theApp.util.njdebug("render", "rendering: "
				+ (document.location ? document.location.href : document));

		var pattern = theApp.prefs.getValue("pattern");
		var delimiters = theApp.prefs.getValue("delimiters");
		theApp.util.njdebug("render", "pattern =" + pattern);

		if (pattern != null && theApp.util.trim(pattern).length != 0)
		{
			// Get the list of tags that we are gong to search for matching
			// phone numbers.
			var xpath = "//text()[(parent::" + this.tagsOfInterest.join(" or parent::") + ")]";
			var candidates = document.evaluate(xpath, document, null,
					XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

			// Get the list of regex patterns we are to match on.
			var trackRegex = new RegExp(theApp.phonepatterns.transposePattern(pattern), "ig");
			theApp.util.njdebug("render", "regex=" + trackRegex);

			// Loop through and test every candidate for a match.
			for ( var cand = null, i = 0; (cand = candidates.snapshotItem(i)); i++)
			{

				theApp.util.njdebug("render", "examining node=" + cand.nodeValue);
				if (trackRegex.test(cand.nodeValue))
				{

					// Check that the node isn't owned by a document which is in
					// design mode (i.e. an editor).
					// If it is then we skip the node.

					theApp.util.njdebug("render", "Scanning for an editor parent for cand=" + cand);

					// Scan all of the owners checking for an editor
					var parent = cand.parentNode;
					var editable = false;
					while (parent != null)
					{
						if (parent.designMode == "on" 
						|| parent.designMode == "true"
						|| parent.contentEditable == "on"
						|| parent.contentEditable == "true"
						)
						{
							theApp.util.njdebug("render", "Found node in designMode, skipping");
							editable = true;
							break;
						}
						else if (parent.designMode == "off" 
						|| parent.designMode == "false"
						|| parent.contentEditable == "off"
						|| parent.contentEditable == "false"
						)
						{
							// parent isn't editable so search no further.
							break;
						}
						if (parent == parent.parentNode)
							theApp.util.njerror("render", "bugger, self referencing parent.");
						// definition:bugger, from the latin australias - woe is me, that shouldn't have happened.
					 	parent = parent.parentNode;
					}
					
					if (editable)
						continue;

					// First check that the parent isn't already a noojeeClick
					// element
					// In some case we appear to be processing the document
					// twice
					// but I've not found a simple way to suppress it so we do
					// this simple check
					if (cand.parentNode != null
							&& cand.parentNode.getAttribute("name") != "noojeeClick")
//							&& cand.parentNode.getAttribute("name") != "noojeeClickTop")
					{
						// Create an artificial parent span to insert the reworked
						// text
						var span = document.createElement("span");
						span.setAttribute("name", "noojeeClickTop");

						var source = cand.nodeValue;
						theApp.util.njdebug("render", "source=" + source);
						cand.parentNode.replaceChild(span, cand);
						trackRegex.lastIndex = 0;

						// var children[];
						// var previousMatch = null;

						// In a single piece of text we may have multiple
						// matches
						// so we need to iterate over the list of matches.
						// We go through the 'text' identifying each match
						// which we wrap in an image tag with the noojee click
						// icon.
						// As we go we rebuild the text into a single new parent
						// span ready for re-inserting into the original parent
						// with any noojee click images inserted.
						for ( var match = null, lastLastIndex = 0; (match = trackRegex
								.exec(source));)
						{
							// OK so we having a matching string
							theApp.util.njdebug("render", "match=" + match);

							// rebuild the original source string as we go by
							// adding the non-matching substrings
							// between the matching substrings.

							// Add the non-matching substring which appear
							// between
							// the matching substrings into the new parent node.
							var nonMatching = source.substring(lastLastIndex,
									match.index);

							// Check the characters immediately before and
							// after the matching digit.
							// If we find a digit, period,
							// comma, plus or minus sign or one of the defined
							// delimiters before or after the
							// matching region then the match region is probably
							// part of some bigger number which isn't actually
							// a phone number. So mark it as non-matching and
							// move on.

							// check the preceding character
							if (match.index > 0)
							{
								//njlog("preceeding=" + source.substring(
								//	match.index - 1, match.index));
								if ("0123456789+-,.".indexOf(source.substring(
										match.index - 1, match.index)) != -1)
								{
									// the non match had an invalid character so 
									// our number mustn't be a phone number.
									continue;
								}
								if (delimiters.indexOf(source.substring(
										match.index - 1, match.index)) != -1)
								{
									// the non match had an invalid character so 
									// our number mustn't be a phone number.
									continue;
								}
							}

							// check the following character.
							if (match.index + match[0].length < source.length - 1)
							{
								//njlog("following=" + source.substring(
								//	match.index + match[0].length, match.index + match[0].length + 1));

								if ("0123456789+-,.".indexOf(source.substring(
										match.index + match[0].length,
										match.index + match[0].length + 1)) != -1)
								{
									// the non match had an invalid character so 
									// our number mustn't be a phone number.
									continue;
								}
								if (delimiters.indexOf(source.substring(
										match.index + match[0].length,
										match.index + match[0].length + 1)) != -1)
								{
									// the non match had an invalid character so 
									// our number mustn't be a phone number.
									continue;
								}

							}
							theApp.util.njdebug("render", "match is good");

							span.appendChild(document
									.createTextNode(nonMatching));

							// Now add matching substring with an image.
							var clickSpan = document.createElement("span");
//							clickSpan.setAttribute("style",
									//"nowrap");
							clickSpan.setAttribute("style",
							"white-space:nowrap");
							clickSpan.setAttribute("name", "noojeeClick");

							theApp.util.njdebug("render", "match[0]=" + match[0]);
							var text = document.createTextNode(match[0]);
							
							//<input type="image" src="rainbow.gif" name="image" width="60" height="60">
							var btn = document.createElement(this.njClickElementType);
							btn.setAttribute("type", "image"); 
							btn.setAttribute("src", "chrome://noojeeclick/content/images/call-phone.png");
							btn.setAttribute("name", this.njClickElementName);
							btn.setAttribute("title", match[0]);
							btn.setAttribute("border", "0");
							btn.setAttribute("padding", "0px 0");
							btn.setAttribute("style", "border-color:#FFFFFF");
							btn.addEventListener("click", theApp.handlers.onDialHandler, true);
							btn.setAttribute("PhoneNo", match[0]);
							
//							var img = document.createElement(this.njClickElement);
//							img
//									.setAttribute("src",
//											"chrome://noojeeclick/content/images/call-phone.png");
//							img.setAttribute("name", this.njClickElementName);
//							img.setAttribute("title", match[0]);
//							img.addEventListener("onmouseover", theApp.handlers.onMouseOver,
//									true);
//							img
//									.addEventListener("onmouseout", theApp.handlers.onMouseOut,
//											true);
//							img.addEventListener("click", theApp.handlers.onDialHandler, true);
//							img.setAttribute("PhoneNo", match[0]);
							clickSpan.appendChild(text);
							//clickSpan.appendChild(img);
							clickSpan.appendChild(btn);
							span.appendChild(clickSpan);
							lastLastIndex = trackRegex.lastIndex;
						}
						span.appendChild(document.createTextNode(source
								.substring(lastLastIndex)));
						span.normalize();
					}
				}
			}
		}
		theApp.util.njdebug("render", "rendering complete:" + new Date());
	}
},

/*
 * Determines if a document should be excluded by check if its URL matches any
 * of the URLs laid out in the excluded preferences.
 */
excluded: function (doc)
{
	var excluded = false;

	if (doc.location != null)
	{
		theApp.util.njdebug("render", "checking exclusion for url=" + doc.location.href);

		var exclusions = theApp.prefs.getValue("exclusions");
		if (exclusions != null && exclusions.length != 0)
		{
			theApp.util.njdebug("render", "exclusions=" + exclusions);
			exclusions = exclusions.split("\n");
			for ( var i = 0; i < exclusions.length; i++)
			{
				var exclusion = theApp.util.trim(exclusions[i]);
				if (exclusion.length > 0)
				{
					if (doc.location.href.indexOf(exclusion) == 0)
					{
						theApp.util.njdebug("render", "excluded: " + doc.location.href);
						excluded = true;
						break;
					}
				}
			}
		} else
			theApp.util.njdebug("render", "No Exclusions.");
	}

	return excluded;
},

}

}});

