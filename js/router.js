/* Hash router: #home #discover #rooms #room/12345 #profile #messages #wallet #settings ... */
(function () {
  const HD = window.HD, U = HD.utils, R = HD.router = { routes: {}, cur: null, cleanup: null };
  R.add = (name, def) => { R.routes[name] = Object.assign({ name }, def); };
  R.parse = () => { const h = location.hash.replace(/^#\/?/, ''); const [name, ...rest] = h.split('/'); return { name: name || '', params: rest.map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } }) }; };
  R.resolve = () => {
    const st = HD.state.getState(), { name, params } = R.parse(); let n = name;
    if (!n || !R.routes[n]) n = st.currentUser ? 'home' : 'welcome';
    if (!st.currentUser && !R.routes[n].public) { R.pending = location.hash; n = 'welcome'; }
    const def = R.routes[n], prev = R.cur;
    if (prev && prev.name === 'room' && (n !== 'room' || params[0] !== prev.params[0]) && st.currentRoom) HD.rooms.leave();
    if (R.cleanup) { try { R.cleanup(); } catch (e) { console.error(e); } R.cleanup = null; }
    HD.modal.closeAll();
    const oldView = U.$('#view'), view = oldView.cloneNode(false); oldView.replaceWith(view); /* fresh node = no leaked listeners */ view.classList.toggle('no-nav', def.chrome === false || !def.nav);
    R.cur = { name: n, params, def }; document.title = (def.title ? def.title + ' · ' : '') + HD.CONFIG.APP_NAME;
    HD.ui.setChrome(def, params);
    try { R.cleanup = def.render(view, params) || null; } catch (e) { console.error(e); view.innerHTML = HD.ui.empty('info', 'Something went wrong', 'This screen failed to load. Try going home.', `<button class="btn primary" data-go="#home">Go home</button>`); }
    window.scrollTo(0, 0); const h = U.$('h1', view); if (h) { h.setAttribute('tabindex', '-1'); }
  };
  R.go = h => { if (location.hash === h) R.resolve(); else location.hash = h; };
  R.refresh = () => R.resolve();
  R.init = () => { addEventListener('hashchange', R.resolve); R.resolve(); };
})();
