/* Gift panel v2: categories (Gift / Relationship / Activity / Country / Bag), quantity chips, "All on stage",
 * bag items from missions, room contribution board. Demo coins only. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $, $$ } = U, UI = HD.ui, M = HD.modal, CS = HD.CONFIG.COIN_SYMBOL;
  const S = () => HD.state.getState();
  HD.bag = { add(id, n = 1) { const s = S(); s.bag[id] = (s.bag[id] || 0) + n; HD.state.persistState(); }, count: id => S().bag[id] || 0 };
  HD.gifts.sendBag = function ({ giftId, toId, roomId, qty = 1 }) {
    const s = S(), g = s.gifts.find(x => x.id === giftId); if (!g || (s.bag[giftId] || 0) < qty) return { ok: false, msg: 'Not enough in your bag' };
    const total = g.price * qty, w = s.wallet; w.balance += total; const r = this.send({ giftId, toId, roomId, qty }); if (!r.ok) { w.balance -= total; return r; }
    s.bag[giftId] -= qty; s.stats.coinsSpent -= total; if (w.transactions[0]) { w.transactions[0].amount = 0; w.transactions[0].label += ' (from bag)'; } HD.state.persistState(); HD.bus.emit('wallet'); return r;
  };
  const CATS = [['gift', 'Gift'], ['rel', 'Relationship'], ['act', 'Activity'], ['cty', 'Country'], ['bag', 'Bag']], QTY = [1, 7, 77, 177, 777];
  M.gift = (room, preTo) => {
    if (!M.requireAccount('send gifts')) return; const st = S(); let cat = 'gift', qty = 1, sel = null;
    const ppl = room ? room.seats.concat(room.audience).filter((v, i, a) => a.indexOf(v) === i && v !== 'me') : st.users.filter(u => !st.social.blocked.includes(u.id)).slice(0, 12).map(u => u.id);
    let to = preTo || (room && room.hostId !== 'me' ? room.hostId : ppl[0]); if (!ppl.includes(to) && to !== '*') to = ppl[0];
    const onStage = room ? room.seats.filter(x => x !== 'me') : [];
    const list = () => cat === 'bag' ? st.gifts.filter(g => (st.bag[g.id] || 0) > 0) : st.gifts.filter(g => g.cat === cat);
    const body = () => `<div class="row between" style="margin-bottom:8px"><span class="coin"><span>${CS}</span> <span id="gbal">${U.fmt(st.wallet.balance)}</span></span><button class="btn sm" data-r>Add demo coins</button></div>
      <div class="field" style="margin-bottom:10px"><label for="g-to">Select the receiver</label><select id="g-to" class="input">${room && onStage.length > 1 ? `<option value="*" ${to === '*' ? 'selected' : ''}>👥 All on stage (${onStage.length})</option>` : ''}${ppl.map(id => `<option value="${id}" ${id === to ? 'selected' : ''}>${esc(HD.user(id).name)}${room && id === room.hostId ? ' (host)' : ''}</option>`).join('')}</select></div>
      <div class="tabs" role="tablist" style="margin-bottom:10px">${CATS.map(c => `<button class="tab ${c[0] === cat ? 'on' : ''}" role="tab" aria-selected="${c[0] === cat}" data-c="${c[0]}">${c[1]}</button>`).join('')}</div>
      <div class="gifts" role="listbox" aria-label="Gifts">${list().length ? list().map(g => `<button class="gift ${sel === g.id ? 'on' : ''}" role="option" data-g="${g.id}" aria-selected="${sel === g.id}"><span class="e">${g.icon}</span><b>${esc(g.name)}</b><span>${cat === 'bag' ? '×' + st.bag[g.id] : U.fmt(g.price)}</span></button>`).join('') : '<p class="muted center" style="grid-column:1/-1;padding:18px 0">Your bag is empty. Complete missions to earn gifts.</p>'}</div>
      <div class="row" style="margin-top:12px;gap:6px" role="group" aria-label="Quantity">${QTY.map(q => `<button class="chip ${q === qty ? 'on' : ''}" data-q="${q}" aria-pressed="${q === qty}">${q}</button>`).join('')}</div>
      <p class="faint tiny" style="margin-top:10px">Demo coins have no cash value. No real money is processed.</p>`;
    const h = M.open({ title: 'Send a gift', body: body(), actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Send gift', kind: 'primary', keepOpen: true, onClick: async hh => {
      if (!sel) return HD.toast.err('Pick a gift first'); const g = st.gifts.find(x => x.id === sel), targets = to === '*' ? onStage : [to]; if (!targets.length) return HD.toast.err('Choose a recipient');
      const total = g.price * qty * targets.length, bag = cat === 'bag';
      if (bag ? (st.bag[g.id] || 0) < qty * targets.length : st.wallet.balance < total) { HD.toast.err(bag ? 'Not enough in your bag' : 'Not enough demo coins'); return bag ? null : M.recharge(); }
      const ok = await M.confirm('Confirm gift', `Send <b>${qty}× ${esc(g.name)} ${g.icon}</b> to <b>${to === '*' ? 'everyone on stage' : esc(HD.user(to).name)}</b> for <b>${bag ? 'your bag' : U.fmt(total) + ' demo coins'}</b>?`, { ok: 'Send' });
      if (!ok) return; let good = 0; targets.forEach(t => { const r = bag ? HD.gifts.sendBag({ giftId: sel, toId: t, roomId: room && room.id, qty }) : HD.gifts.send({ giftId: sel, toId: t, roomId: room && room.id, qty }); if (r.ok) good++; });
      if (good) { hh.close(); HD.toast.ok('Gift sent!', 'gift'); } else HD.toast.err('Could not send');
    } }],
      onOpen: hh => {
        const redraw = () => { hh.body.innerHTML = body(); };
        hh.el.addEventListener('click', e => { const c = e.target.closest('[data-c]'), g = e.target.closest('[data-g]'), q = e.target.closest('[data-q]');
          if (c) { cat = c.dataset.c; sel = null; redraw(); } else if (g) { sel = g.dataset.g; redraw(); } else if (q) { qty = +q.dataset.q; redraw(); } else if (e.target.closest('[data-r]')) M.recharge(); });
        hh.el.addEventListener('change', e => { if (e.target.id === 'g-to') to = e.target.value; });
        const off = HD.bus.on('wallet', () => { const b = $('#gbal', hh.el); if (b) b.textContent = U.fmt(st.wallet.balance); }); const oc = hh.close; hh.close = v => { off(); oc(v); };
      } });
    return h;
  };
  // room contribution board
  HD.contribBoard = room => {
    const c = room.contrib || {}, rows = Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 15), total = room.giftsTotal || 0;
    M.open({ title: '🏆 Room contribution', body: `<div class="card pad center" style="margin-bottom:12px"><div class="muted small">Total gifted in this room</div><div class="sid-big" style="font-size:30px">${CS} ${U.fmt(total)}</div></div>${rows.length ? `<div class="group">${rows.map((id, i) => `<div class="li"><span class="rank ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span>${UI.av(HD.user(id), { s: 38 })}<span class="grow"><b>${id === 'me' ? 'You' : esc(HD.user(id).name)}</b></span><b>${CS} ${U.fmt(c[id])}</b></div>`).join('')}</div>` : '<p class="muted center">No gifts yet. Be the first!</p>'}`, actions: [{ label: 'Close', kind: 'primary' }] });
  };
})();
