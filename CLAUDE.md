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
- **No hardcoded video IDs.** Both players use YouTube's keyless channel-level
  embeds and resolve themselves forever. See below.
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

## Video players

Both use YouTube endpoints that need no API key and no Worker:

- Latest service: `embed/videoseries?list=UU5XmDjyOSrexPMpJgQICKUw`
- Live: `embed/live_stream?channel=UC5XmDjyOSrexPMpJgQICKUw`

`UU5Xm...` is the uploads playlist, which is the channel ID with `UC` swapped for
`UU`. Nobody ever has to paste a video ID.

`main.js` holds the iframe `src` in `data-src` until someone presses play, so
YouTube loads nothing for a visitor who does not watch.

**The poster image is the church's three-crosses photograph on every player, on
purpose.** Their streams open on a holding card, so YouTube's auto-generated
thumbnail is black for nearly every upload. **Never build a thumbnail grid for this
church.**

The channel RSS feed sends no CORS header, so a static page cannot read it. A
titled, searchable archive would need the Worker pattern in
`hope-website-repo/live-check-worker/` **and** the church changing how it titles
uploads. Every upload today is called "Sunday Morning Service".

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
- The print block at the bottom of `style.css`. People print the address and the
  statement of faith.

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
Currently `style.css?v=3` and `main.js?v=1`.

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

- **No em or en dashes in copy phrasing.** Not in body text, headings, alt text or
  meta descriptions. A dash joining clauses is the AI tell. Periods, commas, colons
  and parentheses instead. `&mdash;` separating the page name from the church name
  in a `<title>` or `og:title` is correct typography and stays, as are `&ndash;` in
  ranges like 6:00&ndash;7:30.
- No stock AI phrasing. No "elevate", "seamless", "unlock", "fast-paced".
- Do not duplicate paragraphs across two pages. The homepage welcome teaser is
  written differently from the Our Church copy on purpose. Keep it that way.
- US spelling.
