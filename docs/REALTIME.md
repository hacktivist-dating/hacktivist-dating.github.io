# Realtime & WebRTC preparation

The static build **does not** connect users to each other. `DemoAudioAdapter` simulates other speakers with random speaking indicators; your own microphone is analysed locally (Web Audio `AnalyserNode`) for the level meter and never sent anywhere.

## The interface (`HD.AudioAdapter`)
`connect(roomId)`, `disconnect()`, `mute()`, `unmute()`, `setVolume(v)`, `onSpeaking(cb)`, `onParticipantJoined(cb)`, `onParticipantLeft(cb)`. The room screen only uses these (plus `onLevel` for the meter).

## What real WebRTC needs
- **Signaling** — WebRTC does *not* replace signaling. Peers must exchange SDP offers/answers and ICE candidates through a server you run (WebSocket, SSE + POST, managed service). **GitHub Pages alone cannot provide signaling.**
- **STUN** — required for peers to learn their public address.
- **TURN** — strongly recommended; many networks (symmetric NAT, corporate firewalls) cannot connect peer-to-peer without a relay.
- **SFU** — a full mesh does not scale beyond a few speakers. Use LiveKit, Daily, Agora, Twilio, mediasoup, etc. for rooms with many listeners.
- **Room/state sync** — participants, hands, mutes, chat and gifts need a realtime channel and server-side authority.

## Integration steps
1. Subclass `HD.AudioAdapter` (see the skeleton in `js/webrtcAdapter.js`).
2. Implement token fetching from *your* backend — never embed provider secrets in frontend code.
3. Set `HD.audio = new YourAdapter()` before boot; emit the same callbacks.
4. Replace `DemoRoomAdapter` / `DemoMessageAdapter` with adapters backed by your realtime channel.
5. Enforce permissions (who may speak, mute, remove) on the server.
