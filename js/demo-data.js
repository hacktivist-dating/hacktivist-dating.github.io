/* Seeded, fictional demo data. No real people, photos or identities. */
(function () {
  const HD = window.HD, U = HD.utils, D = HD.demo = {};
  const FIRST = ['Arjun', 'Riya', 'Meera', 'Kabir', 'Nila', 'Zoya', 'Dev', 'Anaya', 'Imran', 'Sana', 'Tara', 'Ishaan', 'Leena', 'Rohan', 'Mira', 'Neel', 'Farah', 'Vikram', 'Diya', 'Aarav', 'Kiran', 'Sahana', 'Omar', 'Lakshmi', 'Yash', 'Noor', 'Pranav', 'Esha', 'Jai', 'Amara'];
  const NOUN = ['byte', 'pixel', 'signal', 'ghost', 'proxy', 'cipher', 'kernel', 'patch', 'root', 'node', 'packet', 'daemon', 'vector', 'socket', 'binary'];
  const COUNTRIES = [['India', '🇮🇳'], ['UAE', '🇦🇪'], ['UK', '🇬🇧'], ['USA', '🇺🇸'], ['Germany', '🇩🇪'], ['Brazil', '🇧🇷'], ['Japan', '🇯🇵'], ['Kenya', '🇰🇪'], ['Turkey', '🇹🇷'], ['Spain', '🇪🇸'], ['Canada', '🇨🇦'], ['Singapore', '🇸🇬']];
  const BIOS = ['Open-source tinkerer. Coffee, code, calm voices.', 'Night-shift debugger. Ask me about synthwave.', 'Privacy nerd, terrible cook, great listener.', 'Here for real talk and bad puns.', 'Building things that respect people.', 'Radio voice in a laptop body.', 'Collecting stories from every timezone.', 'Chess, chai and long conversations.', 'Learning three languages badly at once.', 'Ask me anything about football or firmware.', 'Soft-spoken. Loud opinions about fonts.', 'Rooftop philosopher on weeknights.'];
  D.CATEGORIES = [['trending', 'Trending'], ['new', 'New Rooms'], ['music', 'Music'], ['gaming', 'Gaming'], ['friendship', 'Friendship'], ['dating', 'Dating'], ['education', 'Education'], ['technology', 'Technology'], ['movies', 'Movies'], ['sports', 'Sports'], ['regional', 'Regional'], ['international', 'International']];
  D.LANGS = ['English', 'Malayalam', 'Hindi', 'Tamil', 'Spanish', 'Arabic'];
  D.catName = k => (D.CATEGORIES.find(c => c[0] === k) || [k, k])[1];
  D.GIFTS = [['rose', 'Rose', '🌹', 10, 'petals'], ['icecream', 'Ice Cream', '🍦', 15, 'confetti'], ['coffee', 'Coffee', '☕', 20, 'steam'], ['balloon', 'Balloon', '🎈', 30, 'confetti'], ['heart', 'Heart', '❤️', 50, 'hearts'], ['butterfly', 'Butterfly', '🦋', 60, 'sparkle'], ['cake', 'Cake', '🍰', 80, 'confetti'], ['star', 'Star', '⭐', 100, 'sparkle'], ['gamepad', 'Gamepad', '🎮', 120, 'confetti'], ['teddy', 'Teddy Bear', '🧸', 150, 'hearts'], ['moon', 'Moon', '🌙', 250, 'sparkle'], ['guitar', 'Guitar', '🎸', 300, 'confetti'], ['crown', 'Crown', '👑', 500, 'crown'], ['trophy', 'Trophy', '🏆', 700, 'sparkle'], ['ring', 'Ring', '💍', 800, 'sparkle'], ['diamond', 'Diamond', '💎', 1000, 'sparkle'], ['fireworks', 'Fireworks', '🎆', 1500, 'fireworks'], ['lion', 'Lion', '🦁', 2000, 'lion'], ['castle', 'Castle', '🏰', 3000, 'castle'], ['rocket', 'Rocket', '🚀', 5000, 'rocket']].map(g => ({ id: g[0], name: g[1], icon: g[2], price: g[3], anim: g[4], cat: 'gift' }))
    .concat([['bouquet', 'Rose Bouquet', '💐', 500, 'petals'], ['loveletter', 'Love Letter', '💌', 200, 'hearts'], ['kiss', 'Kiss', '💋', 50, 'hearts'], ['champagne', 'Champagne', '🥂', 800, 'confetti'], ['cupid', 'Cupid Arrow', '💘', 5000, 'hearts'], ['necklace', 'Heart Necklace', '📿', 10000, 'sparkle'], ['foreverlove', 'Forever Love', '💒', 9999, 'castle']].map(g => ({ id: g[0], name: g[1], icon: g[2], price: g[3], anim: g[4], cat: 'rel' })))
    .concat([['lantern', 'Lantern', '🏮', 300, 'sparkle'], ['pumpkin', 'Pumpkin', '🎃', 200, 'confetti'], ['snowman', 'Snowman', '⛄', 400, 'confetti'], ['firebox', 'Firecracker Box', '🧨', 600, 'fireworks'], ['ticket', 'Gold Ticket', '🎫', 1000, 'sparkle']].map(g => ({ id: g[0], name: g[1], icon: g[2], price: g[3], anim: g[4], cat: 'act' })))
    .concat([['f_in', 'India', '🇮🇳'], ['f_ae', 'UAE', '🇦🇪'], ['f_gb', 'UK', '🇬🇧'], ['f_us', 'USA', '🇺🇸'], ['f_br', 'Brazil', '🇧🇷'], ['f_jp', 'Japan', '🇯🇵'], ['f_ke', 'Kenya', '🇰🇪'], ['f_tr', 'Turkey', '🇹🇷']].map(g => ({ id: g[0], name: g[1], icon: g[2], price: 99, anim: 'confetti', cat: 'cty' })));
  const ROOMS = [
    ['Late Night Chill', 'Low-key talk after midnight. Bring tea, leave the stress.', 'friendship', 'English'],
    ['Music & Friends', 'Share a track, share a story. Open mic every hour.', 'music', 'English'],
    ['Kerala Hangout', 'നാട്ടിലെ വിശേഷങ്ങൾ. Chai, cinema and campus stories.', 'regional', 'Malayalam'],
    ['Gaming Lounge', 'Squad up, swap clips, argue about tier lists.', 'gaming', 'English'],
    ['Study Together', 'Quiet co-working. Mics muted, hands up for questions.', 'education', 'English'],
    ['Talk & Chill', 'Dil ki baatein, no judgement. Sabka swagat hai.', 'friendship', 'Hindi'],
    ['Open Source Dating Lounge', 'Fork a conversation. Merge if there is a spark.', 'dating', 'English'],
    ['Encrypted Hearts', 'End-to-end honest. Icebreakers on the hour.', 'dating', 'English'],
    ['Pull Request Pals', 'Code review, career talk and gentle mentorship.', 'technology', 'English'],
    ['Debug Your Love Life', 'Stack traces for heartbreaks. Bring your logs.', 'dating', 'English'],
    ['Bollywood Banter', 'Classics vs. new wave. Dialogues encouraged.', 'movies', 'Hindi'],
    ['Matchday Voices', 'Live reactions, lineups and hot takes.', 'sports', 'English'],
    ['Chennai Chai Talks', 'Filter coffee debates and everything in between.', 'regional', 'Tamil'],
    ['Café Mundial', 'Practise Spanish over an imaginary espresso.', 'international', 'Spanish'],
    ['Lo-fi & Late Code', 'Ambient beats, side projects, soft focus.', 'music', 'English'],
    ['Indie Game Devs', 'Devlogs, playtests and jam teams.', 'gaming', 'English'],
    ['Exam Season Focus', 'Accountability circle for board and entrance prep.', 'education', 'Hindi'],
    ['Sci-Fi Cinema Club', 'Theories, rewatches and spoiler-free zones.', 'movies', 'English'],
    ['Privacy Pioneers', 'Digital rights, safe habits and honest tooling talk.', 'technology', 'English'],
    ['مجلس الليل', 'Late evening majlis for stories and friendly debate.', 'international', 'Arabic']
  ];
  const CHAT = ['hey! how was your day?', 'that sounds amazing 😄', 'you should host a room about that', 'ok that made me laugh out loud', 'send me the playlist?', 'we should hop into a room later', 'honestly same', 'good luck tomorrow!', 'that is such a good idea', 'lol no way', 'thank you, that helped', 'see you in the lounge tonight', 'I just followed you 🙌', 'what are you listening to?', 'brb, making tea', 'the host has a great voice tbh'];
  const ROOMCHAT = ['Hi everyone 👋', 'Love this topic', 'Can someone repeat that?', 'Good evening from Kochi!', 'This room is so wholesome', '🔥🔥', 'First time here, hello!', 'Agreed 100%', 'Ha! Same story here', 'Can I get a mic?', 'Playlist please 🎧', 'Greetings from Berlin', 'Great vibes tonight', 'Mic quality is 10/10'];
  D.ROOMCHAT = ROOMCHAT;
  const BASE = new Date('2026-09-01T00:00:00').getTime();

  D.build = function () {
    const r = U.rng('hacktivist-dating-seed'), now = Date.now();
    const users = FIRST.map((n, i) => {
      const c = COUNTRIES[i % COUNTRIES.length];
      return { id: 'u' + (i + 1), name: n, handle: n.toLowerCase() + '_' + NOUN[(i * 7) % NOUN.length], seed: 'u' + (i + 1) + n, country: c[0], flag: c[1], bio: BIOS[i % BIOS.length], level: 1 + (r() * 9 | 0), vip: r() < .2, verified: r() < .25, followers: 20 + (r() * 4000 | 0), following: 10 + (r() * 400 | 0), likes: 50 + (r() * 9000 | 0), roomsHosted: r() * 60 | 0, giftsReceived: r() * 300 | 0, online: r() < .55, joined: now - (30 + r() * 700) * 864e5 };
    });
    const ids = users.map(u => u.id);
    const shuffle = a => a.map(v => [r(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const rooms = ROOMS.map((d, i) => {
      const s = shuffle(ids), host = s[0], nSpk = 2 + (r() * 5 | 0), seats = [host].concat(s.slice(1, 1 + nSpk)), mods = r() < .6 ? [seats[1]] : [];
      const aud = s.slice(1 + nSpk, 1 + nSpk + 6 + (r() * 8 | 0)), locked = [3, 9, 17].includes(i);
      const muted = {}; seats.forEach(x => { if (r() < .35) muted[x] = true; });
      return { id: String(10230 + i * 137 + (r() * 90 | 0)), title: d[0], desc: d[1], category: d[2], language: d[3], hostId: host, modIds: mods, seats, audience: aud, extraListeners: 12 + (r() * 900 | 0), hands: [], invited: [], muted, level: 1 + (r() * 9 | 0), locked, password: locked ? HD.CONFIG.DEMO_ROOM_PASSWORD : '', privacy: locked ? 'password' : 'public', vip: [1, 6, 15].includes(i), verified: [0, 1, 6, 8, 11, 14, 18].includes(i), followersOnly: false, slowMode: false, allowGuests: true, coverSeed: 'room' + i, createdAt: now - (r() * 60 + 1) * 36e5, status: 'live', peak: 40 + (r() * 500 | 0), giftsTotal: r() * 9000 | 0, mine: false };
    });
    const gifts = D.GIFTS;
    const convUsers = ['u2', 'u5', 'u8', 'u3', 'u11', 'u14', 'u20', 'u26'], messages = [], conversations = [];
    convUsers.forEach((uid, ci) => {
      const n = 6 + (ci < 2 ? 1 : 0); let t = now - (ci + 1) * 36e5 * 3;
      for (let k = 0; k < n && messages.length < 50; k++) { t += 60000 * (2 + (r() * 30 | 0)); messages.push({ id: U.uid('m'), conv: uid, from: k % 2 ? 'me' : uid, text: CHAT[(ci * 5 + k * 3) % CHAT.length], ts: t, reactions: {} }); }
      conversations.push({ id: uid, userId: uid, unread: ci < 3 ? 1 + ci : 0, last: t });
    });
    while (messages.length < 50) { const u = convUsers[messages.length % 8]; messages.push({ id: U.uid('m'), conv: u, from: u, text: CHAT[messages.length % CHAT.length], ts: now - messages.length * 6e4, reactions: {} }); }
    const NT = [['follow', 'u4', 'started following you'], ['friend', 'u9', 'sent you a friend request'], ['gift', 'u12', 'sent you a Rose 🌹'], ['invite', 'u6', 'invited you to Talk & Chill'], ['host', 'u2', 'invited you to co-host a room'], ['achievement', null, 'Achievement unlocked: First Room'], ['reward', null, 'Your daily reward is ready to claim'], ['system', null, 'Welcome! This is a local demo — no data leaves your device']];
    const notifications = []; for (let i = 0; i < 20; i++) { const t = NT[i % NT.length]; notifications.push({ id: U.uid('n'), type: t[0], from: t[1] ? U.pick(ids, r) : null, text: t[2], ts: now - i * 47 * 6e4, read: i > 5 }); }
    for (const n of notifications) if (n.type === 'invite') n.roomId = rooms[5].id;
    const following = ['u2', 'u5', 'u8', 'u11', 'u14'], followers = ['u3', 'u5', 'u7', 'u9', 'u12', 'u15', 'u18', 'u21', 'u24', 'u27'];
    const history = [0, 1, 2].map(i => ({ id: U.uid('h'), name: ROOMS[[6, 0, 4][i]][0], ts: now - (i + 1) * 86400000 * 1.3, duration: (25 + i * 20) * 60000, peak: 30 + i * 41, gifts: 120 * (3 - i), participants: 12 + i * 9, role: ['host', 'listener', 'listener'][i] }));
    return D.migrate({
      v: HD.CONFIG.DATA_VERSION, currentUser: null, currentRoom: null, rooms, users, messages, conversations, notifications, gifts,
      wallet: { balance: 1000, transactions: [{ id: U.uid('t'), type: 'bonus', amount: 1000, label: 'Welcome demo coins', ts: now }], sent: [], received: [] },
      settings: { theme: HD.CONFIG.THEME.mode, accent: HD.CONFIG.THEME.accent, language: HD.CONFIG.DEFAULT_LANGUAGE, motion: 'system', notif: { follow: true, gift: true, invite: true, system: true }, privacy: { showOnline: true, allowDMs: true, showHistory: true }, safety: { filterChat: true, hideBlockedInRooms: true }, audio: { volume: 80, sfx: true, echo: true } },
      friends: ['u2', 'u5'], social: { following, followers, requests: ['u9', 'u17'], blocked: [] },
      achievements: {}, stats: { xp: 0, roomsJoined: 0, roomsHosted: 0, giftsSent: 0, giftsReceived: 0, speakSeconds: 0, nightOwl: false, earlyBird: false, likes: 0 },
      daily: { streak: 0, last: null, claimed: [] }, posts: [], history, recentSearches: [], roomChats: {}, hostEarnings: 0, demoNoticeSeen: false
    });
  };
  D.newMe = function (o) {
    return { id: 'me', name: o.name || 'You', handle: (o.handle || 'guest').toLowerCase().replace(/[^a-z0-9_]/g, '_'), seed: 'me' + (o.handle || 'guest'), country: o.country || 'India', flag: (COUNTRIES.find(c => c[0] === (o.country || 'India')) || COUNTRIES[0])[1], bio: o.bio || 'New here. Say hi in a room!', level: 1, vip: false, verified: false, followers: 24, following: 5, likes: 0, roomsHosted: 0, giftsReceived: 0, online: true, joined: Date.now(), isGuest: !!o.guest, interests: [], frame: null };
  };
  D.leaderboard = function (period, cat) {
    const st = HD.state.getState(), r = U.rng(period + '|' + cat), k = { daily: 1, weekly: 5, monthly: 20 }[period] || 1, base = { hosts: 40, gifters: 90000, receivers: 70000, speakers: 300 }[cat] || 100;
    return st.users.map(u => ({ userId: u.id, score: Math.round(base * k * (.15 + r() * .85)) })).sort((a, b) => b.score - a.score).slice(0, 20);
  };

  // ---------- v1.1 additions: interests, events, shop ----------
  D.INTERESTS = ['Open source', 'Privacy', 'Synthwave', 'Chess', 'Cricket', 'Football', 'Anime', 'Sci-fi', 'Hiking', 'Coffee', 'Board games', 'Photography', 'Poetry', 'Startups', 'Gaming', 'Cooking', 'Travel', 'Film', 'Podcasts', 'Design', 'Machine learning', 'Astronomy', 'Stand-up', 'Yoga'];
  D.FRAMES = [['neon', 'Neon Pulse', 300], ['glitch', 'Glitch', 500], ['gold', 'Royal Gold', 600], ['rainbow', 'Prism', 800], ['aurora', 'Aurora', 1000]].map(x => ({ id: x[0], name: x[1], price: x[2] }));
  D.ROOM_THEMES = [['sunset', 'Sunset', 400], ['ocean', 'Ocean', 400], ['forest', 'Forest', 400], ['neon', 'Neon City', 600], ['mono', 'Monochrome', 300]].map(x => ({ id: x[0], name: x[1], price: x[2] }));
  D.seedEvents = function (s) {
    const r = U.rng('events'), now = Date.now(), ids = s.users.map(u => u.id);
    const E = [['Sunday Open Mic & Chill', 'Bring a story, a song or just your ears.', 'friendship', 'English'], ['AMA: Privacy for Beginners', 'Questions welcome. No jargon, promise.', 'technology', 'English'], ['Synthwave Listening Party', 'Dim the lights. We play, you vibe.', 'music', 'English'], ['Speed Friending Night', 'Five-minute chats, rotating hosts.', 'dating', 'English'], ['Kerala Chai & Stories', 'വൈകുന്നേരത്തെ ചായയും കഥകളും.', 'regional', 'Malayalam'], ['Indie Dev Show & Tell', 'Demo your side project. Friendly feedback only.', 'technology', 'English']];
    return E.map((e, i) => ({ id: 'ev' + (i + 1), title: e[0], desc: e[1], category: e[2], language: e[3], hostId: ids[(i * 5 + 3) % ids.length], startsAt: now + (1 + i * 9 + r() * 6) * 36e5, remind: false, roomId: null, mine: false }));
  };
  D.migrate = function (s) {
    s.users.forEach((u, i) => {
      if (!u.interests) { const rr = U.rng('int' + u.id), pool = D.INTERESTS.slice(), n = 4 + (rr() * 3 | 0); u.interests = []; for (let k = 0; k < n; k++) u.interests.push(pool.splice(rr() * pool.length | 0, 1)[0]); }
      if (u.frame === undefined) u.frame = i % 5 === 2 ? D.FRAMES[(i / 5 | 0) % D.FRAMES.length].id : null;
    });
    D.GIFTS.forEach(g => { if (!s.gifts.find(x => x.id === g.id)) s.gifts.push(g); else { const o = s.gifts.find(x => x.id === g.id); if (!o.cat) o.cat = g.cat; } });
    s.users.forEach((u, i) => { if (u.tier === undefined) u.tier = i % 4 === 1 ? 1 + (i % 8) : 0; if (u.prestige === undefined) u.prestige = i % 5 === 0 ? 1 + (i % 6) : 0; if (u.title === undefined) u.title = i % 6 === 3 ? ['room_star', 'charm_star', 'game_king', 'sweet_cp'][i % 4] : null; });
    s.vip = s.vip || { tier: 0, until: 0, lastDaily: null }; s.bag = s.bag || {}; s.stats = Object.assign({ coinsSpent: 0, charm: 0, posts: 0, momentLikes: 0, gamesPlayed: 0, gamesWon: 0, gamePoints: 0, visitors: 0 }, s.stats);
    s.shop = Object.assign({ owned: [], frame: null, until: {}, equip: {} }, s.shop); s.shop.until = s.shop.until || {}; s.shop.equip = s.shop.equip || {};
    s.rooms.forEach(r => { if (r.layout === undefined) r.layout = ['Music & Friends', 'Gaming Lounge', 'Talk & Chill', 'Late Night Chill'].includes(r.title) ? 'grid10' : 'spotlight'; });
    s.visitors = s.visitors || [];
    s.moments = s.moments || D.seedMoments(s); s.official = s.official || D.OFFICIAL.map((o, i) => ({ id: 'of' + i, title: o[0], text: o[1], ts: Date.now() - i * 864e5, read: i > 1 })); s.cards = s.cards || {}; s.relations = s.relations || []; s.cp = s.cp === undefined ? null : s.cp; s.families = s.families || D.seedFamilies(s); if (s.myFamily === undefined) s.myFamily = null;
    s.match = s.match || { liked: [], passed: [], matches: [] }; s.events = s.events || D.seedEvents(s); s.shop = s.shop || { owned: [], frame: null }; s.favorites = s.favorites || [];
    [s.currentUser, s.account].forEach(u => { if (u && !u.interests) u.interests = []; if (u && u.frame === undefined) u.frame = null; });
    return s;
  };
  D.TOPICS = ['MyFirstRoom', 'LateNightThoughts', 'OpenSourceLove', 'MusicMood', 'StudyBuddy', 'TravelStories', 'FoodieFriday', 'GamingNight'];
  D.seedMoments = function (s) {
    const r = U.rng('moments'), now = Date.now(), ids = s.users.map(u => u.id), T = ['Just wrapped a two-hour room and my voice is gone. Worth it.', 'Hot take: every good conversation starts with a bad joke.', 'Looking for a study buddy for night sessions 📚', 'New playlist dropped in the lounge tonight 🎧', 'Met someone here who also loves chess and bad coffee. Small world.', 'Anyone else awake at 3 AM debugging life?', 'Tried the dice duel with strangers and lost five times in a row 😂', 'Sunset from the rooftop today. No filter needed.', 'Learning Malayalam one voice room at a time.', 'Shoutout to the hosts who keep rooms kind and calm 💜'];
    return T.map((t, i) => ({ id: 'mm' + (i + 1), by: ids[(i * 7 + 2) % ids.length], text: t, topic: D.TOPICS[i % D.TOPICS.length], ts: now - (i * 3 + 1) * 36e5 * (1 + r()), likes: ids.filter(() => r() < .15), comments: [], img: i % 3 === 0 ? 'mmcover' + i : null, gifts: 0 }));
  };
  D.seedFamilies = function (s) {
    const r = U.rng('families'), ids = s.users.map(u => u.id), N = [['Night Owls', 'OWL', 'Late-night talkers and tea drinkers.'], ['Open Source Crew', 'OSC', 'Contribute, review, repeat.'], ['Chai & Chill', 'CHI', 'Warm conversations every evening.'], ['Pixel Pirates', 'PXL', 'Gamers and game makers.'], ['Kerala Kollam', 'KLM', 'നാട്ടുകാരുടെ കൂട്ടം.'], ['Study Squad', 'STD', 'Focus rooms and accountability.']];
    return N.map((n, i) => { const m = ids.filter(() => r() < .3).slice(0, 12); if (!m.length) m.push(ids[i]); return { id: 'fam' + (i + 1), name: n[0], tag: n[1], desc: n[2], owner: m[0], admins: m.slice(1, 3), members: m, level: 1 + (r() * 6 | 0), xp: 100 + (r() * 4000 | 0), notice: 'Welcome! Be kind and keep it fun.', chat: [] }; });
  };
  D.OFFICIAL = [['Welcome to Hacktivist Dating 👋', 'Meet people through live voice rooms. Be kind, be curious, stay safe. This build is a frontend-only demo.'], ['Weekly topic: #MyFirstRoom', 'Post a moment about your first voice room and earn bonus XP.'], ['Anniversary event is live 🎉', 'Complete daily missions to fill the milestone bar and unlock bag gifts.'], ['Safety reminder', 'Never share passwords or payment details in rooms. Use Report and Block when something feels off.']];
  D.compat = function (a, b) { const A = a.interests || [], B = b.interests || []; if (!A.length || !B.length) return 40 + (U.hash(a.id + b.id) % 25); const sh = A.filter(x => B.includes(x)).length, un = new Set(A.concat(B)).size; return Math.min(99, Math.round(35 + 65 * (sh / Math.max(1, Math.min(A.length, B.length))) * .75 + 20 * (sh / un) + (U.hash(a.id + b.id) % 7))); };
  D.ICEBREAKERS = ['Would you rather debug production at 3 AM or explain your code to a rubber duck forever?', 'What song instantly puts you in a good mood?', 'Hot take: tabs or spaces? Defend your side.', 'Two truths and a lie — go!', 'What was the last thing you taught yourself?', 'Which fictional world would you move to tomorrow?', 'What is a tiny thing that made your week better?', 'If you could master any skill overnight, what would it be?', 'Best meal you have ever had, and where?', 'What is your most-used emoji, and what does it say about you?', 'Would you rather lose all your photos or all your contacts?', 'What is one app you would happily delete forever?', 'Describe your perfect Sunday in three words.', 'What is the most useful thing you learned for free online?', 'Which decade had the best music?', 'What are you overthinking right now?', 'Would you rather travel 100 years into the past or the future?', 'What is a hill you will happily die on?', 'Coffee, chai or something else — and how do you take it?', 'What is the nicest thing a stranger did for you?', 'What open-source project deserves more love?', 'What is a skill you wish schools taught?', 'Night owl or early bird — and what do you do with that time?', 'What is your go-to karaoke song?', 'Which movie can you quote the most lines from?'];

  D.chatter = () => ROOMCHAT;
  D.convChatter = () => CHAT;
})();
