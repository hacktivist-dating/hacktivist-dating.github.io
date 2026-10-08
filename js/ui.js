/* Shared UI building blocks, app shell (bottom nav / sidebar) and delegated event handling. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $, $$ } = U, t = k => HD.t(k);
  const UI = HD.ui = { thread: null }; HD.act = {};
  const NAV = [['home', 'home', 'home'], ['discover', 'compass', 'discover'], ['rooms', 'mic', 'rooms'], ['messages', 'chat', 'messages'], ['profile', 'user', 'profile']];
  const SIDE = [['wallet', 'wallet', 'wallet'], ['rewards', 'calendar', 'dailyRewards'], ['matches', 'heart', 'matches'], ['moments', 'compass', 'moments'], ['vip', 'crown', 'vip'], ['family', 'users', 'family'], ['missions', 'calendar', 'missions'], ['shop', 'star', 'shop'], ['leaderboard', 'trophy', 'leaderboard'], ['host', 'mic', 'hostCenter'], ['notifications', 'bell', 'notifications'], ['search', 'search', 'search'], ['settings', 'settings', 'settings']];

  UI.page = html => `<div class="page page-in">${html}</div>`;
  UI.top = (title, o = {}) => `<header class="topbar">${o.back === false ? '' : `<button class="icon-btn" data-back aria-label="Back">${icon('back')}</button>`}<h1>${esc(title)}</h1>${o.actions || ''}</header>`;
  UI.av = (u, o = {}) => `<span class="avw ${o.speaking ? 'speaking' : ''}${u.frame ? ' frame-' + u.frame : ''}" style="--s:${o.s || 44}px" data-uid="${esc(u.id)}"><img class="av" src="${HD.userAvatar(u)}" alt="" loading="lazy">${o.online && u.online ? '<i class="on"></i>' : ''}</span>`;
  UI.vf = u => u && u.verified ? `<span class="vf" title="Verified">${icon('verified', 14)}</span>` : '';
  UI.empty = (ic, title, text, extra = '') => `<div class="empty">${icon(ic, 44)}<h3>${esc(title)}</h3><p>${esc(text || '')}</p>${extra}</div>`;
  UI.chips = (items, active, attr) => items.map(i => `<button class="chip ${i[0] === active ? 'on' : ''}" ${attr}="${esc(i[0])}" aria-pressed="${i[0] === active}">${esc(i[1])}</button>`).join('');
  UI.coin = () => HD.CONFIG.COIN_SYMBOL;
  UI.badges = r => `${r.vip ? '<span class="bdg vip">VIP</span>' : ''}${r.locked ? `<span class="bdg">${icon('lock', 11)} ${r.password ? 'Locked' : 'Private'}</span>` : ''}`;

  UI.roomCard = r => {
    const h = HD.user(r.hostId), n = HD.rooms.listenerCount(r);
    return `<article class="rc" role="link" tabindex="0" data-room="${r.id}" aria-label="${esc(r.title)}, ${n} listeners">
      <div class="rc-cover" style="background-image:url('${HD.roomCover(r)}')"><div class="tl"><span class="bdg"><span class="dotlive"></span> Live</span>${UI.badges(r)}</div><div class="tr"><span class="bdg">${esc(HD.demo.catName(r.category))}</span></div>
      <div class="bl"><b class="trunc">${esc(r.title)}${r.verified ? `<span class="vf">${icon('verified', 15)}</span>` : ''}</b></div></div>
      <div class="rc-body">${UI.av(h, { s: 34, online: true })}<div class="grow"><div class="small trunc"><b>${esc(h.name)}</b></div><div class="meta"><span>${icon('users', 13)} ${U.short(n)}</span><span>${icon('globe', 13)} ${esc(r.language)}</span></div></div></div></article>`;
  };
  UI.roomRow = r => {
    const h = HD.user(r.hostId), n = HD.rooms.listenerCount(r), spk = r.seats.slice(0, 4).map(id => UI.av(HD.user(id), { s: 22 })).join('');
    return `<article class="rr" role="link" tabindex="0" data-room="${r.id}" aria-label="${esc(r.title)}"><div class="cv" style="background-image:url('${HD.roomCover(r)}')"><span class="bdg">Lv ${r.level}</span></div>
      <div class="grow col" style="gap:4px"><div class="row" style="gap:6px"><h3 class="trunc">${esc(r.title)}</h3>${r.verified ? `<span class="vf" style="margin:0">${icon('verified', 15)}</span>` : ''}</div><p>${esc(r.desc)}</p>
      <div class="row wrap" style="gap:5px"><span class="bdg live"><span class="dotlive"></span> Live</span>${UI.badges(r)}<span class="bdg">${esc(HD.demo.catName(r.category))}</span><span class="bdg">${esc(r.language)}</span></div>
      <div class="meta"><span class="mono">#${esc(r.id)}</span><span>${icon('mic', 13)} ${esc(h.name)}</span><span>${icon('users', 13)} ${U.short(n)}</span></div>
      <div class="row between"><div class="speakers-mini">${spk}</div><span class="row" style="gap:6px"><button class="icon-btn" style="width:32px;height:32px;${UI.isFav(r.id) ? 'color:var(--gold-t)' : ''}" data-act="toggleFav" data-id="${r.id}" aria-pressed="${UI.isFav(r.id)}" aria-label="${UI.isFav(r.id) ? 'Remove from saved' : 'Save room'}">${icon('star', 16)}</button><button class="icon-btn" style="width:32px;height:32px" data-act="roomInfo" data-id="${r.id}" aria-label="Room details for ${esc(r.title)}">${icon('info', 16)}</button></span></div></div></article>`;
  };
  UI.userRow = (u, right = '') => `<div class="li" data-user="${u.id}" role="button" tabindex="0" style="cursor:pointer">${UI.av(u, { s: 46, online: true })}<div class="grow"><div class="trunc"><b class="${HD.cosmetic ? HD.cosmetic.nameCls(u.id) : ''}" style="${HD.cosmetic ? HD.cosmetic.nameStyle(u.id) : ''}">${esc(u.name)}</b>${UI.vf(u)} ${u.vip ? '<span class="bdg vip">VIP</span>' : ''} ${UI.tierPill ? UI.tierPill(u.tier, 1) + ' ' + UI.presPill(u.prestige) : ''}</div><div class="muted small trunc">@${esc(u.handle)} · ${u.flag} Lv ${u.level}</div></div>${right}</div>`;
  UI.followBtn = id => { const f = HD.social.isFollowing(id); return `<button class="btn sm ${f ? '' : 'primary'}" data-act="toggleFollow" data-id="${id}">${f ? t('following') : t('follow')}</button>`; };
  UI.bell = () => { const n = HD.notify.unread(); return `<button class="icon-btn" data-go="#notifications" aria-label="${t('notifications')}${n ? ', ' + n + ' unread' : ''}">${icon('bell', 20)}${n ? `<span class="dot" data-badge="notif">${n}</span>` : ''}</button>`; };
  UI.logo = () => `<div class="logo"><span class="logo-mark" aria-hidden="true">&gt;_</span><span class="logo-name">${esc(HD.CONFIG.APP_NAME)}</span></div>`;

  // ---------- shell ----------
  UI.mountShell = () => {
    const nav = document.createElement('nav'); nav.className = 'bottomnav'; nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = `<span class="nav-ind" aria-hidden="true"></span>` + NAV.map(n => `<a class="nav-item" href="#${n[0]}" data-nav="${n[0]}" aria-label="${t(n[2])}">${icon(n[1], 24)}<span>${t(n[2])}</span>${n[0] === 'messages' ? '<i class="n" data-badge="msg" hidden></i>' : ''}</a>`).join('');
    const side = document.createElement('aside'); side.className = 'sidebar'; side.setAttribute('aria-label', 'Sidebar');
    side.innerHTML = UI.logo() + NAV.map(n => `<a class="sb-item" href="#${n[0]}" data-nav="${n[0]}">${icon(n[1], 22)}<span>${t(n[2])}</span>${n[0] === 'messages' ? '<i class="n" data-badge="msg" hidden></i>' : ''}</a>`).join('') + '<div class="sb-sep"></div>' + SIDE.map(n => `<a class="sb-item" href="#${n[0]}" data-nav="${n[0]}">${icon(n[1], 22)}<span>${t(n[2])}</span></a>`).join('') + `<a class="btn primary" href="#create">${icon('plus', 18)} ${t('createRoom')}</a>`;
    const app = $('#app'); app.prepend(side); app.appendChild(nav);
    const pill = document.createElement('button'); pill.className = 'demo-pill'; pill.textContent = t('demo'); pill.setAttribute('aria-label', 'Demo mode. Tap to learn more.'); pill.dataset.act = 'demoNote'; app.appendChild(pill); UI.pill = pill; UI.nav = nav; UI.side = side;
    UI.badgesUpdate();
  };
  UI.setChrome = (def, params) => {
    if (!UI.nav) return; const show = !!def.nav && def.chrome !== false && HD.state.getState().currentUser; const active = def.nav;
    UI.nav.style.display = UI.side.style.display = show ? '' : 'none'; UI.pill.style.display = def.name === 'room' || !HD.state.getState().currentUser ? 'none' : ''; UI.pill.classList.toggle('no-nav', !show);
    const idx = NAV.findIndex(n => n[0] === active); UI.nav.querySelector('.nav-ind').style.setProperty('--i', Math.max(idx, 0)); UI.nav.querySelector('.nav-ind').style.opacity = idx < 0 ? 0 : 1;
    $$('[data-nav]', document).forEach(a => { const on = a.dataset.nav === active; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    if (!show) { UI.side.style.display = 'none'; }
    $('#view').style.marginLeft = show ? '' : '0';
  };
  UI.badgesUpdate = () => {
    const m = HD.messages.unreadTotal(); $$('[data-badge=msg]').forEach(e => { e.hidden = !m; e.textContent = m; });
    const n = HD.notify.unread(); $$('[data-badge=notif]').forEach(e => { e.hidden = !n; e.textContent = n; });
  };
  HD.bus.on('dm', UI.badgesUpdate); HD.bus.on('notif', () => { UI.badgesUpdate(); const c = HD.router.cur; if (c && ['home'].includes(c.name)) { const b = $('[data-go="#notifications"]'); if (b) b.outerHTML = UI.bell(); } });

  // ---------- delegated events ----------
  UI.init = () => {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      if (a) { const f = HD.act[a.dataset.act]; if (f) { e.preventDefault(); f(a.dataset, a, e); } return; }
      const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); HD.router.go(g.dataset.go); return; }
      const b = e.target.closest('[data-back]'); if (b) { e.preventDefault(); if (history.length > 1 && document.referrer !== undefined && HD.router.cur && HD.router.cur.name !== 'home') history.back(); else HD.router.go('#home'); return; }
      const rm = e.target.closest('[data-room]'); if (rm) { HD.act.openRoom({ id: rm.dataset.room }); return; }
      const us = e.target.closest('[data-user]'); if (us && !e.target.closest('button,a')) { HD.modal.profile(us.dataset.user); return; }
    });
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=link][tabindex],[role=button][tabindex]') && !e.target.matches('button,a,input')) { e.preventDefault(); e.target.click(); }
    });
  };
  UI.isFav = id => (HD.state.getState().favorites || []).includes(id);
  HD.act.toggleFav = ({ id }, el) => { const s = HD.state.getState(), f = s.favorites, i = f.indexOf(id); i < 0 ? f.push(id) : f.splice(i, 1); HD.state.persistState(); HD.toast.show(i < 0 ? 'Room saved' : 'Removed from saved', { icon: 'star' }); if (el) { el.style.color = i < 0 ? 'var(--gold)' : ''; el.setAttribute('aria-pressed', i < 0); } HD.bus.emit('fav'); };
  HD.act.openRoom = ({ id }) => { if (!HD.room(id)) return HD.toast.err('Room not found'); HD.router.go('#room/' + id); };
  HD.act.roomInfo = ({ id }) => HD.router.go('#roominfo/' + id);
  HD.act.demoNote = () => HD.modal.demoNote();
  HD.act.toggleFollow = ({ id }, el) => {
    if (!HD.modal.requireAccount('follow people')) return; const f = HD.social.isFollowing(id); f ? HD.social.unfollow(id) : HD.social.follow(id);
    HD.toast.ok(f ? 'Unfollowed' : 'User followed', 'user'); if (el && el.classList.contains('btn')) { el.textContent = f ? t('follow') : t('following'); el.classList.toggle('primary', f); }
  };
  HD.act.logout = async () => { if (await HD.modal.confirm('Log out?', 'Your local demo data stays on this device.', { ok: 'Log out' })) { await HD.auth.logout(); HD.router.go('#welcome'); } };
})();
