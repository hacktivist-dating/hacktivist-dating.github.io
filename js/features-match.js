/* Matches: swipe deck with interest-based compatibility. Matches are simulated (seeded) — nobody is real. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $, $$ } = U, UI = HD.ui, R = HD.router, M = HD.modal;
  const S = () => HD.state.getState();
  const mutual = uid => U.hash(HD.me().handle + '|' + uid) % 100 < 55;
  UI.interestTags = (u, me) => (u.interests || []).map(t => `<span class="tagc ${me && (me.interests || []).includes(t) ? 'shared' : ''}">${esc(t)}</span>`).join('');

  R.add('matches', { title: 'Matches', nav: 'matches', render(v) {
    if (HD.me().isGuest) { v.innerHTML = UI.page(UI.top('Matches') + UI.empty('heart', 'Account needed', 'Create a free local demo account to swipe and match.', '<button class="btn primary" data-go="#register">Create account</button>')); return; }
    let tab = 'deck', busy = false; const TABS = [['deck', 'Swipe'], ['matches', 'Matches'], ['liked', 'Liked']];
    const cands = () => { const s = S(), me = HD.me(); return s.users.filter(u => !s.match.liked.includes(u.id) && !s.match.passed.includes(u.id) && !s.social.blocked.includes(u.id)).map(u => ({ u, c: HD.demo.compat(me, u) })).sort((a, b) => b.c - a.c); };
    const card = (x, i) => { const u = x.u, me = HD.me(); return `<article class="mcard" data-uid="${u.id}" style="transform:scale(${1 - i * .045}) translateY(${i * 16}px);z-index:${10 - i};${i ? 'pointer-events:none' : ''}" aria-label="${esc(u.name)}, ${x.c}% compatible"><span class="stamp like">LIKE</span><span class="stamp nope">NOPE</span><div class="compat">${x.c}% match</div><div class="top" style="background-image:url('${U.cover('mc' + u.id)}')">${UI.av(u, { s: 140 })}</div><div class="info"><h2>${esc(u.name)}${UI.vf(u)} <span style="font-weight:500">${u.flag}</span></h2><div class="muted small">@${esc(u.handle)} · Level ${u.level}</div><p class="muted" style="margin:8px 0">${esc(u.bio)}</p><div>${UI.interestTags(u, me)}</div></div></article>`; };
    v.innerHTML = UI.page(`<header class="topbar"><h1>Matches</h1><button class="icon-btn" data-go="#editprofile" aria-label="Edit interests">${icon('edit', 19)}</button></header><div class="tabs" role="tablist" id="m-t"></div><div id="m-b" style="margin-top:14px"></div>`);
    const body = () => {
      $('#m-t', v).innerHTML = TABS.map(x => `<button class="tab ${x[0] === tab ? 'on' : ''}" role="tab" aria-selected="${x[0] === tab}" data-mt="${x[0]}">${x[1]}${x[0] === 'matches' && S().match.matches.length ? ` (${S().match.matches.length})` : ''}</button>`).join(''); const s = S(), el = $('#m-b', v);
      if (tab === 'deck') {
        const c = cands(), hint = !(HD.me().interests || []).length ? `<div class="note" style="margin-bottom:12px">${icon('info', 18)}<div>Add interests to your profile for better compatibility scores. <a href="#editprofile" style="color:var(--accent-t);font-weight:650">Add interests</a></div></div>` : '';
        el.innerHTML = hint + (c.length ? `<div class="deck" id="deck" aria-live="polite">${c.slice(0, 3).map((x, i) => card(x, i)).reverse().join('')}</div><div class="deck-btns"><button class="nope" data-act="swipe" data-d="nope" aria-label="Pass">${icon('close', 28)}</button><button class="sup" data-act="swipe" data-d="super" aria-label="Super like, 50 coins" title="Super like · 50 coins">${icon('star', 22)}</button><button class="like" data-act="swipe" data-d="like" aria-label="Like">${icon('heart', 28)}</button></div><p class="center faint small" style="margin-top:12px">Drag the card or use ← → keys. Super like costs 50 demo coins and always matches.</p>` : UI.empty('heart', 'You are all caught up', 'Reset the deck to see people again.', '<button class="btn primary" data-act="resetDeck">Reset deck</button>'));
        bindDrag();
      } else {
        const ids = tab === 'matches' ? s.match.matches : s.match.liked.filter(x => !s.match.matches.includes(x));
        el.innerHTML = ids.length ? `<div class="group">${ids.map(id => { const u = HD.user(id); return UI.userRow(u, tab === 'matches' ? `<span class="row" style="gap:6px"><span class="bdg host">${HD.demo.compat(HD.me(), u)}%</span><button class="btn sm primary" data-act="dmUser" data-id="${id}">Say hi</button></span>` : `<span class="bdg">Waiting</span>`); }).join('')}</div>` : UI.empty('heart', tab === 'matches' ? 'No matches yet' : 'Nobody liked yet', 'Swipe right on people whose interests you share.');
      }
    };
    function bindDrag() {
      const deck = $('#deck', v); if (!deck) return; const top = () => deck.querySelector('.mcard:last-child'); let sx = 0, dx = 0, on = false;
      deck.onpointerdown = e => { const c = top(); if (!c || busy || !e.target.closest('.mcard')) return; on = true; sx = e.clientX; dx = 0; c.classList.add('drag'); c.setPointerCapture && c.setPointerCapture(e.pointerId); };
      deck.onpointermove = e => { if (!on) return; const c = top(); dx = e.clientX - sx; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; $('.stamp.like', c).style.opacity = U.clamp(dx / 90, 0, 1); $('.stamp.nope', c).style.opacity = U.clamp(-dx / 90, 0, 1); };
      const end = () => { if (!on) return; on = false; const c = top(); c.classList.remove('drag'); if (Math.abs(dx) > 100) fling(dx > 0 ? 'like' : 'nope'); else { c.style.transform = ''; $$('.stamp', c).forEach(x => x.style.opacity = 0); } };
      deck.onpointerup = end; deck.onpointercancel = end;
    }
    function fling(d) {
      const deck = $('#deck', v), c = deck && deck.querySelector('.mcard:last-child'); if (!c || busy) return; busy = true; const uid = c.dataset.uid, dir = d === 'nope' ? -1 : 1;
      if (d === 'super') { if (S().wallet.balance < 50) { busy = false; return HD.toast.err('Super like needs 50 demo coins'); } S().wallet.balance -= 50; HD.gifts.tx('shop', -50, 'Super like · ' + HD.user(uid).name); HD.bus.emit('wallet'); }
      c.style.transition = 'transform .4s ease, opacity .4s'; c.style.transform = `translateX(${dir * 130}vw) rotate(${dir * 25}deg)`; c.style.opacity = 0;
      setTimeout(() => { decide(uid, d); busy = false; body(); }, 330);
    }
    function decide(uid, d) {
      const s = S(); if (d === 'nope') { s.match.passed.push(uid); return HD.state.persistState(); }
      s.match.liked.push(uid); HD.progress.addXp(2, 'like'); const hit = d === 'super' || mutual(uid);
      if (hit) { s.match.matches.push(uid); HD.messages.ensure(uid); HD.notify.add({ type: 'friend', from: uid, text: 'matched with you 💜' }); HD.progress.addXp(20, 'match'); setTimeout(() => M.match(uid), 180); }
      HD.state.persistState();
    }
    HD.act.swipe = ({ d }) => fling(d);
    HD.act.resetDeck = () => { const s = S(); s.match.liked = s.match.liked.filter(x => s.match.matches.includes(x)); s.match.passed = []; HD.state.persistState(); body(); };
    v.addEventListener('click', e => { const b = e.target.closest('[data-mt]'); if (b) { tab = b.dataset.mt; body(); } });
    const key = e => { if (tab !== 'deck' || $('.scrim') || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return; if (e.key === 'ArrowLeft') fling('nope'); else if (e.key === 'ArrowRight') fling('like'); };
    document.addEventListener('keydown', key); body(); return () => document.removeEventListener('keydown', key);
  } });

  M.match = uid => { const u = HD.user(uid), me = HD.me(); HD.fx.confetti(); HD.sfx.play('win');
    M.open({ title: "It's a match!", body: `<div class="center col" style="align-items:center"><div class="row" style="justify-content:center;gap:0"><span class="avw" style="--s:84px">${`<img class="av" src="${HD.userAvatar(me)}" alt="">`}</span><span class="avw" style="--s:84px;margin-left:-14px"><img class="av" src="${HD.userAvatar(u)}" alt=""></span></div><h2 class="pop" style="margin-top:8px">You and ${esc(u.name)}</h2><p class="muted">${HD.demo.compat(me, u)}% compatible · ${esc((u.interests || []).filter(t => (me.interests || []).includes(t)).slice(0, 3).join(', ') || 'new conversations await')}</p></div>`,
      actions: [{ label: 'Keep swiping', kind: 'ghost' }, { label: 'Say hi', kind: 'primary', onClick: () => { UI.dmPrefill = U.pick(HD.demo.ICEBREAKERS); R.go('#messages/' + uid); } }] }); };

  // interests on profile + editor
  UI.interestEditor = me => `<div class="field"><label>Interests <span class="faint">(pick up to 8 — used for match scores)</span></label><div class="row wrap" id="e-int" role="group" aria-label="Interests">${HD.demo.INTERESTS.map(t => `<button type="button" class="chip ${(me.interests || []).includes(t) ? 'on' : ''}" data-int="${esc(t)}" aria-pressed="${(me.interests || []).includes(t)}">${esc(t)}</button>`).join('')}</div></div>`;
  UI.bindInterestEditor = (root, me) => { const sel = new Set(me.interests || []); root.addEventListener('click', e => { const b = e.target.closest('[data-int]'); if (!b) return; const t = b.dataset.int; if (sel.has(t)) sel.delete(t); else if (sel.size >= 8) return HD.toast.show('Up to 8 interests'); else sel.add(t); b.classList.toggle('on', sel.has(t)); b.setAttribute('aria-pressed', sel.has(t)); }); return () => Array.from(sel); };
})();
