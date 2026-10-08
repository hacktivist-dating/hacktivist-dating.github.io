/* Rooms: listing, access checks, join/leave, host + moderator controls, simulated crowd.
 * Everything is frontend state. Permissions here are UI rules only — NOT security. */
(function () {
  const HD = window.HD, U = HD.utils;
  const S = () => HD.state.getState(); const unlocked = new Set(); let timers = [];
  const PERM = {
    host: ['mute', 'remove', 'move', 'invite', 'approve', 'lock', 'title', 'slow', 'followersOnly', 'end', 'transfer', 'addMod', 'removeMod', 'chat', 'report', 'settings'],
    mod: ['mute', 'remove', 'move', 'invite', 'approve', 'slow', 'chat', 'report'], speaker: ['report'], listener: ['report']
  };
  class RoomAdapter { list() { } get() { } create() { } join() { } leave() { } }
  class DemoRoomAdapter extends RoomAdapter {
    constructor() { super(); }
    capOf(r) { return r && r.layout === 'grid10' ? 10 : 8; }
    emit() { HD.state.persistState(); HD.bus.emit('room:change'); }
    listenerCount(r) { return r.audience.length + r.extraListeners + r.seats.length; }
    role(r, uid) { return r.hostId === uid ? 'host' : r.modIds.includes(uid) && r.seats.includes(uid) ? 'mod' : r.seats.includes(uid) ? 'speaker' : 'listener'; }
    stageOrder(r) { const h = r.seats.filter(x => x === r.hostId), m = r.seats.filter(x => r.modIds.includes(x) && x !== r.hostId), o = r.seats.filter(x => x !== r.hostId && !r.modIds.includes(x)); return h.concat(m, o); }
    can(r, action, target) {
      const me = this.role(r, 'me'); if (!PERM[me].includes(action)) return false;
      if (target) { if (target === 'me' && action !== 'report') return false; const tr = this.role(r, target); if (tr === 'host' && me !== 'host') return false; if (me === 'mod' && tr === 'mod') return false; if (tr === 'host' && ['remove', 'move'].includes(action)) return false; }
      return true;
    }
    score(r) { return this.listenerCount(r) + r.giftsTotal / 50 + (Date.now() - r.createdAt < 216e5 ? 200 : 0) + r.level * 8; }
    get(id) { return HD.room(id); }
    list({ cat, sort, q } = {}) {
      const s = S(); let a = s.rooms.filter(r => r.status === 'live' && !s.social.blocked.includes(r.hostId));
      if (cat && cat !== 'trending' && cat !== 'new') a = a.filter(r => r.category === cat);
      if (q) { const t = q.toLowerCase(); a = a.filter(r => (r.title + ' ' + r.desc + ' ' + r.id + ' ' + r.category + ' ' + r.language + ' ' + HD.user(r.hostId).name).toLowerCase().includes(t)); }
      const k = sort || (cat === 'new' ? 'newest' : 'trending');
      const f = { trending: r => this.score(r), active: r => r.seats.length * 60 + r.giftsTotal / 80 + r.level * 12, newest: r => r.createdAt, listeners: r => this.listenerCount(r) }[k];
      return a.slice().sort((x, y) => f(y) - f(x));
    }
    access(r) {
      if (!r || r.status !== 'live') return { ok: false, reason: 'ended', msg: 'This room has ended' };
      if (r.hostId === 'me' || this.role(r, 'me') !== 'listener') return { ok: true };
      const me = HD.me(); if (me.isGuest && !r.allowGuests) return { ok: false, reason: 'guests', msg: 'This room does not allow guests' };
      if (r.followersOnly && !HD.social.isFollowing(r.hostId)) return { ok: false, reason: 'followers', msg: 'Follow the host to join this followers-only room' };
      if (r.password && !unlocked.has(r.id)) return { ok: false, reason: 'password', msg: 'Password required' };
      return { ok: true };
    }
    tryUnlock(r, pw) { if (pw === r.password) { unlocked.add(r.id); return true; } return false; }
    create(d) {
      const s = S(); let id; do { id = String(10000 + (Math.random() * 89999 | 0)); } while (s.rooms.some(r => r.id === id));
      const priv = d.privacy || 'public';
      const r = { id, title: d.title, desc: d.desc || 'Come say hi!', category: d.category || 'friendship', language: d.language || 'English', hostId: 'me', modIds: [], seats: ['me'], audience: [], extraListeners: 0, hands: [], invited: [], muted: { me: true }, level: 1, locked: priv === 'password' || priv === 'private', password: priv === 'password' ? d.password || '' : '', privacy: priv, vip: false, verified: false, followersOnly: !!d.followersOnly || priv === 'followers', slowMode: !!d.slowMode, allowGuests: d.allowGuests !== false, coverSeed: 'mine' + id, layout: d.layout === 'grid10' ? 'grid10' : 'spotlight', createdAt: Date.now(), status: 'live', peak: 1, giftsTotal: 0, mine: true };
      if (r.privacy === 'private') { r.password = ''; r.locked = true; r.inviteOnly = true; }
      s.rooms.unshift(r); if (d.cover) HD.storage.putImage('cv:' + id, d.cover); unlocked.add(id);
      s.stats.roomsHosted++; s.currentUser.roomsHosted = (s.currentUser.roomsHosted || 0) + 1; HD.progress.addXp(50, 'host'); HD.state.persistState(); return r;
    }
    join(id) {
      const r = HD.room(id), s = S(); if (!r) return { ok: false, msg: 'Room not found' }; const a = this.access(r); if (!a.ok) return a;
      if (s.currentRoom && s.currentRoom.id === id) return { ok: true, room: r, already: true };
      if (s.currentRoom) this.leave();
      s.currentRoom = { id, joinedAt: Date.now(), peak: this.listenerCount(r), gifts: 0 };
      if (!r.seats.includes('me') && !r.audience.includes('me')) r.audience.push('me');
      if (r.muted.me === undefined) r.muted.me = true;
      if (HD.vip) HD.vip.sync(); const mnt = HD.mountFor && HD.mountFor('me'); if (mnt && HD.fx.entrance) { const t = HD.vip.tier(); setTimeout(() => HD.fx.entrance(HD.me().mystery ? 'Mystery guest' : HD.me().name, mnt, t ? t.color : '#a56bff'), 500); }
      s.stats.roomsJoined++; const h = new Date().getHours(); if (h < 5) s.stats.nightOwl = true; else if (h < 8) s.stats.earlyBird = true;
      const chat = HD.messages.room(id); if (!chat.length) { HD.messages.announce(id, 'Welcome to the room! Be kind, be curious. 💜', r.hostId); }
      HD.messages.system(id, 'You joined the room'); HD.progress.addXp(10, 'join'); HD.sfx.play('join');
      HD.audio.connect(id); this.startSim(id); this.emit(); return { ok: true, room: r };
    }
    leave() {
      const s = S(), c = s.currentRoom; if (!c) return; const r = HD.room(c.id); this.stopSim(); HD.audio.disconnect();
      if (r) {
        r.audience = r.audience.filter(x => x !== 'me'); r.hands = r.hands.filter(x => x !== 'me');
        if (r._snap && !r.mine) { Object.assign(r, { hostId: r._snap.hostId, modIds: r._snap.modIds.slice(), seats: r._snap.seats.filter(x => x !== 'me'), audience: r._snap.audience.filter(x => x !== 'me') }); delete r._snap; }
        else if (r.hostId !== 'me') r.seats = r.seats.filter(x => x !== 'me');
        r.modIds = r.modIds.filter(x => x !== 'me' || r.hostId === 'me'); r.muted.me = true;
        if (s.settings.privacy.showHistory !== false || true) s.history.unshift({ id: U.uid('h'), name: r.title, ts: c.joinedAt, duration: Date.now() - c.joinedAt, peak: c.peak, gifts: c.gifts || 0, participants: r.seats.length + r.audience.length + 1, role: r.hostId === 'me' ? 'host' : 'listener' });
        if (s.history.length > 100) s.history.length = 100;
      }
      s.currentRoom = null; this.emit();
    }
    update(id, patch) { const r = HD.room(id); if (!r) return; const old = r.title; Object.assign(r, patch); if (patch.title && patch.title !== old) HD.messages.system(id, `Room renamed to “${patch.title}”`); if (patch.category) HD.messages.system(id, 'Category is now ' + HD.demo.catName(r.category)); this.emit(); }
    _res(ok, msg) { return { ok, msg }; }
    mute(id, uid) { const r = HD.room(id); if (!this.can(r, 'mute', uid)) return this._res(false, 'You cannot do that'); r.muted[uid] = true; HD.messages.system(id, `${this.role(r, 'me') === 'host' ? 'Host' : 'Moderator'} muted ${HD.user(uid).name}'s microphone`); this.emit(); return this._res(true, HD.user(uid).name + ' muted'); }
    unmuteUser(id, uid) { const r = HD.room(id); if (!this.can(r, 'mute', uid)) return this._res(false, 'You cannot do that'); delete r.muted[uid]; this.emit(); return this._res(true, HD.user(uid).name + ' can speak'); }
    remove(id, uid) { const r = HD.room(id); if (!this.can(r, 'remove', uid)) return this._res(false, 'You cannot remove this person'); const f = x => x !== uid; r.seats = r.seats.filter(f); r.audience = r.audience.filter(f); r.hands = r.hands.filter(f); r.modIds = r.modIds.filter(f); HD.messages.system(id, `${HD.user(uid).name} was removed from the room`); this.emit(); return this._res(true, HD.user(uid).name + ' removed'); }
    move(id, uid, to) {
      const r = HD.room(id); if (!this.can(r, 'move', uid)) return this._res(false, 'You cannot move this person');
      if (to === 'stage') { if (r.seats.includes(uid)) return this._res(false, 'Already on stage'); if (r.seats.length >= this.capOf(r)) return this._res(false, 'Stage is full'); r.audience = r.audience.filter(x => x !== uid); r.hands = r.hands.filter(x => x !== uid); r.seats.push(uid); r.muted[uid] = true; HD.messages.system(id, `${HD.user(uid).name} moved to the stage`); }
      else { r.seats = r.seats.filter(x => x !== uid); r.modIds = r.modIds.filter(x => x !== uid || false); if (!r.audience.includes(uid)) r.audience.push(uid); HD.messages.system(id, `${HD.user(uid).name} moved to the audience`); }
      this.emit(); return this._res(true, 'Moved');
    }
    invite(id, uid) {
      const r = HD.room(id); if (!this.can(r, 'invite', uid)) return this._res(false, 'You cannot invite people'); if (r.seats.length >= this.capOf(r)) return this._res(false, 'Stage is full');
      r.invited.push(uid); HD.toast.show(`Invite sent to ${HD.user(uid).name}`, { icon: 'send' });
      setTimeout(() => { const rr = HD.room(id); if (!rr || !S().currentRoom || S().currentRoom.id !== id) return; rr.invited = rr.invited.filter(x => x !== uid); if (Math.random() < .75 && rr.seats.length < this.capOf(rr)) { rr.audience = rr.audience.filter(x => x !== uid); rr.seats.push(uid); rr.muted[uid] = true; HD.messages.system(id, `${HD.user(uid).name} accepted and joined the stage`); HD.sfx.play('pop'); } else HD.toast.show(`${HD.user(uid).name} declined the invite`); this.emit(); }, 1600);
      this.emit(); return this._res(true, 'Invited');
    }
    approve(id, uid) { const r = HD.room(id); if (!this.can(r, 'approve')) return this._res(false, 'You cannot do that'); if (r.seats.length >= this.capOf(r)) return this._res(false, 'Stage is full'); r.hands = r.hands.filter(x => x !== uid); r.audience = r.audience.filter(x => x !== uid); if (!r.seats.includes(uid)) r.seats.push(uid); r.muted[uid] = true; HD.messages.system(id, `${HD.user(uid).name} was invited to speak`); this.emit(); return this._res(true, 'Approved'); }
    reject(id, uid) { const r = HD.room(id); if (!this.can(r, 'approve')) return this._res(false, 'You cannot do that'); r.hands = r.hands.filter(x => x !== uid); this.emit(); return this._res(true, 'Request declined'); }
    lock(id, pw) { const r = HD.room(id); if (!this.can(r, 'lock')) return this._res(false, 'Only the host can do that'); r.locked = true; r.password = pw || ''; r.privacy = pw ? 'password' : 'private'; HD.messages.system(id, 'Room locked'); this.emit(); return this._res(true, 'Room locked'); }
    unlock(id) { const r = HD.room(id); if (!this.can(r, 'lock')) return this._res(false, 'Only the host can do that'); r.locked = false; r.password = ''; r.privacy = 'public'; HD.messages.system(id, 'Room unlocked'); this.emit(); return this._res(true, 'Room unlocked'); }
    setSlow(id, on) { const r = HD.room(id); if (!this.can(r, 'slow')) return this._res(false, 'You cannot do that'); r.slowMode = on; HD.messages.system(id, on ? 'Slow mode is on (8s between messages)' : 'Slow mode is off'); this.emit(); return this._res(true, 'Slow mode ' + (on ? 'on' : 'off')); }
    setFollowersOnly(id, on) { const r = HD.room(id); if (!this.can(r, 'followersOnly')) return this._res(false, 'Only the host can do that'); r.followersOnly = on; HD.messages.system(id, on ? 'Followers-only mode is on' : 'Followers-only mode is off'); this.emit(); return this._res(true, 'Followers-only ' + (on ? 'on' : 'off')); }
    end(id) { const r = HD.room(id); if (!this.can(r, 'end')) return this._res(false, 'Only the host can end the room'); r.status = 'ended'; HD.bus.emit('room:ended', { id }); this.emit(); return this._res(true, 'Room ended'); }
    transfer(id, uid) { const r = HD.room(id); if (!this.can(r, 'transfer', uid)) return this._res(false, 'Only the host can do that'); const old = r.hostId; r.hostId = uid; r.audience = r.audience.filter(x => x !== uid); r.hands = r.hands.filter(x => x !== uid); r.seats = r.seats.filter(x => x !== uid); r.seats.unshift(uid); r.modIds = r.modIds.filter(x => x !== uid); if (!r.seats.includes(old)) r.seats.push(old); r.mine = false; HD.messages.system(id, `${HD.user(uid).name} is now the host`); this.emit(); return this._res(true, 'Host transferred'); }
    addMod(id, uid) { const r = HD.room(id); if (!this.can(r, 'addMod', uid)) return this._res(false, 'Only the host can do that'); if (r.modIds.filter(x => x !== 'me').length >= (HD.vip ? HD.vip.maxMods() : 3) && !r.modIds.includes(uid)) return this._res(false, 'Moderator limit reached — upgrade VIP for more room admins'); if (!r.seats.includes(uid)) { if (r.seats.length >= this.capOf(r)) return this._res(false, 'Stage is full'); r.audience = r.audience.filter(x => x !== uid); r.seats.push(uid); } if (!r.modIds.includes(uid)) r.modIds.push(uid); HD.messages.system(id, `${HD.user(uid).name} is now a moderator`); this.emit(); return this._res(true, 'Moderator added'); }
    removeMod(id, uid) { const r = HD.room(id); if (!this.can(r, 'removeMod', uid)) return this._res(false, 'Only the host can do that'); r.modIds = r.modIds.filter(x => x !== uid); HD.messages.system(id, `${HD.user(uid).name} is no longer a moderator`); this.emit(); return this._res(true, 'Moderator removed'); }
    setMic(id, uid, muted) { const r = HD.room(id); if (!r) return; muted ? r.muted[uid] = true : delete r.muted[uid]; this.emit(); }
    raiseHand(id) {
      const r = HD.room(id); if (!r || r.hands.includes('me') || r.seats.includes('me')) return; r.hands.push('me'); HD.sfx.play('hand'); this.emit();
      if (this.role(r, 'me') === 'listener') setTimeout(() => {
        const rr = HD.room(id), c = S().currentRoom; if (!rr || !c || c.id !== id || !rr.hands.includes('me')) return; rr.hands = rr.hands.filter(x => x !== 'me');
        if (Math.random() < .7 && rr.seats.length < this.capOf(rr)) { rr.audience = rr.audience.filter(x => x !== 'me'); rr.seats.push('me'); rr.muted.me = true; HD.messages.system(id, `${HD.user(rr.hostId).name} invited you to speak`); HD.toast.ok('The host accepted your request — you are on stage', 'mic'); HD.sfx.play('win'); }
        else { HD.messages.system(id, 'Your request to speak was declined'); HD.toast.show('The host declined your request'); }
        this.emit();
      }, 3500 + Math.random() * 2500);
    }
    lowerHand(id) { const r = HD.room(id); if (!r) return; r.hands = r.hands.filter(x => x !== 'me'); this.emit(); }
    leaveStage(id) { const r = HD.room(id); if (!r || r.hostId === 'me') return; r.seats = r.seats.filter(x => x !== 'me'); r.modIds = r.modIds.filter(x => x !== 'me'); if (!r.audience.includes('me')) r.audience.push('me'); r.muted.me = true; HD.audio.mute(); this.emit(); }
    setDemoRole(id, role) {
      const r = HD.room(id); if (!r) return; if (!r._snap) r._snap = { hostId: r.hostId, modIds: r.modIds.slice(), seats: r.seats.slice(), audience: r.audience.slice() };
      const rm = a => a.filter(x => x !== 'me'); r.seats = rm(r.seats); r.audience = rm(r.audience); r.modIds = rm(r.modIds); r.hands = rm(r.hands);
      if (r.hostId === 'me') { r.hostId = r._snap.hostId === 'me' ? (r.seats[0] || 'u1') : r._snap.hostId; }
      if (role === 'host') { const old = r.hostId; r.hostId = 'me'; r.seats = r.seats.filter(x => x !== old); r.seats.unshift('me'); r.seats.push(old); }
      else if (role === 'mod') { if (r.seats.length >= this.capOf(r)) r.seats.pop(); r.seats.splice(1, 0, 'me'); r.modIds.push('me'); }
      else if (role === 'speaker') { if (r.seats.length >= this.capOf(r)) r.seats.pop(); r.seats.push('me'); }
      else r.audience.push('me');
      r.muted.me = true; HD.audio.mute(); HD.messages.system(id, `[demo] your role is now ${role}`); this.emit();
    }
    // ---- simulated crowd ----
    stopSim() { timers.forEach(clearInterval); timers = []; }
    startSim(id) {
      this.stopSim(); const self = this, tick = (fn, ms) => timers.push(setInterval(() => { const c = S().currentRoom, r = HD.room(id); if (!c || c.id !== id || !r) return; fn(r, c); }, ms));
      const bots = r => r.seats.concat(r.audience).filter(x => x !== 'me' && !S().social.blocked.includes(x));
      tick(r => { const b = bots(r); if (b.length && Math.random() < .8) HD.messages.push(id, { from: U.pick(b), text: U.pick(HD.demo.chatter()) }); }, 5200);
      tick((r, c) => {
        const s = S(); if (Math.random() < .55) { const out = s.users.filter(u => !r.seats.includes(u.id) && !r.audience.includes(u.id) && !s.social.blocked.includes(u.id)); if (out.length) { const u = U.pick(out); r.audience.push(u.id); HD.messages.system(id, u.name + ' joined'); HD.audio.participantJoined(u.id); if (u.tier >= 3 && HD.fx.entrance) HD.fx.entrance(u.name, HD.TIERS[u.tier - 1].emoji, HD.TIERS[u.tier - 1].color); } }
        else if (r.audience.length > 4) { const u = U.pick(r.audience.filter(x => x !== 'me')); if (u) { r.audience = r.audience.filter(x => x !== u); HD.messages.system(id, HD.user(u).name + ' left'); HD.audio.participantLeft(u); } }
        c.peak = Math.max(c.peak, self.listenerCount(r)); r.peak = Math.max(r.peak, c.peak); self.emit();
      }, 8800);
      tick(r => { if (!self.can(r, 'approve')) return; const cand = r.audience.filter(x => x !== 'me' && !r.hands.includes(x)); if (cand.length && r.hands.length < 3) { const u = U.pick(cand); r.hands.push(u); HD.sfx.play('hand'); HD.toast.show(`${HD.user(u).name} raised a hand ✋`, { icon: 'hand' }); self.emit(); } }, 16000);
      tick(r => { if (!r.seats.includes('me') || Math.random() > .5) return; const b = bots(r); if (!b.length) return; HD.gifts.receiveDemo(U.pick(b), U.pick(['rose', 'coffee', 'heart', 'star', 'balloon']), id); }, 24000);
      tick(r => { const b = bots(r); if (!b.length || Math.random() > .7) return; const e = U.pick(['❤️', '😂', '🔥', '👏', '😍', '🎉']); const u = U.pick(b); HD.messages.system(id, HD.user(u).name + ' sent ' + e); HD.bus.emit('room:react', { emoji: e, from: u }); }, 7000);
      tick((r, c) => { if (r.seats.includes('me') && !r.muted.me) { S().stats.speakSeconds++; if (S().stats.speakSeconds % 10 === 0) HD.progress.check(); } }, 1000);
    }
  }
  HD.RoomAdapter = RoomAdapter; HD.rooms = new DemoRoomAdapter();
})();
