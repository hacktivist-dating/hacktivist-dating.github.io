# Security notes

This project is a **static demo**. Treat every client-side control as cosmetic.

- **localStorage / IndexedDB can be edited** by the user (DevTools). Anything stored there — coins, XP, roles, achievements — can be changed.
- **Frontend permissions are not security.** Host/moderator rules are UI logic. Anyone can call the JavaScript API from the console.
- **Wallet values are not currency.** Demo coins have no value; no payment code exists. Real payments must use a certified provider and server-side verification.
- **Room passwords are not secure.** Password, private and followers-only checks run in the browser and the password is stored in page state.
- **Moderation is simulated.** Reports are stored locally and reviewed by nobody. The chat word filter is a trivial client-side mask.
- **Accounts are local demo accounts.** No identity is verified, no password is stored, nothing is transmitted.
- **Never put secret API keys in frontend code** (including LiveKit/Agora/Twilio secrets). Mint short-lived tokens on a server.
- All user-provided text is escaped before rendering (`HD.utils.esc`). Keep doing this when adding features.
- Microphone audio is only analysed locally in this build; it is not recorded or uploaded.

For a real product you need: server-side auth, authorisation checks on every action, rate limiting, abuse/CSAM reporting workflows, age assurance, content moderation, audit logs, and a compliant payments backend.

## Notes on the paid-looking features
VIP, prestige, the props store, lucky bags and PK support all use **demo coins that exist only in your browser**. Anyone can edit them in DevTools. Do not wire real money to this code: a real product needs server-side purchases, receipts, fraud checks, age gating and local gambling-law review. The mini-games here intentionally have no wagering.
