/* 	content.js
 *
 *	Contains the logic to drive the extension.
 */

var rules = [
	{
		name: "No Gaffes",
		headlinefilter: /gaffe/i,
		apology: "contained the word \"gaffe\".",
		description: "Headlines containing the word \"gaffe\" are unlikely to contain substansive policy discussion. Instead, they tend to focus on misspoken phrases or embarrassing omissions."
	},
	{
		name: "No Tenuous Stories, Speculations, or Rhetorical Questions",
		headlinefilter: /\bmay\b|might|rumored to|\?\s*$/,
		headlinefilter_except: /falling|number|rising|^(who|what|where|why|when)/i,
		apology: "contained a qualifier.",
		description: "Headlines containing qualifiers such as \"may\" or ending with a question mark often indicate an article of poor quality. Typically, the article is so tenuous that the editor would not let the publication stand behind it. This rule isn't perfect; sometimes, a legitimate question is asked when analyzing data or addressing the reader."
	},
	{
		name: "No Talking Points Volleyball",
		headlinefilter: /bashes|\bblasts\b|draw(s|n|ing)?\s+(fire|condemnation)|\brips\b/i,	
		apology: "contained words indicating that the linked article will only contain oft repeated talking points.",
		description: "Headlines containing the words, phrases, or variants of \"rips\", \"blasts\" or \"drawing fire\" will tend to consist of invective talking points or the equally uninformative response. Often, these stories volley back and forth adding no new information."
	},
	{
		name: "No Overstating Importance",
		headlinefilter: /lawmaker/i,
		headlinefilter_except: /house|lawmakers|lawmaker ratings|representative|senate|senator/i,
		apology: 'indicated that the story will revolve around someone who isn\'t actually important.',
		description: "The word \"Lawmaker\" isn't typically used in a headline unless the person being referenced is someone unimportant (like a Senator or Representative). Most likely, the linked story will be about a legislator at the state or local level saying something stupid that (hopefully) no one else in their party agrees with. If their party did agree, you can bet the reporter would have gotten the statement from an important person."
	},
	{
		name: "No Low Blows",
		headlinefilter: /blow to|fresh blow|poll blow|blow against|new blow|a blow for/i,
		headlinefilter_except: /blow to more than just/i,
		apology: "contained a variant of \"blow to\".",
		description: "Headlines containing the phrase \"blow to\", \"fresh blow\", or variants thereof tend to describe events as though they matter only to a narrow interest group. Often they are of critical importance to large segments of the population. This interpretation as only affecting the political fortunes of a politican or an organization is insulting to the affected populaton. It reduces the level of debate and improverishes us intellectually."
	},
	{
		name: "No Spin Zone",
		headlinefilter: /\bspin\b/i,
		headlinefilter_except: /album|baryon|bike|bicycle|bottle|bowling|class|electron|engineer|fermion|higgs|lepton|music|neutron|physics|proton|song|spin[\s-]off/i,		apology: 'contained the word \"spin\".',
		apology: 'contained the word \"spin\".',
		description: "Any article mentioning spin is almost certainly spinning."
	},
	{
		name: "Unbiased?",
		headlinefilter: /(liberal|conservative|left-?wing|right-?wing)(\s+|\/)(bias|media)/i,
		apology: "contained a reference to ideological bias.",
		description: "Headlines containing a reference to an ideological bias (e.g. \"liberal bias\" or \"right-wing media\") are likely to be extrodinarily biased themselves. Expect to see useless ranting, cherry picked facts, and/or an attempt to respond to a perceived (possibly imaginary) slight. Let's be truthful - it's probably just newspeople bitching about other newspeople."
	},
	{
		name: "No Sensationalism",
		headlinefilter: /mainstream media|\bmsm\b/i,
		apology: "contained sensationalistic phrasing.",
		description: "Headlines mentioning the \"mainstream media\" are drawing attention to the fact that they are different; the linked story is often sensationalistic in order to boost that signal. Think of it this way: Would the story be as interesting without mentioning the \"mainstream media\"? Be wary, the publication may be more concerned with promoting their brand and catching eyeballs than thorough reporting and verified facts."
	}
];

/* By themselves, the rules have false positives in non-politcal articles.
 * We can more precisely define the links to hit by searching for labels
 * in the href of the anchor. For instance, CNN political stories typically
 * look like this: http://www.cnn.com/2012/10/10/politics/crowley-debate/index.html?hpt=hp_bn3
 * Many news sites do the same thing. If the news sites started to adapt to this, 
 * then we'll probably have to build a headline classifier in order to detect political stories. 
 */
var urlfilters = {
	// host: regexp
	"cnn.com" : /politic|ireport|opinion|justice/i,
	"foxnews.com": /opinion|politic|\/us\//i,
	"csmonitor.com": /justice|opinion|politic|government|decoder|society/i,
	"newsmax.com": /newsfront|politic|us/i,
	"go.com": /politic|gma/i, // abc is very good about consigning political stories to labeled categories
	
	//"cbsnews.com": //i, // cbs has an unreliable url scheme
	// "washingtontimes.com": /opinion|blog|campaign|dnc|rnc|politic/i, // there are just too many variants to be covered by a white list here
	// nbcnews.com: NBC just uses story ids for the most part
    // msnbc.com: redirects to nbcnews.com
    // msnbc.msn.com: redirects to nbcnews.com
	// huffingtonpost.com: Too much stuff not labeled politics
	// washingtonpost.com/politics: already limited
	// nytimes.com: already limited
	// theblaze.com: not even sure if this works properly here
    // bbc.co.uk: BBC doesn't fit the patterns much anyway, possibly exclude it completely
	// politico.com: everything is politics
	// salon.com: no easy filters
	// thehill.com: it's all politics
	// infowars.com: it's all politics
	// talkingpointsmemo.com: it's all politics
	// townhall.com: it's all politics

	/* Aggregators are hard to describe accurately 
	   and the links rarely target the sites themselves */

    // "google.com": //i,
    // "yahoo.com": //i, 
    // "drudgereport.com": //i, 
    // "freerepublic.com": //i,
};


/* IsPoliticalUrl
 *
 * For certain websites, we can easily identify which stories
 * are prone to be political stories from the URL. For those
 * sites, we restrict the operation of the extension to positve
 * matches to reduce false positives.
 *
 * Requires: 
 * 	[0] url - the url the headline link points to
 *
 * Returns: boolean, true indicates the engine should NOT operate
 */
function IsPoliticalUrl(url) {
	if (url == null) {
		return true;
	}

	var hostname = jQuery('<a>').attr('href', url)[0].hostname;
	var domainmatches = hostname.match(/(\w+)\.(\w+|co\.uk)$/i);

	if (domainmatches == null
		|| !domainmatches.length) {

		return true;
	}

	var domain = domainmatches[0];

	var politicalaggregation = /politic/i;
	var defaultmatches = /politic|election/i;
	var defaultexceptions = /\/sports?\//i;

	if (urlfilters[domain]) {
		// If the url matches the pattern or the page is an aggregation of political links
		return (urlfilters[domain].test(url)
				|| defaultmatches.test(url) // some sane defaults
				|| politicalaggregation.test(document.location.href))
			&& !defaultexceptions.test(url);
	}

	return true; // Fail-safe for sites without a good filter
}

/* Scrub
 * 
 * Applies rules against a target phrase. Returns
 * the first rule matched or null if nothing matches. 
 * Some news sites reliably label their political stories 
 * in the URL so we restrict the application to the rules
 * to matching URLs for those sites.
 *
 * Requires:
 *	[0] headline - the text of the headline (user visible)
 *	[1] url - the URL the headline points to
 *
 * Returns: the first applicable rule, null if nothing matches
 */
function Scrub(headline, url) {

	if (headline == null
		|| headline == "") {

		return null;
	}

	var defaultheadlineexceptions = /(have|are|do)\s+you/i; // Stories that address the user
	var defaulturlexceptions = /\/(health|med|medicine|wellness)\/|sci(ence)?/i;

	if (defaulturlexceptions.test(url)
		|| defaulturlexceptions.test(document.location.href)) {

		return null;
	}

	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];

		var defectiveheadlinetest = (rule.headlinefilter.test(headline)
				&& (rule.headlinefilter_except == null
					|| (rule.headlinefilter_except
						&& !rule.headlinefilter_except.test(headline))))
				&& !defaultheadlineexceptions.test(headline);

		if (defectiveheadlinetest
			&& IsPoliticalUrl(url)) {

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
		var headline = elem.text();

		var rule = Scrub(headline, elem.attr('href'));

		if (rule == null)
			return;

		var infodiv = jQuery("<div>")
			.addClass('restoresanity info')
			.append(
				jQuery("<span>")
					.text('X')
					.addClass('restoresanity closebutton')
					.click(function (event) {
						jQuery(this).closest('.restoresanity.info').css('display', 'none');
					})
			)
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
			})
			.mouseover(function (event) {
				jQuery(this).find('.closebutton').css('visibility', 'visible');
			})
			.mouseout(function (event) {
				jQuery(this).find('.closebutton').css('visibility', 'hidden');	
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

	// This is a hack to get around google news's 
	// ajax loading. There might be better ways to do
	// this, but this is easy.	
	setTimeout(EliminateUselessStories, 1000);
	setTimeout(EliminateUselessStories, 2500);

	jQuery(document).find('html').click(function (event) {
		jQuery('div.restoresanity.info').css('display', 'none');
	});
});