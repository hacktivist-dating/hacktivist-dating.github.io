(function () {
  const HD = window.HD = window.HD || {};
  const U = HD.utils = {};
  U.$ = (s, r = document) => r.querySelector(s);
  U.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
  U.fmt = n => Number(n || 0).toLocaleString('en-US');
  U.short = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : U.fmt(n);
  U.hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  U.rng = seed => { let a = typeof seed === 'string' ? U.hash(seed) : seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  U.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  U.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  U.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.time = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  U.date = ts => new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  U.today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  U.ago = ts => { const s = Math.max(1, (Date.now() - ts) / 1000 | 0); if (s < 60) return 'now'; const m = s / 60 | 0; if (m < 60) return m + 'm'; const h = m / 60 | 0; if (h < 24) return h + 'h'; const d = h / 24 | 0; return d < 7 ? d + 'd' : U.date(ts); };
  U.dur = ms => { const m = Math.round(ms / 60000); return m < 1 ? '<1 min' : m < 60 ? m + ' min' : (m / 60 | 0) + 'h ' + (m % 60) + 'm'; };
  U.copy = async text => { try { await navigator.clipboard.writeText(text); return true; } catch (e) { try { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (e2) { return false; } } };
  const svgURI = s => 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
  const cache = {};
  U.avatar = (seed, name) => {
    const k = 'a' + seed + name; if (cache[k]) return cache[k];
    const r = U.rng(String(seed)), h = r() * 360 | 0, h2 = (h + 40 + r() * 90) % 360 | 0, init = U.esc((name || '?').trim()[0] || '?').toUpperCase();
    return cache[k] = svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 78% 58%)"/><stop offset="1" stop-color="hsl(${h2} 78% 34%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="${20 + r() * 60 | 0}" cy="${20 + r() * 50 | 0}" r="${18 + r() * 24 | 0}" fill="hsl(${h2} 90% 78%)" opacity=".28"/><circle cx="${r() * 100 | 0}" cy="${60 + r() * 40 | 0}" r="${20 + r() * 26 | 0}" fill="hsl(${h} 90% 70%)" opacity=".22"/><text x="50" y="65" font-size="44" font-weight="700" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" opacity=".95">${init}</text></svg>`);
  };
  U.mysteryAvatar = () => cache.myst || (cache.myst = svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1458"/><stop offset="1" stop-color="#0b0618"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><path d="M50 16c-17 0-28 13-28 30v28h56V46c0-17-11-30-28-30z" fill="#3b1f7a"/><ellipse cx="50" cy="50" rx="17" ry="20" fill="#0b0618"/><path d="M36 47c4-5 24-5 28 0-3 7-6 9-14 9s-11-2-14-9z" fill="#f5c451"/><circle cx="43" cy="49" r="2.6" fill="#0b0618"/><circle cx="57" cy="49" r="2.6" fill="#0b0618"/></svg>'));
  U.cover = seed => {
    const k = 'c' + seed; if (cache[k]) return cache[k];
    const r = U.rng(String(seed)), h = r() * 360 | 0, h2 = (h + 50 + r() * 80) % 360 | 0; let sh = '';
    for (let i = 0; i < 5; i++) sh += `<circle cx="${r() * 320 | 0}" cy="${r() * 200 | 0}" r="${20 + r() * 70 | 0}" fill="hsl(${(h + r() * 120) % 360 | 0} 85% 65%)" opacity="${(.10 + r() * .22).toFixed(2)}"/>`;
    let ln = ''; for (let i = 0; i < 9; i++) ln += `<path d="M0 ${20 + i * 22} Q80 ${r() * 200 | 0} 160 ${20 + i * 22} T320 ${20 + i * 22}" stroke="#fff" stroke-opacity=".06" fill="none"/>`;
    return cache[k] = svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 40%)"/><stop offset="1" stop-color="hsl(${h2} 75% 22%)"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/>${sh}${ln}</svg>`);
  };
  const P = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    micoff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    hand: '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a7 7 0 0 1 4 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>', check: '<path d="M5 12l5 5 9-10"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1"/>',
    trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8M10 18h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 5-4 7-4 12 0 4 3 7 7 7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 8v5l3 2"/>',
    verified: '<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', reply: '<path d="M10 8L4 13l6 5v-3.5c6 0 8.5 1.5 10 5.5 0-6-3-10-10-10.5z"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>', download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    slow: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>', mega: '<path d="M3 11v3l14 5V6zM17 9a4 4 0 0 1 0 6M6 15l1 5h3l-1-4"/>',
    swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>', up: '<path d="M6 15l6-6 6 6"/>', tools: '<path d="M14 6a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/>'
  };
  U.icon = (n, s = 22, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  U.ICONS = P;
  // resize an image file to a small data URL (used for avatars / covers)
  U.resizeImage = (file, max = 384) => new Promise((res, rej) => {
    const fr = new FileReader(); fr.onerror = rej;
    fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * k | 0; c.height = im.height * k | 0; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; im.src = fr.result; };
    fr.readAsDataURL(file);
  });
})();
(function () {
  const HD = window.HD, m = {};
  HD.bus = {
    on(e, f) { (m[e] = m[e] || new Set()).add(f); return () => m[e].delete(f); },
    emit(e, d) { (m[e] || []).forEach(f => { try { f(d); } catch (x) { console.error(x); } }); }
  };
  HD.reducedMotion = () => { const s = HD.state && HD.state.getState() && HD.state.getState().settings.motion; return s === 'reduce' || (s !== 'full' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); };
})();
