/* ==========================================================================
   Layton Chapel Baptist Church - main.js
   Shared behavior for every page. No dependencies, no build step.
   Bump ?v=N on every <script> reference in the SAME commit you change this.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- mobile navigation ----------
     The toggle is a real <button> with aria-expanded, so it works from the
     keyboard. The previous site used a bare <div>, which made the whole nav
     unreachable on a phone. */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- footer year ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ======================================================================
     Worker + service schedule
     ======================================================================
     Same arrangement as hope-website-repo. The Cloudflare Worker in
     live-check-worker/ has two endpoints:

       GET /         -> { live, videoId, watchUrl }
       GET /videos   -> { videos: [{id,title,publishedAt,thumb}], nextPage }

     It holds the YouTube API key as a Worker secret, which a static page
     cannot do. Deploy it, then paste its URL below.

     While WORKER_URL is an empty string the site still works: the Watch Live
     buttons fall back to a schedule-only guess pointing at the channel, and
     the sermons page shows a link to the channel instead of a grid. Nothing
     breaks and nothing needs maintaining week to week.
     ---------------------------------------------------------------------- */
  var WORKER_URL = "";
  var CHANNEL_URL = "https://www.youtube.com/@laytonchapelbaptistchurch";
  var LIVE_URL = "https://www.youtube.com/@laytonchapelbaptistchurch/streams";
  var TZ = "America/New_York"; // Spring Lake, NC

  function churchParts() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return o;
  }

  // True during a service window. Windows are minutes since midnight, from
  // 10 minutes before the start to 100 minutes after. Service times are
  // defined here ONCE and shared by the buttons and the sermons page.
  //
  // Only the Sunday morning service is streamed today. The scheduled stream
  // consistently opens a few minutes before 11:00. If the church starts
  // streaming the Sunday evening or Wednesday service, add its window here.
  function isLive() {
    var t = churchParts();
    var mins = parseInt(t.hour, 10) * 60 + parseInt(t.minute, 10);
    var windows = [];
    if (t.weekday === "Sunday") {
      windows.push([650, 760]); // 10:50 AM to 12:40 PM
    }
    return windows.some(function (w) { return mins >= w[0] && mins <= w[1]; });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Privacy-enhanced embed. Nothing from YouTube loads until a play is pressed.
  function playerHtml(id, title, autoplay) {
    return '<div class="slib-player"><iframe src="https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(id) + '?rel=0' + (autoplay ? '&autoplay=1' : '') +
      '" title="' + esc(title) + '" loading="lazy"' +
      ' referrerpolicy="strict-origin-when-cross-origin"' +
      ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"' +
      ' allowfullscreen></iframe></div>';
  }

  /* ---------- Watch Live buttons ----------
     Any .watch-online link points at the channel normally, and becomes a
     pulsing "Watch Live" during a service window. When the Worker is
     configured it confirms the stream is actually on and deep-links to it. */
  (function () {
    var btns = document.querySelectorAll('.watch-online');
    if (!btns.length) { return; }
    Array.prototype.forEach.call(btns, function (a) {
      a.dataset.defaultHtml = a.innerHTML;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    function render(live, url) {
      Array.prototype.forEach.call(btns, function (a) {
        a.setAttribute('href', url);
        if (live) {
          a.classList.add('is-live');
          a.innerHTML = '<span class="live-dot" aria-hidden="true"></span>Watch Live';
        } else {
          a.classList.remove('is-live');
          a.innerHTML = a.dataset.defaultHtml;
        }
      });
    }

    function update() {
      var scheduled = isLive();
      // Outside a service window, never call the API. That keeps the free
      // YouTube quota untouched for six and a half days a week.
      if (!scheduled || !WORKER_URL) {
        render(scheduled, scheduled ? LIVE_URL : CHANNEL_URL);
        return;
      }
      fetch(WORKER_URL)
        .then(function (r) { return r.json(); })
        .then(function (d) { render(!!d.live, d.watchUrl || LIVE_URL); })
        .catch(function () { render(true, LIVE_URL); });
    }

    update();
    setInterval(update, 60000); // flips on and off by itself
  })();

  /* ---------- sermons page ----------
     Runs only where #sermonGrid exists. Shows the twelve most recent services
     three to a row, and a Live Now section above them while a service is
     actually streaming. */
  (function () {
    var grid = document.getElementById('sermonGrid');
    if (!grid) { return; }

    var liveSection = document.getElementById('sermonLive');
    var livePlayer = document.getElementById('sermonLivePlayer');
    var MAX = 12;

    function fmtDate(iso) {
      if (!iso) { return ''; }
      var d = new Date(iso);
      if (isNaN(d)) { return ''; }
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Their streams open on a holding card, so YouTube's auto-generated
    // thumbnail is black or blank for most uploads. Swap any thumbnail that
    // fails or comes back tiny for the church's own three-crosses poster.
    function thumbFor(v) {
      return v.thumb || 'img/sermon-poster.jpg';
    }

    function card(v) {
      var el = document.createElement('div');
      el.className = 'slib-card';
      var title = v.title || 'Service';
      var date = fmtDate(v.publishedAt);
      el.innerHTML =
        '<button class="slib-thumb" type="button" aria-label="Play ' + esc(title) +
        (date ? ', ' + esc(date) : '') + '">' +
        '<img loading="lazy" src="' + esc(thumbFor(v)) + '" alt="" ' +
        'onerror="this.onerror=null;this.src=\'img/sermon-poster.jpg\'">' +
        '<span class="slib-play" aria-hidden="true"></span></button>' +
        '<div class="slib-meta"><p class="slib-title">' + esc(title) + '</p>' +
        (date ? '<p class="slib-date">' + esc(date) + '</p>' : '') + '</div>';

      el.querySelector('.slib-thumb').addEventListener('click', function () {
        var btn = this;
        var wrap = document.createElement('div');
        wrap.innerHTML = playerHtml(v.id, title, true);
        var player = wrap.firstChild;
        btn.parentNode.replaceChild(player, btn);
        var fn = player.requestFullscreen || player.webkitRequestFullscreen;
        if (fn) { try { fn.call(player); } catch (e) {} }
      });
      return el;
    }

    function fallback(msg) {
      grid.innerHTML = '<p class="slib-note">' + msg + ' <a href="' + CHANNEL_URL +
        '" target="_blank" rel="noopener">Watch on our YouTube channel</a>.</p>';
    }

    function loadVideos() {
      if (!WORKER_URL) {
        fallback('Every service is posted to YouTube.');
        return;
      }
      fetch(WORKER_URL + '/videos')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var vids = (d.videos || []).slice(0, MAX);
          if (!vids.length) { fallback('No services to show yet.'); return; }
          grid.innerHTML = '';
          vids.forEach(function (v) { grid.appendChild(card(v)); });
        })
        .catch(function () {
          fallback('Services could not be loaded right now.');
        });
    }

    /* Live Now section: shown only during a service window, and only when the
       Worker confirms a stream is running. Hidden entirely otherwise, so the
       page never shows a dead player. */
    function showLive(id) {
      if (!liveSection || !livePlayer) { return; }
      if (liveSection.dataset.vid === id) { liveSection.hidden = false; return; }
      liveSection.dataset.vid = id;
      livePlayer.innerHTML = playerHtml(id, 'Live service', false);
      liveSection.hidden = false;
    }

    function hideLive() {
      if (!liveSection || liveSection.hidden) { return; }
      liveSection.hidden = true;
      livePlayer.innerHTML = '';
      liveSection.dataset.vid = '';
    }

    function checkLive() {
      if (!liveSection || !livePlayer) { return; }
      if (!WORKER_URL || !isLive()) { hideLive(); return; }
      fetch(WORKER_URL)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.live && d.videoId) { showLive(d.videoId); } else { hideLive(); }
        })
        .catch(function () { /* leave the current state on a transient error */ });
    }

    loadVideos();
    checkLive();
    setInterval(checkLive, 60000);
  })();

  /* ---------- popout links ----------
     Giving hands off to an outside payment provider. Open it in its own window
     so the visitor keeps the church's site behind them, and fall back to a
     normal new tab if the browser blocks the popup. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-popout]'), function (a) {
    a.addEventListener('click', function (e) {
      var w = window.open(a.href, 'lcbcGiving',
        'noopener,width=560,height=860,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes');
      if (w) {
        e.preventDefault();
        w.focus();
      }
      // If the popup was blocked, the click proceeds as a normal link.
    });
  });
})();
