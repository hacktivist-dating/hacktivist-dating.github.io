/* Offline cache. Bump VERSION when you change any cached file. */
const VERSION = 'hd-v1.3.1';
const ASSETS = ['./', 'index.html', 'manifest.json',
  'css/reset.css', 'css/variables.css', 'css/themes.css', 'css/base.css', 'css/layout.css', 'css/components.css', 'css/animations.css', 'css/responsive.css',
  'js/config.js', 'js/utils.js', 'js/i18n.js', 'js/storage.js', 'js/state.js', 'js/demo-data.js', 'js/toast.js', 'js/modals.js', 'js/progress.js', 'js/fx.js',
  'js/audioAdapter.js', 'js/webrtcAdapter.js', 'js/notificationAdapter.js', 'js/authAdapter.js', 'js/messageAdapter.js', 'js/giftAdapter.js', 'js/roomAdapter.js',
  'js/router.js', 'js/ui.js', 'js/screens-main.js', 'js/screens-room.js', 'js/screens-social.js', 'js/screens-misc.js', 'js/features-match.js', 'js/features-events.js', 'js/features-vip.js', 'js/features-store.js', 'js/features-room.js', 'js/features-gifts.js', 'js/features-games.js', 'js/features-moments.js', 'js/features-bonds.js', 'js/app.js',
  'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png', 'assets/icons/icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
