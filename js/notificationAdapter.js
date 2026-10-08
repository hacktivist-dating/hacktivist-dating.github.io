(function () {
  const HD = window.HD, U = HD.utils;
  class NotificationAdapter { list() { } add() { } markRead() { } markAll() { } remove() { } unread() { } }
  class DemoNotificationAdapter extends NotificationAdapter {
    get s() { return HD.state.getState(); }
    list() { return this.s.notifications.slice().sort((a, b) => b.ts - a.ts); }
    unread() { return this.s.notifications.filter(n => !n.read).length; }
    add(n) {
      const map = { follow: 'follow', friend: 'follow', gift: 'gift', invite: 'invite', host: 'invite', system: 'system' }, k = map[n.type];
      if (k && this.s.settings.notif[k] === false) return null;
      const item = Object.assign({ id: U.uid('n'), ts: Date.now(), read: false }, n); this.s.notifications.unshift(item); if (this.s.notifications.length > 120) this.s.notifications.length = 120;
      HD.state.persistState(); HD.bus.emit('notif', item); return item;
    }
    markRead(id) { const n = this.s.notifications.find(x => x.id === id); if (n) n.read = true; HD.state.persistState(); HD.bus.emit('notif'); }
    markAll() { this.s.notifications.forEach(n => n.read = true); HD.state.persistState(); HD.bus.emit('notif'); }
    remove(id) { this.s.notifications = this.s.notifications.filter(n => n.id !== id); HD.state.persistState(); HD.bus.emit('notif'); }
  }
  HD.NotificationAdapter = NotificationAdapter; HD.notify = new DemoNotificationAdapter();
})();
