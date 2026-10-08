/* XP, levels, achievements (all demo, all local). */
(function () {
  const HD = window.HD, P = HD.progress = {};
  P.LEVELS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
  P.ACH = [
    { id: 'first_room', title: 'First Room', desc: 'Join your first voice room.', icon: '🚪', xp: 20, test: s => s.stats.roomsJoined >= 1 },
    { id: 'first_host', title: 'First Host', desc: 'Create and host a room.', icon: '🎙️', xp: 50, test: s => s.stats.roomsHosted >= 1 },
    { id: 'first_gift', title: 'First Gift', desc: 'Send your first demo gift.', icon: '🎁', xp: 20, test: s => s.stats.giftsSent >= 1 },
    { id: 'f100', title: '100 Followers', desc: 'Reach 100 followers.', icon: '💯', xp: 80, test: s => HD.social.followerCount() >= 100 },
    { id: 'f1000', title: '1000 Followers', desc: 'Reach 1,000 followers.', icon: '🌟', xp: 300, test: s => HD.social.followerCount() >= 1000 },
    { id: 'night_owl', title: 'Night Owl', desc: 'Join a room between midnight and 5 AM.', icon: '🦉', xp: 40, test: s => s.stats.nightOwl },
    { id: 'early_bird', title: 'Early Bird', desc: 'Join a room between 5 and 8 AM.', icon: '🐦', xp: 40, test: s => s.stats.earlyBird },
    { id: 'top_speaker', title: 'Top Speaker', desc: 'Stay unmuted on stage for a full minute.', icon: '🗣️', xp: 60, test: s => s.stats.speakSeconds >= 60 },
    { id: 'gift_master', title: 'Gift Master', desc: 'Send 10 gifts.', icon: '💝', xp: 100, test: s => s.stats.giftsSent >= 10 },
    { id: 'social_star', title: 'Social Star', desc: 'Have 5 friends.', icon: '✨', xp: 80, test: s => s.friends.length >= 5 }
  ];
  P.info = xp => {
    let lv = 1; for (let i = 0; i < P.LEVELS.length; i++) if (xp >= P.LEVELS[i]) lv = i + 1;
    const cur = P.LEVELS[lv - 1], nxt = P.LEVELS[lv] != null ? P.LEVELS[lv] : cur + 2000 * (lv - P.LEVELS.length + 1);
    return { level: lv, cur, next: nxt, pct: Math.round((xp - cur) / (nxt - cur) * 100), xp };
  };
  P.addXp = (n, why) => {
    const s = HD.state.getState(); if (!s.currentUser) return; const before = P.info(s.stats.xp).level;
    n = Math.round(n * (HD.vip ? HD.vip.xpMult() : 1)); s.stats.xp += n; const after = P.info(s.stats.xp).level; s.currentUser.level = after; HD.state.persistState(); HD.bus.emit('xp', { n, why });
    if (after > before) setTimeout(() => HD.modal.levelUp(after), 500); P.check();
  };
  P.check = () => {
    const s = HD.state.getState(); if (!s.currentUser) return;
    P.ACH.forEach(a => {
      if (!s.achievements[a.id] && a.test(s)) {
        s.achievements[a.id] = Date.now(); s.stats.xp += a.xp; s.currentUser.level = P.info(s.stats.xp).level;
        HD.notify.add({ type: 'achievement', text: 'Achievement unlocked: ' + a.title }); HD.state.persistState();
        setTimeout(() => HD.modal.achievement(a), 700);
      }
    });
  };
})();
