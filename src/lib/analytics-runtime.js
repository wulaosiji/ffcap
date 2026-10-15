(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FFCAPAnalytics = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  var STATE_KEY = '__ffcapAnalyticsV1';
  var ORIGIN = 'https://ffcap.cn';

  function safeLocation(pathname) {
    try {
      var url = new URL(pathname || '/', ORIGIN);
      return url.origin === ORIGIN ? ORIGIN + url.pathname : ORIGIN + '/';
    } catch (_) { return ORIGIN + '/'; }
  }

  function safeReferrer(value) {
    if (!value) return '';
    try {
      var url = new URL(value);
      return /^(https?:)$/.test(url.protocol) ? url.origin + url.pathname : '';
    } catch (_) { return ''; }
  }

  function getAnalytics(measurementId, suppliedWindow) {
    var win = suppliedWindow || (typeof window !== 'undefined' ? window : null);
    if (!win || !/^G-[A-Z0-9]+$/.test(measurementId)) return null;
    if (win.location.hostname !== 'ffcap.cn' && win.location.hostname !== 'www.ffcap.cn') return null;

    var states = win[STATE_KEY] || (win[STATE_KEY] = Object.create(null));
    if (states[measurementId]) return states[measurementId];

    var state = { lastLocation: '', track: track };
    states[measurementId] = state;
    try {
      win.dataLayer = win.dataLayer || [];
      win.gtag = win.gtag || function () { win.dataLayer.push(arguments); };
      var initial = {
        page_location: safeLocation(win.location.pathname),
        page_referrer: safeReferrer(win.document.referrer),
        page_title: win.document.title
      };
      win.gtag('js', new Date());
      win.gtag('set', initial);
      win.gtag('config', measurementId, Object.assign({}, initial, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      }));

      // Added after initialization; no tag load or network result is awaited.
      var scriptId = 'ffcap-google-tag-' + measurementId;
      if (!win.document.getElementById(scriptId)) {
        var script = win.document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        script.onerror = function () {};
        win.document.head.appendChild(script);
      }
    } catch (_) {
      delete states[measurementId];
      return null;
    }

    return state;

    function track(pathname, title) {
      var location = safeLocation(pathname || win.location.pathname);
      if (location === state.lastLocation) return false;
      var parameters = {
        page_location: location,
        page_referrer: state.lastLocation || safeReferrer(win.document.referrer),
        page_title: typeof title === 'string' ? title : win.document.title
      };
      try {
        // Shared defaults also keep later automatic engagement events query-free.
        win.gtag('set', parameters);
        win.gtag('event', 'page_view', Object.assign({ send_to: measurementId }, parameters));
        state.lastLocation = location;
        return true;
      } catch (_) { return false; }
    }
  }

  return { getAnalytics: getAnalytics, safeLocation: safeLocation, safeReferrer: safeReferrer };
});
