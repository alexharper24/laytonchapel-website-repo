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

    // Close on Escape, and return focus to the button.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    // Close after tapping a link, so an in-page anchor is actually visible.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- click to load the video ----------
     The iframe src is held in data-src until someone asks for it. That keeps
     YouTube's scripts and cookies off the page for every visitor who never
     presses play, and keeps the page fast.

     The poster image is the church's own three-crosses photograph. Their
     livestreams open on a holding card, so YouTube's own auto-generated
     thumbnails are black for nearly every upload. A uniform poster is the
     only treatment that looks intentional. */
  var posters = document.querySelectorAll('.video-poster');
  Array.prototype.forEach.call(posters, function (poster) {
    poster.addEventListener('click', function () {
      var frame = poster.parentNode;
      var src = frame.getAttribute('data-src');
      if (!src) { return; }

      var iframe = document.createElement('iframe');
      iframe.setAttribute('src', src + (src.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1');
      iframe.setAttribute('title', poster.getAttribute('data-title') || 'Video player');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

      frame.innerHTML = '';
      frame.appendChild(iframe);
    });
  });

  /* ---------- footer year ---------- */
  var year = document.querySelectorAll('[data-year]');
  Array.prototype.forEach.call(year, function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
