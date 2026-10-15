const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const analytics = require('../src/lib/analytics-runtime.js');
const id = ['G', 'TESTONLY123'].join('-'); // Synthetic ID; no request is ever made.

function browser(hostname = 'ffcap.cn') {
  const nodes = new Map();
  const callbacks = new Map();
  return {
    location: { hostname, pathname: '/', search: '?email=private@example.test', hash: '#token' },
    document: {
      title: 'FFCAP',
      referrer: 'https://example.test/from?token=private#secret',
      getElementById: id => nodes.get(id),
      createElement: tag => ({ tagName: tag }),
      head: { appendChild: node => nodes.set(node.id, node) }
    },
    addEventListener: (event, fn) => callbacks.set(event, [...(callbacks.get(event) || []), fn]),
    dispatch: event => (callbacks.get(event) || []).forEach(fn => fn()),
    nodes,
  };
}
function pageViews(win) {
  return (win.dataLayer || []).map(args => [...args]).filter(args => args[0] === 'event' && args[1] === 'page_view');
}

test('initial, client route, then back each count once; search and hash do not count', () => {
  const win = browser();
  const tracker = analytics.getAnalytics(id, win);
  assert.equal(tracker.track('/'), true);
  assert.equal(tracker.track('/'), false); // StrictMode or rerender.
  win.location.search = '?q=private-search';
  win.location.hash = '#products';
  assert.equal(tracker.track('/'), false);
  assert.equal(analytics.getAnalytics(id, win), tracker);
  assert.equal(tracker.track('/research'), true);
  assert.equal(tracker.track('/research?q=secret#result'), false);
  assert.equal(tracker.track('/'), true); // Back navigation is another view.
  assert.equal(pageViews(win).length, 3);
  const config = win.dataLayer.map(args => [...args]).filter(args => args[0] === 'config');
  assert.equal(config.length, 1);
  assert.equal(config[0][2].send_page_view, false);
  assert.equal(win.nodes.size, 1);
});

test('all URL parameters and fragments are absent from event/default URL fields', () => {
  const win = browser();
  const tracker = analytics.getAnalytics(id, win);
  tracker.track('/report.html?id=private-report&reportId=private#token');
  tracker.track('/open.html?slug=private&email=private@example.test');
  const views = pageViews(win);
  assert.equal(views[0][2].page_location, 'https://ffcap.cn/report.html');
  assert.equal(views[0][2].page_referrer, 'https://example.test/from');
  assert.equal(views[1][2].page_referrer, 'https://ffcap.cn/report.html');
  for (const args of win.dataLayer) {
    const params = args[0] === 'set' ? args[1] : args[2];
    if (!params || typeof params !== 'object') continue;
    for (const key of ['page_location', 'page_referrer']) {
      if (key in params) assert(!/[?#]/.test(params[key]));
    }
  }
});

test('localhost/canary and invalid IDs produce no measurement', () => {
  const win = browser('127.0.0.1');
  assert.equal(analytics.getAnalytics(id, win), null);
  assert.equal(analytics.getAnalytics('invalid', browser()), null);
  assert.equal(win.dataLayer, undefined);
});

test('blocked Google library and throwing gtag never throw into navigation', () => {
  const win = browser();
  const tracker = analytics.getAnalytics(id, win);
  for (const node of win.nodes.values()) assert.doesNotThrow(() => node.onerror());
  assert.equal(tracker.track('/'), true); // Queuing does not wait for the library.
  win.gtag = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => tracker.track('/research'));
  assert.equal(tracker.track('/research'), false);
});

test('static bootstrap creates the Google script only after load and never awaits it', () => {
  const win = browser();
  const pending = [];
  const context = vm.createContext({ window: win, globalThis: win, URL, Date, console });
  vm.runInContext(fs.readFileSync(__dirname + '/../src/lib/analytics-runtime.js', 'utf8'), context);
  vm.runInContext(`window.addEventListener('load', function () {
    try { var tracker = window.FFCAPAnalytics.getAnalytics(${JSON.stringify(id)});
      if (tracker) tracker.track(window.location.pathname, window.document.title);
    } catch (_) {}
  });`, context);
  // Existing redirect's load handler remains independent and keeps its 450ms timer.
  win.addEventListener('load', () => pending.push({ delay: 450, redirect: true }));
  assert.equal(win.nodes.size, 0);
  win.dispatch('load');
  assert.equal(win.nodes.size, 1);
  for (const node of win.nodes.values()) assert.equal(node.async, true);
  assert.deepEqual(pending, [{ delay: 450, redirect: true }]);
  assert.equal(pageViews(win).length, 1);
  for (const node of win.nodes.values()) node.onerror();
  assert.deepEqual(pending, [{ delay: 450, redirect: true }]);
});
