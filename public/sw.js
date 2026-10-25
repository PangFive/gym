// Wegym (formerly WHY) service worker: the app opens offline, and a new deploy shows on the next open.
//
// It lives at the same address openGym's worker used (/gym/sw.js), so browsers that still run
// that one replace it with this. On activation every cache that is not WHY's is deleted, and if
// any were found, open pages reload into this app instead of the old one they were showing.
//
// Strategies:
//   the page itself         network first (4 s), cached copy when offline
//   manifest                network first (it carries the app's name and icons)
//   icons                   cache, refreshed in the background
//   Firebase SDK            cache first: the URLs carry a version and never change
//   Google Fonts            cache, refreshed in the background
//   jsQR (QR reader)        cache first: a pinned version
//   YouTube thumbnails      cache first, the newest 200 kept
// Firebase Auth and the Realtime Database go straight to the network.

const VERSION = 'why-v3';   // bump when icons or the manifest change, so phones fetch the new ones
const SHELL = VERSION + '-shell', RUNTIME = VERSION + '-runtime', THUMBS = VERSION + '-thumbs';
const PAGE = new URL('./index.html', self.registration.scope).href;
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/logo.svg'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, which could still hold the previous files
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [SHELL, RUNTIME, THUMBS];
    const old = (await caches.keys()).filter(k => !keep.includes(k));
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.some(k => !k.startsWith('why-'))) {
      for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url).catch(() => {});
    }
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') return e.respondWith(networkFirst(req));
  // the manifest names and pictures the installed app, so it comes fresh whenever there is a network
  if (url.origin === location.origin && url.pathname.endsWith('/manifest.json')) return e.respondWith(fresh(req));
  if (url.origin === location.origin) return e.respondWith(refreshing(req, SHELL));
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) return e.respondWith(cacheFirst(req, RUNTIME));
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return e.respondWith(refreshing(req, RUNTIME));
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/jsqr@')) return e.respondWith(cacheFirst(req, RUNTIME));
  if (url.hostname === 'i.ytimg.com') return e.respondWith(cacheFirst(req, THUMBS, 200));
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
    if (res.ok) cache.put(PAGE, res.clone());
    return res;
  } catch {
    return (await cache.match(PAGE)) || (await cache.match(req)) || Response.error();
  }
}

async function fresh(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

async function refreshing(req, name) {
  const cache = await caches.open(name), hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => null);
  return hit || (await net) || Response.error();
}

async function cacheFirst(req, name, max) {
  const cache = await caches.open(name), hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) {
      await cache.put(req, res.clone());
      if (max) cache.keys().then(keys => Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map(k => cache.delete(k))));
    }
    return res;
  } catch {
    return Response.error();
  }
}
