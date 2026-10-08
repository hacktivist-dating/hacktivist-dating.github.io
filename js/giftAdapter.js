/* Virtual gifts + demo wallet. Coins are fake, nothing is charged. */
(function () {
  const HD = window.HD, U = HD.utils;
  const S = () => HD.state.getState();
  class GiftAdapter { send() { } recharge() { } claimDaily() { } }
  class DemoGiftAdapter extends GiftAdapter {
    tx(type, amount, label) { const w = S().wallet; if (amount < 0 && S().stats) S().stats.coinsSpent = (S().stats.coinsSpent || 0) + (-amount); w.transactions.unshift({ id: U.uid('t'), type, amount, label, ts: Date.now() }); if (w.transactions.length > 200) w.transactions.length = 200; }
    send({ giftId, toId, roomId, qty = 1 }) {
      const s = S(), g = s.gifts.find(x => x.id === giftId); if (!g) return { ok: false, msg: 'Unknown gift' };
      const total = g.price * qty; if (s.wallet.balance < total) return { ok: false, msg: 'Not enough demo coins' };
      s.wallet.balance -= total; this.tx('gift', -total, `${qty}× ${g.name} to ${HD.user(toId).name}`);
      s.wallet.sent.unshift({ id: U.uid('g'), giftId, toId, roomId, qty, price: g.price, ts: Date.now() });
      s.stats.giftsSent += qty; const u = s.users.find(x => x.id === toId); if (u) u.giftsReceived += qty;
      const r = roomId && HD.room(roomId); if (r) { r.giftsTotal += total; r.contrib = r.contrib || {}; r.contrib.me = (r.contrib.me || 0) + total; if (s.currentRoom && s.currentRoom.id === roomId) s.currentRoom.gifts = (s.currentRoom.gifts || 0) + total; if (toId === r.hostId && r.mine) s.hostEarnings += Math.round(total * .5); HD.messages.push(roomId, { type: 'gift', from: 'me', to: toId, text: `sent ${qty > 1 ? qty + '× ' : ''}${g.name} ${g.icon} to ${HD.user(toId).name}`, gift: g.id }); }
      HD.progress.addXp(20 * Math.min(qty, 5), 'gift'); HD.state.persistState(); HD.bus.emit('wallet'); HD.bus.emit('room:gift', { gift: g, from: HD.me().name, to: HD.user(toId).name, roomId }); return { ok: true, total };
    }
    receiveDemo(fromId, giftId, roomId) {
      const s = S(), g = s.gifts.find(x => x.id === giftId); if (!g || !s.currentUser) return;
      const rr = roomId && HD.room(roomId); if (rr) { rr.contrib = rr.contrib || {}; rr.contrib[fromId] = (rr.contrib[fromId] || 0) + g.price; rr.giftsTotal += g.price; }
      s.wallet.received.unshift({ id: U.uid('g'), giftId, fromId, roomId, ts: Date.now() }); s.stats.giftsReceived++; s.stats.charm = (s.stats.charm || 0) + g.price; s.currentUser.giftsReceived = (s.currentUser.giftsReceived || 0) + 1;
      HD.notify.add({ type: 'gift', from: fromId, text: `sent you ${g.name} ${g.icon}` }); HD.progress.addXp(15, 'receive'); HD.bus.emit('room:gift', { gift: g, from: HD.user(fromId).name, to: 'You', roomId });
      if (roomId) HD.messages.push(roomId, { type: 'gift', from: fromId, to: 'me', text: `sent you ${g.name} ${g.icon}`, gift: g.id }); HD.state.persistState();
    }
    recharge(n) { const s = S(); s.wallet.balance += n; this.tx('recharge', n, 'Demo top-up (no payment)'); HD.state.persistState(); HD.bus.emit('wallet'); }
    static REWARDS() { return [50, 100, 150, 200, 300, 400, 1000]; }
    dailyState() {
      const d = S().daily, t = U.today(), y = new Date(Date.now() - 864e5), ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
      const claimedToday = d.last === t; let next = claimedToday ? d.streak : (d.last === ys ? d.streak + 1 : 1); if (next > 7) next = 1; return { claimedToday, streak: d.streak, day: next };
    }
    claimDaily() {
      const s = S(), st = this.dailyState(); if (st.claimedToday) return { ok: false, msg: 'Already claimed today' };
      const amt = DemoGiftAdapter.REWARDS()[st.day - 1]; s.daily.streak = st.day; s.daily.last = U.today(); s.daily.claimed = st.day === 1 ? [1] : s.daily.claimed.concat(st.day);
      s.wallet.balance += amt; this.tx('bonus', amt, `Daily check-in · day ${st.day}`); HD.notify.add({ type: 'reward', text: `Daily reward claimed: +${amt} demo coins` }); HD.progress.addXp(25, 'daily'); HD.state.persistState(); HD.bus.emit('wallet'); return { ok: true, amt, day: st.day };
    }
  }
  HD.GiftAdapter = GiftAdapter; HD.gifts = new DemoGiftAdapter(); HD.REWARDS = DemoGiftAdapter.REWARDS();
})();
