// This is a server-side route that serves an HTML page.
// The page loads the embed URL inside an iframe, but FIRST it overrides
// window.open to block all popups, and intercepts top-level navigation.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");

  if (!target || !target.startsWith("https://")) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="robots" content="noindex, nofollow">
<title>Player</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  #player { width: 100%; height: 100%; border: 0; display: block; }
  #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #7c3aed; font-family: sans-serif; font-size: 14px; }
</style>
</head>
<body>
<div id="loading">Loading player...</div>
<iframe id="player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="no-referrer"></iframe>
<script>
// === POPUP/REDIRECT BLOCKER ===
// Override window.open BEFORE the iframe loads
window.open = function() {
  console.log("[blocked] window.open");
  return null;
};

// Block top-level navigation (redirects away from our site)
// We can't prevent navigation in the iframe itself, but we can
// detect and cancel it at the beforeunload level
window.addEventListener('beforeunload', function(e) {
  // Check if this was triggered by a click inside the iframe
  e.preventDefault();
  e.returnValue = '';
  return '';
});

// Block clicks that try to navigate away
document.addEventListener('click', function(e) {
  const target = e.target;
  if (target && target.tagName === 'A' && target.href) {
    // Only allow links to the same origin
    try {
      const url = new URL(target.href);
      if (url.origin !== window.location.origin) {
        e.preventDefault();
        e.stopPropagation();
        console.log("[blocked] link click:", target.href);
        return false;
      }
    } catch(err) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}, true);

// Load the iframe AFTER popup blocker is in place
var iframe = document.getElementById('player');
iframe.src = ${JSON.stringify(target)};

// Hide loading once iframe loads
iframe.addEventListener('load', function() {
  var loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
});

// Periodically remove any injected ad elements
setInterval(function() {
  try {
    // Remove popups, ad overlays, etc.
    document.querySelectorAll('[id*="ad"], [class*="ad-"], [id*="popup"], [class*="popup"], [id*="popunder"], [class*="popunder"]').forEach(function(el) {
      if (el.id !== 'player' && el.id !== 'loading') {
        el.remove();
      }
    });
  } catch(e) {}
}, 1000);
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Frame-Options": "ALLOWALL",
    },
  });
}
