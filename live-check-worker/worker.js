// Cloudflare Worker for Layton Chapel Baptist Church.
//
// Two endpoints, both returning small JSON with the YouTube API key kept
// server-side as a Worker secret (env.YT_API_KEY), never in the browser:
//
//   GET /         -> live status: { live, videoId, watchUrl }
//   GET /videos   -> recent uploads: { videos: [{id,title,publishedAt,thumb}], nextPage }
//                    optional ?page=<token> for pagination ("Load More")
//
// Set the secret with: npx wrangler secret put YT_API_KEY
// See README.md in this folder for full setup and deploy steps.

const CHANNEL_ID = "UC5XmDjyOSrexPMpJgQICKUw"; // youtube.com/@laytonchapelbaptistchurch
const UPLOADS_PLAYLIST = "UU5XmDjyOSrexPMpJgQICKUw"; // channel uploads playlist = channel id with UC -> UU
// Origins allowed to read this Worker. The production domain plus the two
// places the site is previewed before DNS moves, so the sermon grid can
// actually be verified before launch. The response carries whichever of
// these made the request, and the cache key includes it so one origin can
// never be served another origin's CORS header.
const ALLOWED_ORIGINS = [
  "https://www.laytonchapel.org",
  "https://laytonchapel.org",
  "https://alexharper24.github.io",
  "http://localhost:8177",
];
const DEFAULT_ORIGIN = ALLOWED_ORIGINS[0];

function originFor(request) {
  const o = request.headers.get("Origin");
  return ALLOWED_ORIGINS.includes(o) ? o : DEFAULT_ORIGIN;
}

function corsFor(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}
const CACHE_VERSION = "v3";        // bump to invalidate edge-cached responses after a logic change
const LIVE_CACHE_SECONDS = 120;    // live check is 100 quota units, so cache it
const VIDEOS_CACHE_SECONDS = 900;  // service list; short enough that a new service appears promptly

// Parse an ISO 8601 duration (e.g. PT1H2M3S) into seconds. Returns 0 for a
// missing or zero-length duration, which is what ended live streams with no
// saved recording report.
function isoDurationSeconds(d) {
  if (!d) return 0;
  const m = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/.exec(d);
  if (!m) return 0;
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = originFor(request);
    if (url.pathname === "/videos") return handleVideos(url, env, ctx, origin);
    return handleLive(env, ctx, origin);
  },
};

// Is the channel live right now?
async function handleLive(env, ctx, origin) {
  const cache = caches.default;
  const cacheKey = new Request("https://livecheck.internal/" + CACHE_VERSION +
    "/live/" + CHANNEL_ID + "/" + encodeURIComponent(origin));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let live = false;
  let videoId = null;
  try {
    const api =
      "https://www.googleapis.com/youtube/v3/search" +
      "?part=snippet&type=video&eventType=live" +
      "&channelId=" + CHANNEL_ID +
      "&key=" + env.YT_API_KEY;
    const data = await (await fetch(api)).json();
    if (data.items && data.items.length) {
      live = true;
      videoId = data.items[0].id.videoId;
    }
  } catch (_) {
    // Fail closed: report "not live" and let the site fall back to schedule.
  }

  const resp = new Response(
    JSON.stringify({
      live: live,
      videoId: videoId,
      watchUrl: videoId ? "https://www.youtube.com/watch?v=" + videoId : null,
    }),
    { headers: Object.assign({}, corsFor(origin), { "Cache-Control": "max-age=" + LIVE_CACHE_SECONDS }) }
  );
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

// Recent uploads (sermon library), paginated. Only returns videos that can
// actually be watched: public, embeddable, fully processed, and not a live or
// upcoming broadcast (ended live streams with no saved recording are excluded).
async function handleVideos(url, env, ctx, origin) {
  const pageToken = url.searchParams.get("page") || "";
  const cache = caches.default;
  const cacheKey = new Request("https://livecheck.internal/" + CACHE_VERSION +
    "/videos/" + (pageToken || "first") + "/" + encodeURIComponent(origin));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let videos = [];
  let nextPage = null;
  try {
    let api =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      "?part=snippet&maxResults=20&playlistId=" + UPLOADS_PLAYLIST +
      "&key=" + env.YT_API_KEY;
    if (pageToken) api += "&pageToken=" + encodeURIComponent(pageToken);
    const data = await (await fetch(api)).json();
    nextPage = data.nextPageToken || null;

    const raw = {};
    const ids = [];
    (data.items || []).forEach(function (it) {
      const s = it.snippet || {};
      const vid = s.resourceId && s.resourceId.videoId;
      if (!vid) return;
      if (s.title === "Private video" || s.title === "Deleted video") return;
      const th = s.thumbnails && (s.thumbnails.medium || s.thumbnails.high || s.thumbnails.default);
      raw[vid] = { id: vid, title: s.title, publishedAt: s.publishedAt, thumb: th ? th.url : "" };
      ids.push(vid);
    });

    if (ids.length) {
      try {
        // One extra call (1 unit) to check each video's real status.
        const vapi =
          "https://www.googleapis.com/youtube/v3/videos" +
          "?part=status,snippet,contentDetails&id=" + ids.join(",") +
          "&key=" + env.YT_API_KEY;
        const vdata = await (await fetch(vapi)).json();
        const byId = {};
        (vdata.items || []).forEach(function (v) { byId[v.id] = v; });
        ids.forEach(function (id) {
          const v = byId[id];
          if (!v || !raw[id]) return;
          const st = v.status || {};
          const sn = v.snippet || {};
          const cd = v.contentDetails || {};
          const watchable =
            st.privacyStatus === "public" &&
            st.embeddable !== false &&
            st.uploadStatus === "processed" &&
            sn.liveBroadcastContent === "none" &&
            isoDurationSeconds(cd.duration) > 0; // exclude ended live streams with no saved recording
          if (!watchable) return;
          const th = sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.high || sn.thumbnails.default);
          if (th) raw[id].thumb = th.url;
          videos.push(raw[id]);
        });
      } catch (_) {
        // If the status lookup fails, fall back to the unfiltered list.
        videos = ids.map(function (id) { return raw[id]; });
      }
    }
  } catch (_) {
    // Fail closed: return an empty list; the site shows a fallback link.
  }

  const resp = new Response(
    JSON.stringify({ videos: videos, nextPage: nextPage }),
    { headers: Object.assign({}, corsFor(origin), { "Cache-Control": "max-age=" + VIDEOS_CACHE_SECONDS }) }
  );
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
