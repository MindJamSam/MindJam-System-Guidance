/* =========================================================
   Aurora — v2 Salesforce Training behaviours
   ---------------------------------------------------------
   Stage 3.5: dev menu — font family per element, tile glow,
     backdrop blobs, custom HSV picker, lag-fix throttle.
   Stage 4: sidebar progress bar fill animation, per-section
     glow pickers in the dev menu (auto-discovered from
     [data-aur-target] attributes).
   Stage 5: lesson-page behaviours — entrance stagger,
     3D tilt on .is-tiltable, copy button (clipboard +
     ripple + 3-particle burst + label swap), lightbox
     for [data-aur-lightbox] images. All honour
     prefers-reduced-motion.

   Future stages will extend this file: full Stage-8 dev
   controls, Stage 6 star/backdrop motion.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Star-field deferred load (always runs, registered first) ----------
     Star markup (~25KB per page) lives in a static fragment at
     assets/aurora-stars.html so it doesn't ship inline on every page.
     base.html renders an empty .aur-starfield-host placeholder carrying
     the URL on data-aur-stars-src; we fetch + inject after first paint.
     `requestIdleCallback` defers it past the LCP; falls back to a 50ms
     setTimeout where unsupported (Safari). The shooting-star loop
     querySelector('.aur-starfield') tolerates the field not existing
     yet (first roll is at 60s, long after injection). */

  (function initStarfield() {
    var host = document.querySelector('.aur-starfield-host');
    if (!host) return;
    var src = host.getAttribute('data-aur-stars-src');
    if (!src) return;

    function inject() {
      fetch(src, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (html) {
          if (!html) return;
          host.insertAdjacentHTML('afterend', html);
          host.remove();
        })
        .catch(function () { /* no-op: stars are decorative */ });
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(inject, { timeout: 1500 });
    } else {
      setTimeout(inject, 50);
    }
  })();


  /* ---------- Scroll optimisation (always runs, registered first) ----------
     Adds `aur-is-scrolling` to <html> on every scroll event (passive, zero
     jank cost). CSS uses this to suspend backdrop-filter on tiles and pause
     background animations — eliminating the most expensive GPU operation
     (re-sampling an animated backdrop through N blur kernels per frame).
     Removed 150 ms after the last scroll event so effects restore quickly
     once the user stops. Listens on both .aur-main (desktop internal scroll)
     and window (mobile document scroll). */

  (function initScrollOptimise() {
    var root  = document.documentElement;
    var main  = document.querySelector('.aur-main');
    var timer = null;

    function onScroll() {
      root.classList.add('aur-is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(function () {
        root.classList.remove('aur-is-scrolling');
      }, 150);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    if (main) main.addEventListener('scroll', onScroll, { passive: true });
  })();


  /* ---------- Shooting stars (always runs) ----------
     Spawns a fresh .aur-shoot inside .aur-starfield on a timer. The CSS
     (`.aur-shoot` rules + @keyframes aur-shoot in aurora.css) handles the
     fade-in → flare → fade-out brightness curve and the trail; this JS
     just dispatches one per interval with randomised geometry.

     INTERVAL_MS is fixed at 3000 for now per the requested cadence;
     change to a random window (e.g. rand(2500, 6500)) when ready —
     swap the setInterval for a self-rescheduling setTimeout.

     Spawn is suppressed when:
       - prefers-reduced-motion is on (no surprise motion for those users),
       - the global pause is active (html[data-aur-paused="1"]),
       - star intensity is dialled to 0 in the Appearance panel,
       - the tab is hidden (saves cycles + avoids a queue on resume). */

  (function initShootingStars() {
    var ROLL_MS = 60000;
    var SPAWN_CHANCE = 0.65;
    var COLOUR_CHANCE = 0.10;
    var COLOUR_VARIANTS = [
      { core: '255, 211, 126', glow: '255, 198, 86', head: '255, 246, 214' },
      { core: '231, 84, 136', glow: '231, 84, 136', head: '255, 221, 237' },
      { core: '180, 112, 255', glow: '156, 82, 232', head: '238, 220, 255' },
      { core: '124, 207, 255', glow: '112, 190, 255', head: '226, 245, 255' }
    ];

    function shouldSpawn() {
      if (document.documentElement.classList.contains('aur-is-scrolling')) return false;
      if (document.documentElement.getAttribute('data-aur-paused') === '1') return false;
      try {
        var rawPrefs = localStorage.getItem('auroraUserPrefs');
        if (rawPrefs) {
          var savedPrefs = JSON.parse(rawPrefs);
          if (savedPrefs && savedPrefs.stars === false) return false;
        }
      } catch (e) {}
      var intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--aur-star-intensity'));
      if (isFinite(intensity) && intensity <= 0) return false;
      return true;
    }

    function rand(min, max) { return min + Math.random() * (max - min); }

    function spawn() {
      if (!shouldSpawn()) return;
      var field = document.querySelector('.aur-starfield');
      if (!field) return;

      var angle = rand(12, 62);
      if (Math.random() < 0.32) angle = rand(-38, -12);

      var length = rand(92, 175);
      var travel = length * rand(1.35, 1.95);
      var radians = angle * Math.PI / 180;

      var el = document.createElement('i');
      el.className = 'aur-shooting-star';
      var s = el.style;
      s.setProperty('--shoot-left', rand(-10, 84).toFixed(2) + '%');
      s.setProperty('--shoot-top', rand(4, 72).toFixed(2) + '%');
      s.setProperty('--shoot-len', length.toFixed(0) + 'px');
      s.setProperty('--shoot-angle', angle.toFixed(1) + 'deg');
      s.setProperty('--shoot-tx', (Math.cos(radians) * travel).toFixed(1) + 'px');
      s.setProperty('--shoot-ty', (Math.sin(radians) * travel).toFixed(1) + 'px');
      var durationMs = rand(1700, 2300);
      s.setProperty('--shoot-dur', durationMs.toFixed(0) + 'ms');
      s.setProperty('--shoot-alpha', rand(0.58, 0.82).toFixed(2));
      if (Math.random() < COLOUR_CHANCE) {
        var variant = COLOUR_VARIANTS[Math.floor(rand(0, COLOUR_VARIANTS.length))];
        s.setProperty('--shoot-core-rgb', variant.core);
        s.setProperty('--shoot-glow-rgb', variant.glow);
        s.setProperty('--shoot-head-rgb', variant.head);
      }

      field.appendChild(el);
      function cleanup() { el.remove(); }
      el.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, durationMs + 300);
    }

    function roll() {
      if (Math.random() < SPAWN_CHANCE) spawn();
    }

    setInterval(roll, ROLL_MS);
    setTimeout(roll, ROLL_MS);
  })();


  /* ---------- §7.7 Progress bar fill + advance personality (always runs) ----------
     1. Reads previous-page % from localStorage; paints fill at that width
        with no transition.
     2. Schedules a reflow + second-rAF flip to the new % so the CSS width
        transition fires.
     3. Adds `.is-advancing` to the progress root, scoped to the duration
        of the transition. CSS uses this class to fire the celebration:
        fill glow pulse, faster shimmer pass, current-number bounce.
     4. Removes `.is-advancing` on `transitionend` so the celebration ends
        cleanly. If the user navigates from a page to the same page (% is
        the same), no transition fires — fallback timeout removes the class
        after var(--aur-dur-large). */

  (function initProgress() {
    var el = document.querySelector('.aur-progress');
    if (!el) return;
    var fill = el.querySelector('.aur-progress__fill');
    if (!fill) return;

    var current = parseFloat(el.getAttribute('data-aur-progress-current')) || 0;
    var total   = parseFloat(el.getAttribute('data-aur-progress-total'))   || 1;
    var pct     = Math.max(0, Math.min(100, (current / total) * 100));

    var prev;
    try { prev = parseFloat(localStorage.getItem('auroraProgress')); } catch (e) { prev = NaN; }
    if (!isFinite(prev)) prev = 0;

    // Paint at the previous-page value with no transition.
    fill.style.transition = 'none';
    fill.style.width = prev + '%';

    // Only celebrate when moving forward. Going backwards (e.g. clicking
    // Back to page 3 after reaching page 8) would otherwise animate the
    // fill bar shrinking with the "advance" glow/bounce still firing,
    // which reads as broken.
    var isAdvance = pct > prev + 0.5;

    requestAnimationFrame(function () {
      fill.style.transition = 'width var(--aur-dur-large) var(--aur-ease-out-soft)';
      fill.style.width = pct + '%';

      if (isAdvance) {
        var ADVANCE_MS = 900;  // matches --aur-dur-large width transition
        el.classList.add('is-advancing');
        setTimeout(function () {
          el.classList.remove('is-advancing');
        }, ADVANCE_MS);
      }
    });

    try { localStorage.setItem('auroraProgress', String(pct)); } catch (e) {}
  })();


  /* ---------- Media-tile image load (always runs) ----------
     The §7.12 media tile starts with `opacity: 0` on the img and a
     shimmer-skeleton on the parent body. Add `.is-loaded` when the
     image finishes loading so the skeleton stops and the image fades
     in. Without this, GIFs/PNGs stay invisible. */

  (function initMediaTileLoad() {
    // Only <img> elements need the skeleton/fade lifecycle.
    // <video> elements start visible via CSS (opacity:1, no skeleton).
    var imgs = document.querySelectorAll('img.aur-media-tile__img');
    imgs.forEach(function (img) {
      var body = img.parentNode;
      var markLoaded = function () {
        img.classList.add('is-loaded');
        if (body && body.classList) body.classList.add('is-loaded');
      };
      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener('load', markLoaded);
        img.addEventListener('error', markLoaded); // still un-hide so broken-image icon shows
      }
    });
  })();


  /* ---------- §6.5 Entrance stagger (always runs) ----------
     CSS owns the per-child delay (nth-child up to 6, then collapse).
     JS just flips `.is-revealed` on `.aur-main` after first paint so
     the keyframe fires. Without the flip, children stay opacity:0.
     prefers-reduced-motion is handled by the CSS blanket which
     collapses the animation-duration to 0.001ms. */

  /* ---------- Lazy inline videos (always runs) ----------
     Lesson recordings are authored as WebM with MP4 fallback, but they
     do not need to fetch immediately on page load. The template keeps
     their real URLs in data-src; this hydrates sources shortly before a
     video scrolls into view, or immediately when a user plays/expands it. */

  (function initLazyInlineVideos() {
    var videos = document.querySelectorAll('video[data-aur-lazy-video]');
    if (!videos.length) return;

    function hydrate(video) {
      if (!video || video.getAttribute('data-aur-video-loaded') === '1') return;
      var changed = false;
      video.querySelectorAll('source[data-src]').forEach(function (source) {
        source.setAttribute('src', source.getAttribute('data-src'));
        source.removeAttribute('data-src');
        changed = true;
      });
      video.setAttribute('data-aur-video-loaded', '1');
      video.preload = 'metadata';
      if (changed) video.load();
    }

    function fitVideoToNaturalRatio(video) {
      if (!video || !video.videoWidth || !video.videoHeight) return;
      video.style.aspectRatio = video.videoWidth + ' / ' + video.videoHeight;
      video.style.height = 'auto';
      var body = video.closest('.aur-media-tile__body');
      if (body && body.classList) body.classList.add('is-loaded');
    }

    videos.forEach(function (video) {
      video.addEventListener('loadedmetadata', function () {
        fitVideoToNaturalRatio(video);
      });
      if (video.videoWidth && video.videoHeight) fitVideoToNaturalRatio(video);
    });

    window.__aurHydrateVideo = hydrate;

    if ('IntersectionObserver' in window) {
      // On desktop the viewport doesn't scroll — .aur-main does. Default
      // root:null would compare against the viewport, so videos far down
      // long pages would never fire an intersection and stay as posters.
      var lvIsMobile = window.matchMedia('(max-width: 800px)').matches;
      var lvMain = document.querySelector('.aur-main');
      var lvRoot = (!lvIsMobile && lvMain) ? lvMain : null;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          hydrate(entry.target);
          observer.unobserve(entry.target);
        });
      }, { root: lvRoot, rootMargin: '700px 0px' });
      videos.forEach(function (video) { observer.observe(video); });
    } else {
      videos.forEach(hydrate);
    }
  })();


  /* ---------- §7.3 3D tilt on .aur-tile.is-tiltable ----------
     Lightweight perspective rotate. Pointer position normalised to
     [-1, 1] across the tile; multiplied by max-degree (5deg) for the
     rotateX/Y. rAF-throttled so a high-DPI mouse doesn't overwhelm
     the compositor. Skipped under prefers-reduced-motion. */

  // Tile hover tilt intentionally disabled.


  /* ---------- §7.9 Copy button ----------
     Markup contract (rendered by main.html):
       <button class="aur-copy" data-aur-copy="VALUE">
         <span class="aur-copy__icon">…default + done svgs…</span>
         <span class="aur-copy__label">
           <span class="aur-copy__label-default">Email: <code>VALUE</code></span>
           <span class="aur-copy__label-done">Copied</span>
         </span>
       </button>
     We inject the particle container + 3 particles on first init so
     the CSS animation has elements to act on. Each particle gets its
     own --p-tx / --p-ty for direction. */

  (function initCopy() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var btns = document.querySelectorAll('.aur-copy[data-aur-copy]');

    // Three particle directions roughly evenly spaced; varied to look organic.
    var DIRS = [
      { tx: '-26px', ty: '-18px' },
      { tx:  '26px', ty: '-22px' },
      { tx:   '0px', ty: '-32px' }
    ];

    btns.forEach(function (btn) {
      // Inject particles container once. Skip entirely under reduced motion —
      // CSS would collapse the duration anyway but no point adding DOM.
      if (!reduce && !btn.querySelector('.aur-copy__particles')) {
        var wrap = document.createElement('span');
        wrap.className = 'aur-copy__particles';
        wrap.setAttribute('aria-hidden', 'true');
        DIRS.forEach(function (d) {
          var p = document.createElement('span');
          p.className = 'aur-copy__particle';
          p.style.setProperty('--p-tx', d.tx);
          p.style.setProperty('--p-ty', d.ty);
          wrap.appendChild(p);
        });
        btn.appendChild(wrap);
      }

      var resetTimer = null;

      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-aur-copy') || '';
        var html = btn.getAttribute('data-aur-copy-html') || '';
        var done = function () {
          btn.classList.remove('is-copied');
          // Force reflow so re-adding the class restarts the animations
          // even if the user mashes the button.
          void btn.offsetWidth;
          btn.classList.add('is-copied');
          clearTimeout(resetTimer);
          resetTimer = setTimeout(function () {
            btn.classList.remove('is-copied');
          }, 1400);
        };
        var copyPlain = function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(done, function () { /* swallow */ });
          } else {
            // Fallback for older browsers / non-secure contexts.
            var ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) {}
            document.body.removeChild(ta);
          }
        };

        if (html && navigator.clipboard && navigator.clipboard.write && window.ClipboardItem && window.Blob) {
          navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([value], { type: 'text/plain' })
            })
          ]).then(done, copyPlain);
        } else {
          copyPlain();
        }
      });
    });
  })();


  /* ---------- §7.16 Lightbox ----------
     Single instance in the DOM (rendered by main.html's
     {% block lightbox %}). Any <img data-aur-lightbox> opens it as an
     image; the corner expand button on a media tile (initPerTilePause
     below) dispatches `aur:lightbox-video` to open a <video> in it.
     Esc / backdrop click / close-button click closes it.
     Focus moves to the close button on open and back to the
     triggering element on close. Body scroll is locked while open. */

  (function initLightbox() {
    var box       = document.getElementById('aur-lightbox');
    if (!box) return;
    var img       = document.getElementById('aur-lightbox-img');
    var videoWrap = document.getElementById('aur-lightbox-video-wrap');
    var video     = document.getElementById('aur-lightbox-video');
    var caption   = document.getElementById('aur-lightbox-caption');
    var close     = document.getElementById('aur-lightbox-close');
    /* Custom video controls: refs are read once, listeners are bound
       once below. The same controls are reused for every open. */
    var ctrls     = document.getElementById('aur-lightbox-video-controls');
    var playBtn   = document.getElementById('aur-lightbox-video-play');
    var playIcon  = playBtn ? playBtn.querySelector('.aur-lightbox__video-icon--play')  : null;
    var pauseIcon = playBtn ? playBtn.querySelector('.aur-lightbox__video-icon--pause') : null;
    var scrubber  = document.getElementById('aur-lightbox-video-scrubber');
    var timeEl    = document.getElementById('aur-lightbox-video-time');
    var fsBtn     = document.getElementById('aur-lightbox-video-fs');
    var imgTriggers = document.querySelectorAll('[data-aur-lightbox]');

    var lastFocus = null;
    var prevBodyOverflow = '';

    function fmtTime(t) {
      if (!isFinite(t) || t < 0) t = 0;
      var m = Math.floor(t / 60);
      var s = Math.floor(t - m * 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateProgress() {
      if (!video || !scrubber) return;
      var dur = video.duration;
      var cur = video.currentTime;
      if (isFinite(dur) && dur > 0) {
        var pct = (cur / dur) * 1000;
        scrubber.value = pct;
        scrubber.style.setProperty('--p', (pct / 10) + '%');
        if (timeEl) timeEl.innerHTML = fmtTime(cur) + '&nbsp;/&nbsp;' + fmtTime(dur);
      } else {
        scrubber.value = 0;
        scrubber.style.setProperty('--p', '0%');
        if (timeEl) timeEl.innerHTML = '0:00&nbsp;/&nbsp;0:00';
      }
    }

    function updatePlayIcon() {
      if (!playBtn || !playIcon || !pauseIcon) return;
      var paused = video.paused || video.ended;
      playIcon.hidden  = !paused;
      pauseIcon.hidden =  paused;
      playBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      /* While paused, keep the controls visible even without hover so
         the play button is reachable. */
      if (ctrls) ctrls.classList.toggle('is-paused', paused);
    }

    function showBox(label) {
      lastFocus = document.activeElement;
      if (caption) caption.textContent = label || '';
      box.hidden = false;
      box.setAttribute('aria-hidden', 'false');
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Next frame so the `hidden` removal and the `.is-open` add are
      // separate paints — gives the opacity transition a starting state.
      requestAnimationFrame(function () {
        box.classList.add('is-open');
        if (close) close.focus();
      });
    }

    function openImage(src, alt) {
      if (videoWrap) videoWrap.hidden = true;
      if (video) { video.pause && video.pause(); video.removeAttribute('src'); video.innerHTML = ''; }
      if (img)   { img.hidden = false; img.src = src; img.alt = alt || ''; }
      showBox(alt);
    }

    /* sources: array of { src, type } drawn from the inline video's
       <source> children, so the lightbox video falls back the same way
       (webm â†’ mp4). alt is the tile's accessible label, used as the
       lightbox caption + aria-label. */
    function openVideo(sources, alt) {
      if (img)   { img.hidden = true; img.removeAttribute('src'); img.alt = ''; }
      if (!video || !videoWrap) return;
      videoWrap.hidden = false;
      // Clear any prior sources so the new media is loaded fresh.
      video.pause();
      video.innerHTML = '';
      video.removeAttribute('src');
      sources.forEach(function (s) {
        var srcEl = document.createElement('source');
        srcEl.src = s.src;
        if (s.type) srcEl.type = s.type;
        video.appendChild(srcEl);
      });
      video.setAttribute('aria-label', alt || 'Video preview');
      video.load();
      updateProgress();
      updatePlayIcon();
      // Try to autoplay (muted is required for autoplay on most browsers,
      // but the user expanded this so a small delay before autoplay is
      // fine if it fails).
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
      showBox(alt);
    }

    function dismiss() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = prevBodyOverflow;
      // Wait for the opacity transition to finish before hiding.
      setTimeout(function () {
        box.hidden = true;
        if (img) img.removeAttribute('src');
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.innerHTML = '';
        }
        if (videoWrap) videoWrap.hidden = true;
        if (lastFocus && typeof lastFocus.focus === 'function') {
          lastFocus.focus();
        }
        lastFocus = null;
      }, 220);
    }

    /* Custom controls wiring (bound once, reused across opens). */
    if (video) {
      video.addEventListener('play',           updatePlayIcon);
      video.addEventListener('pause',          updatePlayIcon);
      video.addEventListener('ended',          updatePlayIcon);
      video.addEventListener('timeupdate',     updateProgress);
      video.addEventListener('loadedmetadata', updateProgress);
      video.addEventListener('durationchange', updateProgress);
      /* Single click on the lightbox video toggles play/pause; double
         click closes the lightbox. Same 250ms timer trick as the
         inline media — defer the single-click action so a dblclick
         can cancel it cleanly. */
      var vidClickTimer = null;
      video.addEventListener('click', function () {
        if (vidClickTimer) { clearTimeout(vidClickTimer); vidClickTimer = null; }
        vidClickTimer = setTimeout(function () {
          vidClickTimer = null;
          if (video.paused) video.play().catch(function () {});
          else              video.pause();
        }, 250);
      });
      video.addEventListener('dblclick', function () {
        if (vidClickTimer) { clearTimeout(vidClickTimer); vidClickTimer = null; }
        dismiss();
      });
    }
    /* Lightbox image has no single-click action, so dblclick to
       collapse needs no disambiguation timer. */
    if (img) {
      img.addEventListener('dblclick', dismiss);
    }
    if (playBtn && video) {
      playBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (video.paused) video.play().catch(function () {});
        else              video.pause();
      });
    }
    if (scrubber && video) {
      scrubber.addEventListener('input', function () {
        var dur = video.duration;
        if (!isFinite(dur) || dur <= 0) return;
        var pct = scrubber.value / 1000;
        video.currentTime = pct * dur;
        scrubber.style.setProperty('--p', (pct * 100) + '%');
      });
    }
    if (fsBtn && videoWrap) {
      fsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (fsEl) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          var req = videoWrap.requestFullscreen || videoWrap.webkitRequestFullscreen;
          if (req) {
            var fsPromise = req.call(videoWrap);
            if (fsPromise && typeof fsPromise.catch === 'function') fsPromise.catch(function () {});
          }
        }
      });
    }

    imgTriggers.forEach(function (el) {
      // Keyboard-accessible: images aren't focusable by default. Make
      // them so, and react to Enter/Space. Mouse click on the image
      // itself is owned by initPerTilePause (single click â†’ pause,
      // double click â†’ open lightbox); this keydown is the keyboard
      // equivalent of the double-click expand.
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-haspopup', 'dialog');
      var alt = el.getAttribute('alt') || '';
      el.setAttribute('aria-label', alt ? ('View larger: ' + alt) : 'View larger image');

      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openImage(el.currentSrc || el.src, alt);
        }
      });
    });

    /* Custom events let other init blocks (initPerTilePause below)
       trigger the lightbox without reaching into this closure. */
    document.addEventListener('aur:lightbox-image', function (e) {
      openImage(e.detail.src, e.detail.alt);
    });
    document.addEventListener('aur:lightbox-video', function (e) {
      openVideo(e.detail.sources, e.detail.alt);
    });

    if (close) close.addEventListener('click', dismiss);
    box.addEventListener('click', function (e) {
      // Backdrop click — only when the click target is the backdrop itself,
      // not the image or close button.
      if (e.target === box) dismiss();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) dismiss();
    });
  })();


  /* ---------- Stage 9: Mobile sidebar drawer toggle (always runs) ----------
     The hamburger button is hidden by CSS on desktop, so this handler is a
     no-op there. On mobile (<800px) it toggles `body.aur-sidebar-open` which
     slides the sidebar drawer in and dims the rest of the page. */

  /* ---------- Sidebar nav: collapsible sections (always runs) ----------
     Each `<div class="aur-nav__section">` has a heading button + collapsible
     body. Clicking the heading toggles `.is-open`. State persists per
     section in localStorage under `auroraNavOpen` (a `{ slug: boolean }`
     dict). Default state: section containing the current page is open
     (set by the template via `sec_contains_current`); user toggles
     override the default and persist. */

  /* ---------- Steps "Compact" toggle + click-to-expand (always runs) ----------
     The Steps card supports a compact mode where each step shows only
     its marker + title. Clicking a step's title toggles `.is-expanded`
     on that step, revealing the body inline via the grid-rows trick.
     Each step is independent (multiple may be open at once). The toggle
     state persists per visitor in localStorage (`auroraStepsCompact`).
     Per-step expand state is page-local (not persisted). */

  (function initStepsCompact() {
    var card    = document.querySelector('[data-aur-steps]');
    if (!card) return;
    var toggle  = card.querySelector('.aur-steps-toggle');
    if (!toggle) return;
    var steps   = card.querySelectorAll('.aur-step');

    var STORAGE_KEY = 'auroraStepsCompact';
    var compact = false;
    try { compact = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}

    function apply() {
      card.classList.toggle('is-compact', compact);
      toggle.setAttribute('aria-pressed', compact ? 'true' : 'false');
      // Clear all expand states when switching modes so a re-enter of
      // compact mode starts clean.
      if (!compact) {
        card.querySelectorAll('.aur-step.is-expanded').forEach(function (s) {
          s.classList.remove('is-expanded');
        });
      }
    }
    apply();

    toggle.addEventListener('click', function () {
      compact = !compact;
      apply();
      try { localStorage.setItem(STORAGE_KEY, compact ? '1' : '0'); } catch (e) {}
    });

    // URL hash sync: when a step is expanded, mirror its id into the
    // URL hash (replaceState — doesn't pollute history). When the user
    // collapses the same step, clear the hash. Lets users share deep
    // links to specific expanded steps. The hash also drives auto-
    // expansion on page load + back/forward navigation.
    function setHash(id) {
      var target = id ? '#' + id : '';
      if (window.location.hash === target) return;
      var url = window.location.pathname + window.location.search + target;
      try { history.replaceState(null, '', url); } catch (e) { /* file:// fallback */ }
    }

    function applyHash() {
      var hash = window.location.hash;
      if (!hash) return;
      var m = hash.match(/^#(step-\d+)$/);
      if (!m) return;
      var target = document.getElementById(m[1]);
      if (!target || !card.contains(target)) return;
      if (card.classList.contains('is-compact')) {
        target.classList.add('is-expanded');
      }
      // Defer scroll past the layout shift from expansion.
      requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Click on the step's title toggles its visibility. Works in
    // BOTH modes:
    //   - Compact: title click toggles `.is-expanded` (default
    //     state is collapsed; click expands).
    //   - Non-compact: title click toggles `.is-folded` (default
    //     state is expanded; click folds).
    // Two classes with opposite default states so the CSS for the
    // two modes can co-exist without ambiguity.
    steps.forEach(function (step) {
      var title = step.querySelector('.aur-step__title');
      if (!title) return;

      function toggleStep() {
        if (card.classList.contains('is-compact')) {
          var willExpand = !step.classList.contains('is-expanded');
          step.classList.toggle('is-expanded');
          // Hash mirrors the step the user just opened; clearing it
          // when they collapse keeps the URL in sync. Compact-mode
          // only — non-compact folds don't deep-link.
          setHash(willExpand ? step.id : null);
        } else {
          step.classList.toggle('is-folded');
        }
      }

      title.addEventListener('click', function (e) {
        // Don't toggle if the click was on a link or button inside.
        if (e.target.closest('a, button, [data-aur-lightbox]')) return;
        toggleStep();
      });
      // Keyboard support: Enter/Space on a focused title toggles too.
      title.setAttribute('tabindex', '0');
      title.setAttribute('role', 'button');
      title.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggleStep();
      });
    });

    // Apply state from hash on initial load and on hashchange (back /
    // forward / external link).
    applyHash();
    window.addEventListener('hashchange', applyHash);
  })();

  /* ---------- Reference accordions compact toggle ----------
     Terminology and Useful Links use native <details> sections rather
     than step cards. This gives them the same Compact control: pressed
     means all sections are closed; unpressed restores the page's
     initial open/closed pattern. */
  (function initReferenceAccordionCompact() {
    var toggles = document.querySelectorAll('[data-aur-accordion-compact]');
    if (!toggles.length) return;

    toggles.forEach(function (toggle) {
      var actions = toggle.closest('.aur-term-actions');
      var accordion = actions ? actions.nextElementSibling : null;
      if (!accordion || !accordion.matches('[data-aur-accordion]')) return;

      var sections = Array.from(accordion.querySelectorAll('details.aur-term-section'));
      if (!sections.length) return;
      var defaultOpen = sections.map(function (section) { return section.hasAttribute('open'); });
      var storageKey = 'auroraAccordionCompact:' + window.location.pathname;
      var compact = false;

      try { compact = localStorage.getItem(storageKey) === '1'; } catch (e) {}

      function apply() {
        accordion.classList.toggle('is-compact', compact);
        toggle.setAttribute('aria-pressed', compact ? 'true' : 'false');
        sections.forEach(function (section, i) {
          section.open = compact ? false : !!defaultOpen[i];
        });
      }

      toggle.addEventListener('click', function () {
        compact = !compact;
        apply();
        try { localStorage.setItem(storageKey, compact ? '1' : '0'); } catch (e) {}
      });

      apply();
    });
  })();


  (function initNavCollapse() {
    var sections = document.querySelectorAll('.aur-nav__section');
    if (!sections.length) return;

    var STORAGE_KEY = 'auroraNavOpen';
    var saved = {};
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (e) {}
    }

    sections.forEach(function (section) {
      var slug = section.getAttribute('data-aur-nav-section');
      var heading = section.querySelector('.aur-nav__heading');
      if (!heading) return;

      // Default is minimised; per-section user preference overrides.
      var open = Object.prototype.hasOwnProperty.call(saved, slug) ? !!saved[slug] : false;
      section.classList.toggle('is-open', open);
      heading.setAttribute('aria-expanded', open ? 'true' : 'false');

      heading.addEventListener('click', function () {
        var nowOpen = !section.classList.contains('is-open');
        section.classList.toggle('is-open', nowOpen);
        heading.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
        saved[slug] = nowOpen;
        saveState();
      });
    });
  })();


  (function initMobileNav() {
    var hamburger = document.getElementById('aur-hamburger');
    var sidebar   = document.getElementById('aur-sidebar');
    var backdrop  = document.getElementById('aur-sidebar-backdrop');
    if (!hamburger || !sidebar) return;

    function setOpen(open) {
      document.body.classList.toggle('aur-sidebar-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (open) sidebar.focus();
    }

    hamburger.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('aur-sidebar-open'));
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () { setOpen(false); });
    }

    // Close the drawer on Esc when it's open.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('aur-sidebar-open')) {
        setOpen(false);
        hamburger.focus();
      }
    });

    // Close the drawer when the user clicks a nav link inside it.
    sidebar.addEventListener('click', function (e) {
      var anchor = e.target && e.target.closest ? e.target.closest('a') : null;
      if (anchor && document.body.classList.contains('aur-sidebar-open')) {
        setOpen(false);
      }
    });

    // If the viewport resizes above the mobile breakpoint, ensure the
    // drawer state doesn't get stuck open.
    var mql = window.matchMedia('(min-width: 801px)');
    var resetIfDesktop = function (e) {
      if (e.matches && document.body.classList.contains('aur-sidebar-open')) {
        setOpen(false);
      }
    };
    if (mql.addEventListener) mql.addEventListener('change', resetIfDesktop);
    else if (mql.addListener) mql.addListener(resetIfDesktop);
  })();


  /* ---------- Shared colour + font utilities (user prefs + dev panel) ---------- */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function pad2(n) { var h = Math.round(n).toString(16); return h.length === 1 ? '0' + h : h; }
  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r, g, b) { return '#' + pad2(r) + pad2(g) + pad2(b); }
  function rgbaStr(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + alpha + ')';
  }
  function rgbaToHex(rgba) {
    var m = String(rgba).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? rgbToHex(+m[1], +m[2], +m[3]) : null;
  }
  function hexToHsv(hex) {
    var c = hexToRgb(hex);
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min, h = 0;
    if (d > 0) {
      if (max === r)      h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else                h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: max === 0 ? 0 : d / max, v: max };
  }
  function hsvToHex(h, s, v) {
    var c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    var r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  var SYSTEM_STACK = '-apple-system, "Segoe UI", "Inter", system-ui, sans-serif';
  var FONT_PRESETS = [
    { label: 'System',       stack: SYSTEM_STACK,                            google: null },
    { label: 'IBM Plex',     stack: '"IBM Plex Sans", ' + SYSTEM_STACK,      google: 'IBM+Plex+Sans:wght@400;600;700' },
    // Self-hosted dyslexia-friendly font; @font-face declared in aurora.css.
    { label: 'OpenDyslexic', stack: '"OpenDyslexic", ' + SYSTEM_STACK,       google: null }
  ];

  function findPresetByStack(stack) {
    for (var i = 0; i < FONT_PRESETS.length; i++) {
      if (FONT_PRESETS[i].stack === stack) return FONT_PRESETS[i];
    }
    return FONT_PRESETS[0];
  }
  function injectGoogleFont(googlePath) {
    if (!googlePath) return;
    var id = 'aur-gf-' + googlePath.split(':')[0].replace(/[^A-Za-z0-9]/g, '');
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + googlePath + '&display=swap';
    document.head.appendChild(link);
  }


  /* ---------- User preferences panel (always runs — available to all users) ---------- */

  (function initUserPrefs() {
    var PREF_KEY = 'auroraUserPrefs';
    var docEl    = document.documentElement;

    /* Defaults live in window.__AURORA_DEFAULTS__ (set inline at the
       top of <head> in base.html) so the same object drives BOTH the
       early-paint CSS-var application AND this module. To change
       the out-of-the-box appearance, edit that block — not here.
       The fallback object below only runs if the inline script
       failed to define the global (e.g. CSP block, JS error). */
    var DEFAULTS = window.__AURORA_DEFAULTS__ || {
      fontStack:     null,
      fontSize:      1,
      stars:         true,
      colours:       true,
      colour1:       '#e6b71d',
      colour2:       '#c52f64',
      colour3:       '#9734e4',
      bgOpacity:     0.15,
      tileColour:    '#141020',
      tileOpacity:   1,
      tileBlur:      3,
      headingColour: '#e7c5f3',
      textColour:    '#dbc4e9',
      linkColour:    '#e75488'
    };

    function loadPrefs() {
      try {
        var raw = localStorage.getItem(PREF_KEY);
        var prefs = raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
        // Blur is now depth-based rather than user-configurable. Ignore
        // any older saved slider value so stacked cards stay consistent.
        prefs.tileBlur = DEFAULTS.tileBlur;
        return prefs;
      } catch (e) { return Object.assign({}, DEFAULTS); }
    }
    function savePrefs(p) {
      try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {}
    }
    /* ---------- Tile backdrop helper ----------
       Chromium has a long-standing quirk where `backdrop-filter:
       blur(var(--x))` does NOT re-sample the GPU blur kernel when
       only --x changes via a custom property — the variable updates
       in the cascade but the rendered blur stays stale. Workaround:
       write the literal computed `backdrop-filter` value as inline
       style on each backdrop-using element. Scrolling now keeps these
       inline filters active so glass stays consistent while the
       background animations pause behind it. */
    var BACKDROP_SELECTOR =
      '.aur-tile, .aur-step, .aur-help-card, .aur-video-panel, ' +
      '.aur-sidebar, .aur-shell-topbar, ' +
      '.aur-prefs-panel, .aur-dev-panel, .aur-fab, .aur-fab-menu';

    function readBlurPx(el) {
      var value = window.getComputedStyle(el).getPropertyValue('--aur-tile-blur');
      var px = parseFloat(value);
      return isFinite(px) ? px : 3;
    }

    function applyTileBackdropInline(tileOpacity) {
      /* Couple saturate() to the blur slider. Gaussian blur on the
         already-smooth blob gradients has almost no visible high-
         frequency content to remove, so cranking the blur slider
         barely seems to affect blob regions — only the sharp stars.
         Scaling saturation alongside blur means cranking the slider
         *does* visibly change the blob signal: pastel-on-dark blobs
         get progressively more vivid through the tile, reading as
         the "cohesive frosted-glass mass" the user wants.

         The saturation ceiling at blur=40 is tile-opacity-aware:
         a more transparent tile (higher "Glass effect") lets more
         of the saturated backdrop sample through, so the compound
         effect amplifies. To keep peak vividness comparable across
         glass settings, we ease the ceiling down as glass rises.
         Default Glass (0.44): ceiling 240%.
         Max     Glass (1.00): ceiling 175%.
         Below default Glass: ceiling stays at 240% (clamped). */
      var g   = tileOpacity == null ? 0.44 : tileOpacity;
      var glassExcess = Math.max(0, Math.min(1, (g - 0.44) / (1 - 0.44)));
      var ceiling = 132 - glassExcess * 12;
      var els = document.querySelectorAll(BACKDROP_SELECTOR);
      els.forEach(function (el) {
        var blurPx = readBlurPx(el);
        var t = Math.max(0, Math.min(1, blurPx / 40));
        var sat = Math.round(100 + t * (ceiling - 100));
        var val = 'blur(' + blurPx + 'px) saturate(' + sat + '%)';
        el.style.webkitBackdropFilter = val;
        el.style.backdropFilter = val;
        /* Force layout read so Chromium definitely re-samples the
           composited backdrop kernel. Without this, some versions
           batch the inline-style change with subsequent ones and
           the GPU sees no kernel change between paints. */
        void el.offsetWidth;
      });
      try { window.__lastBlurApplied = { count: els.length, at: Date.now() }; } catch (e) {}
    }

    function applyPrefs(p) {
      var s = docEl.style;
      var fontVars = ['--aur-font', '--aur-font-title', '--aur-font-subtitle', '--aur-font-body'];
      if (p.fontStack) {
        fontVars.forEach(function (v) { s.setProperty(v, p.fontStack); });
      } else {
        fontVars.forEach(function (v) { s.removeProperty(v); });
      }
      s.setProperty('--aur-font-scale',       String(p.fontSize));
      s.setProperty('--aur-star-intensity',   p.stars ? '1' : '0');
      s.setProperty('--aur-backdrop-1',       p.colour1);
      s.setProperty('--aur-backdrop-2',       p.colour2);
      s.setProperty('--aur-backdrop-3',       p.colour3);
      s.setProperty('--aur-backdrop-opacity', p.colours === false ? '0' : String(p.bgOpacity));
      var g  = p.tileOpacity;            // 0 = solid, 1 = maximum glass
      var a1 = 1 - g * 0.85;            // alpha: 0â†’1.0 (opaque), 1â†’0.15 (transparent)
      s.setProperty('--aur-bg-elev-1', rgbaStr(p.tileColour || '#141020', a1));
      s.setProperty('--aur-bg-elev-2', rgbaStr(p.tileColour || '#141020', Math.min(1, a1 + 0.10)));
      s.setProperty('--aur-bg-elev-stack-2', rgbaStr(p.tileColour || '#141020', Math.min(1, a1 + 0.22)));
      s.setProperty('--aur-bg-elev-stack-3', rgbaStr(p.tileColour || '#141020', Math.min(1, a1 + 0.34)));
      s.setProperty('--aur-bg-elev-stack-4', rgbaStr(p.tileColour || '#141020', Math.min(1, a1 + 0.44)));
      s.setProperty('--aur-bg-sidebar', rgbaStr(p.tileColour || '#141020', Math.min(1, a1 + 0.04)));
      s.setProperty('--aur-tile-blur', DEFAULTS.tileBlur + 'px');
      /* "Main text" drives both --aur-text (titles, strong, nav items)
         and --aur-text-soft (body prose, list items, descriptions).
         Body prose inside tiles uses --aur-text-soft, NOT --aur-text,
         so without overriding -soft the picker wouldn't visibly
         affect tile body content. The original subtle brightness
         hierarchy between -text and -text-soft is dropped in favour
         of "the colour I pick is the colour I see." */
      var tc = p.textColour || '#dbc4e9';
      s.setProperty('--aur-text',         tc);
      s.setProperty('--aur-text-soft',    tc);
      s.setProperty('--aur-text-heading', p.headingColour || tc);
      s.setProperty('--aur-text-link',    p.linkColour    || '#e75488');

      /* Force re-sample of backdrop-filter (see comment above the helper). */
      applyTileBackdropInline(p.tileOpacity);
    }

    var prefs = loadPrefs();
    applyPrefs(prefs);   // restore saved state immediately

    var toggle   = document.getElementById('aur-prefs-toggle');
    var panel    = document.getElementById('aur-prefs-panel');
    var closeBtn = document.getElementById('aur-prefs-close');
    var resetBtn = document.getElementById('aur-prefs-reset');
    if (!toggle || !panel) return;

    function openPanel() {
      panel.classList.add('is-open');
      panel.removeAttribute('aria-hidden');
      panel.removeAttribute('inert');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closePanel() {
      allPrefsPickers.forEach(function (inst) { inst.close(); });
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      panel.setAttribute('inert', '');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      panel.classList.contains('is-open') ? closePanel() : openPanel();
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel(); toggle.focus();
      }
    });

    /* Custom HSV colour picker for user prefs.
       Popups are portaled to <body> so they escape the panel's
       overflow:hidden + transform containing-block. */
    var allPrefsPickers = [];

    function initPrefsPicker(root, initialHex, onChange) {
      if (!root) return null;
      var swatch = root.querySelector('.aur-picker__swatch');
      var pop    = root.querySelector('.aur-picker__pop');
      if (!swatch || !pop) return null;
      var sv     = pop.querySelector('.aur-picker__sv');
      var cursor = pop.querySelector('.aur-picker__sv-cursor');
      var hue    = pop.querySelector('.aur-picker__hue');
      var hexIn  = pop.querySelector('.aur-picker__hex');

      /* Portal popup to <body> so it escapes the panel's transform
         containing-block and overflow:hidden clipping. */
      document.body.appendChild(pop);
      pop.style.position = 'fixed';
      pop.style.zIndex   = '9100';
      pop.style.width    = '230px';
      pop.style.margin   = '0';

      var hsv = hexToHsv(initialHex);

      function syncSv() {
        sv.style.backgroundColor = 'hsl(' + Math.round(hsv.h) + ', 100%, 50%)';
        cursor.style.left = (hsv.s * 100) + '%';
        cursor.style.top  = ((1 - hsv.v) * 100) + '%';
        hue.value         = Math.round(hsv.h);
        hexIn.value       = hsvToHex(hsv.h, hsv.s, hsv.v);
      }
      function writeValue(hex) { swatch.style.color = hex; }

      syncSv();
      writeValue(initialHex);

      function positionPop() {
        var r = swatch.getBoundingClientRect();
        pop.style.top  = (r.bottom + 6) + 'px';
        pop.style.left = Math.max(8, r.right - 230) + 'px';
      }
      /* Keep the fixed-position popover attached to the swatch while
         it's open. Both .aur-main (desktop scroll container) and window
         (mobile) fire scroll events, plus resize for layout changes.
         Attached only while open to avoid always-on listeners. */
      var _scrollTargets = null;
      function bindReposition() {
        if (_scrollTargets) return;
        _scrollTargets = [window];
        var mainEl = document.querySelector('.aur-main');
        if (mainEl) _scrollTargets.push(mainEl);
        _scrollTargets.forEach(function (t) {
          t.addEventListener('scroll', positionPop, { passive: true });
        });
        window.addEventListener('resize', positionPop);
      }
      function unbindReposition() {
        if (!_scrollTargets) return;
        _scrollTargets.forEach(function (t) {
          t.removeEventListener('scroll', positionPop);
        });
        window.removeEventListener('resize', positionPop);
        _scrollTargets = null;
      }
      function closePop() {
        pop.hidden = true;
        root.classList.remove('is-open');
        swatch.setAttribute('aria-expanded', 'false');
        unbindReposition();
      }
      function openPop() {
        allPrefsPickers.forEach(function (inst) { if (inst !== instance) inst.close(); });
        positionPop();
        pop.hidden = false;
        root.classList.add('is-open');
        swatch.setAttribute('aria-expanded', 'true');
        bindReposition();
      }

      swatch.addEventListener('click', function (e) {
        e.stopPropagation();
        root.classList.contains('is-open') ? closePop() : openPop();
      });

      var svRect = null, svDragging = false;
      function svFromPointer(e) {
        if (!svRect) return;
        var x = clamp((e.clientX - svRect.left) / svRect.width,  0, 1);
        var y = clamp((e.clientY - svRect.top)  / svRect.height, 0, 1);
        hsv.s = x; hsv.v = 1 - y;
        cursor.style.left = (x * 100) + '%';
        cursor.style.top  = (y * 100) + '%';
        var hex = hsvToHex(hsv.h, hsv.s, hsv.v);
        writeValue(hex); onChange(hex);
      }
      sv.addEventListener('pointerdown', function (e) {
        svDragging = true;
        svRect = sv.getBoundingClientRect();
        sv.setPointerCapture(e.pointerId);
        svFromPointer(e);
      });
      sv.addEventListener('pointermove', function (e) { if (svDragging) svFromPointer(e); });
      function endSvDrag(e) {
        if (!svDragging) return;
        svDragging = false;
        try { sv.releasePointerCapture(e.pointerId); } catch (err) {}
        svRect = null;
      }
      sv.addEventListener('pointerup', endSvDrag);
      sv.addEventListener('pointercancel', endSvDrag);

      hue.addEventListener('input', function () {
        hsv.h = parseFloat(hue.value);
        sv.style.backgroundColor = 'hsl(' + Math.round(hsv.h) + ', 100%, 50%)';
        var hex = hsvToHex(hsv.h, hsv.s, hsv.v);
        writeValue(hex); hexIn.value = hex; onChange(hex);
      });

      function commitHex() {
        var v = hexIn.value.trim().toLowerCase();
        if (v[0] !== '#') v = '#' + v;
        if (!/^#[0-9a-f]{6}$/.test(v)) { hexIn.value = hsvToHex(hsv.h, hsv.s, hsv.v); return; }
        hsv = hexToHsv(v);
        syncSv(); writeValue(v); onChange(v);
      }
      hexIn.addEventListener('blur', commitHex);
      hexIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitHex(); } });

      var instance = {
        _root:    root,
        _pop:     pop,
        setValue: function (hex) { hsv = hexToHsv(hex); syncSv(); writeValue(hex); },
        close:    closePop
      };
      allPrefsPickers.push(instance);
      return instance;
    }

    /* Grab all control elements */
    var fontSel     = document.getElementById('aur-pref-font');
    var fontSizeEl  = document.getElementById('aur-pref-font-size');
    var fontSizeVal = document.getElementById('aur-pref-font-size-val');
    var starsEl     = document.getElementById('aur-pref-stars');
    var coloursEl   = document.getElementById('aur-pref-colours');
    var colourFields = document.querySelectorAll('.aur-prefs-field--colours, .aur-prefs-field--bg-intensity');
    var bgIntEl     = document.getElementById('aur-pref-bg-intensity');
    var bgIntVal    = document.getElementById('aur-pref-bg-intensity-val');
    var tileEl      = document.getElementById('aur-pref-tile-opacity');
    var tileVal     = document.getElementById('aur-pref-tile-opacity-val');

    /* Font select — populate options from shared FONT_PRESETS */
    if (fontSel) {
      FONT_PRESETS.forEach(function (fp) {
        var opt = document.createElement('option');
        opt.value = fp.stack;
        opt.textContent = fp.label;
        fontSel.appendChild(opt);
      });
      fontSel.value = prefs.fontStack || SYSTEM_STACK;
      if (fontSel.selectedIndex < 0) fontSel.selectedIndex = 0;
      var cur = findPresetByStack(fontSel.value);
      if (cur && cur.google) injectGoogleFont(cur.google);
      fontSel.addEventListener('change', function () {
        var fp = findPresetByStack(fontSel.value);
        if (fp && fp.google) injectGoogleFont(fp.google);
        prefs.fontStack = (fp && fp.stack !== SYSTEM_STACK) ? fp.stack : null;
        applyPrefs(prefs); savePrefs(prefs);
      });
    }

    /* Font size */
    if (fontSizeEl) {
      fontSizeEl.value = prefs.fontSize;
      if (fontSizeVal) fontSizeVal.textContent = Math.round(prefs.fontSize * 100) + '%';
      fontSizeEl.addEventListener('input', function () {
        prefs.fontSize = parseFloat(fontSizeEl.value);
        if (fontSizeVal) fontSizeVal.textContent = Math.round(prefs.fontSize * 100) + '%';
        applyPrefs(prefs); savePrefs(prefs);
      });
    }

    /* Stars toggle */
    if (starsEl) {
      starsEl.checked = prefs.stars;
      starsEl.addEventListener('change', function () {
        prefs.stars = starsEl.checked;
        applyPrefs(prefs); savePrefs(prefs);
      });
    }

    function syncColourControls(on) {
      if (!on) allPrefsPickers.forEach(function (inst) { inst.close(); });
      colourFields.forEach(function (field) {
        field.classList.toggle('is-disabled', !on);
        field.querySelectorAll('button, input').forEach(function (el) {
          el.disabled = !on;
        });
      });
    }

    if (coloursEl) {
      coloursEl.checked = prefs.colours !== false;
      syncColourControls(coloursEl.checked);
      coloursEl.addEventListener('change', function () {
        prefs.colours = coloursEl.checked;
        syncColourControls(prefs.colours);
        applyPrefs(prefs); savePrefs(prefs);
      });
    }

    /* Backdrop colour pickers */
    var picker1 = initPrefsPicker(document.getElementById('aur-pref-colour-1-picker'), prefs.colour1, function (hex) { prefs.colour1 = hex; applyPrefs(prefs); savePrefs(prefs); });
    var picker2 = initPrefsPicker(document.getElementById('aur-pref-colour-2-picker'), prefs.colour2, function (hex) { prefs.colour2 = hex; applyPrefs(prefs); savePrefs(prefs); });
    var picker3 = initPrefsPicker(document.getElementById('aur-pref-colour-3-picker'), prefs.colour3, function (hex) { prefs.colour3 = hex; applyPrefs(prefs); savePrefs(prefs); });

    /* Background intensity */
    if (bgIntEl) {
      bgIntEl.value = prefs.bgOpacity;
      if (bgIntVal) bgIntVal.textContent = Math.round(prefs.bgOpacity * 100) + '%';
      bgIntEl.addEventListener('input', function () {
        prefs.bgOpacity = parseFloat(bgIntEl.value);
        if (bgIntVal) bgIntVal.textContent = Math.round(prefs.bgOpacity * 100) + '%';
        applyPrefs(prefs); savePrefs(prefs);
      });
    }

    /* Tile colour */
    var pickerTile = initPrefsPicker(document.getElementById('aur-pref-tile-colour-picker'), prefs.tileColour, function (hex) { prefs.tileColour = hex; applyPrefs(prefs); savePrefs(prefs); });

    /* Tile / glass opacity */
    if (tileEl) {
      tileEl.value = prefs.tileOpacity;
      if (tileVal) tileVal.textContent = Math.round(prefs.tileOpacity * 100) + '%';
      tileEl.addEventListener('input', function () {
        prefs.tileOpacity = parseFloat(tileEl.value);
        if (tileVal) tileVal.textContent = Math.round(prefs.tileOpacity * 100) + '%';
        applyPrefs(prefs); savePrefs(prefs);
      });
    }

    /* Text colours — split into Header / Main text / Hyperlink */
    var pickerHeading = initPrefsPicker(document.getElementById('aur-pref-heading-colour-picker'), prefs.headingColour, function (hex) { prefs.headingColour = hex; applyPrefs(prefs); savePrefs(prefs); });
    var pickerText    = initPrefsPicker(document.getElementById('aur-pref-text-colour-picker'),    prefs.textColour,    function (hex) { prefs.textColour    = hex; applyPrefs(prefs); savePrefs(prefs); });
    var pickerLink    = initPrefsPicker(document.getElementById('aur-pref-link-colour-picker'),    prefs.linkColour,    function (hex) { prefs.linkColour    = hex; applyPrefs(prefs); savePrefs(prefs); });

    /* Push a prefs object into every panel control (slider values,
       display spans, switch checked state, picker swatches). Used
       on init (to override the HTML's hardcoded value= attrs from
       window.__AURORA_DEFAULTS__) and on reset. Single seam means
       changing defaults requires editing ONE block in base.html;
       slider attrs become cosmetic fallbacks only. */
    function syncControlsFromPrefs(p) {
      if (fontSel)      fontSel.value     = p.fontStack || SYSTEM_STACK;
      if (fontSizeEl) { fontSizeEl.value  = p.fontSize;    if (fontSizeVal) fontSizeVal.textContent = Math.round(p.fontSize * 100) + '%'; }
      if (starsEl)      starsEl.checked   = p.stars;
      if (coloursEl)  { coloursEl.checked = p.colours !== false; syncColourControls(coloursEl.checked); }
      if (bgIntEl)    { bgIntEl.value     = p.bgOpacity;   if (bgIntVal)    bgIntVal.textContent    = Math.round(p.bgOpacity * 100) + '%'; }
      if (tileEl)     { tileEl.value      = p.tileOpacity; if (tileVal)     tileVal.textContent     = Math.round(p.tileOpacity * 100) + '%'; }
      if (picker1)       picker1.setValue(p.colour1);
      if (picker2)       picker2.setValue(p.colour2);
      if (picker3)       picker3.setValue(p.colour3);
      if (pickerTile)    pickerTile.setValue(p.tileColour);
      if (pickerHeading) pickerHeading.setValue(p.headingColour);
      if (pickerText)    pickerText.setValue(p.textColour);
      if (pickerLink)    pickerLink.setValue(p.linkColour);
    }
    /* Init: push current prefs into controls so HTML hardcoded
       value= attrs and display text don't need to stay in sync
       with window.__AURORA_DEFAULTS__. */
    syncControlsFromPrefs(prefs);

    /* Collapsible sections. Each <section data-aur-prefs-section>
       toggles its `is-open` class + aria-expanded on the head when
       the head button is clicked. Default open on load (markup ships
       with `is-open` already set). State is not persisted across
       sessions — sections re-open with the panel. */
    document.querySelectorAll('[data-aur-prefs-section]').forEach(function (sec) {
      var head = sec.querySelector('.aur-prefs-section__head');
      if (!head) return;
      head.addEventListener('click', function () {
        var open = sec.classList.toggle('is-open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    /* Close any open prefs picker when clicking outside it.
       Popups are portaled to body, so check both root (swatch) and pop. */
    document.addEventListener('click', function (e) {
      allPrefsPickers.forEach(function (inst) {
        if (inst._root.classList.contains('is-open') &&
            !inst._root.contains(e.target) &&
            !inst._pop.contains(e.target)) {
          inst.close();
        }
      });
    });

    /* Reset to defaults — overwrite prefs with DEFAULTS, apply, push
       into controls. */
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        prefs = Object.assign({}, DEFAULTS);
        applyPrefs(prefs);
        try { localStorage.removeItem(PREF_KEY); } catch (e) {}
        syncControlsFromPrefs(prefs);
      });
    }
  })();


  /* ---------- Dev menu (guarded on html[data-aur-dev="1"]) ---------- */

  if (document.documentElement.getAttribute('data-aur-dev') === '1') {

  /* Constants */

  var STORAGE_OVERRIDES = 'auroraDevOverrides';
  var STORAGE_OPEN      = 'auroraDevOpen';


  /* Helpers */

  function getOverrides() {
    try {
      var raw = localStorage.getItem(STORAGE_OVERRIDES);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveOverrides(o) {
    try { localStorage.setItem(STORAGE_OVERRIDES, JSON.stringify(o)); } catch (e) {}
  }
  function setOverride(key, value) {
    var o = getOverrides();
    if (value === null || value === undefined) delete o[key];
    else o[key] = value;
    saveOverrides(o);
  }
  function applyVar(key, value) { document.documentElement.style.setProperty(key, value); }
  function clearVar(key)        { document.documentElement.style.removeProperty(key); }

  /* Boot */

  var toggle = document.getElementById('aur-dev-toggle');
  var panel  = document.getElementById('aur-dev-panel');
  var close  = document.getElementById('aur-dev-close');
  var reset  = document.getElementById('aur-dev-reset');
  var copy   = document.getElementById('aur-dev-copy');
  var fontSelects = document.querySelectorAll('[data-aur-font]');
  var pickers     = document.querySelectorAll('.aur-picker');

  if (!toggle || !panel) return;

  if (localStorage.getItem(STORAGE_OPEN) === '1') {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function () {
    var open = panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    try { localStorage.setItem(STORAGE_OPEN, open ? '1' : '0'); } catch (e) {}
  });
  close.addEventListener('click', function () {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    try { localStorage.setItem(STORAGE_OPEN, '0'); } catch (e) {}
  });

  var savedOverrides = getOverrides();


  /* Font dropdowns */

  fontSelects.forEach(function (sel) {
    var varName = sel.getAttribute('data-aur-font');

    FONT_PRESETS.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.stack;
      opt.textContent = p.label;
      sel.appendChild(opt);
    });

    var current = savedOverrides[varName] || SYSTEM_STACK;
    sel.value = current;
    if (sel.selectedIndex < 0) sel.value = SYSTEM_STACK;

    var preset = findPresetByStack(sel.value);
    if (preset.google) injectGoogleFont(preset.google);

    sel.addEventListener('change', function () {
      var p = findPresetByStack(sel.value);
      if (p.google) injectGoogleFont(p.google);
      applyVar(varName, p.stack);
      if (p.stack === SYSTEM_STACK) setOverride(varName, null);
      else setOverride(varName, p.stack);
    });
  });


  /* Colour pickers — each .aur-picker auto-instantiates. */

  function initPicker(root) {
    var varName  = root.getAttribute('data-aur-target');
    var def      = (root.getAttribute('data-aur-default') || '#000000').toLowerCase();
    var alphaRaw = root.getAttribute('data-aur-alpha');
    var alpha    = alphaRaw ? parseFloat(alphaRaw) : null;

    var swatch  = root.querySelector('.aur-picker__swatch');
    var pop     = root.querySelector('.aur-picker__pop');
    var sv      = root.querySelector('.aur-picker__sv');
    var cursor  = root.querySelector('.aur-picker__sv-cursor');
    var hue     = root.querySelector('.aur-picker__hue');
    var hexIn   = root.querySelector('.aur-picker__hex');

    var stored = savedOverrides[varName];
    var current = def;
    if (stored) {
      if (alpha !== null) {
        var conv = rgbaToHex(stored);
        if (conv) current = conv;
      } else {
        current = stored;
      }
    }
    current = current.toLowerCase();

    var hsv = hexToHsv(current);

    function writeValue(hex) {
      var write = (alpha !== null) ? rgbaStr(hex, alpha) : hex;
      applyVar(varName, write);
      swatch.style.color = hex;
    }
    function commitValue(hex) {
      var write = (alpha !== null) ? rgbaStr(hex, alpha) : hex;
      var defWrite = (alpha !== null) ? rgbaStr(def, alpha) : def;
      hexIn.value = hex;
      if (write.toLowerCase() === defWrite.toLowerCase()) setOverride(varName, null);
      else setOverride(varName, write);
    }

    var pendingHex = null;
    var rafScheduled = false;
    function schedulePreview(hex) {
      pendingHex = hex;
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(function () {
        rafScheduled = false;
        if (pendingHex) { writeValue(pendingHex); pendingHex = null; }
      });
    }

    function syncSv() {
      sv.style.backgroundColor = 'hsl(' + Math.round(hsv.h) + ', 100%, 50%)';
      cursor.style.left = (hsv.s * 100) + '%';
      cursor.style.top  = ((1 - hsv.v) * 100) + '%';
      hue.value = Math.round(hsv.h);
      hexIn.value = hsvToHex(hsv.h, hsv.s, hsv.v);
    }

    syncSv();
    writeValue(current);

    swatch.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !root.classList.contains('is-open');
      document.querySelectorAll('.aur-picker.is-open').forEach(function (p) {
        if (p !== root) {
          p.classList.remove('is-open');
          var pp = p.querySelector('.aur-picker__pop');
          if (pp) pp.hidden = true;
          var ps = p.querySelector('.aur-picker__swatch');
          if (ps) ps.setAttribute('aria-expanded', 'false');
        }
      });
      root.classList.toggle('is-open', willOpen);
      pop.hidden = !willOpen;
      swatch.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    var svRect = null;
    var svDragging = false;

    function svFromPointer(e) {
      if (!svRect) return;
      var x = clamp((e.clientX - svRect.left) / svRect.width, 0, 1);
      var y = clamp((e.clientY - svRect.top)  / svRect.height, 0, 1);
      hsv.s = x;
      hsv.v = 1 - y;
      cursor.style.left = (x * 100) + '%';
      cursor.style.top  = (y * 100) + '%';
      schedulePreview(hsvToHex(hsv.h, hsv.s, hsv.v));
    }

    sv.addEventListener('pointerdown', function (e) {
      svDragging = true;
      svRect = sv.getBoundingClientRect();
      sv.setPointerCapture(e.pointerId);
      document.documentElement.classList.add('aur-is-dragging');
      svFromPointer(e);
    });
    sv.addEventListener('pointermove', function (e) { if (svDragging) svFromPointer(e); });
    function endSvDrag(e) {
      if (!svDragging) return;
      svDragging = false;
      try { sv.releasePointerCapture(e.pointerId); } catch (err) {}
      svRect = null;
      document.documentElement.classList.remove('aur-is-dragging');
      commitValue(hsvToHex(hsv.h, hsv.s, hsv.v));
    }
    sv.addEventListener('pointerup', endSvDrag);
    sv.addEventListener('pointercancel', endSvDrag);

    hue.addEventListener('pointerdown', function () { document.documentElement.classList.add('aur-is-dragging'); });
    hue.addEventListener('input', function () {
      hsv.h = parseFloat(hue.value);
      sv.style.backgroundColor = 'hsl(' + Math.round(hsv.h) + ', 100%, 50%)';
      schedulePreview(hsvToHex(hsv.h, hsv.s, hsv.v));
    });
    hue.addEventListener('change', function () {
      document.documentElement.classList.remove('aur-is-dragging');
      commitValue(hsvToHex(hsv.h, hsv.s, hsv.v));
    });

    function commitHex() {
      var v = hexIn.value.trim().toLowerCase();
      if (v[0] !== '#') v = '#' + v;
      if (!/^#[0-9a-f]{6}$/.test(v)) { hexIn.value = hsvToHex(hsv.h, hsv.s, hsv.v); return; }
      hsv = hexToHsv(v);
      syncSv();
      writeValue(v);
      commitValue(v);
    }
    hexIn.addEventListener('blur', commitHex);
    hexIn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commitHex(); hexIn.blur(); }
    });

    return {
      varName: varName,
      reset: function () {
        hsv = hexToHsv(def);
        syncSv();
        clearVar(varName);
        swatch.style.color = def;
      }
    };
  }

  var pickerInstances = [];
  pickers.forEach(function (p) { pickerInstances.push(initPicker(p)); });

  // Outside-click closes any open picker.
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.aur-picker.is-open').forEach(function (p) {
      if (!p.contains(e.target)) {
        p.classList.remove('is-open');
        var pp = p.querySelector('.aur-picker__pop');
        if (pp) pp.hidden = true;
        var ps = p.querySelector('.aur-picker__swatch');
        if (ps) ps.setAttribute('aria-expanded', 'false');
      }
    });
  });


  /* ---------- Sliders (Stage 8) ----------
     Each [data-aur-slider] is a generic numeric control. data-attrs:
       data-aur-target=<css var>   — which :root variable to write
       data-aur-default=<number>   — fallback / reset value
       data-aur-min, data-aur-max, data-aur-step — range
       data-aur-unit=<string>      — appended to the displayed value (e.g. 'px')
       data-aur-precision=<int>    — decimal places in the displayed value
       data-aur-format=<template>  — optional. Template like 'rgba(20, 16, 32, {value})'.
                                     If present, the substituted string is what's
                                     written to the CSS var (not the bare number).
     Writes throttled to rAF; commits to localStorage on `change` only. */

  function initSlider(root) {
    var varName   = root.getAttribute('data-aur-target');
    var def       = root.getAttribute('data-aur-default');
    var unit      = root.getAttribute('data-aur-unit') || '';
    var displayUnit = root.hasAttribute('data-aur-display-unit')
      ? root.getAttribute('data-aur-display-unit')
      : unit;
    var precision = parseInt(root.getAttribute('data-aur-precision') || '0', 10);
    var format    = root.getAttribute('data-aur-format') || '';
    var input     = root.querySelector('.aur-slider__input');
    var valueEl   = root.querySelector('.aur-slider__value');

    function formatDisplay(n) {
      return parseFloat(n).toFixed(precision) + displayUnit;
    }
    function cssValueFor(n) {
      // Trim trailing zeros in the bare number for cleaner CSS strings,
      // unless a format template wants the precise value.
      var num = parseFloat(n).toFixed(precision);
      if (format) return format.replace('{value}', num);
      return num + unit;
    }
    function isDefault(n) {
      return parseFloat(n).toFixed(precision) === parseFloat(def).toFixed(precision);
    }

    // Initial value: saved override (if any) â†’ default. We can't easily
    // round-trip a format-template value back into the slider, so for
    // formatted sliders (tile bg opacity) we trust the saved numeric value
    // is stored separately. To keep the implementation simple we store
    // the bare slider number under a sidecar key `<varName>::slider`.
    var sliderStoreKey = varName + '::slider';
    var startVal = def;
    if (savedOverrides && Object.prototype.hasOwnProperty.call(savedOverrides, sliderStoreKey)) {
      startVal = savedOverrides[sliderStoreKey];
    } else if (savedOverrides && !format && Object.prototype.hasOwnProperty.call(savedOverrides, varName)) {
      // Direct value (e.g. '24px') — strip unit.
      var raw = String(savedOverrides[varName]);
      if (unit && raw.slice(-unit.length) === unit) raw = raw.slice(0, -unit.length);
      var parsed = parseFloat(raw);
      if (isFinite(parsed)) startVal = parsed;
    }
    input.value = startVal;
    valueEl.textContent = formatDisplay(startVal);
    // Apply on boot so persisted overrides take effect from the first frame.
    if (!isDefault(startVal)) applyVar(varName, cssValueFor(startVal));

    var pendingVal = null;
    var rafScheduled = false;
    function schedulePreview(n) {
      pendingVal = n;
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(function () {
        rafScheduled = false;
        if (pendingVal !== null) {
          applyVar(varName, cssValueFor(pendingVal));
          valueEl.textContent = formatDisplay(pendingVal);
          pendingVal = null;
        }
      });
    }

    function commit(n) {
      if (isDefault(n)) {
        setOverride(varName, null);
        setOverride(sliderStoreKey, null);
        clearVar(varName);
      } else {
        if (format) {
          setOverride(varName, cssValueFor(n));
          setOverride(sliderStoreKey, parseFloat(n).toFixed(precision));
        } else {
          setOverride(varName, cssValueFor(n));
        }
      }
    }

    input.addEventListener('input', function () { schedulePreview(input.value); });
    input.addEventListener('change', function () { commit(input.value); });

    return {
      varName: varName,
      reset: function () {
        input.value = def;
        valueEl.textContent = formatDisplay(def);
        clearVar(varName);
      }
    };
  }

  var sliderInstances = [];
  document.querySelectorAll('[data-aur-slider]').forEach(function (s) {
    sliderInstances.push(initSlider(s));
  });


  /* Reset */

  reset.addEventListener('click', function () {
    try { localStorage.removeItem(STORAGE_OVERRIDES); } catch (e) {}
    fontSelects.forEach(function (sel) {
      clearVar(sel.getAttribute('data-aur-font'));
      sel.value = SYSTEM_STACK;
    });
    pickerInstances.forEach(function (p) { p.reset(); });
    sliderInstances.forEach(function (s) { s.reset(); });
  });


  /* Copy JSON */

  copy.addEventListener('click', function () {
    var blob = JSON.stringify(getOverrides(), null, 2);
    var done = function () {
      var original = copy.textContent;
      copy.textContent = 'Copied';
      copy.classList.add('is-success');
      setTimeout(function () {
        copy.textContent = original;
        copy.classList.remove('is-success');
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(blob).then(done, function () { /* swallow */ });
    } else {
      var ta = document.createElement('textarea');
      ta.value = blob;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });
  } // end dev-only block


  /* Scroll position: always start every page at the top. We opt out of
     the browser's automatic scroll-restoration (which can otherwise
     put you back where you last were on the same URL) and clear any
     saved positions from the previous per-path restore feature so a
     returning visitor isn't dumped at the bottom of a page they
     scrolled through earlier. */

  (function resetScrollOnLoad() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    /* One-time cleanup of the old sessionStorage keys (`auroraScroll:...`)
       that were written by the removed initScrollRestore feature. */
    try {
      for (var i = sessionStorage.length - 1; i >= 0; i--) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf('auroraScroll:') === 0) sessionStorage.removeItem(k);
      }
    } catch (e) {}

    if (location.hash) return; // let the browser jump to the anchor

    function toTop() {
      var mainEl = document.querySelector('.aur-main');
      var isMobile = window.matchMedia('(max-width: 800px)').matches;
      if (!isMobile && mainEl) mainEl.scrollTop = 0;
      else window.scrollTo(0, 0);
    }
    toTop();
    /* Re-apply for a couple of frames to defeat late layout shifts
       (lazy images, animated entrance staggers). */
    requestAnimationFrame(function () {
      toTop();
      requestAnimationFrame(toTop);
    });
  })();


  /* ---------- Lite YouTube embed (always runs) ----------
     Each .aur-video-lite poster button is replaced by a real YouTube
     iframe on click. autoplay=1 is appended so the video starts
     immediately (autoplay is allowed because the click is a user
     gesture). Saves a heavy 3rd-party iframe on every video page
     until the user actually wants to watch. */

  (function initLiteVideo() {
    var btns = document.querySelectorAll('.aur-video-lite');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-aur-video-src');
        var title = btn.getAttribute('data-aur-video-title') || 'Video';
        if (!src) return;
        var url = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1';
        var iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = title;
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.position = 'absolute';
        iframe.style.inset = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        if (btn.parentNode) btn.parentNode.replaceChild(iframe, btn);
      }, { once: true });
    });
  })();


  /* ---------- Widont — kill single-word last lines (always runs) ----------
     For every prose paragraph and list item, locate the last text node
     and replace the whitespace before its final word with a non-breaking
     space. The last two words stay bound together, so no paragraph can
     end with a single orphan word on its own line. */

  (function initWidont() {
    var sel = [
      '.aur-step__prose p',
      '.aur-step__prose li',
      '.aur-info-card__prose p',
      '.aur-info-card__prose li',
      '.aur-prose p',
      '.aur-prose li',
      '.aur-description'
    ].join(', ');

    var nodes = document.querySelectorAll(sel);
    nodes.forEach(function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      var last = null;
      while (walker.nextNode()) {
        var v = walker.currentNode.nodeValue;
        if (v && v.trim()) last = walker.currentNode;
      }
      if (!last) return;
      // Replace the LAST whitespace run before the final word with U+00A0.
      // Leave any trailing whitespace/punctuation in place.
      var m = last.nodeValue.match(/^([\s\S]*?)(\s+)(\S+)(\s*)$/);
      if (m) {
        last.nodeValue = m[1] + '\u00a0' + m[3] + m[4];
      }
    });
  })();


  /* Page-nav visibility: the previous scroll-driven fade was fragile
     (depended on the scroll container and viewport dimensions) and
     often left the Back/Continue buttons faint. CSS now shows them
     at full opacity in-flow; no JS needed. */


  /* ---------- Global GIF pause/resume (always runs) ----------
     GIFs have no pause API. The well-known workaround: capture the
     current frame to a <canvas> sibling and hide the original <img>;
     to resume, remove the canvas and unhide the img (the browser
     restarts the GIF). State persists via localStorage.auroraPaused.
     Default state follows prefers-reduced-motion. */

  (function initAnimationPause() {
    var STORAGE_KEY = 'auroraPaused';
    var btn = document.querySelector('[data-aur-anim-toggle]');
    if (!btn) return;

    var label = btn.querySelector('.aur-anim-toggle__label');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var paused = stored === null ? reduce : stored === '1';
    var userToggledGlobalAnimations = false;

    var imgSel = '.aur-step__media-img, .aur-media-tile__img';

    function isGifImage(img) {
      if (!img || img.tagName !== 'IMG') return false;
      var src = (img.currentSrc || img.src || '').split('?')[0].split('#')[0].toLowerCase();
      return src.slice(-4) === '.gif';
    }

    function freezeImg(img) {
      if (img._aurFrozen) return;
      // If the image isn't loaded yet, defer until it is. Re-check the
      // paused flag at fire time — the user may have un-paused while
      // we were waiting.
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener('load', function onLoad() {
          if (paused) freezeImg(img);
        }, { once: true });
        return;
      }
      var canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.className = 'aur-anim-frozen';
      canvas.setAttribute('aria-label', img.alt || 'Paused image');
      canvas.title = 'Click to resume animations';
      try {
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
      } catch (e) {
        // Cross-origin or unsupported — bail silently.
        return;
      }
      img.style.display = 'none';
      img.parentNode.insertBefore(canvas, img);
      img._aurFrozen = canvas;
      // Clicking the frozen frame resumes everything and re-opens
      // the lightbox-style interaction on the live GIF.
      canvas.addEventListener('click', function () {
        paused = false;
        try { localStorage.setItem(STORAGE_KEY, '0'); } catch (e) {}
        applyState();
      });
    }

    function unfreezeImg(img) {
      if (!img._aurFrozen) return;
      if (img._aurFrozen.parentNode) img._aurFrozen.parentNode.removeChild(img._aurFrozen);
      img._aurFrozen = null;
      img.style.display = '';
    }

    function applyState() {
      var els = document.querySelectorAll(imgSel);
      els.forEach(function (el) {
        if (el.tagName === 'VIDEO') {
          if (paused) {
            el.pause();
          } else if (userToggledGlobalAnimations) {
            if (window.__aurHydrateVideo) window.__aurHydrateVideo(el);
            el.play().catch(function () {});
          }
        } else {
          /* Only animated GIFs need the canvas freeze trick. Static PNG/JPG
             screenshots should stay as real images so their colours remain
             clean and browser colour management is left alone. */
          if (isGifImage(el)) {
            if (paused) freezeImg(el); else unfreezeImg(el);
          } else {
            unfreezeImg(el);
          }
        }
      });
      /* Surface the paused state on <html> so decorative animations
         elsewhere (starfield twinkle + parallax warp, etc.) can be
         CSS-paused. Using a data attribute keeps the contract
         declarative — anything that animates can opt in by scoping
         under html[data-aur-paused="1"]. */
      if (paused) document.documentElement.setAttribute('data-aur-paused', '1');
      else        document.documentElement.removeAttribute('data-aur-paused');
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
      if (label) label.textContent = paused ? 'Resume animations' : 'Pause animations';
    }

    btn.addEventListener('click', function () {
      userToggledGlobalAnimations = true;
      paused = !paused;
      try { localStorage.setItem(STORAGE_KEY, paused ? '1' : '0'); } catch (e) {}
      applyState();
    });

    applyState();
  })();


  /* ---------- Per-tile pause/play button (always runs) ----------
     Floats a small play/pause control in the top-right corner of
     every media tile and step-media element. Hidden until the user
     hovers the tile (or until the media is paused — so a paused
     tile always shows the play button). Click toggles the play
     state of just THAT media; the global pause toggle in the FAB
     still controls everything at once. */

  (function initPerTilePause() {
    var medias = document.querySelectorAll('.aur-media-tile__img, .aur-step__media-img');
    if (!medias.length) return;

    function makeBtn() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'aur-media-pause';
      btn.setAttribute('aria-label', 'Pause animation');
      btn.innerHTML =
        '<svg class="aur-media-pause__icon aur-media-pause__icon--pause" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>' +
        '<svg class="aur-media-pause__icon aur-media-pause__icon--play" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      return btn;
    }

    /* Per-tile freeze/unfreeze for <img> GIFs. Mirrors the global
       pause's canvas trick but uses a separate state key so it
       doesn't tangle with the global toggle. Optional onResumeClick
       attaches a click listener to the canvas so clicking the frozen
       frame resumes — the canvas replaces the <img> in the DOM and
       inherits no listeners. Trade-off: if a user globally pauses
       then resumes one tile here, the other tiles stay paused
       (global state is unaware). Acceptable. */
    function freezePerTile(img, onResumeClick) {
      if (img._aurTilePaused) return false;
      if (!img.complete || !img.naturalWidth) return false;
      var canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.className = 'aur-anim-frozen';
      canvas.setAttribute('aria-label', img.alt || 'Paused image');
      canvas.style.cursor = 'pointer';
      try { canvas.getContext('2d').drawImage(img, 0, 0); }
      catch (e) { return false; }
      img.style.display = 'none';
      img.parentNode.insertBefore(canvas, img);
      img._aurTilePaused = canvas;
      if (typeof onResumeClick === 'function') {
        canvas.addEventListener('click', function (e) {
          e.stopPropagation();
          onResumeClick();
        });
      }
      return true;
    }
    function unfreezePerTile(img) {
      if (!img._aurTilePaused) return;
      if (img._aurTilePaused.parentNode) {
        img._aurTilePaused.parentNode.removeChild(img._aurTilePaused);
      }
      img._aurTilePaused = null;
      img.style.display = '';
    }

    function isGifImage(media) {
      if (media.tagName !== 'IMG') return false;
      var src = (media.currentSrc || media.src || '').split('?')[0].split('#')[0].toLowerCase();
      return src.slice(-4) === '.gif';
    }

    function isAnimatedMedia(media) {
      return media.tagName === 'VIDEO' || isGifImage(media);
    }

    medias.forEach(function (media) {
      var originalParent = media.parentElement;
      if (!originalParent) return;
      var parent = originalParent;
      if (!parent.classList.contains('aur-media-control-wrap')) {
        parent = document.createElement('span');
        parent.className = 'aur-media-control-wrap';
        originalParent.insertBefore(parent, media);
        parent.appendChild(media);
      }
      var canPause = isAnimatedMedia(media);
      /* Anchor the button absolutely to the immediate parent of the
         media. .aur-media-tile__body already has position: relative;
         .aur-step__media is static — bump it to relative just for
         this one. */
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      /* Glow halo as a separate sibling element behind the button.
         Pseudo-elements / box-shadow / drop-shadow / outline all
         failed to render reliably given the button's
         backdrop-filter compositing on some browsers; a plain div
         with its own animated background-color + blur filter is the
         most foolproof option. */
      var halo = null;
      var btn = null;
      if (canPause) {
        halo = document.createElement('div');
        halo.className = 'aur-media-pause-halo';
        parent.appendChild(halo);

        btn = makeBtn();
        parent.appendChild(btn);
      }

      /* Corner expand button — opens the media in the lightbox at full
         size. Images already have data-aur-lightbox click-anywhere
         behaviour, so for them the corner button is a duplicate
         affordance (also handy when the media is small and the user
         doesn't want to "click the tiny thumbnail"). For videos this
         is the ONLY way to expand, since click-on-video continues to
         toggle pause. */
      var expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'aur-media-expand';
      expand.setAttribute('aria-label', 'View larger');
      /* The icon glyph is loaded as an SVG-as-mask inside this span
         (see .aur-media-expand__icon in CSS), so the visible glyph
         displays the slowly rotating yellow/purple/red conic gradient
         instead of a flat stroke colour. */
      expand.innerHTML = '<span class="aur-media-expand__icon" aria-hidden="true"></span>';
      parent.appendChild(expand);

      /* Helper — same payload-building logic is needed by both the
         corner expand button and the double-click-to-expand on the
         media itself. Pulled out to avoid duplication. */
      function openInLightbox() {
        if (media.tagName === 'VIDEO') {
          var sources = Array.prototype.map.call(
            media.querySelectorAll('source'),
            function (s) {
              return {
                src: s.getAttribute('src') || s.getAttribute('data-src') || s.src,
                type: s.type
              };
            }
          ).filter(function (s) { return !!s.src; });
          /* Inline videos don't carry alt text — use any aria-label
             from the surrounding figcaption if present. */
          var fig = media.closest('figure');
          var capEl = fig ? fig.querySelector('figcaption') : null;
          var label = capEl ? capEl.textContent.trim() : '';
          document.dispatchEvent(new CustomEvent('aur:lightbox-video', {
            detail: { sources: sources, alt: label }
          }));
        } else {
          document.dispatchEvent(new CustomEvent('aur:lightbox-image', {
            detail: {
              src: media.currentSrc || media.src,
              alt: media.alt || ''
            }
          }));
        }
      }

      expand.addEventListener('click', function (e) {
        e.stopPropagation();
        openInLightbox();
      });

      function update(isPaused) {
        if (!btn || !halo) return;
        btn.classList.toggle('is-paused', isPaused);
        halo.classList.toggle('is-active', isPaused);
        btn.setAttribute('aria-label', isPaused ? 'Resume animation' : 'Pause animation');
      }

      function toggle() {
        if (!canPause) return;
        if (media.tagName === 'VIDEO') {
          if (window.__aurHydrateVideo) window.__aurHydrateVideo(media);
          if (media.paused) {
            media.play().catch(function () {});
            update(false);
          } else {
            media.pause();
            update(true);
          }
        } else {
          if (media._aurTilePaused) { unfreezePerTile(media); update(false); }
          else                       { freezePerTile(media, toggle); update(true); }
        }
      }

      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          toggle();
        });
      }

      /* Single click on the media toggles pause/play; double click
         opens it in the lightbox. To distinguish the two, the click
         handler defers `toggle()` by 250ms — if a `dblclick` arrives
         within that window the timer is cancelled, so a double-click
         opens the lightbox cleanly without flickering through a
         pause-then-resume first. Tradeoff: pause feels ~250ms
         slower than a true single-click handler, but the dual
         affordance was explicitly requested. */
      media.style.cursor = canPause ? 'pointer' : 'zoom-in';
      var clickTimer = null;
      if (canPause) {
        media.addEventListener('click', function (e) {
          e.stopPropagation();
          if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
          clickTimer = setTimeout(function () {
            clickTimer = null;
            toggle();
          }, 250);
        });
      }
      media.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        openInLightbox();
      });

      /* GIFs should not animate until the user asks them to. Freeze them
         once the first frame is available, then use the existing per-tile
         play button/click handler to resume. */
      if (isGifImage(media)) {
        if (media.complete && media.naturalWidth) {
          update(freezePerTile(media, toggle));
        } else {
          media.addEventListener('load', function () {
            update(freezePerTile(media, toggle));
          }, { once: true });
          update(true);
        }
      } else if (canPause) {
        if (media.tagName === 'VIDEO') update(media.paused);
        else                            update(!!media._aurTilePaused);
      }
    });
  })();


  /* ---------- Consolidated FAB menu (always runs) ----------
     One floating button at bottom-left replaces the legacy trio
     (.aur-anim-toggle, .aur-prefs-toggle, .aur-dev-toggle). Those
     buttons are still in the DOM — hidden by CSS — so each FAB menu
     item simply dispatches a click on the matching legacy button
     and reuses the existing JS handlers without modification.

     The "Pause animations" menu item mirrors the legacy anim toggle's
     aria-pressed state so the icon + label swap stays in sync after
     any state change (click, system reduced-motion change, etc.). */

  (function initFab() {
    var fab  = document.getElementById('aur-fab');
    var menu = document.getElementById('aur-fab-menu');
    if (!fab || !menu) return;

    var animBtn      = document.querySelector('[data-aur-anim-toggle]');
    var animMenuItem = menu.querySelector('[data-aur-fab-action="anim"]');

    function syncAnim() {
      if (animBtn && animMenuItem) {
        animMenuItem.setAttribute(
          'aria-pressed',
          animBtn.getAttribute('aria-pressed') || 'false'
        );
      }
    }
    syncAnim();
    if (animBtn && 'MutationObserver' in window) {
      new MutationObserver(syncAnim).observe(animBtn, {
        attributes: true,
        attributeFilter: ['aria-pressed']
      });
    }

    function openMenu() {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
    }
    function isOpen() { return fab.getAttribute('aria-expanded') === 'true'; }

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen()) closeMenu(); else openMenu();
    });

    /* Click-outside closes the menu. The menu itself is .contains(target);
       the FAB has its own handler that already toggled, so we exclude it. */
    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (menu.contains(e.target) || fab.contains(e.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        closeMenu();
        fab.focus();
      }
    });

    /* Delegate menu item clicks â†’ dispatch a click on the legacy
       hidden button matching the action. Menu always closes after. */
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('[data-aur-fab-action]');
      if (!item) return;
      var action = item.getAttribute('data-aur-fab-action');
      closeMenu();
      var target = null;
      if (action === 'prefs') target = document.getElementById('aur-prefs-toggle');
      else if (action === 'anim') target = animBtn;
      else if (action === 'dev')  target = document.getElementById('aur-dev-toggle');
      if (target) target.click();
    });
  })();

})();


/* ---------- Assigned Mentees interactive example ----------
   Used on Accessing Your Mentees. The markup contains both panels so
   the guidance remains readable without JavaScript; this only swaps
   the visible explanation when a table link is clicked. */
(function () {
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-aur-mentee-picker]'));
  if (!roots.length) return;

  roots.forEach(function (root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-aur-mentee-record]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-aur-mentee-panel]'));
    var title = root.querySelector('.aur-mentee-picker__selected-title');
    var type = root.querySelector('.aur-mentee-picker__selected-type');
    var labels = {
      client: {
        title: 'Client',
        type: 'Universal account'
      },
      assigned: {
        title: 'Assigned Mentee Name',
        type: 'Your assigned mentee record'
      }
    };

    function show(key) {
      var selected = labels[key];
      if (!selected) return;
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-aur-mentee-record') === key));
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-aur-mentee-panel') !== key;
      });
      if (title) title.textContent = selected.title;
      if (type) type.textContent = selected.type;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        show(button.getAttribute('data-aur-mentee-record'));
      });
    });
  });
})();


/* ---------- Record difference guide ----------
   Used on Understanding the Difference. Selects one focused answer for
   the task the mentor is trying to complete. */
(function () {
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-aur-record-guide]'));
  if (!roots.length) return;

  var labels = {
    client: {
      context: 'Mentee Profile',
      title: 'Client',
      summary: 'Use this for shared, general information about the young person.',
      note: 'Your own session notes and history are under Assigned Mentee Name.'
    },
    assigned: {
      context: 'Mentee Profile',
      title: 'Assigned Mentee Name',
      summary: 'Use this for your mentor-specific record, session notes, and history.',
      note: 'This is the one to use when you need notes linked to your work with the mentee.'
    },
    calendar: {
      context: 'Calendar Event',
      title: 'Date, time, and who with',
      summary: 'Use this to check, move, or delete the session time.',
      note: 'This helps you manage the calendar, but it does not record what happened.'
    },
    service: {
      context: 'Service Appointment',
      title: 'What happened in the session',
      summary: 'Use this to confirm attendance, complete the wrap up, add notes, and update status.',
      note: 'This is the record used for attendance tracking, invoicing, and payment.'
    }
  };

  roots.forEach(function (root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-record-choice]'));
    var context = root.querySelector('[data-record-context]');
    var title = root.querySelector('[data-record-title]');
    var summary = root.querySelector('[data-record-summary]');
    var note = root.querySelector('[data-record-note]');

    function show(key) {
      var selected = labels[key] || labels.client;
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-record-choice') === key));
      });
      if (context) context.textContent = selected.context;
      if (title) title.textContent = selected.title;
      if (summary) summary.textContent = selected.summary;
      if (note) note.textContent = selected.note;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        show(button.getAttribute('data-record-choice'));
      });
    });

    show('client');
  });
})();


/* ---------- Nav preview component (how-to-navigate page) ----------
   Toggles which panel is visible based on which top-nav button is
   clicked. No-op on every other page. */
(function () {
  var root = document.querySelector('.mj-navprev');
  if (!root) return;

  var buttons = Array.prototype.slice.call(root.querySelectorAll('.mj-navprev__nav-button'));
  var panels  = Array.prototype.slice.call(root.querySelectorAll('.mj-navprev__panel'));

  function showPanel(name) {
    buttons.forEach(function (button) {
      button.setAttribute('aria-expanded', String(button.dataset.mjTarget === name));
    });
    panels.forEach(function (panel) {
      panel.classList.toggle('is-active', panel.dataset.mjPanel === name);
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      showPanel(button.dataset.mjTarget);
    });
  });
})();


/* ---------- Delete Series visualizer ----------
   Used on Using Calendar Events. Click or hover an option to preview
   whether Salesforce removes one event or the selected event plus all
   following future events. */
(function () {
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-aur-delete-demo]'));
  if (!roots.length) return;

  var captions = {
    none: 'Preview: no delete choice is selected, so all sessions are still visible.',
    single: 'Preview: only the Wednesday event is removed. Monday and Tuesday stay, and the future sessions stay.',
    following: 'Preview: Wednesday and the following sessions are removed. Monday and Tuesday stay because they are historic events.'
  };

  roots.forEach(function (root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-delete-mode]'));
    var caption = root.querySelector('[data-delete-caption]');
    var active = root.getAttribute('data-delete-preview') || 'single';

    function show(mode, commit) {
      if (!captions[mode]) return;
      root.setAttribute('data-delete-preview', mode);
      if (caption) caption.textContent = captions[mode];
      if (commit) active = mode;
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-delete-mode') === active));
      });
    }

    buttons.forEach(function (button) {
      var mode = button.getAttribute('data-delete-mode');
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        show(mode, true);
      });
      button.addEventListener('mouseenter', function () { show(mode, false); });
      button.addEventListener('focus', function () { show(mode, false); });
      button.addEventListener('mouseleave', function () { show(active, false); });
      button.addEventListener('blur', function () { show(active, false); });
    });

    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-delete-mode]')) return;
      show('none', true);
    });

    show(active, true);
  });
})();
