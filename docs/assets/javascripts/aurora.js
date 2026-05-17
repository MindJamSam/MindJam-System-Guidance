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

    var noChange = Math.abs(prev - pct) < 0.5;

    requestAnimationFrame(function () {
      fill.style.transition = 'width var(--aur-dur-large) var(--aur-ease-out-soft)';
      fill.style.width = pct + '%';

      if (!noChange) {
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
    var imgs = document.querySelectorAll('.aur-media-tile__img');
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

  (function initEntrance() {
    var main = document.querySelector('.aur-main');
    if (!main) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { main.classList.add('is-revealed'); });
    });
  })();


  /* ---------- §7.3 3D tilt on .aur-tile.is-tiltable ----------
     Lightweight perspective rotate. Pointer position normalised to
     [-1, 1] across the tile; multiplied by max-degree (5deg) for the
     rotateX/Y. rAF-throttled so a high-DPI mouse doesn't overwhelm
     the compositor. Skipped under prefers-reduced-motion. */

  (function initTilt() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    var MAX_DEG = 5;
    var tiles = document.querySelectorAll('.aur-tile.is-tiltable');

    tiles.forEach(function (tile) {
      var rect = null;
      var pendingX = 0, pendingY = 0;
      var rafScheduled = false;

      function paint() {
        rafScheduled = false;
        tile.style.transform =
          'perspective(900px) rotateX(' + pendingX.toFixed(2) + 'deg) rotateY(' + pendingY.toFixed(2) + 'deg)';
      }

      tile.addEventListener('pointerenter', function () {
        rect = tile.getBoundingClientRect();
      });
      tile.addEventListener('pointermove', function (e) {
        if (!rect) rect = tile.getBoundingClientRect();
        var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
        // Rotate around the axis perpendicular to motion: x-axis tilt
        // is driven by vertical position, y-axis tilt by horizontal.
        pendingX = -ny * MAX_DEG;
        pendingY =  nx * MAX_DEG;
        if (!rafScheduled) { rafScheduled = true; requestAnimationFrame(paint); }
      });
      tile.addEventListener('pointerleave', function () {
        rect = null;
        tile.style.transform = '';
      });
    });
  })();


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
      });
    });
  })();


  /* ---------- §7.16 Lightbox ----------
     Single instance in the DOM (rendered by main.html's
     {% block lightbox %}). Any <img data-aur-lightbox> opens it.
     Esc / backdrop click / close-button click closes it.
     Focus moves to the close button on open and back to the
     triggering image on close. Body scroll is locked while open. */

  (function initLightbox() {
    var box     = document.getElementById('aur-lightbox');
    if (!box) return;
    var img     = document.getElementById('aur-lightbox-img');
    var caption = document.getElementById('aur-lightbox-caption');
    var close   = document.getElementById('aur-lightbox-close');
    var triggers = document.querySelectorAll('[data-aur-lightbox]');
    if (!triggers.length) return;

    var lastFocus = null;
    var prevBodyOverflow = '';

    function open(src, alt) {
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt || '';
      if (caption) caption.textContent = alt || '';
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

    function dismiss() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = prevBodyOverflow;
      // Wait for the opacity transition to finish before hiding.
      setTimeout(function () {
        box.hidden = true;
        img.removeAttribute('src');
        if (lastFocus && typeof lastFocus.focus === 'function') {
          lastFocus.focus();
        }
        lastFocus = null;
      }, 220);
    }

    triggers.forEach(function (el) {
      // Keyboard-accessible: images aren't focusable by default. Make
      // them so, and react to Enter/Space.
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-haspopup', 'dialog');
      var alt = el.getAttribute('alt') || '';
      el.setAttribute('aria-label', alt ? ('View larger: ' + alt) : 'View larger image');

      el.addEventListener('click', function () {
        open(el.currentSrc || el.src, alt);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(el.currentSrc || el.src, alt);
        }
      });
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

    // Click on the step's title toggles its expansion. Only active in
    // compact mode (in full mode titles are non-interactive and bodies
    // are always visible).
    steps.forEach(function (step) {
      var title = step.querySelector('.aur-step__title');
      if (!title) return;

      function toggleStep() {
        var willExpand = !step.classList.contains('is-expanded');
        step.classList.toggle('is-expanded');
        // Hash mirrors the step the user just opened; clearing it when
        // they collapse keeps the URL in sync with what they see.
        setHash(willExpand ? step.id : null);
      }

      title.addEventListener('click', function (e) {
        if (!card.classList.contains('is-compact')) return;
        // Don't toggle if the click was on a link or button inside.
        if (e.target.closest('a, button, [data-aur-lightbox]')) return;
        toggleStep();
      });
      // Keyboard support: Enter/Space on a focused title toggles too.
      title.setAttribute('tabindex', '0');
      title.setAttribute('role', 'button');
      title.addEventListener('keydown', function (e) {
        if (!card.classList.contains('is-compact')) return;
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

      // Apply any saved state (overrides template default).
      if (Object.prototype.hasOwnProperty.call(saved, slug)) {
        section.classList.toggle('is-open', !!saved[slug]);
        heading.setAttribute('aria-expanded', saved[slug] ? 'true' : 'false');
      }

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


  /* ---------- Dev menu (guarded on html[data-aur-dev="1"]) ---------- */

  if (document.documentElement.getAttribute('data-aur-dev') !== '1') return;

  /* Constants */

  var SYSTEM_STACK = '-apple-system, "Segoe UI", "Inter", system-ui, sans-serif';
  var FONT_PRESETS = [
    { label: 'System',         stack: SYSTEM_STACK,                            google: null },
    { label: 'Inter',          stack: '"Inter", ' + SYSTEM_STACK,              google: 'Inter:wght@400;600;700' },
    { label: 'Geist',          stack: '"Geist", ' + SYSTEM_STACK,              google: 'Geist:wght@400;600;700' },
    { label: 'Roboto',         stack: '"Roboto", ' + SYSTEM_STACK,             google: 'Roboto:wght@400;700' },
    { label: 'Lora',           stack: '"Lora", Georgia, serif',                google: 'Lora:wght@400;600;700' },
    { label: 'IBM Plex',       stack: '"IBM Plex Sans", ' + SYSTEM_STACK,      google: 'IBM+Plex+Sans:wght@400;600;700' },
    // Self-hosted dyslexia-friendly font; @font-face declared in aurora.css.
    // No google: source — file is shipped under docs/assets/fonts/.
    { label: 'OpenDyslexic',   stack: '"OpenDyslexic", ' + SYSTEM_STACK,       google: null }
  ];

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
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + googlePath + '&display=swap';
    document.head.appendChild(link);
  }

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
    var d = max - min;
    var h = 0;
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
    var c = v * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = v - c;
    var r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }


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

    // Initial value: saved override (if any) → default. We can't easily
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




  /* ---------- Scroll-position restore on refresh (always runs) ----------
     Browser's native scroll-restoration is unreliable when content
     lazy-loads or layout shifts after first paint (animated entrance
     stagger, lazy GIFs, etc.). We disable the browser's default and
     handle it ourselves via sessionStorage, keyed per path. Re-applies
     for several frames after load to catch height shifts. URL hash
     deeplinks (#step-N) take precedence and skip the restore. */

  (function initScrollRestore() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var KEY = 'auroraScroll:' + location.pathname;
    // .aur-main is the actual scroll container (body is fixed-height
    // overflow:hidden — see CSS). On mobile, body scrolls instead.
    var mainEl = document.querySelector('.aur-main');
    var isMobile = window.matchMedia('(max-width: 800px)').matches;
    var scroller = (!isMobile && mainEl) ? mainEl : window;

    function getY() {
      return scroller === window ? window.scrollY : scroller.scrollTop;
    }
    function setY(y) {
      if (scroller === window) window.scrollTo(0, y);
      else scroller.scrollTop = y;
    }

    var pending = false;
    function save() {
      try { sessionStorage.setItem(KEY, String(getY())); } catch (e) {}
    }
    scroller.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        save();
      });
    }, { passive: true });
    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);

    if (!location.hash) {
      var raw = null;
      try { raw = sessionStorage.getItem(KEY); } catch (e) {}
      var y = raw == null ? NaN : parseInt(raw, 10);
      if (isFinite(y) && y > 0) {
        setY(y);
        requestAnimationFrame(function () {
          setY(y);
          requestAnimationFrame(function () { setY(y); });
        });
      }
    }
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
        last.nodeValue = m[1] + ' ' + m[3] + m[4];
      }
    });
  })();


  /* ---------- Page-nav gradual reveal (always runs) ----------
     The Back / Continue nav sits in-flow at the bottom of the page.
     CSS starts it at opacity 0 + translateY(24px); this loop maps the
     nav's distance from the viewport bottom to an opacity in [0..1],
     so the buttons gradually fade and rise as the reader scrolls down.
     The fade window starts ~600px below the viewport and completes
     when the nav top is ~30% from the viewport top. rAF-throttled. */

  (function initPageNavReveal() {
    var nav = document.querySelector('.aur-page-nav');
    if (!nav) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      nav.style.opacity = '1';
      nav.style.transform = 'none';
      return;
    }

    var pending = false;

    function update() {
      pending = false;
      var rect = nav.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;

      // dist = how far the nav's top is below the viewport bottom.
      // Positive → nav still below the fold; negative → nav above
      // viewport bottom (i.e. partially or fully in view).
      var dist = rect.top - vh;

      // Reveal window: starts 600px below viewport, completes when
      // the nav top has crossed 30% from the top of the viewport.
      var startDist = 600;
      var endDist   = -vh * 0.7;

      var t = (startDist - dist) / (startDist - endDist);
      if (t < 0) t = 0;
      else if (t > 1) t = 1;

      nav.style.opacity = String(t);
      nav.style.transform = 'translateY(' + ((1 - t) * 24).toFixed(1) + 'px)';
    }

    function onScroll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();


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

    var imgSel = '.aur-step__media-img, .aur-media-tile__img';

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
      var imgs = document.querySelectorAll(imgSel);
      imgs.forEach(function (img) {
        if (paused) freezeImg(img); else unfreezeImg(img);
      });
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
      if (label) label.textContent = paused ? 'Resume animations' : 'Pause animations';
    }

    btn.addEventListener('click', function () {
      paused = !paused;
      try { localStorage.setItem(STORAGE_KEY, paused ? '1' : '0'); } catch (e) {}
      applyState();
    });

    applyState();
  })();
})();
