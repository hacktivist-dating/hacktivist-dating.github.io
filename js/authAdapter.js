/* Local demo accounts + social graph. NOT real authentication: nothing is verified, no password is stored. */
(function () {
  const HD = window.HD, U = HD.utils;
  const S = () => HD.state.getState();
  class AuthAdapter { async login() { } async register() { } async guest() { } async logout() { } getCurrentUser() { } }
  class DemoAuthAdapter extends AuthAdapter {
    getCurrentUser() { return S().currentUser; }
    async register(o) {
      const s = S(); if (!o.name || !o.handle) return { ok: false, msg: 'Enter a name and a username' };
      const me = HD.demo.newMe(o); s.currentUser = me; s.account = me;
      s.friends = s.friends.filter(Boolean); HD.social.sync();
      HD.notify.add({ type: 'system', text: 'Welcome to ' + HD.CONFIG.APP_NAME + '! Your demo account lives only on this device.' }); HD.state.persistState(); return { ok: true, user: me };
    }
    async login(o) {
      const s = S(); if (!o.handle) return { ok: false, msg: 'Enter your username' };
      const h = o.handle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (s.account && s.account.handle === h) s.currentUser = s.account;
      else return this.register({ name: o.handle.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()), handle: h, country: 'India' });
      HD.social.sync(); HD.state.persistState(); return { ok: true, user: s.currentUser };
    }
    async guest() { const s = S(); s.currentUser = HD.demo.newMe({ guest: true, name: 'Guest', handle: 'guest_' + Math.random().toString(36).slice(2, 6) }); HD.social.sync(); HD.state.persistState(); return { ok: true }; }
    async logout() { const s = S(); if (s.currentUser && !s.currentUser.isGuest) s.account = s.currentUser; if (HD.state.getState().currentRoom) HD.rooms.leave(); s.currentUser = null; HD.state.persistState(); }
  }
  HD.AuthAdapter = AuthAdapter; HD.auth = new DemoAuthAdapter();

  const soc = HD.social = {
    sync() { const s = S(); if (s.currentUser) { s.currentUser.followers = soc.followerCount(); s.currentUser.following = s.social.following.length; } },
    followerCount() { const s = S(); return s.social.followers.length + (s.stats.extraFollowers || 0); },
    isFollowing: id => S().social.following.includes(id),
    isFollower: id => S().social.followers.includes(id),
    isFriend: id => S().friends.includes(id),
    isBlocked: id => S().social.blocked.includes(id),
    isPending: id => (S().social.sent || []).includes(id),
    follow(id) { const s = S(); if (!soc.isFollowing(id)) { s.social.following.push(id); HD.progress.addXp(10, 'follow'); } soc.sync(); HD.state.persistState(); HD.bus.emit('social'); },
    unfollow(id) { const s = S(); s.social.following = s.social.following.filter(x => x !== id); soc.sync(); HD.state.persistState(); HD.bus.emit('social'); },
    addFriend(id) {
      const s = S(); if (soc.isFriend(id) || soc.isPending(id)) return; (s.social.sent = s.social.sent || []).push(id); HD.state.persistState(); HD.bus.emit('social');
      setTimeout(() => { const t = S(); if (!t.currentUser || !soc.isPending(id)) return; t.social.sent = t.social.sent.filter(x => x !== id); if (!t.friends.includes(id)) t.friends.push(id); HD.notify.add({ type: 'friend', from: id, text: 'accepted your friend request' }); HD.toast.ok(HD.user(id).name + ' accepted your request', 'users'); HD.progress.addXp(30, 'friend'); HD.state.persistState(); HD.bus.emit('social'); }, 2600);
    },
    removeFriend(id) { const s = S(); s.friends = s.friends.filter(x => x !== id); HD.state.persistState(); HD.bus.emit('social'); },
    acceptRequest(id) { const s = S(); s.social.requests = s.social.requests.filter(x => x !== id); if (!s.friends.includes(id)) s.friends.push(id); if (!soc.isFollower(id)) s.social.followers.push(id); soc.sync(); HD.progress.addXp(30, 'friend'); HD.state.persistState(); HD.bus.emit('social'); },
    declineRequest(id) { const s = S(); s.social.requests = s.social.requests.filter(x => x !== id); HD.state.persistState(); HD.bus.emit('social'); },
    block(id) { const s = S(), f = x => x !== id; s.social.following = s.social.following.filter(f); s.social.followers = s.social.followers.filter(f); s.friends = s.friends.filter(f); s.social.requests = s.social.requests.filter(f); if (!s.social.blocked.includes(id)) s.social.blocked.push(id); soc.sync(); HD.state.persistState(); HD.bus.emit('social'); },
    unblock(id) { const s = S(); s.social.blocked = s.social.blocked.filter(x => x !== id); HD.state.persistState(); HD.bus.emit('social'); },
    simulateGrowth(n) {
      const s = S(); const cand = s.users.filter(u => !s.social.followers.includes(u.id) && !s.social.blocked.includes(u.id)).slice(0, Math.min(3, n));
      cand.forEach(u => { s.social.followers.push(u.id); HD.notify.add({ type: 'follow', from: u.id, text: 'started following you' }); });
      s.stats.extraFollowers = (s.stats.extraFollowers || 0) + Math.max(0, n - cand.length); soc.sync(); HD.progress.check(); HD.state.persistState(); HD.bus.emit('social');
    }
  };
})();
