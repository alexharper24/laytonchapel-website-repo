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

1. **YouTube API key** at https://console.cloud.google.com/
   - Create a project.
   - APIs and Services -> Library -> enable **YouTube Data API v3**.
   - Credentials -> Create credentials -> **API key**. Copy it.
   - Edit the key -> API restrictions -> restrict it to **YouTube Data API v3**.

2. The channel is already filled in (`UC5XmDjyOSrexPMpJgQICKUw` =
   youtube.com/@laytonchapelbaptistchurch). To re-confirm it:

   ```
   https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=laytonchapelbaptistchurch&key=YOUR_KEY
   ```

## Deploy

From inside this folder:

```bash
npm install -g wrangler          # first time only
wrangler login                   # opens a browser to authorize Cloudflare
wrangler secret put YT_API_KEY   # paste the API key when prompted
wrangler deploy
```

Deploy prints a URL like `https://laytonchapel-live-check.<subdomain>.workers.dev`.

## Turn it on in the website

Open `../main.js`, find `WORKER_URL` near the top of the Worker block, and paste
the URL between the quotes:

```js
var WORKER_URL = "https://laytonchapel-live-check.<subdomain>.workers.dev";
```

Bump `?v=N` on every `main.js` reference in the same commit, then push.

## Notes specific to this church

- **`ALLOW_ORIGIN` is `https://www.laytonchapel.org`.** The Worker sends CORS for
  that origin only. To test against `http://localhost:8177`, add it temporarily
  and take it back out before deploying for real.
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
