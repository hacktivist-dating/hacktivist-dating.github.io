/* Screens: welcome, login, register, home, discover, rooms, room details, create room, search */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $, $$ } = U, UI = HD.ui, R = HD.router, M = HD.modal, t = k => HD.t(k);
  const CATS = HD.demo.CATEGORIES, REAL = CATS.filter(c => !['trending', 'new'].includes(c[0]));

  // ---------- welcome / auth ----------
  R.add('welcome', { title: 'Welcome', public: true, render(v) {
    v.innerHTML = `<div class="welcome page-in" style="max-width:520px;margin:0 auto"><div><span class="logo-mark hero-mark" aria-hidden="true">&gt;_</span><h1>${esc(HD.CONFIG.APP_NAME)}</h1><p class="muted" style="font-size:17px;margin-top:8px">${esc(HD.CONFIG.APP_TAGLINE)} Drop into live voice rooms and meet people who care about the same things you do.</p></div>
      <div class="col" style="gap:12px"><button class="btn primary block" data-go="#register">${t('register')}</button><button class="btn block" data-go="#login">${t('signIn')}</button><button class="btn ghost block" data-act="guestIn">${t('guest')}</button></div>
      <div class="note">${icon('info', 18)}<div>Frontend-only demo. Accounts, rooms and coins live in this browser — no server, no real payments. <a href="#demo" style="color:var(--accent-t);font-weight:650">What does that mean?</a></div></div></div>`;
  } });
  HD.act.guestIn = async () => { await HD.auth.guest(); go(); };
  const go = () => { const p = R.pending; R.pending = null; location.hash = p && !/welcome|login|register/.test(p) ? p : '#home'; if (location.hash === (p || '#home')) R.resolve(); };
  const authForm = (mode) => ({ title: mode === 'login' ? 'Sign in' : 'Create account', public: true, render(v) {
    const reg = mode === 'register';
    v.innerHTML = UI.page(UI.top(reg ? t('register') : t('signIn'), {}) + `<form id="af" novalidate><p class="muted" style="margin-bottom:18px">${reg ? 'Create a local demo account. Nothing is sent anywhere.' : 'Enter your username. This is a simulation — no password is checked or stored.'}</p>
      ${reg ? `<div class="field"><label for="a-n">Display name</label><input id="a-n" class="input" maxlength="24" autocomplete="name" required></div>` : ''}
      <div class="field"><label for="a-h">Username</label><input id="a-h" class="input" maxlength="20" autocapitalize="none" autocomplete="username" placeholder="e.g. night_owl" required></div>
      <div class="field"><label for="a-p">Password (demo, not stored)</label><input id="a-p" class="input" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
      ${reg ? `<div class="field"><label for="a-c">Country</label><select id="a-c" class="input">${['India', 'UAE', 'UK', 'USA', 'Germany', 'Brazil', 'Japan', 'Kenya', 'Turkey', 'Spain', 'Canada', 'Singapore'].map(c => `<option>${c}</option>`).join('')}</select></div>` : ''}
      <button class="btn primary block" type="submit">${reg ? t('register') : t('signIn')}</button>
      <p class="center muted small" style="margin-top:16px">${reg ? 'Have an account?' : 'New here?'} <a href="#${reg ? 'login' : 'register'}" style="color:var(--accent-t);font-weight:650">${reg ? t('signIn') : t('register')}</a></p></form>`);
    $('#af', v).addEventListener('submit', async e => {
      e.preventDefault(); const h = $('#a-h', v).value.trim();
      const r = reg ? await HD.auth.register({ name: $('#a-n', v).value.trim(), handle: h, country: $('#a-c', v).value }) : await HD.auth.login({ handle: h });
      if (!r.ok) return HD.toast.err(r.msg); HD.toast.ok(reg ? 'Account created' : 'Signed in'); go();
    });
  } });
  R.add('login', authForm('login')); R.add('register', authForm('register'));

  // ---------- home ----------
  R.add('home', { title: 'Home', nav: 'home', render(v) {
    const me = HD.me(), st = HD.state.getState(), top = HD.rooms.list({ sort: 'trending' }), d = HD.gifts.dailyState();
    const friendsIn = top.filter(r => st.social.following.includes(r.hostId) || r.seats.some(x => st.social.following.includes(x))).slice(0, 4);
    v.innerHTML = UI.page(`<header class="topbar">${UI.logo()}<span class="grow"></span><button class="icon-btn" data-go="#search" aria-label="${t('search')}">${icon('search', 20)}</button>${UI.bell()}<button class="avw" style="--s:40px" data-go="#profile" aria-label="${t('profile')}"><img class="av" src="${HD.userAvatar(me)}" alt=""></button></header>
      <h1 style="margin:6px 0 4px">${me.isGuest ? 'Hey there 👋' : 'Hey ' + esc(me.name) + ' 👋'}</h1><p class="muted">${top.length} rooms are live right now.</p>
      <div class="quick sect" style="margin-top:18px"><button data-go="#create"><span class="q">${icon('plus', 22)}</span>${t('createRoom')}</button><button data-go="#rewards"><span class="q">${icon('calendar', 22)}</span>Check-in${d.claimedToday ? '' : '<i class="n"></i>'}</button><button data-go="#leaderboard"><span class="q">${icon('trophy', 22)}</span>Ranks</button><button data-go="#host"><span class="q">${icon('mic', 22)}</span>Host</button><button data-go="#matches"><span class="q">${icon('heart', 22)}</span>Matches</button><button data-act="goTab" data-t="upcoming"><span class="q">${icon('clock', 22)}</span>Events</button><button data-go="#shop"><span class="q">${icon('star', 22)}</span>Shop</button><button data-act="goTab" data-t="saved"><span class="q">${icon('bookmark', 22)}</span>Saved</button><button data-go="#moments"><span class="q">${icon('compass', 22)}</span>Moments</button><button data-go="#missions"><span class="q">${icon('calendar', 22)}</span>Missions</button><button data-go="#family"><span class="q">${icon('users', 22)}</span>Family</button><button data-go="#vip"><span class="q">${icon('crown', 22)}</span>VIP</button></div>
      <section class="sect"><div class="sect-h"><h2>${t('recommended')}</h2><a href="#rooms">${t('seeAll')}</a></div><div class="hscroll" role="list">${top.slice(0, 7).map(r => `<div role="listitem">${UI.roomCard(r)}</div>`).join('')}</div></section>
      <section class="sect"><div class="sect-h"><h2>Browse by topic</h2></div><div class="hscroll noscroll-x">${REAL.map(c => `<button class="chip" data-act="goCat" data-c="${c[0]}">${c[1]}</button>`).join('')}</div></section>
      ${friendsIn.length ? `<section class="sect"><div class="sect-h"><h2>Friends are here</h2></div><div class="col">${friendsIn.map(UI.roomRow).join('')}</div></section>` : ''}
      <section class="sect"><div class="sect-h"><h2>${t('trending')}</h2><a href="#discover">${t('seeAll')}</a></div><div class="grid-rooms">${top.slice(0, 6).map(UI.roomRow).join('')}</div></section>`);
  } });
  HD.act.goCat = ({ c }) => { UI.discoverCat = c; R.go('#discover'); };

  // ---------- discover ----------
  R.add('discover', { title: 'Discover', nav: 'discover', render(v) {
    let cat = UI.discoverCat || 'trending', sort = 'trending'; UI.discoverCat = null;
    const SORTS = [['trending', 'Trending'], ['active', 'Most Active'], ['newest', 'Newest'], ['listeners', 'Most Listeners']];
    v.innerHTML = UI.page(`<header class="topbar"><h1>${t('discover')}</h1><button class="icon-btn" data-go="#search" aria-label="${t('search')}">${icon('search', 20)}</button></header>
      <div class="hscroll noscroll-x" id="d-cats" role="group" aria-label="Categories"></div><div class="row" style="margin:10px 0 14px"><span class="muted small">Sort</span><div class="hscroll noscroll-x grow" style="margin:0" id="d-sort" role="group" aria-label="Sort"></div></div><div class="grid-rooms" id="d-list"></div>`);
    const draw = () => {
      $('#d-cats', v).innerHTML = UI.chips(CATS, cat, 'data-cat'); $('#d-sort', v).innerHTML = UI.chips(SORTS, sort, 'data-sort');
      const list = HD.rooms.list({ cat, sort: cat === 'new' && sort === 'trending' ? 'newest' : sort });
      $('#d-list', v).innerHTML = list.length ? list.map(UI.roomRow).join('') : `<div style="grid-column:1/-1">${UI.empty('compass', 'No rooms here yet', 'Be the first to start one in this category.', '<button class="btn primary" data-go="#create">Create room</button>')}</div>`;
    };
    v.addEventListener('click', e => { const c = e.target.closest('[data-cat]'), s = e.target.closest('[data-sort]'); if (c) { cat = c.dataset.cat; draw(); const el = $('[data-cat].on', v); el && el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } if (s) { sort = s.dataset.sort; draw(); } });
    draw();
  } });

  // ---------- rooms ----------
  R.add('rooms', { title: 'Voice rooms', nav: 'rooms', render(v) {
    let tab = UI.roomsTab || 'all'; UI.roomsTab = null; const TABS = [['all', 'All live'], ['upcoming', 'Upcoming'], ['saved', 'Saved'], ['following', 'Following'], ['mine', 'My rooms']];
    v.innerHTML = UI.page(`<header class="topbar"><h1>${t('rooms')}</h1><button class="btn primary sm" data-go="#create">${icon('plus', 16)} ${t('createRoom')}</button></header><div class="tabs" role="tablist" id="r-tabs"></div><div class="col" style="margin-top:14px" id="r-list"></div>`);
    const draw = () => {
      const st = HD.state.getState(); $('#r-tabs', v).innerHTML = TABS.map(x => `<button class="tab ${x[0] === tab ? 'on' : ''}" role="tab" aria-selected="${x[0] === tab}" data-tab="${x[0]}">${x[1]}</button>`).join('');
      if (tab === 'upcoming') { $('#r-list', v).innerHTML = HD.events.html(); return; }
      let l = HD.rooms.list({ sort: 'trending' }); if (tab === 'saved') l = st.rooms.filter(r => st.favorites.includes(r.id) && r.status === 'live'); if (tab === 'following') l = l.filter(r => st.social.following.includes(r.hostId)); if (tab === 'mine') l = st.rooms.filter(r => r.mine && r.status === 'live');
      $('#r-list', v).innerHTML = l.length ? l.map(UI.roomRow).join('') : UI.empty('mic', tab === 'mine' ? 'You are not hosting anything' : tab === 'saved' ? 'No saved rooms' : 'Nothing live here', tab === 'mine' ? 'Start a room and invite people to talk.' : tab === 'saved' ? 'Tap the star on a room to save it.' : 'Follow hosts to see their rooms here.', tab === 'mine' ? '<button class="btn primary" data-go="#create">Create room</button>' : '<button class="btn" data-go="#discover">Discover rooms</button>');
    };
    v.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; draw(); } }); draw(); const o1 = HD.bus.on('events', () => tab === 'upcoming' && draw()), o2 = HD.bus.on('fav', () => tab === 'saved' && draw()); return () => { o1(); o2(); };
  } });

  // ---------- room details ----------
  R.add('roominfo', { title: 'Room details', nav: 'rooms', render(v, [id]) {
    const r = HD.room(id); if (!r) return void (v.innerHTML = UI.page(UI.top('Room') + UI.empty('info', 'Room not found', 'Check the room ID.')));
    const h = HD.user(r.hostId), n = HD.rooms.listenerCount(r);
    v.innerHTML = UI.page(UI.top('Room details') + `<div class="card" style="overflow:hidden"><div style="height:170px;background:url('${HD.roomCover(r)}') center/cover"></div><div class="pad col">
      <div class="row wrap"><span class="bdg live"><span class="dotlive"></span> ${r.status === 'live' ? 'Live' : 'Ended'}</span>${UI.badges(r)}<span class="bdg">${esc(HD.demo.catName(r.category))}</span><span class="bdg">${esc(r.language)}</span><span class="bdg">Lv ${r.level}</span></div>
      <h1 style="font-size:24px">${esc(r.title)}${r.verified ? `<span class="vf">${icon('verified', 20)}</span>` : ''}</h1><p class="muted">${esc(r.desc)}</p>
      <div class="stats"><div class="stat"><b>${U.short(n)}</b><span>Listeners</span></div><div class="stat"><b>${r.seats.length}</b><span>On stage</span></div><div class="stat"><b class="mono" style="font-size:15px">${esc(r.id)}</b><span>Room ID</span></div></div>
      <div class="li" data-user="${h.id}" style="cursor:pointer">${UI.av(h, { s: 46 })}<div class="grow"><b>${esc(h.name)}</b>${UI.vf(h)}<div class="muted small">Host · @${esc(h.handle)}</div></div>${h.id === 'me' ? '' : UI.followBtn(h.id)}</div>
      <div><div class="lbl" style="margin-bottom:8px">On stage</div><div class="speakers-mini" style="flex-wrap:wrap;gap:6px">${r.seats.map(x => UI.av(HD.user(x), { s: 36 })).join('')}</div></div>
      ${r.followersOnly ? `<div class="note">${icon('users', 18)}<div>Followers-only room. Follow the host to join.</div></div>` : ''}${r.password ? `<div class="note">${icon('lock', 18)}<div>Password protected. Demo rooms use <b>${esc(HD.CONFIG.DEMO_ROOM_PASSWORD)}</b>. This is a browser-side check, not real security.</div></div>` : ''}
      <div class="row"><button class="btn primary grow" data-act="openRoom" data-id="${r.id}" ${r.status !== 'live' ? 'disabled' : ''}>${t('join')} room</button><button class="icon-btn" data-act="toggleFav" data-id="${r.id}" aria-label="Save room" style="${UI.isFav(r.id) ? 'color:var(--gold-t)' : ''}">${icon('star', 20)}</button><button class="icon-btn" data-act="shareRoom" data-id="${r.id}" aria-label="Share room">${icon('share', 20)}</button></div></div></div>`);
  } });
  HD.act.shareRoom = ({ id }) => { const r = HD.room(id); r && M.share(r); };

  // ---------- create room ----------
  R.add('create', { title: 'Create room', nav: 'rooms', render(v) {
    if (HD.me().isGuest) { v.innerHTML = UI.page(UI.top(t('createRoom')) + UI.empty('mic', 'Account needed', 'Guests can browse and listen. Create a free local demo account to host your own room.', '<button class="btn primary" data-go="#register">Create account</button>')); return; }
    let cover = null;
    v.innerHTML = UI.page(UI.top(t('createRoom')) + `<form id="cf" novalidate><div class="field"><label for="c-t">Room name</label><input id="c-t" class="input" maxlength="40" placeholder="e.g. Sunday Night Debugging" required></div>
      <div class="field"><label for="c-d">Description</label><textarea id="c-d" class="input" maxlength="140" placeholder="What is this room about?"></textarea></div>
      <div class="row"><div class="field grow"><label for="c-c">Category</label><select id="c-c" class="input">${REAL.map(c => `<option value="${c[0]}">${c[1]}</option>`).join('')}</select></div><div class="field grow"><label for="c-l">Language</label><select id="c-l" class="input">${HD.demo.LANGS.map(l => `<option>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label for="c-lay">Seat layout</label><select id="c-lay" class="input"><option value="spotlight">Spotlight host + 7 seats</option><option value="grid10">Numbered grid · 10 seats</option></select></div><div class="field"><label for="c-img">Room cover (optional)</label><input id="c-img" type="file" accept="image/*" class="input" style="padding:10px"><div id="c-prev" class="small faint">A generated cover is used if you skip this.</div></div>
      <div class="field"><label for="c-p">Privacy</label><select id="c-p" class="input"><option value="public">Public</option><option value="private">Private (invite only)</option><option value="password">Password protected</option><option value="followers">Followers only</option></select></div>
      <div class="field" id="c-pwf" hidden><label for="c-pw">Room password</label><input id="c-pw" class="input" maxlength="20"></div>
      <div class="group" style="margin-bottom:14px"><label class="sw"><span>Schedule for later<div class="small muted">Create an event with reminders instead of going live now</div></span><input type="checkbox" id="c-sch"><span class="t"></span></label><div id="c-whenf" hidden style="padding:0 0 12px"><input id="c-when" type="datetime-local" class="input" aria-label="Start time"></div><label class="sw"><span>Slow mode<div class="small muted">8 seconds between chat messages</div></span><input type="checkbox" id="c-s"><span class="t"></span></label><label class="sw"><span>Followers only<div class="small muted">Only people who follow you can join</div></span><input type="checkbox" id="c-f"><span class="t"></span></label><label class="sw"><span>Allow guests<div class="small muted">Let people without accounts listen</div></span><input type="checkbox" id="c-g" checked><span class="t"></span></label></div>
      <div class="note" style="margin-bottom:16px">${icon('shield', 18)}<div>Privacy options are enforced in your browser only. See docs/SECURITY.md.</div></div><button class="btn primary block" type="submit">${t('createRoom')}</button></form>`);
    $('#c-sch', v).addEventListener('change', e => { $('#c-whenf', v).hidden = !e.target.checked; if (e.target.checked && !$('#c-when', v).value) { const d = new Date(Date.now() + 36e5 - new Date().getTimezoneOffset() * 6e4); $('#c-when', v).value = d.toISOString().slice(0, 16); } $('#cf button[type=submit]', v).textContent = e.target.checked ? 'Schedule room' : t('createRoom'); });
    $('#c-p', v).addEventListener('change', e => { $('#c-pwf', v).hidden = e.target.value !== 'password'; });
    $('#c-img', v).addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { cover = await U.resizeImage(f, 640); $('#c-prev', v).innerHTML = `<img src="${cover}" alt="Cover preview" style="height:90px;border-radius:12px;margin-top:6px">`; } catch (x) { HD.toast.err('Could not read that image'); } });
    $('#cf', v).addEventListener('submit', e => {
      e.preventDefault(); const title = $('#c-t', v).value.trim(); if (!title) { HD.toast.err('Give your room a name'); return $('#c-t', v).focus(); }
      const priv = $('#c-p', v).value, pw = $('#c-pw', v).value.trim(); if (priv === 'password' && !pw) return HD.toast.err('Enter a room password');
      if ($('#c-sch', v).checked) { const at = new Date($('#c-when', v).value).getTime(); if (!at || at < Date.now() + 30000) return HD.toast.err('Pick a start time in the future'); HD.events.create({ title, desc: $('#c-d', v).value.trim(), category: $('#c-c', v).value, language: $('#c-l', v).value, startsAt: at }); HD.toast.ok('Room scheduled', 'calendar'); UI.roomsTab = 'upcoming'; return R.go('#rooms'); }
      const r = HD.rooms.create({ title, desc: $('#c-d', v).value.trim(), category: $('#c-c', v).value, language: $('#c-l', v).value, privacy: priv, password: pw, layout: $('#c-lay', v).value, cover, slowMode: $('#c-s', v).checked, followersOnly: $('#c-f', v).checked, allowGuests: $('#c-g', v).checked });
      HD.toast.ok('Room created!', 'mic'); R.go('#room/' + r.id);
    });
  } });

  // ---------- search ----------
  R.add('search', { title: 'Search', nav: 'search', render(v) {
    const st = HD.state.getState();
    v.innerHTML = UI.page(`<header class="topbar"><button class="icon-btn" data-back aria-label="Back">${icon('back')}</button><input id="s-q" class="input" style="min-height:42px;border-radius:999px" type="search" placeholder="Search users, rooms, categories" aria-label="Search" autocomplete="off"></header><div id="s-out"></div>`);
    const q = $('#s-q', v), out = $('#s-out', v); q.focus();
    const recent = () => { const rs = st.recentSearches; out.innerHTML = rs.length ? `<div class="sect-h" style="margin-top:14px"><h3>Recent</h3><button class="link" data-act="clearRecent">Clear history</button></div><div class="row wrap">${rs.map(x => `<button class="chip" data-act="useSearch" data-q="${esc(x)}">${icon('history', 14)} ${esc(x)}</button>`).join('')}</div>` : `<div class="seg-title">TRY</div><div class="row wrap">${['chill', 'music', 'Malayalam', 'privacy', 'arjun'].map(x => `<button class="chip" data-act="useSearch" data-q="${x}">${x}</button>`).join('')}</div>`; };
    const run = () => {
      const s = q.value.trim().toLowerCase(); if (!s) return recent();
      const users = st.users.filter(u => !st.social.blocked.includes(u.id) && (u.name + ' ' + u.handle + ' ' + u.country + ' ' + u.id).toLowerCase().includes(s)).slice(0, 8);
      const rooms = HD.rooms.list({ q: s }).slice(0, 8), cats = CATS.filter(c => c[1].toLowerCase().includes(s));
      out.innerHTML = (cats.length ? `<div class="seg-title">CATEGORIES</div><div class="row wrap">${cats.map(c => `<button class="chip" data-act="goCat" data-c="${c[0]}">${c[1]}</button>`).join('')}</div>` : '') + (users.length ? `<div class="seg-title">USERS</div><div class="group">${users.map(u => UI.userRow(u, u.id === 'me' ? '' : UI.followBtn(u.id))).join('')}</div>` : '') + (rooms.length ? `<div class="seg-title">ROOMS</div><div class="col">${rooms.map(UI.roomRow).join('')}</div>` : '') + (!cats.length && !users.length && !rooms.length ? UI.empty('search', 'No results', 'Try a different word.') : '');
    };
    const save = U.debounce(() => { const s = q.value.trim(); if (s.length > 1) { st.recentSearches = [s].concat(st.recentSearches.filter(x => x.toLowerCase() !== s.toLowerCase())).slice(0, 8); HD.state.persistState(); } }, 900);
    q.addEventListener('input', () => { run(); save(); }); recent(); UI.searchRun = run;
    UI.searchSet = s => { q.value = s; run(); q.focus(); };
  } });
  HD.act.clearRecent = () => { HD.state.getState().recentSearches = []; HD.state.persistState(); UI.searchRun(); HD.toast.show('Search history cleared'); };
  HD.act.useSearch = ({ q }) => UI.searchSet(q);
})();
