/* Minimal localisation layer. Add a language by adding a dictionary; missing keys fall back to English. */
(function () {
  const HD = window.HD;
  const D = {
    en: { home: 'Home', discover: 'Discover', rooms: 'Rooms', messages: 'Messages', profile: 'Profile', search: 'Search', settings: 'Settings', wallet: 'Wallet', notifications: 'Notifications', join: 'Join', createRoom: 'Create room', leaderboard: 'Leaderboard', follow: 'Follow', following: 'Following', followers: 'Followers', gift: 'Gift', chat: 'Chat', raiseHand: 'Raise hand', reaction: 'React', people: 'People', recommended: 'Recommended rooms', save: 'Save changes', cancel: 'Cancel', live: 'Live', mic: 'Mic', more: 'More', seeAll: 'See all', dailyRewards: 'Daily rewards', hostCenter: 'Host center', friends: 'Friends', signIn: 'Sign in', register: 'Create account', guest: 'Continue as guest', logout: 'Log out', language: 'Language', appearance: 'Appearance', about: 'About', help: 'Help & safety', history: 'Room history', trending: 'Trending', newRooms: 'New rooms', listeners: 'listeners', demo: 'DEMO MODE', matches: 'Matches', moments: 'Moments', vip: 'VIP', family: 'Family', missions: 'Missions', shop: 'Shop', events: 'Events', saved: 'Saved' },
    ml: { home: 'ഹോം', discover: 'കണ്ടെത്തുക', rooms: 'റൂമുകൾ', messages: 'സന്ദേശങ്ങൾ', profile: 'പ്രൊഫൈൽ', search: 'തിരയുക', settings: 'ക്രമീകരണങ്ങൾ', wallet: 'വാലറ്റ്', notifications: 'അറിയിപ്പുകൾ', join: 'ചേരുക', createRoom: 'റൂം സൃഷ്ടിക്കുക', leaderboard: 'ലീഡർബോർഡ്', follow: 'പിന്തുടരുക', following: 'പിന്തുടരുന്നു', followers: 'പിന്തുടരുന്നവർ', gift: 'സമ്മാനം', chat: 'ചാറ്റ്', raiseHand: 'കൈ ഉയർത്തുക', reaction: 'പ്രതികരണം', people: 'ആളുകൾ', recommended: 'ശുപാർശ ചെയ്ത റൂമുകൾ', save: 'സേവ് ചെയ്യുക', cancel: 'റദ്ദാക്കുക', live: 'ലൈവ്', more: 'കൂടുതൽ', seeAll: 'എല്ലാം കാണുക', language: 'ഭാഷ', appearance: 'രൂപം', about: 'കുറിച്ച്', logout: 'ലോഗ് ഔട്ട്', listeners: 'ശ്രോതാക്കൾ' },
    hi: { home: 'होम', discover: 'खोजें', rooms: 'रूम', messages: 'संदेश', profile: 'प्रोफ़ाइल', search: 'खोज', settings: 'सेटिंग्स', wallet: 'वॉलेट', notifications: 'सूचनाएं', join: 'जुड़ें', createRoom: 'रूम बनाएं', leaderboard: 'लीडरबोर्ड', follow: 'फ़ॉलो', following: 'फ़ॉलोइंग', followers: 'फ़ॉलोअर्स', gift: 'उपहार', chat: 'चैट', raiseHand: 'हाथ उठाएं', reaction: 'रिएक्शन', people: 'लोग', recommended: 'अनुशंसित रूम', save: 'सहेजें', cancel: 'रद्द करें', live: 'लाइव', more: 'और', seeAll: 'सभी देखें', language: 'भाषा', appearance: 'दिखावट', about: 'परिचय', logout: 'लॉग आउट', listeners: 'श्रोता' }
  };
  let lang = 'en';
  const I = HD.i18n = {
    languages: { en: 'English', ml: 'മലയാളം', hi: 'हिन्दी' },
    set(l) { lang = D[l] ? l : 'en'; document.documentElement.lang = lang; },
    get: () => lang,
    add(code, name, dict) { D[code] = dict; I.languages[code] = name; },
    t(k) { return (D[lang] && D[lang][k]) || D.en[k] || k; }
  };
  HD.t = I.t;
})();
