/* 	content.js
 *
 *	Contains the logic to drive the extension.
 */

var rules = [
	{
		name: "No Gaffes",
		regexp: /gaffe/i,
		apology: "contained the word \"gaffe\".",
		description: "Headlines containing the word \"gaffe\" are unlikely to contain substansive policy discussion. Instead, they tend to focus on misspoken phrases or embarrassing omissions."
	},
	{
		name: "No Tenuous Stories, Speculations, or Rhetorical Questions",
		regexp: /may|might|rumored to|\?\s*$/,
		except_regexp: /number|rising|falling|^(who|what|where|why|when)/i,
		apology: "contained a qualifier.",
		description: "Headlines containing qualifiers such as \"may\" or ending with a question mark often indicate an article of poor quality. Typically, the article is so tenuous that the editor would not let the publication stand behind it. This rule isn't perfect; sometimes, a legitimate question is asked when analyzing data or addressing the reader."
	},
	{
		name: "No Talking Points Volleyball",
		regexp: /bashes|rips|blasts|draw(s|n|ing)?\s+fire/i,	
		apology: "contained words indicating that the linked article will only contain oft repeated talking points.",
		description: "Headlines containing the words, phrases, or variants of \"rips\", \"blasts\" or \"drawing fire\" will tend to consist of invective talking points or the equally uninformative response. Often, these stories volley back and forth adding no new information."
	},
	{
		name: "No Overstating Importance",
		regexp: /lawmaker/i,
		except_regexp: /lawmakers|representative|senator|senate|house/i,
		apology: 'indicated that the story will revolve around someone who isn\'t actually important.',
		description: "The word \"Lawmaker\" isn't typically used in a headline unless the person being referenced is someone unimportant (like a Senator or Representative). Most likely, the linked story will be about a legislator at the state or local level saying something stupid that (hopefully) no one else in their party agrees with. If their party did agree, you can bet the reporter would have gotten the statement from an important person."
	},
	{
		name: "No Low Blows",
		regexp: /blow to|fresh blow|poll blow|blow against|new blow|a blow for/i,
		except_regexp: /blow to more than just/i,
		apology: "contained a variant of \"blow to\".",
		description: "Headlines containing the phrase \"blow to\", \"fresh blow\", or variants thereof tend to describe events as though they matter only to a narrow interest group. Often they are of critical importance to large segments of the population. This interpetation as only affecting the political fortunes of a politican or organization is insulting to the affected populaton and reduces the level of debate."
	},
	{
		name: "No Spin Zone",
		regexp: /\bspin\b/i,
		except_regexp: /album|music|song|bowling|bike|spin[\s-]off|baryon|lepton|higgs|fermion|electron|neutron|proton|physics|engineer/i,
		apology: 'contained the word \"spin\".',
		description: "Any article mentioning spin is almost certainly spinning."
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
	jQuery('a')
		.not('a.restoresanity')
		.not('a:contains("section to my Google News homepage")')
		.not('a:contains("Create an email alert for")')
		.each(function (index, elem) {

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
			.append(
				jQuery("<span>")
					.text("The Extension to Restore Sanity")
					.addClass('restoresanity logo')
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

	setTimeout(EliminateUselessStories, 1000);
	setTimeout(EliminateUselessStories, 2500);

	jQuery(document).find('html').click(function (event) {
		jQuery('div.restoresanity.info').css('display', 'none');
	});
});