# CLAUDE.md

Context for working on the Layton Chapel Baptist Church website. Read this and
`README.md` before making changes.

## What this is

The public website for **Layton Chapel Baptist Church** (Spring Lake, North
Carolina), an independent Baptist church that preaches from the King James Bible.
Hand-maintained **static multi-page site**, intended for GitHub Pages at
**www.laytonchapel.org**. No backend, no build step, no framework, no npm. Edit the
HTML/CSS/JS and push.

It replaces a stock SermonAudio "Solo" template. The audit that produced this
structure is at
https://claude.ai/code/artifact/c620185d-55bb-45c8-af2a-6a6a60a87c48

**The point of this build is that the church can mostly manage it themselves.**
That constraint drove real decisions. Respect it.

## The durability rule

Alex's instruction for this site: **only put content on it that will not go stale.**
A church of this size will not update a website weekly, and a page showing last
October's event date is worse than no page.

So, concretely:

- **No dated events anywhere in the HTML.** Trunk or Treat is described on
  `ministries.html` as a fall outreach with no date. Announcements point at the
  church's Facebook page, which is where they already post and which they already
  keep current.
- **No counts.** No sermon totals, follower numbers, review counts, or attendance.
- **No age-cutoff dates.** Children's Church is "ages 4 through 2nd grade", not the
  "four years old by 8/31/2025" rule from their announcement slide, because that
  date rolls every year.
- **No hardcoded video IDs.** The sermons grid is fetched at run time from the
  Worker, so nobody pastes a video ID after a service. See below.
- **There is no events page,** deliberately. It was proposed, then dropped for
  exactly this reason. Do not add one without a maintainer.

## Structure

Nine content pages plus `404.html`. Nav is six items plus a Give button:
Our Church, The Gospel, What We Believe, Sermons, Ministries, Visit.

**Visit is deliberately `index.html#visit`, not a page.** Service times and
directions belong on the homepage where a visitor sees them without a click, and
there is not yet enough visit content from the church to fill a page. Same call
`hope-website-repo` made. Do not split it out without asking.

- `our-church.html` owns the history, the pastor bio, the nine core values and the
  photo gallery. It absorbed what would otherwise be separate About, Pastor and
  Life-at pages, because there is not enough material for those to stand alone.
- `ministries.html` is a hub. `ministries-awana.html` is its one detail page, kept
  separate because AWANA is the only ministry with concrete detail plus a live
  registration flow, and parents search for it by name.
- `contact.html` and `giving.html` sit in the footer and the Give button, not the
  main nav.

**The header and footer markup is identical in all ten pages.** `aria-current="page"`
on the active nav item is the only intended difference. Change one, change all ten,
then grep to confirm. The pages were generated once from a shared template to
guarantee that; the generator is not in the repo and the files are now hand-edited.

## Doctrine and facts

- **`beliefs.html` is a placeholder.** The church has a statement of faith on paper
  that has never been published. When it arrives, type it **exactly as given**.
  Never draft, summarize, soften or reword it.
- **`gospel.html` needs pastoral review before launch.** The Scripture is KJV and
  the ordering is conventional, but the connecting prose is a draft.
- **Do not invent anything about the people or the history.** No bios, no founding
  narrative, no relationships. Every unknown is a visible `Replace this` box that is
  also listed in README.md. A plausible invention that ships is worse than an
  obvious blank.
- Two typos were corrected in the church's own copy ("reach People", "takes
  precedent over"). Both are flagged in README for approval. Do not make further
  edits to their text without asking.

## Sermons, live detection, and the Worker

**This is the same arrangement as `hope-website-repo`, on purpose.** Alex asked for
it explicitly, and an earlier keyless approach was replaced to get it.

`live-check-worker/` is a Cloudflare Worker holding the YouTube API key as a
secret, with two endpoints: `GET /` for live status and `GET /videos` for recent
uploads. `main.js` has one `WORKER_URL` constant.

What runs off it:

- **`.watch-online` links anywhere on the site** point at the channel normally and
  become a pulsing red "Watch Live" during a Sunday morning service window. When
  the Worker is configured they deep-link to the actual stream. There are three:
  the header button, the hero button and the footer link.
- **`sermons.html`** shows the twelve most recent services three to a row, and a
  Live Now section that stays `hidden` unless a stream is genuinely running.

`isLive()` in `main.js` defines the service windows **once**. Only the Sunday
morning service is streamed today. Edit that function, not the pages, to change
them.

**Outside a service window the site never calls the API at all**, which keeps the
free quota untouched six and a half days a week.

**While `WORKER_URL` is an empty string everything still works:** the buttons fall
back to a schedule-only guess pointing at the channel, and the grid shows a link to
YouTube. Deploy the Worker and paste its URL in to light up the grid.

The channel RSS feed is not an alternative. It sends no `Access-Control-Allow-Origin`
header, so a static page cannot read it from the browser. That is why the Worker
exists.

**Thumbnails fall back to the church's own three-crosses poster.** Their streams
open on a holding card, so YouTube's auto-generated thumbnail is black for most
uploads. Every card also shows the service date, because every upload is titled
"Sunday Morning Service" and the title alone cannot tell one service from another.

## Design system

Tokens at the top of `style.css`.

- **`--green-bright` `#00A652`** is sampled from the church's own logo and wordmark.
  It measures **3.19:1 on white and fails WCAG AA for body text**, so it is only ever
  a fill behind white text on large elements. **`--green` `#00703C`** (6.2:1) carries
  all text and links. **This split is deliberate. Do not "fix" the bright green into
  body copy.**
- `--gold` `#C9821F` is drawn from the sunset in the hero photograph.
- Quicksand for headings (close to the church's own rounded wordmark), Source Sans 3
  for body.
- `--maxw: 1560px`, `.wrap{width:min(94%,var(--maxw))}`, prose capped at
  `--prose: 70ch`.
- **Three crosses is the church's real identity**, appearing in the logo, the
  wordmark, the road sign and their chosen video thumbnail. Do not introduce a
  different device.
- **Five section grounds, and they are meant to be visibly different:** white,
  `--offset` #EDF2EE, `--tint` #E1EEE6, the green service strip, and `--deep`
  #16211B for closing bands. Alternate them. A page that runs white the whole way
  down reads as unfinished.
- **`.split-head` spans both columns.** Use it for any two-column section with a
  heading, so the columns start level with each other underneath it rather than
  the right one floating up beside the heading.
- **Square corners everywhere.** `--radius` is `0` and buttons are square too.
  Alex asked for this specifically: pills and rounded cards read softer and
  busier, and square edges keep the grid reading as a grid. The only round things
  left are the live dot and the core-values bullets, which are meant to be dots.
- **Card grids are `repeat(3, minmax(0,1fr))`, not `auto-fit`.** Six cards fall
  3 and 3. `auto-fit` left one card stranded alone on a row. If you add a card to
  a grid, keep the count a multiple of three or accept the gap deliberately.
- **`.hero-inner` must not declare a width.** It is used with `.wrap`, sits later
  in the file at the same specificity, and a `width:100%` there silently
  overrode `.wrap` and flushed the hero copy against the left edge of the screen.
  That bug shipped once already.
- **Text-led pages use `.wrap-doc` (1140px) and `.doc` with a `.doc-rail`.** A
  68ch measure inside the full 1560px container strands the words at the far left
  with nothing beside them. The rail carries the standing calls to action.

### Do not remove

- **The light-mode lock:** both `color-scheme` metas in every page, plus
  `color-scheme: light only` and the `prefers-color-scheme: dark` override block in
  `style.css`. Without it iOS Safari inverts the site into unreadable dark-on-dark.
- **The viewport has no `user-scalable=no` and no `maximum-scale`.** The old site had
  both. This congregation includes people who need to enlarge text.
- **The nav toggle is a real `<button>` with `aria-expanded`.** The old site used a
  bare `<div>`, which made the whole nav unreachable by keyboard at phone width.
- The `_gotcha` honeypot on the contact form. Formspree discards anything that fills
  it.
- **`target="_blank" rel="noopener"` on every off-site link.** YouTube, Facebook,
  SermonAudio, Google Maps, EasyTithe and the AWANA registration site all open in
  their own tab, so a visitor never loses the church's site. It is declared in the
  markup on all 66 of them rather than left to JavaScript, and `main.js` has a
  pass that catches anything added later and appends a visually hidden
  "opens in a new tab" for screen readers. Internal links must NOT get a target.
- The print block at the bottom of `style.css`. People print the address and the
  statement of faith.
- **`.page-head` is the sunset photograph, set as a CSS background rather than
  an `<img>`.** It is decorative, so it needs no alt text, and one rule beats
  the same markup repeated across nine pages. The scrim gradient is part of
  the same `background` shorthand so it can never go missing and leave white
  text on a bright sky. Text in the banner is white, the eyebrow gold.
- **The service strip is flex, not grid.** Equal grid tracks forced the long
  address onto a second line while the short cells sat half empty. Content
  sized cells centred as a group keep all four on one row.
- **`--footer` is a separate, darker shade from `--deep`.** Four pages close on
  a dark `.section-deep` band, and when the footer shared that colour the two
  merged into one slab. Keep them distinct, and keep the footer's top rule.
- **Never pass `noopener` in a `window.open` feature string.** By spec that
  makes `window.open` return `null`, so a handler that keys off the return
  value never cancels the anchor and the browser opens both a popup and the
  `target="_blank"` tab. Sever `opener` on the returned window instead. That
  bug shipped once on the giving page.
- The `@media (hover: none)` block. Without it the sermon card lift stays stuck
  after a tap on iOS.
- `[id]{scroll-margin-top:96px}`. The header is sticky at 81px, so without this
  every in-page anchor lands with its own heading hidden underneath it.
- **The footer column toggles are constructed in `main.js`.** Below 500px the
  Service times, Explore and Follow along columns fold, which took the footer
  from 1038px to 485px at 390px wide. The pages carry only `class="footer-col"`;
  `main.js`
  builds the button, the chevron and the panel from the `<h3>` and `<ul>`
  already in the markup, then adds `.footer-accordion-ready` to the footer,
  which is what the collapsing CSS is scoped to. So the label is written once,
  and a footer whose script never ran stays fully open with no toggles. Do not
  hand-write the toggle markup into the ten pages, and do not scope the
  collapsed CSS to anything the markup sets. The list is **moved** into the
  panel rather than cloned, because the live service code has already bound
  the `.watch-online` link inside it.
- **The address and phone number never fold.** Service times DO fold, at Alex's
  direction, even though the homepage keeps them one glance away in the service
  strip. That homepage placement is the reason Visit is an anchor and not a page,
  and it is why folding them in the footer costs nothing.
- **Nothing closes the folded list but `.footer-bottom`'s own top rule.** Giving
  the last column a border-bottom of its own put two identical 1px rules 36px
  apart with nothing between them, which read on a phone as an empty fourth row.
  `.footer-bottom` has `margin-top:0` at that width so its rule sits tight
  against the last row.
- **The fold stops at 499px, and that number is derived.** `.footer-grid` is
  `auto-fit minmax(215px,1fr)`, so it has two columns from a 500px viewport up.
  Above that a folded row shares its grid row with the 171px address block and
  its rule floats 147px above the next one, reading as a stray bar; two open
  columns are also shorter there (357px against 453px at 600px). Do not widen
  it to match the 620px breakpoints elsewhere in the file.
- **`row-gap` is 0 while folded** so each row's own top rule is the only
  separator and the three read as one list. The address block carries its own
  `margin-bottom` instead. Rows are 48px, which still clears the 44px tap
  target floor this site holds to.

## Working on it

```bash
python -m http.server 8000     # or preview_start with the "laytonchapel" entry
                               # in C:\Git_Repos\.claude\launch.json (port 8177)
```

Serve over HTTP. `file://` will not exercise the embeds or the form.

Before committing:

```bash
python check_site.py laytonchapel-website-repo   # from C:\Git_Repos\site-checks
```

It must come back clean. It catches uncommitted images, missing `?v=`, the absent
light-mode lock, em dashes in copy, dropped `@media` blocks, sitemap gaps and nav
drift.

**Bump `?v=N` on `style.css` / `main.js` in the same commit that changes the file.**
Currently `style.css?v=21`, `main.js?v=8`, favicon and touch icon at `?v=2`.

**Commit the files in `img/`.** HTML shipping without its images is the most common
production bug across these repos.

## Images

Everything in `img/` was recovered from the church's own YouTube channel, Facebook
page and AWANA registration site, because the old website had exactly one image on
it. Cleared for use.

**The snow photographs are deliberately unused** and live in `img/archive/` at
Alex's direction. `img/archive/` also holds the superseded logo copies and the
horizontal wordmark. **Never delete any of them.** Superseded logos and alternate
lockups stay tracked.

`img/graphics/` holds church-authored event graphics kept as reference for real
event content. No page publishes them.

## Copy rules

- **No em or en dashes anywhere. None.** Not in body text, headings, alt text, meta
  descriptions, and **not in `<title>` or `og:title` either.** The root CLAUDE.md
  exempts a dash separating a name from a location in a title, and site-checks
  allows it, but Alex asked for it gone on this site: titles use a **pipe**
  (`Sermons | Layton Chapel Baptist Church`), which is ordinary web convention.
  This is a deliberate departure. Do not put the em dashes back.
- **No middots, no ellipsis characters, no en dashes in ranges.** Clock ranges are
  spelled out ("6:00 to 7:30 PM"), verse ranges take a plain hyphen
  ("Ephesians 2:8-9"), and separators are commas. There is currently **zero
  non-ASCII** in the HTML, CSS and JS. Keep it that way; it is the quickest check
  that no typographic tell has crept back in:

  ```bash
  grep -P '[^ -]' *.html style.css main.js
  ```
- No stock AI phrasing. No "elevate", "seamless", "unlock", "fast-paced".
- Do not duplicate paragraphs across two pages. The homepage welcome teaser is
  written differently from the Our Church copy on purpose. Keep it that way.
- US spelling.
