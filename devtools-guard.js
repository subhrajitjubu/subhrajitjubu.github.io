/* DevTools deterrent for this static site.
   Blocks the usual keyboard / right-click routes into developer tools.
   Note: client-side JS can only deter, not truly prevent, a determined user. */
(function () {
  'use strict';

  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    var key = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;

    if (key === 'f12') {
      e.preventDefault();
      return;
    }
    if (mod && shift && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
      e.preventDefault();
      return;
    }
    if (mod && (key === 'u' || key === 's')) {
      e.preventDefault();
    }
  }, true);
})();
