/* Centralised app state. Everything persists to localStorage; runtime-only keys are stripped. */
(function () {
  const HD = window.HD, C = HD.CONFIG; let state = null; const subs = new Set(); let timer = null;
  const RUNTIME = ['currentRoom'];
  const S = HD.state = {
    getState: () => state,
    setState(patch) { Object.assign(state, patch); notify(); later(); },
    updateState(fn) { fn(state); notify(); later(); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    persistState() {
      if (S.frozen) return false;
      try { const o = {}; Object.keys(state).forEach(k => { if (!RUNTIME.includes(k)) o[k] = state[k]; }); localStorage.setItem(C.STORAGE_KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
    },
    loadState() {
      try { const raw = localStorage.getItem(C.STORAGE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === C.DATA_VERSION) { s.currentRoom = null; state = HD.demo.migrate(s); return state; } } } catch (e) { }
      state = HD.demo.build(); S.persistState(); return state;
    },
    resetDemoData() {
      const keep = state && state.settings; try { localStorage.removeItem(C.STORAGE_KEY); } catch (e) { }
      HD.storage.clearImages(); state = HD.demo.build(); if (keep) state.settings = keep; S.persistState(); notify();
    }
  };
  function notify() { subs.forEach(f => { try { f(state); } catch (e) { console.error(e); } }); }
  function later() { clearTimeout(timer); timer = setTimeout(S.persistState, 250); }
  window.addEventListener('pagehide', () => S.persistState());
  window.addEventListener('visibilitychange', () => { if (document.hidden) S.persistState(); });
  // helpers
  HD.me = () => state.currentUser;
  HD.user = id => id === 'me' ? (state.currentUser && state.currentUser.mystery ? Object.assign({}, state.currentUser, { name: 'Mystery ' + (HD.utils.hash(state.currentUser.handle) % 9000 + 1000), handle: 'mystery', verified: false, frame: 'glitch', seed: 'mystery', title: null }) : state.currentUser) : state.users.find(u => u.id === id) || { id, name: 'Unknown', handle: 'unknown', seed: id, level: 1 };
  HD.userAvatar = u => u && u.mystery ? HD.utils.mysteryAvatar() : (u && HD.storage.images['av:' + u.id]) || HD.utils.avatar(u.seed || u.id, u.name);
  HD.roomCover = r => (r && HD.storage.images['cv:' + r.id]) || HD.utils.cover(r.coverSeed || r.id);
  HD.room = id => state.rooms.find(r => r.id === id);
})();
