/* Room chat + direct messages. All local. "Other people" are scripted demo bots. */
(function () {
  const HD = window.HD, U = HD.utils;
  const S = () => HD.state.getState();
  const BAD = /\b(idiot|stupid|dumb|hate you)\b/gi;
  class MessageAdapter { room() { } sendRoom() { } conversations() { } thread() { } sendDM() { } }
  class DemoMessageAdapter extends MessageAdapter {
    constructor() { super(); this.last = {}; }
    filter(t) { return S().settings.safety.filterChat ? t.replace(BAD, m => '*'.repeat(m.length)) : t; }
    room(id) { const s = S(); return s.roomChats[id] || (s.roomChats[id] = []); }
    push(id, m) { const arr = this.room(id), msg = Object.assign({ id: U.uid('c'), ts: Date.now(), reactions: {}, type: 'msg' }, m); arr.push(msg); if (arr.length > 300) arr.splice(0, arr.length - 300); HD.bus.emit('room:chat', { roomId: id, msg }); return msg; }
    system(id, text) { return this.push(id, { type: 'sys', text }); }
    announce(id, text, from) { return this.push(id, { type: 'ann', text, from: from || 'me' }); }
    sendRoom(id, text, o = {}) {
      text = (text || '').trim(); if (!text) return { ok: false, msg: '' }; const r = HD.room(id); if (!r) return { ok: false, msg: 'Room not found' };
      const role = HD.rooms.role(r, 'me');
      if (r.slowMode && role !== 'host' && role !== 'mod' && !(HD.vip && HD.vip.has('free'))) { const w = 8000 - (Date.now() - (this.last[id] || 0)); if (w > 0) return { ok: false, msg: `Slow mode: wait ${Math.ceil(w / 1000)}s` }; }
      this.last[id] = Date.now(); this.push(id, { from: 'me', text: this.filter(text).slice(0, 300), replyTo: o.replyTo || null }); return { ok: true };
    }
    react(id, mid, emoji) { const m = this.room(id).find(x => x.id === mid); if (!m) return; const a = m.reactions[emoji] = m.reactions[emoji] || []; const i = a.indexOf('me'); i < 0 ? a.push('me') : a.splice(i, 1); if (!a.length) delete m.reactions[emoji]; HD.bus.emit('room:chat', { roomId: id, refresh: true }); }
    remove(id, mid) { const s = S(); s.roomChats[id] = this.room(id).filter(x => x.id !== mid); HD.bus.emit('room:chat', { roomId: id, refresh: true }); }
    clear(id) { S().roomChats[id] = []; this.system(id, 'Chat was cleared by a moderator'); HD.bus.emit('room:chat', { roomId: id, refresh: true }); }
    // --- direct messages ---
    conversations() { const s = S(); return s.conversations.filter(c => !s.social.blocked.includes(c.userId)).sort((a, b) => b.last - a.last); }
    thread(uid) { return S().messages.filter(m => m.conv === uid).sort((a, b) => a.ts - b.ts); }
    unreadTotal() { return S().conversations.reduce((n, c) => n + (c.unread || 0), 0); }
    markRead(uid) { const c = S().conversations.find(x => x.userId === uid); if (c && c.unread) { c.unread = 0; HD.state.persistState(); HD.bus.emit('dm'); } }
    ensure(uid) { const s = S(); let c = s.conversations.find(x => x.userId === uid); if (!c) { c = { id: uid, userId: uid, unread: 0, last: Date.now() }; s.conversations.push(c); } return c; }
    sendDM(uid, text) {
      text = (text || '').trim(); if (!text) return { ok: false }; const s = S(), c = this.ensure(uid);
      s.messages.push({ id: U.uid('m'), conv: uid, from: 'me', text: text.slice(0, 500), ts: Date.now(), reactions: {} }); c.last = Date.now(); HD.state.persistState(); HD.bus.emit('dm', { uid });
      HD.bus.emit('dm:typing', { uid, on: true });
      setTimeout(() => { const st = S(); if (!st.currentUser) return; st.messages.push({ id: U.uid('m'), conv: uid, from: uid, text: U.pick(HD.demo.convChatter()), ts: Date.now(), reactions: {} }); c.last = Date.now(); if (HD.ui && HD.ui.thread === uid) { c.unread = 0; } else c.unread = (c.unread || 0) + 1; HD.state.persistState(); HD.bus.emit('dm:typing', { uid, on: false }); HD.bus.emit('dm', { uid, incoming: true }); }, 1400 + Math.random() * 1800);
      return { ok: true };
    }
    reactDM(mid, emoji) { const m = S().messages.find(x => x.id === mid); if (!m) return; const a = m.reactions[emoji] = m.reactions[emoji] || []; const i = a.indexOf('me'); i < 0 ? a.push('me') : a.splice(i, 1); if (!a.length) delete m.reactions[emoji]; HD.state.persistState(); HD.bus.emit('dm', { uid: m.conv }); }
  }
  HD.MessageAdapter = MessageAdapter; HD.messages = new DemoMessageAdapter();
})();
