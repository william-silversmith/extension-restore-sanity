/* 	content.js

	Extension: The Extension to Restore Sanity
	Author: William Silversmith. Copyright 2012.

	Contains the logic to drive the extension.
 */

var rules = [
	{
		name: "No Gaffes",
		regexp: /gaffe/i,
		apology: "contained the word \"gaffe\".",
		description: "Headlines containing the word \"gaffe\" are unlikely to contain substansive policy discussion. Instead, they tend to prey on misspoken phrases or embarrassing omissions."
	},
	{
		name: "No Tenuous Stories or Rhetorical Questions",
		regexp: /\?\s*$/,
		except_regexp: /number|rising|falling|^(who|what|where|why|when)/i,
		apology: "ended with a question mark.",
		description: "Headlines ending with a question mark are often stories or opinions either so tenuous that the author's editor wouldn't let the instution stand behind it or story is so obvious you don't need to read it. This rule isn't perfect as sometimes a legitimate question is asked when analyzing data or when addressing the reader."
	},
	{
		name: "No Talking Points Volleyball",
		regexp: /bashes|rips|blasts|draw(s|n|ing)?\s+fire/i,	
		apology: "contained words indicating that the linked article will only contain oft repeated talking points.",
		description: "Headlines containing the words, phrases, or varients thereof \"rips\", \"blasts\" or \"drawing fire\" will tend to consist of invective talking points or the equally uninformative response from their target. Often these stories volley back and forth adding no new information."
	},
	{
		name: "No Overstating Importance",
		regexp: /lawmaker/i,
		except_regexp: /representative|senator|senate|house/i,
		apology: 'indicated that the story will revolve around someone who isn\'t actually important.',
		description: "The word \"Lawmaker\" isn't typically used in a headline unless the person being referenced is not someone more important (like a Senator or Representative). Most likely, the linked story will be about someone unimportant saying something stupid that (hopefully) no one else in their party would agree with. If their party did agree, you can bet the reporter would have gotten the statement from an important person."
	}
];

/* Scrub
 * 
 * Applies rules against a target phrase. Returns
 * the first rule matched or null if nothing matches. 
 */
function Scrub(phrase) {
	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];

		if (rule.regexp.test(phrase)
			&& (rule.except_regexp == null
				|| (rule.except_regexp
					&& !rule.except_regexp.test(phrase)))) {

			return rule;
		}
	}

	return null;
}

/* EliminateUselessStories
 *
 * Runs the scrub and replaces matches with informative
 * notices.
 */
function EliminateUselessStories () {
	jQuery('a').not('a.restoresanity').each(function (index, elem) {
		elem = jQuery(elem);
		var targetphrase = elem.text();

		var rule = Scrub(targetphrase);

		if (rule == null)
			return;

		var infodiv = jQuery("<div>")
			.addClass('restoresanity info')
			.append(
				jQuery("<p>")
					.addClass('restoresanity rulename')
					.text(rule.name)
			)
			.append(
				jQuery('<p>')
					.addClass('restoresanity ruledescription')
					.text(rule.description)
			)
			.append(
				jQuery('<p>')
					.addClass('restoresanity ruledescription')
					.text("In case you were curious, the link was: ")
					.append(
						jQuery('<a>')
							.addClass('restoresanity originalheadline')
							.text(elem.text())
							.attr('href', elem.attr('href'))
							.click(function (event) {
								window.location.href = jQuery(this).attr('href');
							})
					)
			)
			.click(function (event) {
				event.stopPropagation();
				return false;				
			});

		var apology = jQuery("<span>")
			.text("Story hidden: The headline " + rule.apology + " ")
			.addClass('restoresanity apology');

		apology.append(
			jQuery('<span>')
				.addClass('restoresanity whylink')
				.text('?')
				.click(function (event) {
					event.stopPropagation();

					var offset = apology.offset();

					infodiv
						.css('display', 'block')
						.css('top', offset.top + apology.height() + 5)
						.css('left', offset.left);

					return false;
				})
		);

		elem.after(apology);
		jQuery('body').append(infodiv);
		elem.remove();
	});
}

jQuery(document).ready(function () {

	// Need to add an exception for Google news
	// as searching for news changes the URL
	// from news.google.com to www.google.com with
	// an query parameter set in the GET string
	if (window.location.hostname == "www.google.com"
		&& !window.location.href.match(/&tbm=nws/)) {

		return;
	}

	EliminateUselessStories();

	setTimeout(EliminateUselessStories, 2500);

	jQuery(document).find('html').click(function (event) {
		jQuery('div.restoresanity.info').css('display', 'none');
	});
});