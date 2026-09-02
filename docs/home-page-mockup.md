---
title: Home Page Mockup
section: getting-started
description: >-
  An interactive mockup of what you see when you first log in to the Salesforce Community Site. Click around to get a feel for the layout, buttons, calendar, and pop-ups. Nothing you do here will be saved.
---

<div class="mj-mockup-embed" id="mjMockupEmbed">
  <button class="aur-media-expand" type="button" aria-label="View fullscreen" title="Fullscreen (Esc to exit)">
    <span class="aur-media-expand__icon" aria-hidden="true"></span>
  </button>
  <iframe src="../assets/demos/home-mockup.html" title="MindJam home page mockup" loading="lazy"></iframe>
</div>

<script>
(function () {
  var embed = document.getElementById('mjMockupEmbed');
  if (!embed) return;
  var btn = embed.querySelector('.aur-media-expand');
  var iframe = embed.querySelector('iframe');

  function enterFs() {
    embed.classList.add('is-fullscreen');
    btn.setAttribute('aria-label', 'Exit fullscreen');
  }
  function exitFs() {
    embed.classList.remove('is-fullscreen');
    btn.setAttribute('aria-label', 'View fullscreen');
  }
  function handleEsc(e) {
    if (e.key === 'Escape' && embed.classList.contains('is-fullscreen')) exitFs();
  }

  btn.addEventListener('click', function () {
    if (embed.classList.contains('is-fullscreen')) exitFs();
    else enterFs();
  });

  // Parent-page Escape handler
  document.addEventListener('keydown', handleEsc);

  // Same-origin iframe: attach Escape handler inside it too, so
  // keystrokes work even when focus is inside the mockup.
  function bindIframeEsc() {
    try {
      var doc = iframe.contentDocument;
      if (doc) doc.addEventListener('keydown', handleEsc);
    } catch (err) { /* cross-origin, nothing we can do */ }
  }
  if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
    bindIframeEsc();
  }
  iframe.addEventListener('load', bindIframeEsc);
})();
</script>
