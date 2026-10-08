# Hacktivist Dating

A polished, mobile-first **social voice-room web app** that runs as a completely static site — HTML, CSS and vanilla JavaScript only. No build step, no backend, deployable straight to GitHub Pages.

> **This is a frontend-only demonstration.** Live multi-user communication, real authentication, real payments and server-side moderation require backend services. Everyone you meet in a room is a scripted demo bot; coins are fake; accounts are local. See [Demo mode](#demo-mode) and [Security limitations](#security-limitations).

The name and all branding live in [`js/config.js`](js/config.js). The visual identity is original (dark glass UI, neon accent, terminal-prompt logo).

## Features

- Splash → welcome → guest / register / sign-in (local simulation)
- Home, Discover (12 category chips + 4 sort modes), Voice Rooms list, Room details, Search with history
- **Live voice room**: host + stage seats + listeners, animated speaking rings, raise hand → accept/reject, chat drawer (reply, reactions, announcements, system messages, slow mode), floating emoji reactions, People sheet, share sheet
- **Host & moderator controls**: mute, remove, move, invite, approve/reject, lock/unlock, rename, change category, slow mode, followers-only, end room, transfer host, add/remove moderator. A **Demo role switcher** (Room → More) lets you try every role in any room
- Virtual gifts (20) with full-screen animations (petals, hearts, crown, rocket, castle, lion, fireworks…), demo wallet, transactions, daily 7-day check-in
- Profile with tabs (Posts, Moments, Rooms, Gifts, Achievements), XP/levels, 10 achievements, edit profile with photo upload (IndexedDB)
- Friends, followers, following, block/unblock, friend requests, direct messages with typing indicator and reactions, notification centre
- Leaderboards (daily/weekly/monthly × 4 categories, clearly labelled demo data)
- Host Center, room history, settings (theme dark/light/system, 5 accents, motion, language, privacy, safety, audio, data export/reset)
- Accessibility: keyboard navigation, visible focus, ARIA labels, dialog focus trapping, `prefers-reduced-motion`
- i18n: English, Malayalam, Hindi (key labels; missing strings fall back to English)
- PWA: manifest, service worker, offline cache, installable
- Hash routing: `#home #discover #rooms #room/12345 #profile #messages #wallet #settings …`


## What's new in v1.2 (inspired by popular voice-room apps — original design, simulated, demo coins only)

> I studied the *feature set* of commercial voice-room apps and rebuilt the ideas with an original look, original names and original icons. No logos, artwork, usernames, photos or text from those apps are used. The two mechanics that resemble gambling there (slot machines / betting-based "game level") are **not** implemented as wagers: mini-games are free, and Game level comes from playing, never from betting.

- **VIP tiers (8)** with 24 privileges: tier medal, colour nickname, entrance effect, colour chat bubble, daily coins, more room admins, level acceleration, "speak freely" (skips slow mode), mystery mode, profile flash and more. Bought with demo coins for 7/30/90 days.
- **Prestige (11 levels)** earned by spending demo coins, with a privilege ladder. **Titles** (8, 3 tiers each) earned through activity. **Influence** (wealth / charm / activity). **Special IDs** (collectable numbers). **Mystery mode** (masked avatar and alias inside rooms).
- **Props store**: avatar headwear (animated frames), mounts (entrance rides), chat bubbles, relationship cards and CP rings, room themes, plus a backpack. Rent for 7 / 30 days or forever, equip, send as a gift. Some items unlock through VIP, prestige or CP level.
- **CP space & relationship cards**: invite someone with a CP / soulmate / bestie / homie card; gifts and messages grow intimacy and level the bond.
- **Moments**: social feed with Follow / Trending / Topic tabs, weekly-topic banner, photo posts, likes, comments, gifting a rose, delete.
- **Messages v2**: Message / Friends tabs, pinned System / Official announcement / Moment rows, friend search by name, username or ID, request screen, clear unread.
- **Search v2**: Room / User tabs, "You may like", recent searches.
- **Family**: create or join clubs, family chat, notice, daily check-in, levels.
- **Gift panel v2**: Gift / Relationship / Activity / Country / Bag, quantity chips (1, 7, 77, 177, 777), "All on stage", room contribution board.
- **Games** (free): turntable, dice duel, hand game, number guess, coin flip, trivia, **Lucky Bag** (share coins with the room), **PK battle** (host vs speaker, support with coins). **Game level** (Bronze → Master) from play points.
- **Missions / anniversary event**: daily missions, milestone track, bag rewards (resets daily).
- **Room extras**: contribution chip, chat tabs (All / Chat / Gift), generated room music, polls, soundboard, icebreakers, saved rooms, scheduled rooms with reminders and `.ics`, voice notes in DMs, invite image, keyboard shortcuts.
- **Matches**: swipe deck with interest-based compatibility.

- **Accessibility**: a built-in audit (`tests/a11y_audit.py`) checks every screen in dark and light themes with the purple, gold and green accents — accessible names, form labels, image alt text, duplicate ids, headings and text contrast (WCAG AA) — and currently reports **0 issues**. Keyboard tests (`tests/e2e_keyboard.py`) cover the skip link, focus rings, dialog focus trapping, Esc, focus return and room shortcuts.
- **Seat layouts**: each room is either *Spotlight* (host + 7 seats) or a *Numbered grid* of 10 seats (NO.1 – NO.10). Hosts can switch it live in Room settings; the Create form also lets you choose.
- **Backup & restore**: Settings → Data exports one JSON file with all state **plus photos, moment images and voice notes**, and imports it back (older backups still work).
- **Visitors**: simulated profile views with a Visitors list on your profile.

Everything above is local: no real payments, no real people, no server.

## Screens

Splash · Welcome · Guest · Login/Register · Home · Discover · Voice Rooms · Room Details · Live Room · Profile · Edit Profile · Friends · Messages (+ thread) · Notifications · Search · Leaderboard · Wallet · Daily Rewards · Settings · Help & Safety · About · Demo Mode · Host Center · Room History · Following · Followers · Create Room

## Technology

HTML5, CSS3 (custom properties, glassmorphism, animations), vanilla ES6+ (classic scripts under one `HD` namespace so it also works from `file://`), SVG icons, localStorage, IndexedDB, Web Audio API, MediaDevices API, Web Speech API (optional dictation), Service Worker. **No** frameworks, bundlers or servers.

## Local development

Open `index.html` directly — most features work. For the service worker, PWA install and microphone access use a local server (these need `http://localhost` or HTTPS):

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

To try it fast: **Continue as guest** (browse/listen) or **Create account** (host, gift, speak). Open a room, tap **Raise hand**; the host usually accepts in a few seconds. Password rooms use `1234`.

## GitHub Pages deployment

1. Create a repository, e.g. `hacktivist-dating`, on GitHub.
2. Copy the **contents** of this folder to the repository root (so `index.html` is at the top level).
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/hacktivist-dating.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: “Deploy from a branch”**, branch `main`, folder `/ (root)`, **Save**.
4. After a minute the site is live at `https://USERNAME.github.io/hacktivist-dating/`.

All asset paths are relative and routing is hash-based, so project-site sub-paths work with no configuration. When you change cached files, bump `VERSION` in `service-worker.js`. Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Demo mode

A subtle **DEMO MODE** pill is always visible (tap it for the explanation) and the live room shows a **DEMO** tag next to the listener count. Your microphone is real (permission prompt, mute, level meter, mic test) but never transmitted; other speakers are simulated. Nothing pretends to be a real connection.

## Architecture

```
index.html  manifest.json  service-worker.js
css/  reset · variables · themes · base · layout · components · animations · responsive
js/
  config.js        branding & constants          state.js       central state (get/set/update/subscribe/persist/load/reset)
  storage.js       localStorage + IndexedDB      demo-data.js   seeded fictional data
  router.js        hash router                   ui.js          shared components, shell, delegated events
  modals.js toast.js fx.js progress.js i18n.js utils.js
  *Adapter.js      Auth / Audio / Room / Message / Gift / Notification interfaces + Demo* implementations
  webrtcAdapter.js placeholder for future WebRTC
  screens-*.js     all screens
docs/  ARCHITECTURE · REALTIME · SECURITY · DEPLOYMENT
tests/ e2e.py, e2e_features.py, e2e_v12.py, e2e_v13.py, e2e_v14.py, e2e_keyboard.py, a11y_audit.py (optional Playwright suites)
```

UI code talks only to the adapters (`HD.auth`, `HD.audio`, `HD.rooms`, `HD.messages`, `HD.gifts`, `HD.notify`), so a backend can replace the `Demo*` classes without redesigning screens. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security limitations

localStorage can be edited by anyone; frontend permissions are not security; wallet values are not currency; room passwords are visible to the browser and not secure; moderation is simulated; accounts are local demo accounts; no API keys are (or should ever be) placed in frontend code. Read [docs/SECURITY.md](docs/SECURITY.md).

## Future WebRTC integration

WebRTC does **not** replace signaling; GitHub Pages cannot provide it. You need a signaling channel, STUN, ideally TURN, and for rooms an SFU (LiveKit, Daily, Agora, Twilio, mediasoup…). Subclass `HD.AudioAdapter`, set `HD.audio` before boot. See [docs/REALTIME.md](docs/REALTIME.md) and `js/webrtcAdapter.js`.

## Future backend integration

Implement the adapter interfaces against your service (auth, database, realtime, payments, moderation) and assign them on `HD` before `app.js` runs. Payments in particular must be handled server-side by a certified provider.

## License

MIT — see [LICENSE](LICENSE).
