/* VIP tiers (bought with demo coins), Prestige levels (earned by spending), titles, influence levels,
 * special IDs and mystery mode. Original names/art; everything is simulated and costs only demo coins. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $ } = U, UI = HD.ui, R = HD.router, M = HD.modal, CS = HD.CONFIG.COIN_SYMBOL;
  const S = () => HD.state.getState();

  // ---------- VIP tiers ----------
  HD.TIERS = [['spark', 'Spark', 2000, '#ffb86b', '🔥'], ['flare', 'Flare', 5000, '#ff8a5b', '☄️'], ['blaze', 'Blaze', 10000, '#ff5c8a', '🌋'], ['aurora', 'Aurora', 20000, '#3ddc97', '🌌'], ['nova', 'Nova', 40000, '#4da3ff', '💫'], ['zenith', 'Zenith', 80000, '#a56bff', '🔱'], ['apex', 'Apex', 160000, '#f5c451', '👑'], ['omni', 'Omni', 320000, '#ffd45e', '🌟']].map((t, i) => ({ n: i + 1, id: t[0], name: t[1], price: t[2], color: t[3], emoji: t[4], coinsDay: [200, 500, 1000, 2500, 5000, 12000, 30000, 80000][i], mods: 4 + i * 4, xp: +(1.05 + i * .12).toFixed(2) }));
  // [id, emoji, name, description, min tier, implemented-effect?]
  HD.PRIVS = [['medal', '🏅', 'Tier medal', 'A medal next to your name everywhere', 1], ['nick', '🎨', 'Colour nickname', 'Gradient name in chat and lists', 1], ['entrance', '✨', 'Entrance effect', 'A banner announces you when you join', 1], ['cmsg', '💬', 'Colour message', 'Your chat messages get a tinted bubble', 1], ['daily', '🪙', 'Daily coins', 'Claim a stipend of demo coins every day', 1], ['mods', '🛡️', 'More room admins', 'Raises how many moderators you can add', 1],
    ['card', '🪪', 'Name card', 'A premium card on your profile', 2], ['xp', '🚀', 'Level acceleration', 'Earn XP faster', 2], ['frame', '👑', 'Exclusive headwear', 'Unlocks the tier avatar frame in the Props store', 2], ['emoji', '😎', 'Exclusive emoji', 'Extra reactions in the tray', 2],
    ['free', '🎙️', 'Speak freely', 'Skip slow-mode limits in chat', 3], ['mount', '🏎️', 'Exclusive mount', 'Unlocks the tier mount for entrance rides', 3], ['flash', '⚡', 'Profile flash', 'Animated shimmer on your profile', 3], ['member', '📌', 'Member list on top', 'You are listed first among listeners', 3],
    ['bg', '🖼️', 'Profile backgrounds', 'Choose your profile cover', 4], ['mystery', '🕵️', 'Mystery mode', 'Hide your identity in rooms (free while VIP)', 4], ['kick', '🧱', 'Anti-kick', 'Moderators cannot remove you', 4], ['mic', '🎤', 'Mic aura', 'A coloured aura when you speak', 4],
    ['horn', '📣', 'Flying message', 'Send a banner across the whole room', 5], ['seat', '💺', 'Priority seat', 'A VIP badge on your seat', 5], ['sticker', '🎭', 'Animated stickers', 'Fun animated stickers in chat', 6], ['announce', '📰', 'Picture announcements', 'Add a picture-style room announcement', 6], ['hide', '🙈', 'Hide online status', 'Appear offline in lists', 7], ['upgrade', '📢', 'Upgrade announcement', 'A system notice celebrates your new tier', 8]].map(p => ({ id: p[0], emoji: p[1], name: p[2], desc: p[3], min: p[4] }));
  const V = HD.vip = {
    current() { const v = S().vip; return v && v.until > Date.now() ? v.tier : 0; },
    tier() { const n = V.current(); return n ? HD.TIERS[n - 1] : null; },
    has(id) { const p = HD.PRIVS.find(x => x.id === id); return !!p && V.current() >= p.min; },
    sync() { const me = HD.me(); if (!me) return; const n = V.current(); me.tier = n; me.prestige = HD.prestige.level(); me.flash = V.has('flash'); const s = S(); if (me.mystery && !V.has('mystery') && !(s.vip.mysteryUntil > Date.now())) me.mystery = false; },
    buy(n, days = 30) {
      const t = HD.TIERS[n - 1], s = S(); if (!t) return { ok: false, msg: 'Unknown tier' }; const price = Math.round(t.price * days / 30); if (s.wallet.balance < price) return { ok: false, msg: 'Not enough demo coins' };
      s.wallet.balance -= price; HD.gifts.tx('vip', -price, `VIP ${t.name} · ${days} days`); const base = V.current() === n ? s.vip.until : Date.now(); s.vip.tier = n; s.vip.until = base + days * 864e5; V.sync(); HD.progress.addXp(40, 'vip'); HD.state.persistState(); HD.bus.emit('wallet');
      if (V.has('upgrade')) HD.notify.add({ type: 'system', text: `📢 ${HD.me().name} reached VIP ${t.name}!` }); return { ok: true };
    },
    dailyClaimed() { return S().vip.lastDaily === U.today(); },
    claimDaily() { const t = V.tier(); if (!t) return { ok: false, msg: 'Activate a VIP tier first' }; if (V.dailyClaimed()) return { ok: false, msg: 'Already claimed today' }; const s = S(); s.vip.lastDaily = U.today(); s.wallet.balance += t.coinsDay; HD.gifts.tx('bonus', t.coinsDay, `VIP ${t.name} daily coins`); HD.state.persistState(); HD.bus.emit('wallet'); return { ok: true, amt: t.coinsDay }; },
    xpMult() { const t = V.tier(); return t ? t.xp : 1; },
    maxMods() { const t = V.tier(); return t ? t.mods : 3; }
  };
  UI.tierPill = (n, small) => { const t = HD.TIERS[n - 1]; return t ? `<span class="tier" style="--tc:${t.color}${small ? ';font-size:9.5px;height:15px' : ''}" title="VIP ${t.name}">${t.emoji} ${t.name}</span>` : ''; };
  UI.presPill = n => n ? `<span class="pres" title="Prestige ${n}">P${n}</span>` : '';
  HD.cosmetic = { nameCls: uid => { const u = HD.user(uid); return u && u.tier ? 'nick-vip' : ''; }, nameStyle: uid => { const u = HD.user(uid); const t = u && u.tier ? HD.TIERS[u.tier - 1] : null; return t ? `--tc:${t.color}` : ''; }, bubbleCls: uid => { if (uid !== 'me') return ''; const e = S().shop.equip || {}; return (e.bubble ? ' bub-' + e.bubble : '') + (V.has('cmsg') && !e.bubble ? ' bub-vip' : ''); } };

  // ---------- Prestige (earned, not bought) ----------
  const PT = [0, 500, 2000, 5000, 12000, 30000, 70000, 150000, 300000, 600000, 1200000];
  const PNAMES = ['Newcomer', 'Patron', 'Benefactor', 'Champion', 'Luminary', 'Paragon', 'Sovereign', 'Eminent', 'Exalted', 'Mythic', 'Eternal'];
  const PRIV = [['🎖️', 'Prestige badge'], ['🖼️', 'Prestige frame'], ['⭐', 'Profile star'], ['🏆', 'Honor title'], ['🎟️', 'Weekly bag gift'], ['🛋️', 'Lounge seat'], ['🌠', 'Entrance sparkle'], ['💎', 'Diamond name'], ['📣', 'Broadcast pass'], ['🔮', 'Mythic aura'], ['♾️', 'Eternal crest']];
  HD.prestige = { thresholds: PT, names: PNAMES, level() { const sp = (S().stats || {}).coinsSpent || 0; let l = 0; PT.forEach((t, i) => { if (sp >= t && i > 0) l = i; }); return l; }, points: () => (S().stats || {}).coinsSpent || 0 };

  // ---------- Titles ----------
  HD.TITLES = [['room_star', 'Room Star', '🎙️', 'Join rooms', () => S().stats.roomsJoined, [5, 25, 100], 'linear-gradient(90deg,#c0763a,#f0b36a)'], ['charm_star', 'Charm Star', '💖', 'Receive gifts', () => S().stats.giftsReceived, [3, 20, 100], 'linear-gradient(90deg,#3d8bff,#62e6ff)'], ['honor_star', 'Honor Star', '🏵️', 'Unlock achievements', () => Object.keys(S().achievements).length, [3, 6, 10], 'linear-gradient(90deg,#d99a1c,#ffe08a)'], ['regal_star', 'Regal Star', '👑', 'Reach prestige levels', () => HD.prestige.level(), [2, 5, 8], 'linear-gradient(90deg,#9c6b3a,#e8b98a)'], ['game_king', 'Game King', '🎮', 'Win mini-games', () => S().stats.gamesWon, [3, 15, 50], 'linear-gradient(90deg,#ff3d7f,#ff9d4d)'], ['sweet_cp', 'Sweet CP', '💞', 'Level up your CP bond', () => (S().cp ? S().cp.level || 1 : 0), [1, 3, 5], 'linear-gradient(90deg,#ff6bd6,#ffb6e9)'], ['moment_star', 'Moment Star', '✨', 'Get likes on moments', () => S().stats.momentLikes, [5, 30, 120], 'linear-gradient(90deg,#7c5cff,#34e0ff)'], ['social_star', 'Social Star', '🤝', 'Make friends', () => S().friends.length, [3, 8, 20], 'linear-gradient(90deg,#1fb77a,#9af0c4)']].map(t => ({ id: t[0], name: t[1], emoji: t[2], desc: t[3], val: t[4], steps: t[5], bg: t[6] }));
  HD.titleTier = t => { const v = t.val(); let n = 0; t.steps.forEach((x, i) => { if (v >= x) n = i + 1; }); return n; };
  UI.titleBadge = (id, tier) => { const t = HD.TITLES.find(x => x.id === id); return t ? `<span class="ttl-b" style="background:${t.bg}">${t.emoji} ${esc(t.name)}${tier ? ' No.' + (4 - tier) : ''}</span>` : ''; };

  // ---------- Influence ----------
  HD.influence = () => { const s = S(); return { wealth: Math.floor(Math.sqrt((s.stats.coinsSpent || 0) / 10)), charm: Math.floor(Math.sqrt((s.stats.charm || 0) / 5)), activity: HD.progress.info(s.stats.xp).level * 3 + Math.floor(s.stats.roomsJoined / 2) }; };

  // ---------- Special IDs ----------
  HD.SIDS = [['100000', 'Genesis', 50000], ['123456', 'Straight', 12000], ['520520', 'I love you', 15000], ['666666', 'Lucky six', 25000], ['777777', 'Lucky seven', 40000], ['888888', 'Fortune', 60000], ['999999', 'Longevity', 55000], ['1314520', 'Forever', 30000], ['2468024', 'Even steps', 6000], ['5555555', 'Quintuple', 20000]].map(x => ({ id: x[0], name: x[1], price: x[2] }));
  HD.displayId = u => u.sid || (u.id === 'me' ? '100001' : u.id.replace('u', '').padStart(6, '0'));
  HD.sidTaken = id => S().users.some(u => u.sid === id) || id === '777777' || id === '888888';

  // ---------- Mystery ----------
  HD.mystery = { active: () => !!(HD.me() && HD.me().mystery), can() { return V.has('mystery') || (S().vip.mysteryUntil || 0) > Date.now(); }, set(on) { const me = HD.me(); me.mystery = on; HD.state.persistState(); HD.bus.emit('room:change'); }, rent(days) { const price = 3000 * days; const s = S(); if (s.wallet.balance < price) return { ok: false, msg: 'Not enough demo coins' }; s.wallet.balance -= price; HD.gifts.tx('shop', -price, `Mystery mode · ${days} days`); s.vip.mysteryUntil = Math.max(Date.now(), s.vip.mysteryUntil || 0) + days * 864e5; HD.state.persistState(); HD.bus.emit('wallet'); return { ok: true }; } };

  // ---------- screens ----------
  const gate = (v, title) => { if (HD.me().isGuest) { v.innerHTML = UI.page(UI.top(title) + UI.empty('star', 'Account needed', 'Create a free local demo account to use this.', '<button class="btn primary" data-go="#register">Create account</button>')); return true; } };
  R.add('vip', { title: 'VIP', nav: 'vip', render(v, [tab]) {
    if (gate(v, 'VIP')) return; let sel = +tab || V.current() || 1, days = 30;
    const draw = () => { const t = HD.TIERS[sel - 1], cur = V.current(), s = S(), un = HD.PRIVS.filter(p => p.min <= sel).length, price = Math.round(t.price * days / 30);
      v.innerHTML = UI.page(UI.top('VIP', { actions: `<span class="coin">${CS} ${U.fmt(s.wallet.balance)}</span>` }) + `<div class="tabs" role="tablist" style="margin-bottom:12px">${HD.TIERS.map(x => `<button class="tab ${x.n === sel ? 'on' : ''}" role="tab" aria-selected="${x.n === sel}" data-tier="${x.n}">${x.name}</button>`).join('')}</div>
      <div class="vip-hero" style="--tc:${t.color}"><div class="vip-medal pop">${t.emoji}</div><h2>${esc(t.name)}</h2><div class="muted small">${cur === sel ? 'Active until ' + U.date(s.vip.until) : cur > sel ? 'You have a higher tier' : 'Not active'}</div></div>
      <div class="center" style="margin:14px 0 4px"><b style="color:var(--gold-t)">◆ Aristocratic privileges ◆</b><div class="muted small">${un}/${HD.PRIVS.length} · ${U.fmt(t.coinsDay)} coins/day · ${t.mods} room admins · XP ×${t.xp}</div></div>
      <div class="privs">${HD.PRIVS.map(p => `<div class="priv ${p.min <= sel ? '' : 'lock'}"><span class="e">${p.emoji}</span><b>${esc(p.name)}</b><small>${p.min <= sel ? '' : 'Tier ' + p.min + '+'}</small></div>`).join('')}</div>
      <div class="card pad col" style="margin-top:16px;gap:12px"><div class="row" role="group" aria-label="Duration">${[7, 30, 90].map(d => `<button class="chip ${d === days ? 'on' : ''}" data-days="${d}" aria-pressed="${d === days}">${d} days</button>`).join('')}</div>
      <button class="btn primary block" data-act="vipBuy" data-n="${sel}" data-d="${days}">${cur === sel ? 'Extend' : 'Activate'} · ${CS} ${U.fmt(price)}</button>
      ${cur ? `<button class="btn block" data-act="vipDaily" ${V.dailyClaimed() ? 'disabled' : ''}>${V.dailyClaimed() ? 'Daily coins claimed' : 'Claim daily ' + U.fmt(HD.TIERS[cur - 1].coinsDay) + ' coins'}</button>` : ''}<p class="faint small">Demo coins only. Nothing is charged and nothing is real.</p></div>`); };
    v.addEventListener('click', e => { const t = e.target.closest('[data-tier]'), d = e.target.closest('[data-days]'); if (t) { sel = +t.dataset.tier; draw(); } if (d) { days = +d.dataset.days; draw(); } });
    HD.act.vipBuy = ({ n, d }) => { const r = V.buy(+n, +d); if (!r.ok) { HD.toast.err(r.msg); return M.recharge(); } HD.fx.confetti(); HD.sfx.play('win'); HD.toast.ok('VIP activated', 'crown'); draw(); };
    HD.act.vipDaily = () => { const r = V.claimDaily(); r.ok ? (HD.toast.ok('+' + U.fmt(r.amt) + ' coins', 'wallet'), draw()) : HD.toast.err(r.msg); };
    draw(); return HD.bus.on('wallet', () => { }); } });

  R.add('prestige', { title: 'Prestige', nav: 'prestige', render(v) {
    if (gate(v, 'Prestige')) return; const pts = HD.prestige.points(), lv = HD.prestige.level(), nx = PT[lv + 1], pct = nx ? Math.round((pts - PT[lv]) / (nx - PT[lv]) * 100) : 100;
    v.innerHTML = UI.page(UI.top('Prestige') + `<div class="vip-hero" style="--tc:#f5c451"><div class="vip-medal">${lv ? '🏛️' : '🌱'}</div><h2>${lv ? 'Prestige ' + lv + ' · ' + PNAMES[lv] : 'Not started'}</h2><div class="muted small">${U.fmt(pts)} points earned · you earn 1 point per demo coin spent on gifts, props and VIP</div></div>
      <div class="card pad" style="margin-top:12px"><div class="row between"><b>Progress</b><span class="muted small">${nx ? U.fmt(nx - pts) + ' points to Prestige ' + (lv + 1) : 'Max level reached'}</span></div><div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>
      <div class="seg-title">PRIVILEGES BY LEVEL</div><div class="group">${PT.slice(1).map((t, i) => `<div class="li ${i + 1 > lv ? 'faint' : ''}" style="${i + 1 > lv ? 'opacity:.55' : ''}"><span class="ic-wrap" style="font-size:20px">${PRIV[i][0]}</span><span class="grow"><b>P${i + 1} · ${PNAMES[i + 1]}</b><div class="muted small">${PRIV[i][1]} · ${U.fmt(t)} points</div></span>${i + 1 <= lv ? icon('check', 18) : icon('lock', 16)}</div>`).join('')}</div>`);
  } });

  R.add('titles', { title: 'Titles', nav: 'titles', render(v) {
    if (gate(v, 'Titles')) return; const draw = () => { const me = HD.me();
      v.innerHTML = UI.page(UI.top('Titles') + `<p class="muted small" style="margin-bottom:12px">Earn titles through activity, then wear one next to your name.</p><div class="shop-grid">${HD.TITLES.map(t => { const tr = HD.titleTier(t), eq = me.title && me.title.id === t.id, val = t.val(), nxt = t.steps[tr] || t.steps[2];
        return `<div class="shop-item ${eq ? 'eq' : ''}"><span class="ttl-b" style="background:${t.bg};${tr ? '' : 'filter:grayscale(1);opacity:.5'}">${t.emoji} ${esc(t.name)}${tr ? ' No.' + (4 - tr) : ''}</span><div class="small muted">${esc(t.desc)}: ${val}/${nxt}</div><div class="bar" style="width:100%"><i style="width:${Math.min(100, val / nxt * 100)}%"></i></div>${tr ? `<button class="btn sm ${eq ? '' : 'primary'}" data-act="titleEq" data-id="${t.id}">${eq ? 'Remove' : 'Wear'}</button>` : '<span class="bdg">Locked</span>'}</div>`; }).join('')}</div>`); };
    HD.act.titleEq = ({ id }) => { const me = HD.me(); me.title = me.title && me.title.id === id ? null : { id, tier: HD.titleTier(HD.TITLES.find(x => x.id === id)) }; HD.state.persistState(); draw(); }; draw(); } });

  R.add('influence', { title: 'Influence', nav: 'influence', render(v) {
    if (gate(v, 'Influence')) return; const i = HD.influence(), rows = [['wealth', '💰', 'Wealth', i.wealth, 'Grows as you spend demo coins on gifts, props and VIP.'], ['charm', '💖', 'Charm', i.charm, 'Grows when you receive gifts on stage.'], ['activity', '⚡', 'Activity', i.activity, 'Grows with XP and joining rooms.']];
    v.innerHTML = UI.page(UI.top('Influence') + `<div class="col">${rows.map(r => `<div class="card pad"><div class="row"><span style="font-size:30px">${r[1]}</span><div class="grow"><b>${r[2]} level</b><div class="muted small">${r[4]}</div></div><span class="lvl" style="font-size:18px">${r[3]}</span></div><div class="bar" style="margin-top:10px"><i style="width:${Math.min(100, r[3])}%"></i></div></div>`).join('')}</div>`);
  } });

  R.add('specialid', { title: 'Special ID', nav: 'specialid', render(v) {
    if (gate(v, 'Special ID')) return; const draw = () => { const me = HD.me(), s = S();
      v.innerHTML = UI.page(UI.top('Special ID', { actions: `<span class="coin">${CS} ${U.fmt(s.wallet.balance)}</span>` }) + `<div class="card pad center"><div class="muted small">Your ID</div><div class="sid-big">${esc(HD.displayId(me))}</div>${me.sid ? '<button class="btn sm" data-act="sidClear">Restore default ID</button>' : '<span class="faint small">Default ID</span>'}</div><div class="seg-title">AVAILABLE IDS</div><div class="group">${HD.SIDS.map(x => { const taken = HD.sidTaken(x.id), own = me.sid === x.id; return `<div class="li"><span class="ic-wrap sid-ic">ID</span><span class="grow"><b class="mono" style="font-size:17px">${x.id}</b><div class="muted small">${esc(x.name)}</div></span>${own ? '<span class="bdg host">Yours</span>' : taken ? '<span class="bdg">Taken</span>' : `<button class="btn sm primary" data-act="sidBuy" data-id="${x.id}">${CS} ${U.fmt(x.price)}</button>`}</div>`; }).join('')}</div>`); };
    HD.act.sidBuy = ({ id }) => { const x = HD.SIDS.find(y => y.id === id), s = S(); if (s.wallet.balance < x.price) { HD.toast.err('Not enough demo coins'); return M.recharge(); } s.wallet.balance -= x.price; HD.gifts.tx('shop', -x.price, 'Special ID ' + id); HD.me().sid = id; HD.progress.addXp(20, 'sid'); HD.state.persistState(); HD.bus.emit('wallet'); HD.fx.confetti(); HD.toast.ok('Special ID set', 'star'); draw(); };
    HD.act.sidClear = () => { HD.me().sid = null; HD.state.persistState(); draw(); }; draw(); } });

  R.add('mystery', { title: 'Mystery mode', nav: 'mystery', render(v) {
    if (gate(v, 'Mystery')) return; const draw = () => { const me = HD.me(), can = HD.mystery.can(), left = Math.max(0, (S().vip.mysteryUntil || 0) - Date.now());
      v.innerHTML = UI.page(UI.top('Mystery mode') + `<div class="vip-hero" style="--tc:#7c5cff"><img src="${U.mysteryAvatar()}" alt="" style="width:110px;height:110px;border-radius:50%;margin:0 auto;box-shadow:0 0 30px rgba(124,92,255,.7)"><h2>Hide behind a mask</h2><p class="muted small">In rooms you appear as “Mystery ####” with a masked avatar. Your real profile stays hidden.</p></div>
      <div class="group" style="margin-top:14px"><label class="sw"><span>Mystery mode<div class="small muted">${can ? 'Applies to rooms you join' : 'Needs VIP ' + HD.TIERS[3].name + '+ or a rental'}</div></span><input type="checkbox" id="my-t" ${me.mystery ? 'checked' : ''} ${can ? '' : 'disabled'}><span class="t"></span></label></div>
      ${left > 0 ? `<p class="muted small" style="margin-top:8px">Rental active for ${U.dur(left)}.</p>` : ''}<div class="card pad col" style="margin-top:14px"><b>Rent mystery mode</b><div class="row">${[1, 7, 30].map(d => `<button class="btn grow" data-act="myRent" data-d="${d}">${d}d · ${CS} ${U.fmt(3000 * d)}</button>`).join('')}</div></div><p class="faint small" style="margin-top:12px">Demo feature: it only masks you inside this app’s simulated rooms.</p>`);
      const t = $('#my-t', v); t && t.addEventListener('change', e => { HD.mystery.set(e.target.checked); HD.toast.show(e.target.checked ? 'Mystery mode on' : 'Mystery mode off', { icon: 'eye' }); }); };
    HD.act.myRent = ({ d }) => { const r = HD.mystery.rent(+d); r.ok ? (HD.toast.ok('Mystery mode unlocked', 'eye'), draw()) : (HD.toast.err(r.msg), M.recharge()); }; draw(); } });

  setInterval(() => { if (S().currentUser) V.sync(); }, 20000);
})();
