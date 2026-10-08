(function () {
  const HD = window.HD, U = HD.utils, { esc, icon } = U; const M = HD.modal = {};
  let stack = [];
  const FOCUS = 'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  M.open = function (o) {
    const root = U.$('#modal-root'), prev = document.activeElement;
    const scrim = document.createElement('div'); scrim.className = 'scrim ' + (o.className || '');
    const acts = (o.actions || []).map((a, i) => `<button class="btn ${a.kind || ''}" data-i="${i}">${esc(a.label)}</button>`).join('');
    scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(o.title || 'Dialog')}"><div class="grab"></div>
      <div class="sheet-h"><h2>${esc(o.title || '')}</h2><button class="icon-btn" data-x aria-label="Close">${icon('close', 18)}</button></div>
      <div class="sheet-b">${o.body || ''}</div>${acts ? `<div class="sheet-f">${acts}</div>` : ''}</div>`;
    root.appendChild(scrim);
    const h = { el: scrim, body: U.$('.sheet-b', scrim), done: false };
    h.close = (val) => {
      if (h.done) return; h.done = true; stack = stack.filter(x => x !== h);
      scrim.classList.add('closing'); setTimeout(() => scrim.remove(), 200);
      try { prev && prev.focus && prev.focus(); } catch (e) { } o.onClose && o.onClose(val);
    };
    scrim.addEventListener('mousedown', e => { if (e.target === scrim && o.dismissible !== false) h.close(); });
    scrim.addEventListener('click', e => {
      if (e.target.closest('[data-x]')) return h.close();
      const b = e.target.closest('.sheet-f [data-i]'); if (b) { const a = o.actions[+b.dataset.i]; const r = a.onClick ? a.onClick(h) : undefined; if (!a.keepOpen && r !== false) h.close(a.value); }
    });
    scrim.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); h.close(); }
      if (e.key === 'Tab') { const f = U.$$(FOCUS, scrim).filter(x => x.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    stack.push(h); o.onOpen && o.onOpen(h);
    setTimeout(() => { const f = U.$('[autofocus],.sheet-b input,.sheet-f .btn.primary,.sheet-b button', scrim) || U.$('[data-x]', scrim); f && f.focus(); }, 60);
    return h;
  };
  M.closeAll = () => stack.slice().forEach(h => h.close());
  M.confirm = (title, text, o = {}) => new Promise(res => { let r = false; M.open({ title, body: `<p class="muted">${text}</p>`, onClose: () => res(r), actions: [{ label: o.cancel || 'Cancel', kind: 'ghost' }, { label: o.ok || 'Confirm', kind: o.danger ? 'danger' : 'primary', onClick: () => { r = true; } }] }); });
  M.alert = (title, text, ok = 'Got it') => new Promise(res => M.open({ title, body: `<div class="muted">${text}</div>`, onClose: res, actions: [{ label: ok, kind: 'primary' }] }));
  M.prompt = (title, o = {}) => new Promise(res => {
    let val = null; const h = M.open({ title, onClose: () => res(val), body: `<div class="field"><label for="pm-in">${esc(o.label || '')}</label>${o.hint ? `<div class="small faint">${esc(o.hint)}</div>` : ''}<input id="pm-in" class="input" type="${o.type || 'text'}" value="${esc(o.value || '')}" placeholder="${esc(o.placeholder || '')}" maxlength="${o.max || 80}" autocomplete="off"></div>`, actions: [{ label: 'Cancel', kind: 'ghost' }, { label: o.ok || 'Save', kind: 'primary', onClick: hh => { val = U.$('#pm-in', hh.el).value.trim(); if (!val && !o.allowEmpty) { HD.toast.err('Enter a value first'); val = null; return false; } } }] });
    U.$('#pm-in', h.el).addEventListener('keydown', e => { if (e.key === 'Enter') { const b = U.$('.sheet-f .primary', h.el); b && b.click(); } });
  });
  M.requireAccount = (what = 'do that') => {
    const me = HD.me(); if (me && !me.isGuest) return true;
    M.open({ title: 'Create a free account', body: `<p class="muted">Guests can browse and listen. To ${esc(what)}, create a local demo account. It stays on this device.</p>`, actions: [{ label: 'Not now', kind: 'ghost' }, { label: 'Create account', kind: 'primary', onClick: () => { location.hash = '#register'; } }] });
    return false;
  };
  M.demoNote = () => M.open({ title: 'Demo mode', body: `<div class="note">${icon('info', 18)}<div>This is a frontend-only demonstration. Live multi-user communication, real authentication, real payments and server-side moderation require backend services.</div></div>`, actions: [{ label: 'Close', kind: 'ghost' }, { label: 'Learn more', kind: 'primary', onClick: () => { location.hash = '#demo'; } }] });

  // ---------- user quick profile ----------
  M.profile = uid => {
    if (uid === 'me') { location.hash = '#profile'; return; }
    const u = HD.user(uid), soc = HD.social, fol = soc.isFollowing(uid);
    const h = M.open({ title: 'Profile', body: `<div class="center col" style="align-items:center;gap:8px"><span class="avw" style="--s:88px"><img class="av" src="${HD.userAvatar(u)}" alt=""></span>
      <h2>${esc(u.name)} ${u.verified ? `<span class="vf">${icon('verified', 18)}</span>` : ''}</h2><div class="muted small">@${esc(u.handle)} · ${u.flag} ${esc(u.country)} · ID ${esc(u.id.replace('u', '').padStart(6, '0'))}</div>
      <div class="row wrap" style="justify-content:center"><span class="lvl">Lv ${u.level}</span>${u.vip ? '<span class="bdg vip">VIP</span>' : ''}</div><p class="muted">${esc(u.bio)}</p></div>
      <div class="stats" style="margin:12px 0"><div class="stat"><b>${U.short(u.followers)}</b><span>Followers</span></div><div class="stat"><b>${U.short(u.following)}</b><span>Following</span></div><div class="stat"><b>${U.short(u.likes)}</b><span>Likes</span></div></div>`,
      actions: [{ label: fol ? 'Following' : 'Follow', kind: fol ? '' : 'primary', keepOpen: true, onClick: hh => { if (!M.requireAccount('follow people')) return; const now = soc.isFollowing(uid); now ? soc.unfollow(uid) : soc.follow(uid); const b = U.$('.sheet-f .btn', hh.el); b.textContent = now ? 'Follow' : 'Following'; b.classList.toggle('primary', now); } }, ].concat(HD.state.getState().currentRoom ? [{ label: 'Send gift', onClick: () => { const r = HD.room(HD.state.getState().currentRoom.id); setTimeout(() => M.gift(r, uid), 250); } }] : [{ label: 'Message', onClick: () => { if (!M.requireAccount('send messages')) return false; location.hash = '#messages/' + uid; } }, { label: 'View', onClick: () => { location.hash = '#profile/' + uid; } }]) });
    return h;
  };

  // ---------- share ----------
  M.share = room => {
    const url = HD.roomLink(room.id), txt = `Join "${room.title}" on ${HD.CONFIG.APP_NAME}`;
    const items = [['copy-id', 'Copy room ID', 'link'], ['copy-link', 'Copy room link', 'link'], ['wa', 'WhatsApp', 'chat'], ['tg', 'Telegram', 'send'], ['ig', 'Instagram', 'heart'], ['img', 'Save invite image', 'download'], ['sys', 'System share', 'share']];
    const h = M.open({ title: 'Share room', body: `<div class="muted small" style="margin-bottom:8px">Room ID <b class="mono">${esc(room.id)}</b></div><div class="input mono small trunc" style="min-height:0;margin-bottom:10px">${esc(url)}</div><div class="group">${items.map(i => `<button class="li" data-s="${i[0]}"><span class="ic-wrap">${icon(i[2], 20)}</span><span class="grow">${i[1]}</span></button>`).join('')}</div>`,
      onOpen: hh => hh.el.addEventListener('click', async e => {
        const b = e.target.closest('[data-s]'); if (!b) return; const k = b.dataset.s;
        if (k === 'copy-id') HD.toast.ok(await U.copy(room.id) ? 'Room ID copied' : 'Copy failed', 'link');
        else if (k === 'copy-link') HD.toast.ok(await U.copy(url) ? 'Copied to clipboard' : 'Copy failed', 'link');
        else if (k === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(txt + ' ' + url), '_blank', 'noopener');
        else if (k === 'tg') window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(txt), '_blank', 'noopener');
        else if (k === 'ig') { await U.copy(url); HD.toast.show('Instagram has no web share link — room link copied. Paste it in a story or DM.', { ms: 4200 }); }
        else if (k === 'img') { const r = await HD.shareCard(room); HD.toast.ok(r === 'shared' ? 'Image shared' : 'Invite image saved', 'download'); }
        else if (k === 'sys') { if (navigator.share) { try { await navigator.share({ title: room.title, text: txt, url }); } catch (e2) { } } else { await U.copy(url); HD.toast.show('Sharing is not supported here — link copied'); } }
      })
    });
  };

  // ---------- gift ----------
  M.gift = (room, preTo) => {
    if (!M.requireAccount('send gifts')) return;
    const st = HD.state.getState(); let sel = null, qty = 1;
    const ppl = room ? room.seats.concat(room.audience).filter((v, i, a) => a.indexOf(v) === i && v !== 'me') : st.users.filter(u => !st.social.blocked.includes(u.id)).slice(0, 12).map(u => u.id);
    let to = preTo || (room && room.hostId !== 'me' ? room.hostId : ppl[0]);
    if (!ppl.includes(to)) to = ppl[0];
    const body = () => `<div class="row between" style="margin-bottom:10px"><span class="coin">${HD.CONFIG.COIN_SYMBOL} <span id="gbal">${U.fmt(st.wallet.balance)}</span></span><button class="btn sm" data-r>Add demo coins</button></div>
      <div class="field"><label for="g-to">Send to</label><select id="g-to" class="input">${ppl.map(id => `<option value="${id}" ${id === to ? 'selected' : ''}>${esc(HD.user(id).name)}${room && id === room.hostId ? ' (host)' : ''}</option>`).join('')}</select></div>
      <div class="gifts" role="listbox" aria-label="Gifts">${st.gifts.map(g => `<button class="gift" role="option" data-g="${g.id}" aria-selected="false"><span class="e">${g.icon}</span><b>${esc(g.name)}</b><span>${U.fmt(g.price)}</span></button>`).join('')}</div>
      <div class="row between" style="margin-top:12px"><span class="muted small">Quantity</span><div class="row"><button class="icon-btn" data-q="-1" aria-label="Less">−</button><b id="gq" style="min-width:24px;text-align:center">1</b><button class="icon-btn" data-q="1" aria-label="More">+</button></div></div>
      <p class="faint tiny" style="margin-top:10px">Demo coins have no cash value. No real money is processed.</p>`;
    const h = M.open({ title: 'Send a gift', body: body(), actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Send gift', kind: 'primary', keepOpen: true, onClick: async hh => {
      if (!sel) return HD.toast.err('Pick a gift first'); if (!to) return HD.toast.err('Choose a recipient'); const g = st.gifts.find(x => x.id === sel), total = g.price * qty;
      if (st.wallet.balance < total) { HD.toast.err('Not enough demo coins'); return M.recharge(); }
      const ok = await M.confirm('Confirm gift', `Send <b>${qty}× ${g.name} ${g.icon}</b> to <b>${esc(HD.user(to).name)}</b> for <b>${U.fmt(total)}</b> demo coins?`, { ok: 'Send' });
      if (!ok) return; const r = HD.gifts.send({ giftId: sel, toId: to, roomId: room && room.id, qty }); if (r.ok) { hh.close(); HD.toast.ok('Gift sent!', 'gift'); } else HD.toast.err(r.msg);
    } }],
      onOpen: hh => {
        const q = s => U.$(s, hh.el);
        hh.el.addEventListener('click', e => {
          const g = e.target.closest('[data-g]'); if (g) { sel = g.dataset.g; U.$$('.gift', hh.el).forEach(x => { const on = x === g; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); }); }
          const qb = e.target.closest('[data-q]'); if (qb) { qty = U.clamp(qty + +qb.dataset.q, 1, 99); q('#gq').textContent = qty; }
          if (e.target.closest('[data-r]')) M.recharge();
        });
        hh.el.addEventListener('change', e => { if (e.target.id === 'g-to') to = e.target.value; });
        const off = HD.bus.on('wallet', () => { const b = q('#gbal'); if (b) b.textContent = U.fmt(st.wallet.balance); }); const oc = hh.close; hh.close = v => { off(); oc(v); };
      }
    });
    return h;
  };

  // ---------- recharge (demo) ----------
  M.recharge = () => {
    const packs = [[500, 'Starter'], [1000, 'Plus'], [5000, 'Pro'], [20000, 'Whale']];
    return M.open({ title: 'Add demo coins', body: `<div class="note" style="margin-bottom:12px">${icon('info', 18)}<div>Simulated top-up. No payment is taken and coins have no real value.</div></div><div class="group">${packs.map(p => `<button class="li" data-p="${p[0]}"><span class="ic-wrap">🪙</span><span class="grow"><b>${U.fmt(p[0])} coins</b><div class="muted small">${p[1]} pack · free in demo</div></span><span class="btn sm primary">Add</span></button>`).join('')}</div>`,
      onOpen: h => h.el.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; HD.gifts.recharge(+b.dataset.p); HD.toast.ok('+' + U.fmt(+b.dataset.p) + ' demo coins added', 'wallet'); h.close(); }) });
  };

  // ---------- room settings (host) ----------
  M.roomSettings = room => {
    const cats = HD.demo.CATEGORIES.filter(c => !['trending', 'new'].includes(c[0])), themes = HD.shop ? HD.shop.ownedThemes() : [];
    return M.open({ title: 'Room settings', body: `<div class="field"><label for="rs-t">Room name</label><input id="rs-t" class="input" maxlength="40" value="${esc(room.title)}"></div><div class="field"><label for="rs-d">Description</label><textarea id="rs-d" class="input" maxlength="140">${esc(room.desc)}</textarea></div>
      <div class="field"><label for="rs-c">Category</label><select id="rs-c" class="input">${cats.map(c => `<option value="${c[0]}" ${c[0] === room.category ? 'selected' : ''}>${c[1]}</option>`).join('')}</select></div><div class="field"><label for="rs-ly">Seat layout</label><select id="rs-ly" class="input"><option value="spotlight" ${room.layout !== 'grid10' ? 'selected' : ''}>Spotlight host + 7 seats</option><option value="grid10" ${room.layout === 'grid10' ? 'selected' : ''}>Numbered grid · 10 seats</option></select></div><div class="field"><label for="rs-th">Room theme</label><select id="rs-th" class="input"><option value="">Default</option>${themes.map(t => `<option value="${t.id}" ${t.id === room.theme ? 'selected' : ''}>${t.name}</option>`).join('')}</select>${themes.length ? '' : '<div class="small faint">Buy themes in the Shop to unlock more.</div>'}</div>`,
      actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Save changes', kind: 'primary', onClick: h => { const t = U.$('#rs-t', h.el).value.trim(); if (!t) { HD.toast.err('Room name is required'); return false; } HD.rooms.update(room.id, { title: t, desc: U.$('#rs-d', h.el).value.trim(), category: U.$('#rs-c', h.el).value, theme: U.$('#rs-th', h.el).value || null, layout: U.$('#rs-ly', h.el).value }); HD.toast.ok('Room updated'); } }] });
  };

  // ---------- report / block ----------
  M.report = (kind, id, name) => {
    const reasons = ['Harassment or hate', 'Spam or scams', 'Inappropriate content', 'Impersonation', 'Underage user', 'Something else'];
    return M.open({ title: 'Report ' + (name || kind), body: `<div class="note" style="margin-bottom:12px">${icon('shield', 18)}<div>Demo moderation: your report is stored only on this device. A real service would send it to a moderation team.</div></div><div class="group">${reasons.map((r, i) => `<label class="sw"><span>${r}</span><input type="radio" name="rr" value="${r}" ${i ? '' : 'checked'}><span class="t"></span></label>`).join('')}</div>`,
      actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Submit report', kind: 'danger', onClick: h => { const r = U.$('input[name=rr]:checked', h.el).value; const st = HD.state.getState(); st.reports = (st.reports || []).concat({ kind, id, reason: r, ts: Date.now() }); HD.state.persistState(); HD.toast.ok('Report saved locally (demo)', 'flag'); } }] });
  };
  M.block = uid => { const u = HD.user(uid); return M.confirm('Block ' + u.name + '?', 'They will be removed from your friends and following, and hidden in the app. You can unblock them in Settings → Privacy.', { ok: 'Block', danger: true }).then(ok => { if (ok) { HD.social.block(uid); HD.toast.ok(u.name + ' blocked', 'ban'); } return ok; }); };

  // ---------- invite ----------
  M.invite = room => {
    const st = HD.state.getState(), list = st.users.filter(u => !room.seats.includes(u.id) && !room.audience.includes(u.id) && !st.social.blocked.includes(u.id)).slice(0, 12);
    return M.open({ title: 'Invite to ' + room.title, body: `<div class="group">${list.map(u => `<div class="li"><span class="avw" style="--s:40px"><img class="av" src="${HD.userAvatar(u)}" alt=""></span><span class="grow"><b>${esc(u.name)}</b><div class="muted small">@${esc(u.handle)}</div></span><button class="btn sm" data-inv="${u.id}">Invite</button></div>`).join('')}</div>`,
      onOpen: h => h.el.addEventListener('click', e => { const b = e.target.closest('[data-inv]'); if (!b) return; b.textContent = 'Invited'; b.disabled = true; HD.toast.ok('Invitation sent (demo)', 'send'); }) });
  };

  // ---------- achievement / level up ----------
  M.achievement = a => { HD.fx && HD.fx.confetti(); HD.sfx && HD.sfx.play('win'); return M.open({ title: 'Achievement unlocked', body: `<div class="center col" style="align-items:center;padding:8px 0"><div class="pop" style="font-size:72px">${a.icon}</div><h2>${esc(a.title)}</h2><p class="muted">${esc(a.desc)}</p><span class="lvl">+${a.xp} XP</span></div>`, actions: [{ label: 'Nice!', kind: 'primary' }] }); };
  M.levelUp = lv => { HD.fx && HD.fx.confetti(); HD.sfx && HD.sfx.play('win'); return M.open({ title: 'Level up!', body: `<div class="center col" style="align-items:center;padding:8px 0"><div class="pop" style="font-size:64px">🚀</div><h2>You reached level ${lv}</h2><p class="muted">Keep joining rooms, hosting and making friends to earn more XP.</p></div>`, actions: [{ label: 'Keep going', kind: 'primary' }] }); };
  HD.roomLink = id => location.origin && location.origin !== 'null' ? location.origin + location.pathname + '#room/' + id : location.href.split('#')[0] + '#room/' + id;
})();
