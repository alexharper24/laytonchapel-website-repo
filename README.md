# laytonchapel-website-repo

The website for **Layton Chapel Baptist Church**, Spring Lake, North Carolina.
Hand-written static HTML, CSS and JavaScript. No build step, no framework, no npm.
Intended to be hosted free on GitHub Pages at **www.laytonchapel.org**.

Full audit of the old site and the reasoning behind this structure:
https://claude.ai/code/artifact/c620185d-55bb-45c8-af2a-6a6a60a87c48

> **Status: scaffolded, not launched.** The pages are real and complete except where
> a `Replace this` box appears on screen. Those boxes are deliberate and are all
> listed below. Do not point DNS at this until the pending list is cleared.

---

## Running it locally

There is no build. Serve the folder over HTTP and open it. Do not open the files
directly with `file://`, because the YouTube embeds and the form will not behave
like production.

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Deploying

GitHub Pages, deploy from `main` / root.

```bash
git add -A
git commit -m "describe the change"
git push
```

`CNAME`, `.nojekyll`, `robots.txt` and `sitemap.xml` all need to stay in the root.
Set the custom domain in the repository's Pages settings **before** moving DNS, then
enable Enforce HTTPS once the certificate issues.

**When you change an image, commit the file in `img/`.** HTML going up without its
images is the most common production bug across these site repos.

**When you change `style.css` or `main.js`, bump `?v=N` on every reference in the
same commit.** GitHub Pages serves with a ten minute cache and browsers hold
stylesheets through a hard refresh. Currently `style.css?v=3` and `main.js?v=2`.

---

## Pages

| File | Nav | What it owns |
|---|---|---|
| `index.html` | Home | Hero, service times strip, welcome teaser, latest service player, ministry cards, and the `#visit` block. Carries the `Church` JSON-LD. |
| `our-church.html` | Our Church | History, Meet Our Pastor, the nine core values verbatim, Life at Layton Chapel gallery. |
| `gospel.html` | The Gospel | Gospel presentation, KJV throughout. **Needs pastoral review before launch.** |
| `beliefs.html` | What We Believe | Statement of faith. Placeholder until the church supplies the document. |
| `sermons.html` | Sermons | Latest service player, live stream player, and every SermonAudio listening route. |
| `ministries.html` | Ministries | Hub. Sunday School, nursery, Children's Church, AWANA, adult Bible study. |
| `ministries-awana.html` | (under Ministries) | AWANA clubs, schedule, registration link. |
| `contact.html` | (footer) | Phone, address, directions, Formspree message and prayer request form. |
| `giving.html` | Give button | In person, by mail, and online through EasyTithe. |
| `404.html` | none | Real 404 page. Also catches the old `/webcast/` and `/notices/` traffic. |

Nav is six items plus a Give button: Our Church, The Gospel, What We Believe,
Sermons, Ministries, Visit.

**Visit is deliberately an anchor to `index.html#visit`**, not its own page, so
service times and directions sit on the homepage where a visitor sees them without
a click. Promote it to a real page only once the church supplies enough visit
detail to justify one.

**Every page shares the same header and footer markup.** Change one, change all
nine, then grep to confirm. `aria-current="page"` marks the active nav item and is
the only intended difference between pages.

---

## Still pending

Each of these shows on screen as a dashed `Replace this` box. Delete the whole
block when you fill it in, not just the text.

### Blocks launch

1. **Formspree form ID and the church email address.** `contact.html` has
   `REPLACE_THIS_FORMSPREE_ID` in the form action. Formspree emails a one-time
   confirmation to the destination on first submission, so it must be a real inbox
   somebody watches.
2. **The statement of faith.** `beliefs.html` is a placeholder. The church has the
   document on paper; the old site told visitors to phone for a copy. Type it
   **exactly as given**. Do not draft a substitute.
3. **Pastoral review of `gospel.html`.** The Scripture is KJV and the order is the
   usual one, but the wording between the verses is a draft.

### Should land before launch

4. **Pastor Chancey's bio and a real portrait.** `our-church.html#pastor`. The
   current image is a frame from a service video.
5. **Staff, deacons and ministry leaders,** with roles. Two names are known to have
   preached (Paul Odom, Bill Pannhoff) but their roles are not.
6. **Visit detail:** what people wear, roughly how long the morning service runs,
   which door greeters use. `index.html#visit`.
7. **Photographs of people.** See the gap list below.
8. **Office email and hours.** `contact.html`.

### Worth confirming, not blocking

9. **"We sing from the hymnal"** appears on `index.html` twice. It is drawn from the
   church's own on-screen service graphics, which display hymn titles and numbers.
   Have the church confirm the wording.
10. **AWANA club age bands** on `ministries-awana.html` are AWANA's standard bands,
    not the church's own wording. The registration site confirms all six clubs exist.
11. **The EasyTithe link,** giving categories, and whether they issue annual statements.
12. **Trunk or Treat** is described on `ministries.html` as a fall outreach with no
    date, because a dated event goes stale. Confirm it is annual.
13. **Is 1935 this congregation's founding or a predecessor's?** The church's own
    copy says "originally established in 1935", which is doing some work.
14. **Two copy corrections were made** to the church's own text and should be
    approved: "reach People" to "reach people", and "takes precedent over" to
    "takes precedence over". Both are in the Sunday School paragraph and the core
    values respectively.

---

## Images

Everything in `img/` came off the church's own YouTube channel, Facebook page and
AWANA registration site, harvested 2026-09-07, because the old website had exactly
one image on it. Alex has cleared these for use. **The snow photographs are
deliberately not used** and sit in `img/archive/`.

| File | Source | Used on |
|---|---|---|
| `hero-crosses.jpg` | YouTube channel banner | Homepage hero |
| `sermon-poster.jpg` | YouTube video thumbnail | Both video players |
| `og-image.jpg` | Derived from the above | Social card, every page |
| `exterior.jpg` | Facebook cover, vignette cropped off | Homepage, Our Church, gallery |
| `pastor-chancey.jpg` | Livestream frame | Our Church, until a portrait arrives |
| `logo-mark.png` | YouTube avatar, resized from 1600px | Header, footer |
| `apple-touch-icon.png`, `favicon.ico` | Derived from the mark | All pages |

`img/archive/` holds the superseded and unused originals, including the 145px logo
off the old site, the 200px Facebook copy, the 1600px mark, the horizontal wordmark,
and the three snow photographs. **Never delete these.** Superseded logos and
alternate lockups stay tracked.

`img/graphics/` holds church-authored event graphics kept as reference for real
event content. They are not published by any page.

### The photo gap

Nothing of the following exists on any of the church's properties, so it can only
come from the church:

- A wide interior shot of the auditorium from the back
- **Any photograph of people in the seats.** Not one exists.
- Children's ministry and AWANA nights
- A proper portrait of the pastor
- Fellowship hall, Sunday School rooms, baptistry

Fifteen to twenty-five usable frames would fill the gallery and the ministry pages
properly.

---

## Design

Tokens are at the top of `style.css`.

- **Green `#00A652`** is sampled from the church's own logo mark and wordmark, and
  matches the green in their broadcast graphics.
- **`#00A652` measures 3.19:1 on white, which fails WCAG AA for body text.** It is
  used only as a fill behind white text on large elements. `--green` `#00703C`
  (6.2:1) carries all text and links. **This split is deliberate. Do not "fix"
  `--green-bright` into body copy.**
- Warm accent `--gold` `#C9821F` is drawn from the sunset in the hero photograph.
- Type is **Quicksand** for headings, which is close to the rounded geometric sans
  in the church's own wordmark, and **Source Sans 3** for body.
- Page width is `--maxw: 1560px` with `.wrap{width:min(94%,var(--maxw))}`. Prose is
  capped at `--prose: 70ch` so line length stays readable inside the wide container.
- **Three crosses is the church's real identity.** It appears in the logo, the
  wordmark, the road sign at the driveway, and the photograph they chose for their
  video thumbnail. Build on it. Do not introduce a different device.

### Things that must not be removed

- **The light-mode lock.** Both `color-scheme` metas in every page, plus
  `color-scheme: light only` in `:root` and the `prefers-color-scheme: dark`
  override block in `style.css`. Without it, iOS Safari inverts the site into
  unreadable dark-on-dark.
- **The viewport has no `user-scalable=no` and no `maximum-scale`.** The old site
  had both, which blocked pinch zoom and failed WCAG 1.4.4. This congregation
  includes people who need to enlarge text.
- **The mobile nav toggle is a real `<button>`** with `aria-expanded`. The old site
  used a bare `<div>`, which made the entire navigation unreachable by keyboard and
  screen reader at phone width.
- Tap targets are 44px minimum throughout.

---

## Sermons and the video players

Both players use YouTube's keyless embed endpoints, so there is **no API key, no
Cloudflare Worker, and nothing to maintain week to week**:

- Latest service: `youtube-nocookie.com/embed/videoseries?list=UU5XmDjyOSrexPMpJgQICKUw`
  (the uploads playlist, which is the channel ID with `UC` swapped for `UU`)
- Live stream: `youtube-nocookie.com/embed/live_stream?channel=UC5XmDjyOSrexPMpJgQICKUw`

Both resolve on their own forever. Nobody has to paste a video ID after a service.

The iframe `src` is held in `data-src` until someone presses play, so YouTube's
scripts never load for visitors who do not watch.

**The poster image is the church's own three-crosses photograph, on purpose.** Their
livestreams open on a holding card, so YouTube's auto-generated thumbnail is black
or blank for nearly every upload. A thumbnail-led list would render as a wall of
black rectangles. A single uniform poster is the only treatment that looks
intentional. **Do not build a thumbnail grid for this church.**

The RSS feed at `youtube.com/feeds/videos.xml?channel_id=...` is not an option: it
sends no `Access-Control-Allow-Origin` header, so a static page cannot read it from
the browser. If a titled, searchable archive is ever wanted, that needs the
Cloudflare Worker pattern in `hope-website-repo/live-check-worker/` **and** the
church starting to title uploads with the sermon title, speaker and passage. Every
upload today is titled "Sunday Morning Service".

---

## What the old site was, and what happened to its URLs

The previous site was a stock SermonAudio "Solo" template at the same domain, with
six pages and no photographs, no meta descriptions, no canonicals, no structured
data, no sitemap and no robots.txt. Its sermon player is genuinely good and is kept,
by linking out to it rather than replacing it.

| Old path | Now |
|---|---|
| `/about/` | `our-church.html` |
| `/contact/` | `contact.html` |
| `/sermons/` | `sermons.html` |
| `/webcast/` | `sermons.html` |
| `/notices/` | Facebook, linked from `ministries.html` and `404.html` |
| `/sermons/<id>/` | Left pointing at SermonAudio. Those pages still work there. |

Redirects are not possible on GitHub Pages without JavaScript, so `404.html`
explains where things went. Submit the sitemap in Search Console after launch and
watch for the retired URLs.

## Other properties to keep in sync

Name, address, phone and hours must match everywhere. The JSON-LD in `index.html`
is the source of truth.

- YouTube: `@laytonchapelbaptistchurch` (channel `UC5XmDjyOSrexPMpJgQICKUw`)
- Facebook: `facebook.com/LaytonChapelBaptistChurch`, the church's largest audience
- SermonAudio: broadcaster `lcbc1935`, church code `33622`
- AWANA registration: `laytonchapel.twotimtwo.com`
- Online giving: `app.easytithe.com/App/Giving/lcbc`
- Google Business Profile, Yelp, YellowPages and church directories all carry
  listings already. Some have the address as "Road" rather than "Rd." and one lists
  only the Sunday evening service.
