# Architecture

**Single-page app, no modules, no build.** Scripts are loaded in dependency order by `index.html` and share the `window.HD` namespace (so the site also runs from `file://`, where ES modules are blocked).

## Layers
1. **State** (`state.js`) — one object (`getState`, `setState`, `updateState`, `subscribe`, `persistState`, `loadState`, `resetDemoData`). Persisted to `localStorage` (debounced, and on `pagehide`). `currentRoom` is runtime-only. Uploaded images live in IndexedDB (`storage.js`) and are cached in memory at boot.
2. **Adapters** — interfaces and demo implementations:
   | Interface | Demo implementation | File |
   |---|---|---|
   | AuthAdapter | DemoAuthAdapter (local account, no password stored) | authAdapter.js |
   | AudioAdapter | DemoAudioAdapter (real local mic meter, simulated others) | audioAdapter.js |
   | RoomAdapter | DemoRoomAdapter (rooms, roles, host/mod rules, crowd simulation) | roomAdapter.js |
   | MessageAdapter | DemoMessageAdapter (room chat + DMs, scripted replies) | messageAdapter.js |
   | GiftAdapter | DemoGiftAdapter (fake coins, daily reward) | giftAdapter.js |
   | NotificationAdapter | DemoNotificationAdapter | notificationAdapter.js |
3. **Event bus** (`HD.bus`) — adapters emit (`room:change`, `room:chat`, `room:gift`, `wallet`, `dm`, `notif`, `social`…); screens subscribe and clean up on route change.
4. **Router** (`router.js`) — hash routes registered with `HD.router.add(name, {title, nav, public, render(view, params) → cleanup})`. A fresh `#view` node is created per navigation so listeners never leak.
5. **UI** (`ui.js`, `modals.js`, `toast.js`, `fx.js`) — string-template components, delegated `data-act` / `data-go` handlers (`HD.act`), one modal system (sheet on mobile, dialog on desktop, focus-trapped).
6. **Screens** (`screens-*.js`).

## Swapping in a backend
Replace an adapter by assigning a compatible object on `HD` *before* `app.js` boots, e.g. `HD.rooms = new ApiRoomAdapter()`. Keep the same method names and emit the same bus events. Screens do not read demo data directly (they go through `HD.state`, which your adapters can fill from the network).

## Branding
Edit `js/config.js` (name, tagline, version, default language, theme, currency name/symbol). Accent colours are CSS variables in `css/themes.css`.

## Adding a language
`HD.i18n.add('ta', 'தமிழ்', { home: 'முகப்பு', ... })`, then it appears in Settings → Language.

## v1.2 modules
`features-vip.js` (VIP tiers, prestige, titles, influence, special IDs, mystery) · `features-store.js` (props store, rentals, entrance effect) · `features-gifts.js` (gift panel v2, bag, contributions) · `features-games.js` (mini-games, game level, lucky bag, PK, missions, room music) · `features-moments.js` (moments, messages v2, search v2) · `features-bonds.js` (CP space, families) · `features-match.js` · `features-events.js` · `features-room.js`.
Older saved data is upgraded automatically by `HD.demo.migrate()` (adds new keys without wiping anything).

## Colour tokens
Text colours that must stay readable on both themes use semantic tokens: `--accent-t`, `--gold-t`, `--ok-t`, `--danger-t`, `--warn-t`, `--info-t` (dark and light values in `variables.css` / `themes.css`). Use these for **text**; use `--accent`, `--gold` etc. only for fills, borders and glows. Run `python3 tests/a11y_audit.py PORT [accent]` after changing colours.
