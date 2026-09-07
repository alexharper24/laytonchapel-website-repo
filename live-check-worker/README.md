# Live check Worker

A small Cloudflare Worker for the Layton Chapel website. Ported from
`hope-website-repo/live-check-worker/`, which runs the same arrangement for Hope
Baptist Church. Two JSON endpoints:

- `GET /` -> **live status**: `{ live, videoId, watchUrl }`. Powers the
  "Watch Live" buttons and the Live Now section on `sermons.html`, upgrading them
  from a schedule based guess to real detection.
- `GET /videos` -> **recent services** for the sermons grid:
  `{ videos: [{id,title,publishedAt,thumb}], nextPage }`.

**The YouTube API key lives here as a Worker secret, so it never appears in the
public website.** That is the entire reason the Worker exists: a static GitHub
Pages site cannot safely hold an API key.

Quota: the live check costs 100 units and is cached 120s; the video list costs 1
unit and is cached 15 minutes. Both stay well inside the free 10,000 units a day.
`main.js` only calls the live endpoint during a Sunday morning service window, so
there is no API usage at all the rest of the week.

**After changing `worker.js`, redeploy with `npx wrangler deploy`.**

## Until it is deployed

The site works without it. `WORKER_URL` in `../main.js` is an empty string, and
in that state the Watch Live buttons fall back to a schedule-only guess pointing
at the channel, and the sermons grid shows a link to YouTube instead of twelve
cards. Nothing breaks. Deploy the Worker when you want the grid and true live
detection.

## One time setup

**A YouTube Data API key is the only real work here.** Cloudflare is already
authorized on this machine.

At https://console.cloud.google.com/

- **Create a NEW project.** Do not reuse the one behind Hope's key. Quota is per
  project, not per key, and Hope already polls across two Sunday service windows,
  which comes close to the whole 10,000 units a day on its own. A separate
  project gives Layton Chapel its own 10,000.
- APIs and Services -> Library -> enable **YouTube Data API v3**.
- Credentials -> Create credentials -> **API key**. Copy it.
- Edit the key -> API restrictions -> restrict it to **YouTube Data API v3**.

The channel is already filled in (`UC5XmDjyOSrexPMpJgQICKUw` =
youtube.com/@laytonchapelbaptistchurch). To re-confirm it:

```
https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=laytonchapelbaptistchurch&key=YOUR_KEY
```

## Deploy

From inside this folder.

**Use the Program Files node explicitly.** The `nvm` shim on PATH points into
another user's profile and is unreadable from this account, so a bare `npx`
fails with "Could not determine Node.js install directory". Same reason
`roanoke-website-repo` pins its node path in launch.json.

```bash
"/c/Program Files/nodejs/npx.cmd" wrangler secret put YT_API_KEY
```

```bash
"/c/Program Files/nodejs/npx.cmd" wrangler deploy
```

`wrangler login` is not needed. The account (alex24harper@gmail.com, the one
Hope's Worker runs on) is already authorized; credentials sit in
`C:\Users\aharper\.wrangler\config\default.toml`.

Deploy prints a URL. Based on Hope's, it will be
`https://laytonchapel-live-check.alexharper.workers.dev`.

## Turn it on in the website

Open `../main.js`, find `WORKER_URL` near the top of the Worker block, and paste
the URL between the quotes:

```js
var WORKER_URL = "https://laytonchapel-live-check.<subdomain>.workers.dev";
```

Bump `?v=N` on every `main.js` reference in the same commit, then push.

## Notes specific to this church

- **`ALLOWED_ORIGINS` covers the preview locations as well as production:**
  `https://www.laytonchapel.org`, the apex, `https://alexharper24.github.io`, and
  `http://localhost:8177`. The response echoes whichever of those asked, and the
  edge cache key includes the origin so one can never be served another's CORS
  header. That means the sermon grid can be checked on the Pages preview and
  locally, before DNS moves. Hope's Worker allows one origin only; this one
  deliberately does not.
- **Every upload is titled "Sunday Morning Service".** The grid therefore shows
  the service date under each card, because the title alone cannot tell one
  service from another. If the church ever starts titling uploads with the sermon
  title, speaker and passage, the grid gets much more useful for free.
- **The watchable-video filter matters more here than at Hope.** Every upload on
  this channel is a livestream, and an ended stream with no saved recording
  reports a zero duration. `worker.js` already excludes those, which is what keeps
  dead entries out of the grid.
- Their streams open on a holding card, so YouTube's auto-generated thumbnails
  are usually black. `main.js` falls back to the church's own three-crosses
  poster for any thumbnail that fails to load.

## Cost

Free. Cloudflare Workers free plan is 100,000 requests a day, and the YouTube
Data API is free within quota.
