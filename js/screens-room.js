/* Live voice room screen. All participants except you are scripted demo bots. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $, $$ } = U, UI = HD.ui, R = HD.router, M = HD.modal, t = k => HD.t(k);
  const EMOJI = ['❤️', '😂', '🔥', '👏', '😍', '🎉', '💎', '👑'];

  R.add('room', { title: 'Live room', nav: null, render(v, params) {
    const id = params[0]; let chatTab = 'all', alive = true, offs = [], drawer = false, tray = false, replyTo = null, unread = 0; const sp = {};
    const off = f => { offs.push(f); return f; };
    const cleanup = () => { HD.music && HD.music.on && HD.music.stop(); alive = false; offs.forEach(f => { try { f(); } catch (e) { } }); offs = []; };
    const bail = () => { if (alive) R.go('#rooms'); };
    (async () => {
      const r0 = HD.room(id);
      if (!r0) { v.innerHTML = UI.page(UI.top('Room') + UI.empty('info', 'Room not found', 'That room ID does not exist on this device.', '<button class="btn primary" data-go="#rooms">Browse rooms</button>')); return; }
      let a = HD.rooms.access(r0), host = HD.user(r0.hostId);
      if (!a.ok) {
        if (a.reason === 'password') {
          const pw = await M.prompt('Room password', { label: 'Enter the password', type: 'password', hint: 'Demo rooms use ' + HD.CONFIG.DEMO_ROOM_PASSWORD + '. This check runs in your browser and is not secure.', ok: 'Join' });
          if (!alive) return; if (pw !== null && HD.rooms.tryUnlock(r0, pw)) a = { ok: true }; else { if (pw !== null) HD.toast.err('Wrong password'); return bail(); }
        } else if (a.reason === 'followers') {
          if (!M.requireAccount('follow ' + host.name)) return bail();
          const ok = await M.confirm('Followers only', `This room is only for people who follow ${esc(host.name)}.`, { ok: 'Follow & join' }); if (!alive) return; if (!ok) return bail(); HD.social.follow(host.id); a = { ok: true };
        } else { HD.toast.err(a.msg); if (a.reason === 'guests') M.requireAccount('join this room'); return bail(); }
      }
      if (!alive) return; const j = HD.rooms.join(id); if (!j.ok) { HD.toast.err(j.msg || 'Could not join'); return bail(); } build();
    })();

    function build() {
      const r = () => HD.room(id), room = r();
      v.innerHTML = `<div class="room-screen" style="--cover:url('${HD.roomCover(room)}')"><div class="room-inner"><header class="rm-top" id="rt"></header><div class="rm-body" id="rb"></div><div class="feed" id="rf" aria-live="polite" aria-label="Recent chat"></div><div class="ctrl" id="rk" role="toolbar" aria-label="Room controls"></div></div></div>`;
      const inner = $('.room-inner', v), me = () => HD.rooms.role(r(), 'me'), canMg = () => ['host', 'mod'].includes(me());
      const blocked = x => HD.state.getState().social.blocked.includes(x);

      const seat = (uid, s) => {
        const u = HD.user(uid), rl = HD.rooms.role(r(), uid), mu = !!r().muted[uid];
        return `<button class="seat" data-seat="${uid}" style="--s:${s}px" aria-label="${esc(u.name)}, ${rl}, ${mu ? 'muted' : 'microphone on'}">${rl === 'host' ? `<span class="tag" style="color:var(--gold-t)">${icon('crown', 13)}</span>` : rl === 'mod' ? `<span class="tag" style="color:var(--info-t)">${icon('shield', 13)}</span>` : ''}${UI.av(u, { s, speaking: sp[uid] && !mu })}${r().seats.includes(uid) ? `<span class="mic ${mu ? '' : 'live'}">${icon(mu ? 'micoff' : 'mic', 12)}</span>` : ''}<span class="nm"><span class="trunc ${HD.cosmetic.nameCls(uid)}" style="${HD.cosmetic.nameStyle(uid)}">${uid === 'me' ? (u.name.startsWith('Mystery') ? 'You · 🕵️' : 'You') : esc(u.name)}</span>${u.vip ? '<span class="bdg vip" style="height:15px;padding:0 5px;font-size:9px">VIP</span>' : ''}</span>${rl === 'host' ? '<span class="bdg host">Host</span>' : rl === 'mod' ? '<span class="bdg mod">Mod</span>' : ''}</button>`;
      };
      const drawTop = () => { const x = r(), n = HD.rooms.listenerCount(x);
        $('#rt', v).innerHTML = `<button class="icon-btn" data-r="back" aria-label="Back">${icon('back')}</button><div class="ttl"><b class="trunc">${esc(x.title)} ${x.locked ? icon('lock', 13) : ''}</b><div class="meta"><span class="bdg live"><span class="dotlive"></span> ${t('live')}</span><span class="mono">#${esc(x.id)}</span><button class="bdg" data-r="people" aria-label="${n} listeners, open list">${icon('users', 11)} ${U.short(n)}</button>${HD.music.on ? '<button class="bdg" data-r="music" aria-label="Stop music">🎵</button>' : ''}<button class="bdg vip" data-r="contrib" aria-label="Room contribution ${x.giftsTotal}">🏆 ${U.short(x.giftsTotal || 0)}</button><span class="bdg demo" title="Demo audio: other participants are simulated" aria-label="Demo audio: other participants are simulated">DEMO</span></div></div><button class="icon-btn" data-r="share" aria-label="Share room">${icon('share', 19)}</button><button class="icon-btn" data-r="more" aria-label="More options">${icon('more', 19)}</button><button class="icon-btn" data-r="exit" aria-label="Leave room">${icon('logout', 19)}</button>`; const rs = $('.room-screen', v); if (x.theme) rs.dataset.rt = x.theme; else delete rs.dataset.rt; };
      const drawStage = () => { const x = r(), order = HD.rooms.stageOrder(x), aud = x.audience.filter(a => !blocked(a)), shown = aud.slice(0, 15), more = aud.length + x.extraListeners - shown.length, keep = $('#rb', v).scrollTop, cap = HD.rooms.capOf(x), grid = x.layout === 'grid10';
        const empty = n => `<button class="seat empty-seat" data-empty style="--s:${grid ? 52 : 60}px" aria-label="Empty seat ${n}"><span class="ph">${icon('plus', 18)}</span><span class="nm faint">${grid ? 'NO.' + n : 'Seat'}</span></button>`;
        let stage; if (grid) { stage = `<div class="stage grid10">${Array.from({ length: cap }, (_, k) => order[k] ? `<div class="slot" data-no="${k + 1}">${seat(order[k], 52)}<i class="no">NO.${k + 1}</i></div>` : empty(k + 1)).join('')}</div>`; }
        else { const hostId = order[0], rest = order.slice(1), empties = Math.max(0, cap - 1 - rest.length); stage = `<div class="stage"><div class="host-row">${hostId ? seat(hostId, 92) : ''}</div>${rest.map(u => seat(u, 60)).join('')}${Array.from({ length: empties }, (_, k) => empty(rest.length + k + 2)).join('')}</div>`; }
        $('#rb', v).innerHTML = `${stage}
        ${HD.roomUI.poll(x)}${HD.roomUI.bag(x)}${HD.roomUI.pk(x)}<div class="seg-title" style="margin-top:22px">LISTENERS · ${U.short(HD.rooms.listenerCount(x) - x.seats.length)}</div><div class="aud">${shown.map(u => seat(u, 44)).join('')}${more > 0 ? `<div class="seat"><span class="avw" style="--s:44px"><span class="av" style="display:grid;place-items:center;background:var(--surface2);font-size:12px;font-weight:700">+${U.short(more)}</span></span></div>` : ''}</div>`;
        $('#rb', v).scrollTop = keep; };
      const drawFeed = () => { const l = HD.messages.room(id).filter(m => !blocked(m.from)).slice(-4);
        $('#rf', v).innerHTML = l.map(m => m.type === 'sys' ? `<div class="fm sys">${esc(m.text)}</div>` : `<div class="fm ${m.type === 'ann' ? 'ann' : ''}"><b>${m.from === 'me' ? 'You' : esc(HD.user(m.from).name)}</b>${esc(m.text)}</div>`).join(''); };
      const drawCtrl = () => { const x = r(), rl = me(), on = x.seats.includes('me'), mu = !!x.muted.me, hand = x.hands.includes('me'), mgr = canMg();
        const mic = `<button data-r="mic" aria-pressed="${on && !mu}" aria-label="${on ? (mu ? 'Unmute microphone' : 'Mute microphone') : 'Microphone (join the stage first)'}"><span class="cb ${on && !mu ? 'live' : ''}" id="micb">${icon(on && !mu ? 'mic' : 'micoff', 22)}</span>${t('mic')}</button>`;
        const h = mgr ? `<button data-r="people-req" aria-label="Speaker requests"><span class="cb ${x.hands.length ? 'hot' : ''}">${icon('hand', 22)}</span>Requests${x.hands.length ? `<i class="cnt">${x.hands.length}</i>` : ''}</button>` : on ? `<button data-r="step" aria-label="Leave the stage"><span class="cb">${icon('logout', 21)}</span>Step down</button>` : `<button data-r="hand" aria-pressed="${hand}"><span class="cb ${hand ? 'hot' : ''}">${icon('hand', 22)}</span>${hand ? 'Raised' : t('raiseHand')}</button>`;
        $('#rk', v).innerHTML = mic + h + `<button data-r="chat" aria-label="Open chat"><span class="cb">${icon('chat', 22)}</span>${t('chat')}${unread ? `<i class="cnt">${unread > 9 ? '9+' : unread}</i>` : ''}</button><button data-r="gift"><span class="cb">${icon('gift', 22)}</span>${t('gift')}</button><button data-r="react" aria-expanded="${tray}"><span class="cb">${icon('smile', 22)}</span>${t('reaction')}</button><button data-r="people"><span class="cb">${icon('users', 22)}</span>${t('people')}</button><button data-r="more"><span class="cb">${icon('more', 22)}</span>${t('more')}</button>`; };
      const drawAll = () => { drawTop(); drawStage(); drawCtrl(); };
      drawAll(); drawFeed();

      // ---- live events ----
      off(HD.bus.on('room:change', () => { if (!alive) return; const x = r(); if (!x || !HD.state.getState().currentRoom) return; drawTop(); drawStage(); drawCtrl(); if (peopleH) drawPeople(); }));
      off(HD.bus.on('room:chat', e => { if (!alive || e.roomId !== id) return; drawFeed(); if (drawer) drawMsgs(); else if (e.msg && e.msg.from !== 'me' && e.msg.type !== 'sys') { unread++; drawCtrl(); } }));
      off(HD.bus.on('room:react', e => { if (alive) HD.fx.reaction(e.emoji); }));
      off(HD.bus.on('room:gift', e => { if (alive && e.roomId === id) { HD.fx.play(e.gift, e.from, e.to); drawStage(); } }));
      off(HD.bus.on('room:ended', e => { if (alive && e.id === id) { HD.rooms.leave(); HD.toast.ok('Room ended'); R.go('#rooms'); } }));
      off(HD.audio.onSpeaking(e => { sp[e.userId] = e.speaking; const mu = !!r().muted[e.userId]; $$(`[data-seat="${e.userId}"] .avw`, v).forEach(el => el.classList.toggle('speaking', e.speaking && !mu)); }));
      off(HD.audio.onLevel(l => { const b = $('#micb', v); if (b) b.style.setProperty('--lvl', l.toFixed(2)); }));
      const onKey = e => { if ($('.scrim') || e.ctrlKey || e.metaKey || e.altKey) return; if (e.key === 'Escape') { if (drawer) toggleDrawer(false); else if (tray) toggleTray(); return; } if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return; const k = e.key.toLowerCase(); if (k === 'm') micToggle(); else if (k === 'c') toggleDrawer(!drawer); else if (k === 'g') M.gift(r()); else if (k === 'r') toggleTray(); else if (k === 'p') openPeople('stage'); else if (k === 'h') doHand(); else if (k === 's') HD.soundboard.open(); else if (k === 'x') HD.gamesPanel(id); else if (e.key === '?') HD.shortcutsHelp(); }; document.addEventListener('keydown', onKey); off(() => document.removeEventListener('keydown', onKey));

      // ---- actions ----
      const leave = () => { R.go('#rooms'); };
      const micToggle = async () => {
        const x = r(); if (!x.seats.includes('me')) { HD.toast.show(HD.me().isGuest ? 'Create an account to speak' : 'Raise your hand to get on stage first', { icon: 'hand' }); return; }
        if (!x.muted.me) { await HD.audio.mute(); HD.rooms.setMic(id, 'me', true); HD.toast.show('Microphone muted', { icon: 'micoff' }); return; }
        const res = await HD.audio.unmute(); HD.rooms.setMic(id, 'me', false);
        if (res.hasInput) HD.toast.ok('Microphone enabled', 'mic'); else HD.toast.show(res.status === 'denied' ? 'Mic permission denied — showing demo indicator only' : 'No microphone available here — demo indicator only', { icon: 'info', ms: 3800 });
      };
      const toggleTray = () => { tray = !tray; const ex = $('.react-tray', inner); if (ex) ex.remove(); if (tray) { const d = document.createElement('div'); d.className = 'react-tray'; d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Reactions'); d.innerHTML = EMOJI.map(e => `<button data-e="${e}" aria-label="React ${e}">${e}</button>`).join(''); inner.appendChild(d); } drawCtrl(); };

      // chat drawer
      const msgHTML = (m, all) => {
        if (blocked(m.from)) return ''; if (m.type === 'sys') return `<div class="cmsg sys">${esc(m.text)}</div>`;
        const u = HD.user(m.from), rp = m.replyTo && all.find(x => x.id === m.replyTo), rx = Object.keys(m.reactions || {});
        return `<div class="cmsg ${m.type === 'ann' ? 'ann' : ''}" data-mid="${m.id}">${UI.av(u, { s: 32 })}<div class="txt"><b class="${HD.cosmetic.nameCls(m.from)}" style="${HD.cosmetic.nameStyle(m.from)}">${m.from === 'me' ? 'You' : esc(u.name)}</b> ${UI.tierPill(u.tier, 1)} ${UI.presPill(u.prestige)} <span class="faint tiny">${U.time(m.ts)}</span>${m.type === 'ann' ? ' <span class="bdg host">Host announcement</span>' : ''}${rp ? `<div class="reply">${esc(rp.from === 'me' ? 'You' : HD.user(rp.from).name)}: ${esc((rp.text || '').slice(0, 60))}</div>` : ''}<div class="${HD.cosmetic.bubbleCls(m.from)}">${m.type === 'gift' ? '🎁 ' : ''}${esc(m.text)}</div>${rx.length ? `<div>${rx.map(e => `<span class="rx">${e} ${m.reactions[e].length}</span>`).join(' ')}</div>` : ''}<div class="acts"><button data-c="reply" aria-label="Reply">Reply</button><button data-c="react" aria-label="React with heart">❤️</button>${canMg() ? '<button data-c="del">Delete</button>' : ''}</div></div></div>`;
      };
      const drawMsgs = () => { const box = $('.msgs', inner); if (!box) return; const all = HD.messages.room(id), near = box.scrollHeight - box.scrollTop - box.clientHeight < 90; box.innerHTML = all.filter(m => chatTab === 'all' || (chatTab === 'gift' ? m.type === 'gift' : (m.type === 'msg' || m.type === 'ann'))).slice(-120).map(m => msgHTML(m, all)).join(''); if (near) box.scrollTop = box.scrollHeight; };
      const drawReply = () => { const el = $('.replying', inner); if (!el) return; if (!replyTo) { el.hidden = true; return; } const m = HD.messages.room(id).find(x => x.id === replyTo); el.hidden = false; el.innerHTML = `${icon('reply', 14)}<span class="grow trunc">Replying to ${m ? esc(m.from === 'me' ? 'yourself' : HD.user(m.from).name) : ''}</span><button data-c="cancel" aria-label="Cancel reply">${icon('close', 14)}</button>`; };
      const toggleDrawer = open => {
        drawer = open; const ex = $('.drawer', inner); if (ex) ex.remove(); if (!open) { drawCtrl(); return; } unread = 0; drawCtrl();
        const d = document.createElement('section'); d.className = 'drawer'; d.setAttribute('aria-label', 'Room chat');
        d.innerHTML = `<div class="row" style="padding:12px 16px 4px"><h3 class="grow">Room chat${r().slowMode ? ' · <span class="small muted">slow mode</span>' : ''}</h3><div class="tabs" style="max-width:190px;margin-right:6px">${[['all', 'All'], ['chat', 'Chat'], ['gift', 'Gift']].map(x => `<button type="button" class="tab ${x[0] === chatTab ? 'on' : ''}" data-c="ctab" data-t="${x[0]}" style="padding:0 10px;height:30px">${x[1]}</button>`).join('')}</div><button class="icon-btn" data-c="close" aria-label="Close chat">${icon('close', 18)}</button></div><div class="msgs" role="log" aria-live="polite"></div><div class="replying" hidden></div><div class="qe">${['😂', '🔥', '👏', '😍', '🎉', '❤️', '🙌', '💜'].map(e => `<button data-c="emoji" data-e="${e}" aria-label="Insert ${e}">${e}</button>`).join('')}</div><form class="composer-room"><input class="input grow" id="cin" maxlength="300" placeholder="Say something nice…" aria-label="Message" autocomplete="off">${HD.speech.supported ? `<button type="button" class="icon-btn" data-c="speech" aria-label="Dictate message">${icon('mic', 18)}</button>` : ''}<button class="icon-btn" type="submit" aria-label="Send" style="background:linear-gradient(120deg,var(--accent),var(--accent2));color:var(--accent-ink)">${icon('send', 18)}</button></form>`;
        inner.appendChild(d); drawMsgs(); setTimeout(() => $('#cin', d).focus(), 300);
        $('form', d).addEventListener('submit', e => { e.preventDefault(); const i = $('#cin', d); if (HD.me().isGuest && !M.requireAccount('chat in rooms')) return; const res = HD.messages.sendRoom(id, i.value, { replyTo }); if (!res.ok) return res.msg && HD.toast.show(res.msg, { icon: 'slow' }); i.value = ''; replyTo = null; drawReply(); });
        d.addEventListener('click', e => {
          const c = e.target.closest('[data-c]'); if (!c) return; const k = c.dataset.c, mid = (c.closest('[data-mid]') || {}).dataset && c.closest('[data-mid]').dataset.mid;
          if (k === 'ctab') { chatTab = c.dataset.t; $$('[data-c=ctab]', d).forEach(b => b.classList.toggle('on', b.dataset.t === chatTab)); drawMsgs(); } else if (k === 'close') toggleDrawer(false); else if (k === 'emoji') { const i = $('#cin', d); i.value += c.dataset.e; i.focus(); }
          else if (k === 'reply') { replyTo = mid; drawReply(); $('#cin', d).focus(); } else if (k === 'cancel') { replyTo = null; drawReply(); }
          else if (k === 'react') HD.messages.react(id, mid, '❤️'); else if (k === 'del') HD.messages.remove(id, mid);
          else if (k === 'speech') { HD.toast.show('Listening…', { icon: 'mic' }); HD.speech.listen(txt => { $('#cin', d).value += (($('#cin', d).value ? ' ' : '') + txt); }); }
        });
      };

      // people + user actions
      let peopleH = null, peopleTab = 'stage';
      const drawPeople = () => {
        if (!peopleH) return; const x = r(), mgr = canMg(), aud = x.audience.filter(a => !blocked(a)), tabs = [['stage', 'On stage (' + x.seats.length + ')'], ['aud', 'Listeners (' + aud.length + ')']].concat(mgr ? [['req', 'Requests' + (x.hands.length ? ' (' + x.hands.length + ')' : '')]] : []);
        const row = (uid, extra = '') => { const u = HD.user(uid), rl = HD.rooms.role(x, uid); return `<div class="li" data-pu="${uid}" role="button" tabindex="0" style="cursor:pointer">${UI.av(u, { s: 42, speaking: sp[uid] && !x.muted[uid] })}<div class="grow"><b>${uid === 'me' ? 'You' : esc(u.name)}</b> ${rl === 'host' ? '<span class="bdg host">Host</span>' : rl === 'mod' ? '<span class="bdg mod">Mod</span>' : ''}${u.vip ? ' <span class="bdg vip">VIP</span>' : ''}<div class="muted small">@${esc(u.handle)}</div></div>${extra || (x.seats.includes(uid) ? icon(x.muted[uid] ? 'micoff' : 'mic', 18) : '')}</div>`; };
        let body = ''; if (peopleTab === 'stage') body = x.seats.map(u => row(u)).join(''); else if (peopleTab === 'aud') body = aud.length ? aud.map(u => row(u, x.hands.includes(u) ? '✋' : '')).join('') : '<p class="muted center">No one listed.</p>';
        else body = x.hands.length ? x.hands.map(u => row(u, `<span class="row"><button class="btn sm primary" data-req="ok" data-id="${u}">Accept</button><button class="btn sm" data-req="no" data-id="${u}">Reject</button></span>`)).join('') : '<p class="muted center" style="padding:24px 0">No raised hands right now.</p>';
        peopleH.body.innerHTML = `<div class="tabs" style="margin-bottom:10px" role="tablist">${tabs.map(tb => `<button class="tab ${tb[0] === peopleTab ? 'on' : ''}" role="tab" aria-selected="${tb[0] === peopleTab}" data-pt="${tb[0]}">${tb[1]}</button>`).join('')}</div><div class="group">${body}</div>`;
      };
      const openPeople = tab => { peopleTab = tab || 'stage'; if (peopleH) peopleH.close(); peopleH = M.open({ title: t('people'), body: '', onClose: () => { peopleH = null; } }); drawPeople();
        peopleH.el.addEventListener('click', e => { const p = e.target.closest('[data-pt]'); if (p) { peopleTab = p.dataset.pt; drawPeople(); return; } const q = e.target.closest('[data-req]'); if (q) { const res = q.dataset.req === 'ok' ? HD.rooms.approve(id, q.dataset.id) : HD.rooms.reject(id, q.dataset.id); HD.toast.show(res.msg, { kind: res.ok ? 'ok' : 'err' }); return; } const u = e.target.closest('[data-pu]'); if (u) { const uid = u.dataset.pu; peopleH.close(); setTimeout(() => openUser(uid), 250); } }); };

      const pick = (title, ids, cb) => { const h = M.open({ title, body: `<div class="group">${ids.length ? ids.map(u => `<button class="li" data-pk="${u}">${UI.av(HD.user(u), { s: 38 })}<span class="grow"><b>${esc(HD.user(u).name)}</b></span></button>`).join('') : '<p class="muted center" style="padding:14px 0">Nobody available.</p>'}</div>`, onOpen: hh => hh.el.addEventListener('click', e => { const b = e.target.closest('[data-pk]'); if (b) { hh.close(); cb(b.dataset.pk); } }) }); return h; };
      const res = o => HD.toast.show(o.msg, { kind: o.ok ? 'ok' : 'err', icon: o.ok ? 'check' : 'info' });

      const openUser = uid => {
        const x = r(), u = HD.user(uid), rl = HD.rooms.role(x, uid), C = (a) => HD.rooms.can(x, a, uid), items = [];
        const add = (k, ic, label, danger) => items.push(`<button class="li" data-ua="${k}"><span class="ic-wrap" ${danger ? 'style="color:var(--danger-t)"' : ''}>${icon(ic, 20)}</span><span class="grow" ${danger ? 'style="color:var(--danger-t)"' : ''}>${label}</span></button>`);
        add('profile', 'user', 'View profile');
        if (uid !== 'me') { add('follow', 'heart', HD.social.isFollowing(uid) ? 'Unfollow' : 'Follow'); add('gift', 'gift', 'Send a gift'); }
        if (uid === 'me' && x.seats.includes('me') && rl !== 'host') add('step', 'logout', 'Leave the stage');
        if (uid !== 'me') { if (x.seats.includes(uid) && C('mute')) add('mute', x.muted[uid] ? 'mic' : 'micoff', x.muted[uid] ? 'Allow to speak (unmute)' : 'Mute microphone');
          if (x.seats.includes(uid) && C('move') && rl !== 'host') add('toaud', 'swap', 'Move to audience');
          if (!x.seats.includes(uid) && C('move')) add('tostage', 'up', 'Move to stage');
          if (!x.seats.includes(uid) && C('invite')) add('invite', 'send', 'Invite to speak');
          if (C('addMod') && rl !== 'mod' && rl !== 'host') add('addmod', 'shield', 'Make moderator'); if (C('removeMod') && rl === 'mod') add('rmmod', 'shield', 'Remove moderator');
          if (C('transfer')) add('transfer', 'crown', 'Transfer host'); if (C('remove')) add('remove', 'ban', 'Remove from room', true);
          add('report', 'flag', 'Report user', true); add('block', 'ban', 'Block user', true); }
        const h = M.open({ title: uid === 'me' ? 'You' : u.name, body: `<div class="row" style="margin-bottom:8px">${UI.av(u, { s: 52 })}<div><b>${esc(u.name)}</b>${UI.vf(u)}<div class="muted small">@${esc(u.handle)} · ${rl}</div></div></div><div class="group">${items.join('')}</div>`,
          onOpen: hh => hh.el.addEventListener('click', async e => {
            const b = e.target.closest('[data-ua]'); if (!b) return; const k = b.dataset.ua; hh.close(); await new Promise(z => setTimeout(z, 230));
            if (k === 'profile') M.profile(uid); else if (k === 'follow') { if (M.requireAccount('follow people')) HD.act.toggleFollow({ id: uid }); } else if (k === 'gift') M.gift(x, uid);
            else if (k === 'step') HD.rooms.leaveStage(id); else if (k === 'mute') res(x.muted[uid] ? HD.rooms.unmuteUser(id, uid) : HD.rooms.mute(id, uid));
            else if (k === 'toaud') res(HD.rooms.move(id, uid, 'aud')); else if (k === 'tostage') res(HD.rooms.move(id, uid, 'stage')); else if (k === 'invite') res(HD.rooms.invite(id, uid));
            else if (k === 'addmod') res(HD.rooms.addMod(id, uid)); else if (k === 'rmmod') res(HD.rooms.removeMod(id, uid));
            else if (k === 'transfer') { if (await M.confirm('Transfer host?', `Make ${esc(u.name)} the host? You will become a speaker.`, { ok: 'Transfer' })) res(HD.rooms.transfer(id, uid)); }
            else if (k === 'remove') { if (await M.confirm('Remove ' + u.name + '?', 'They will be removed from this room.', { ok: 'Remove', danger: true })) res(HD.rooms.remove(id, uid)); }
            else if (k === 'report') M.report('user', uid, u.name); else if (k === 'block') M.block(uid);
          }) });
      };

      const openMore = () => {
        const x = r(), rl = me(), host = rl === 'host', mgr = canMg(), items = [];
        const add = (k, ic, label, sub, sw) => items.push(sw !== undefined ? `<label class="sw"><span>${label}${sub ? `<div class="small muted">${sub}</div>` : ''}</span><input type="checkbox" data-mk="${k}" ${sw ? 'checked' : ''}><span class="t"></span></label>` : `<button class="li" data-mk="${k}"><span class="ic-wrap">${icon(ic, 20)}</span><span class="grow">${label}${sub ? `<div class="small muted">${sub}</div>` : ''}</span></button>`);
        add('info', 'info', 'Room info'); add('share', 'share', 'Share room'); add('invite', 'send', 'Invite friends'); add('fav', 'star', UI.isFav(x.id) ? 'Remove from saved' : 'Save room'); add('ice', 'smile', 'Icebreaker card', 'Get a conversation starter'); add('sounds', 'volume', 'Soundboard', 'Applause, air horn & more (on stage)'); add('games', 'bolt', 'Games', 'Turntable, dice, trivia, lucky bag, PK…'); add('music', 'volume', HD.music.on ? 'Stop room music' : 'Play room music', 'Generated ambient music (this device only)');
        if (host) { add('settings', 'edit', 'Room settings', 'Title, description, category'); add('lock', x.locked ? 'unlock' : 'lock', x.locked ? 'Unlock room' : 'Lock room'); add('fo', 'users', 'Followers-only mode', 'Only followers can join', x.followersOnly); }
        if (mgr) { add('poll', 'chat', x.poll ? 'Replace poll' : 'Start a poll'); }
        if (mgr) { add('slow', 'slow', 'Slow mode', '8 seconds between messages', x.slowMode); add('announce', 'mega', 'Send announcement'); add('clear', 'trash', 'Clear chat'); }
        if (host) { add('addmod', 'shield', 'Add moderator'); add('rmmod', 'shield', 'Remove moderator'); add('transfer', 'crown', 'Transfer host'); add('end', 'close', 'End room'); }
        add('mictest', 'mic', 'Microphone test', 'Check permission and input level'); add('keys', 'info', 'Keyboard shortcuts'); add('role', 'tools', 'Demo: switch my role', 'Try host / moderator / speaker / listener controls'); add('report', 'flag', 'Report room');
        const h = M.open({ title: 'Room options', body: `<div class="group">${items.join('')}</div><p class="faint tiny" style="margin-top:10px">Role: <b>${rl}</b>. Permissions here are UI rules for the demo — they are not security.</p>`,
          onOpen: hh => { const fn = async e => { const el = e.target.closest('[data-mk]'); if (!el) return; const k = el.dataset.mk; if (el.type === 'checkbox') { const on = el.checked; res(k === 'slow' ? HD.rooms.setSlow(id, on) : HD.rooms.setFollowersOnly(id, on)); return; } hh.close(); await new Promise(z => setTimeout(z, 230)); more(k); }; hh.el.addEventListener('click', e => { if (e.target.closest('[data-mk]') && e.target.type !== 'checkbox') fn(e); }); hh.el.addEventListener('change', fn); } });
      };
      const more = async k => {
        const x = r(), st = HD.state.getState(), npc = x.seats.filter(u => u !== 'me'), aud = x.audience.filter(u => u !== 'me');
        if (k === 'info') R.go('#roominfo/' + id); else if (k === 'share') M.share(x); else if (k === 'invite') M.invite(x); else if (k === 'settings') M.roomSettings(x);
        else if (k === 'lock') { if (x.locked) res(HD.rooms.unlock(id)); else { const pw = await M.prompt('Lock room', { label: 'Password (optional)', hint: 'Leave empty for invite-only. Browser-side only — not secure.', allowEmpty: true, type: 'text', ok: 'Lock' }); if (pw !== null) res(HD.rooms.lock(id, pw)); } }
        else if (k === 'announce') { const tx = await M.prompt('Announcement', { label: 'Message to everyone', max: 140, ok: 'Send' }); if (tx) HD.messages.announce(id, tx, 'me'); }
        else if (k === 'clear') { if (await M.confirm('Clear chat?', 'This removes all messages for everyone in the demo.', { ok: 'Clear', danger: true })) HD.messages.clear(id); }
        else if (k === 'addmod') pick('Add moderator', npc.filter(u => !x.modIds.includes(u)).concat(aud.slice(0, 6)), u => res(HD.rooms.addMod(id, u)));
        else if (k === 'rmmod') pick('Remove moderator', x.modIds.filter(u => u !== 'me'), u => res(HD.rooms.removeMod(id, u)));
        else if (k === 'transfer') pick('Transfer host to…', npc.concat(aud.slice(0, 6)), async u => { if (await M.confirm('Transfer host?', `Make ${esc(HD.user(u).name)} the host?`, { ok: 'Transfer' })) res(HD.rooms.transfer(id, u)); });
        else if (k === 'end') { if (await M.confirm('End room?', 'Everyone will be removed and the room will close.', { ok: 'End room', danger: true })) { const o = HD.rooms.end(id); if (o.ok) { HD.toast.ok('Room ended'); } else res(o); } }
        else if (k === 'fav') HD.act.toggleFav({ id }); else if (k === 'ice') HD.icebreaker.open(id); else if (k === 'sounds') HD.soundboard.open(); else if (k === 'games') HD.gamesPanel(id); else if (k === 'music') { HD.music.toggle(); HD.toast.show(HD.music.on ? 'Room music on' : 'Room music off', { icon: 'volume' }); } else if (k === 'poll') HD.roomUI.pollDialog(id); else if (k === 'keys') HD.shortcutsHelp();
        else if (k === 'mictest') HD.act.micTest(); else if (k === 'report') M.report('room', id, x.title);
        else if (k === 'role') M.open({ title: 'Demo role switcher', body: `<div class="note" style="margin-bottom:12px">${icon('info', 18)}<div>Switches <b>your</b> role in this room so you can try every control. Restored when you leave.</div></div><div class="group">${['host', 'mod', 'speaker', 'listener'].map(z => `<button class="li" data-rl="${z}"><span class="grow" style="text-transform:capitalize"><b>${z === 'mod' ? 'Moderator' : z}</b></span>${me() === z ? icon('check', 18) : ''}</button>`).join('')}</div>`, onOpen: hh => hh.el.addEventListener('click', e => { const b = e.target.closest('[data-rl]'); if (!b) return; HD.rooms.setDemoRole(id, b.dataset.rl); HD.toast.ok('You are now: ' + b.dataset.rl); hh.close(); }) });
      };

      // main click delegation
      inner.addEventListener('click', e => {
        const s = e.target.closest('[data-seat]'); if (s) return openUser(s.dataset.seat);
        if (e.target.closest('[data-empty]')) { const x = r(); if (canMg()) { const c = x.audience.filter(u => u !== 'me').slice(0, 10); return pick('Invite to speak', c, u => res(HD.rooms.invite(id, u))); } if (x.seats.includes('me')) return HD.toast.show('You are already on stage'); return doHand(); }
        const em = e.target.closest('[data-e]'); if (em && em.closest('.react-tray')) { HD.fx.reaction(em.dataset.e); HD.messages.system(id, 'You sent ' + em.dataset.e); HD.sfx.play('pop'); return; }
        const b = e.target.closest('[data-r]'); if (!b) { if (tray && !e.target.closest('.react-tray')) toggleTray(); return; }
        const k = b.dataset.r;
        if (k === 'back' || k === 'exit') { const x = r(); if (x.hostId === 'me' && x.mine) HD.toast.show('You left — your room stays live', { icon: 'info' }); leave(); }
        else if (k === 'share') M.share(r()); else if (k === 'more') openMore(); else if (k === 'mic') micToggle(); else if (k === 'hand') doHand();
        else if (k === 'step') { HD.rooms.leaveStage(id); HD.toast.show('You stepped down'); } else if (k === 'people') openPeople('stage'); else if (k === 'people-req') openPeople('req');
        else if (k === 'music') { HD.music.toggle(); } else if (k === 'contrib') HD.contribBoard(r()); else if (k === 'chat') toggleDrawer(!drawer); else if (k === 'gift') M.gift(r()); else if (k === 'react') toggleTray();
      });
      const doHand = () => { if (HD.me().isGuest && !M.requireAccount('speak in rooms')) return; const x = r(); if (x.hands.includes('me')) { HD.rooms.lowerHand(id); HD.toast.show('Hand lowered'); } else { HD.rooms.raiseHand(id); HD.toast.show('✋ Hand Raised', { icon: 'hand' }); } };
      $('#rf', v).addEventListener('click', () => toggleDrawer(true));
    }
    return cleanup;
  } });

  // ---------- microphone test ----------
  HD.act.micTest = () => {
    const A = HD.audio; let off = null, stopAfter = !A.stream;
    M.open({ title: 'Microphone test', body: `<p class="muted small" style="margin-bottom:10px">Your microphone is only analysed locally to draw this meter. Audio is never recorded or sent anywhere.</p><div class="mic-meter" id="mm" aria-hidden="true">${'<i></i>'.repeat(20)}</div><p id="ms" class="small muted" style="margin:10px 0">Requesting microphone…</p>
      <div class="field"><label for="mv">Volume (${'local monitor'})</label><input id="mv" type="range" min="0" max="100" value="${A.volume}"></div><label class="sw"><span>Hear myself (use headphones)</span><input type="checkbox" id="mh"><span class="t"></span></label>`,
      onClose: () => { off && off(); A.testing = false; A.setMonitor(false); A._applyTrack(); if (stopAfter && !HD.state.getState().currentRoom) A.stopMic(); },
      onOpen: async h => {
        A.testing = true; const ok = await A.startMic(), s = $('#ms', h.el); if (!A.muted) { } if (A.muted) A._applyTrack(); if (ok && A.muted) A.stream.getAudioTracks().forEach(t => t.enabled = true);
        s.textContent = ok ? 'Microphone connected — say something.' : A.micStatus === 'denied' ? 'Permission denied. Allow microphone access in your browser settings.' : A.micStatus === 'unsupported' ? 'This browser (or the file:// origin) does not expose a microphone. Serve the site over HTTPS or localhost.' : 'No microphone found.';
        const bars = $$('#mm i', h.el); off = A.onLevel(l => { const n = Math.round(l * bars.length); bars.forEach((b, i) => { b.classList.toggle('on', i < n); b.style.height = (20 + i * 4) + '%'; }); if (A.muted && A.stream) { } });
        $('#mv', h.el).addEventListener('input', e => A.setVolume(e.target.value)); $('#mh', h.el).addEventListener('change', e => A.setMonitor(e.target.checked));
      } });
  };
})();
