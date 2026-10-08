/* Boot sequence */
(function () {
  const HD = window.HD, U = HD.utils, { $ } = U;
  window.addEventListener('error', e => console.error('[HD]', e.message));
  async function boot() {
    await HD.storage.initIDB();
    HD.state.loadState(); HD.applySettings();
    const st = HD.state.getState(); if (st.currentUser && st.currentUser.isGuest === undefined) st.currentUser.isGuest = false;
    document.title = HD.CONFIG.APP_NAME; U.$$('[data-app-name]').forEach(e => e.textContent = HD.CONFIG.APP_NAME);
    HD.ui.mountShell(); HD.ui.init();
    matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => HD.applySettings());
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); HD.installPrompt = e; });
    // splash: typed prompt
    const sp = $('#splash'), tx = $('#splash .typed'), word = 'hacktivist_dating', quick = HD.reducedMotion() || sessionStorage.getItem('hd.splash');
    const start = () => { HD.router.init(); sp.classList.add('done'); setTimeout(() => sp.remove(), 700); sessionStorage.setItem('hd.splash', '1'); };
    if (quick) { start(); } else { let i = 0; const iv = setInterval(() => { tx.textContent = word.slice(0, ++i); if (i >= word.length) { clearInterval(iv); setTimeout(start, 650); } }, 55); }
    // background simulation: occasional new followers / notifications
    setInterval(() => {
      const s = HD.state.getState(); if (!s.currentUser || document.hidden || Math.random() > .35) return;
      const c = s.users.filter(u => !s.social.followers.includes(u.id) && !s.social.blocked.includes(u.id));
      if (c.length) { const u = U.pick(c); s.social.followers.push(u.id); HD.social.sync(); HD.notify.add({ type: 'follow', from: u.id, text: 'started following you' }); HD.progress.check(); }
    }, 45000);
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) navigator.serviceWorker.register('service-worker.js').catch(() => { });
    window.addEventListener('online', () => HD.toast.show('Back online', { icon: 'globe' })); window.addEventListener('offline', () => HD.toast.show('You are offline — the demo still works', { icon: 'globe' }));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
