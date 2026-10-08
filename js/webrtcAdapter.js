/* PLACEHOLDER — real multi-user WebRTC is intentionally NOT implemented.
 *
 * What a real implementation needs (none of this exists in a GitHub Pages-only site):
 *  1. SIGNALING: WebRTC does not replace signaling. Peers must exchange SDP offers/answers and ICE
 *     candidates through a server you control (WebSocket, Server-Sent Events + POST, a managed
 *     service, etc.). GitHub Pages serves static files only and cannot provide this.
 *  2. STUN: required so peers can discover their public addresses (public STUN servers work for tests).
 *  3. TURN: strongly recommended — a relay is needed for peers behind symmetric NATs/strict firewalls.
 *  4. TOPOLOGY: a full mesh does not scale past a handful of speakers. For rooms use an SFU
 *     (LiveKit, Daily, Agora, Twilio, mediasoup, ...).
 *
 * To integrate: subclass HD.AudioAdapter, implement its methods, then set `HD.audio = new YourAdapter()`
 * before the app boots. See docs/REALTIME.md.
 */
(function () {
  const HD = window.HD;
  class WebRTCAdapter extends HD.AudioAdapter {
    constructor(opts = {}) { super(); this.mode = 'webrtc'; this.iceServers = opts.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }]; this.signaling = opts.signaling || null; }
    get supported() { return typeof RTCPeerConnection !== 'undefined'; }
    async connect() { throw new Error('WebRTC is not implemented. A signaling server (and ideally TURN + an SFU) is required. See docs/REALTIME.md.'); }
    disconnect() { }
    async mute() { }
    async unmute() { }
    setVolume() { }
    onSpeaking() { return () => { }; }
    onParticipantJoined() { return () => { }; }
    onParticipantLeft() { return () => { }; }
  }
  HD.WebRTCAdapter = WebRTCAdapter;
})();
