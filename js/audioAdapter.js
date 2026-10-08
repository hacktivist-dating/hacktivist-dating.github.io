/* Audio layer.
 * AudioAdapter is the interface a real realtime implementation (WebRTC / LiveKit / Agora / Daily / Twilio)
 * must fulfil. DemoAudioAdapter ONLY simulates other people's voices (random speaking indicators).
 * The local microphone is real (permission, mute, level meter) but is never transmitted anywhere. */
(function () {
  const HD = window.HD, U = HD.utils;
  class AudioAdapter {
    async connect(roomId) { throw new Error('connect() not implemented'); }
    disconnect() { throw new Error('disconnect() not implemented'); }
    async mute() { throw new Error('mute() not implemented'); }
    async unmute() { throw new Error('unmute() not implemented'); }
    setVolume(v) { throw new Error('setVolume() not implemented'); }
    onSpeaking(cb) { throw new Error('onSpeaking() not implemented'); }
    onParticipantJoined(cb) { throw new Error('onParticipantJoined() not implemented'); }
    onParticipantLeft(cb) { throw new Error('onParticipantLeft() not implemented'); }
  }
  class DemoAudioAdapter extends AudioAdapter {
    constructor() {
      super(); this.mode = 'demo'; this.cb = { speaking: new Set(), joined: new Set(), left: new Set(), level: new Set() };
      this.stream = null; this.ctx = null; this.analyser = null; this.muted = true; this.volume = 80; this.micStatus = 'idle'; this.level = 0; this.speaking = {}; this.timer = null; this.raf = 0; this.roomId = null; this.iMeSpeaking = false; this.monitor = null;
    }
    get supported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
    async connect(roomId) { this.roomId = roomId; this.speaking = {}; clearInterval(this.timer); this.timer = setInterval(() => this._simulate(), 900); this._simulate(); return true; }
    disconnect() { clearInterval(this.timer); this.timer = null; this.roomId = null; Object.keys(this.speaking).forEach(k => this._emit(k, false)); this.speaking = {}; this.muted = true; this.stopMic(); }
    _emit(uid, on, lvl) { if (this.speaking[uid] === on && uid !== 'me') return; this.speaking[uid] = on; this.cb.speaking.forEach(f => f({ userId: uid, speaking: on, level: lvl || 0 })); }
    _simulate() {
      const r = this.roomId && HD.room(this.roomId); if (!r) return;
      r.seats.forEach(uid => { if (uid === 'me') return; const can = !r.muted[uid]; const was = !!this.speaking[uid]; const on = can && (was ? Math.random() < .62 : Math.random() < .28); if (on !== was) this._emit(uid, on, .3 + Math.random() * .6); });
      Object.keys(this.speaking).forEach(k => { if (k !== 'me' && !r.seats.includes(k)) { this._emit(k, false); delete this.speaking[k]; } });
    }
    async startMic() {
      if (this.stream) return true;
      if (!this.supported) { this.micStatus = 'unsupported'; return false; }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: HD.state.getState().settings.audio.echo, noiseSuppression: true } });
        const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); const src = this.ctx.createMediaStreamSource(this.stream);
        this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 512; src.connect(this.analyser); this.src = src; this.micStatus = 'granted';
        const buf = new Uint8Array(this.analyser.fftSize); let lastEmit = 0;
        const tick = t => {
          if (!this.analyser) return; this.analyser.getByteTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
          this.level = U.clamp(Math.sqrt(s / buf.length) * 4, 0, 1); this.cb.level.forEach(f => f(this.muted && !this.testing ? 0 : this.level));
          if (t - lastEmit > 120) { lastEmit = t; const on = !this.muted && this.level > .12; if (on !== this.iMeSpeaking) { this.iMeSpeaking = on; this._emit('me', on, this.level); } }
          this.raf = requestAnimationFrame(tick);
        }; this.raf = requestAnimationFrame(tick); this._applyTrack(); return true;
      } catch (e) { this.micStatus = e && e.name === 'NotAllowedError' ? 'denied' : 'unavailable'; return false; }
    }
    _applyTrack() { if (this.stream) this.stream.getAudioTracks().forEach(t => t.enabled = !this.muted); }
    stopMic() { cancelAnimationFrame(this.raf); this.setMonitor(false); if (this.stream) this.stream.getTracks().forEach(t => t.stop()); if (this.ctx) try { this.ctx.close(); } catch (e) { } this.stream = null; this.ctx = null; this.analyser = null; this.level = 0; this.iMeSpeaking = false; this.cb.level.forEach(f => f(0)); }
    async mute() { this.muted = true; this._applyTrack(); if (this.iMeSpeaking) { this.iMeSpeaking = false; this._emit('me', false); } return { ok: true }; }
    async unmute() { const had = !!this.stream; const ok = await this.startMic(); this.muted = false; this._applyTrack(); return { ok: true, hasInput: ok, status: this.micStatus, first: !had }; }
    setVolume(v) { this.volume = U.clamp(+v, 0, 100); if (this.monitor) this.monitor.gain.value = this.volume / 100; }
    setMonitor(on) {
      if (!this.ctx || !this.src) return; if (on && !this.monitor) { this.monitor = this.ctx.createGain(); this.monitor.gain.value = this.volume / 100; this.src.connect(this.monitor); this.monitor.connect(this.ctx.destination); }
      if (!on && this.monitor) { try { this.src.disconnect(this.monitor); this.monitor.disconnect(); } catch (e) { } this.monitor = null; }
    }
    onSpeaking(cb) { this.cb.speaking.add(cb); return () => this.cb.speaking.delete(cb); }
    onLevel(cb) { this.cb.level.add(cb); return () => this.cb.level.delete(cb); }
    onParticipantJoined(cb) { this.cb.joined.add(cb); return () => this.cb.joined.delete(cb); }
    onParticipantLeft(cb) { this.cb.left.add(cb); return () => this.cb.left.delete(cb); }
    participantJoined(uid) { this.cb.joined.forEach(f => f(uid)); }
    participantLeft(uid) { this.cb.left.forEach(f => f(uid)); }
  }
  HD.AudioAdapter = AudioAdapter; HD.DemoAudioAdapter = DemoAudioAdapter; HD.audio = new DemoAudioAdapter();

  // ---- generated sound effects (no audio files) ----
  let sctx = null;
  HD.sfx = {
    play(name) {
      try {
        const s = HD.state.getState(); if (!s || !s.settings.audio.sfx) return;
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; sctx = sctx || new AC(); if (sctx.state === 'suspended') sctx.resume();
        const seq = { join: [[520, 0], [780, .09]], gift: [[660, 0], [880, .08], [1100, .16], [1320, .24]], win: [[523, 0], [659, .1], [784, .2], [1047, .3]], pop: [[700, 0]], hand: [[600, 0], [900, .07]] }[name] || [[600, 0]];
        seq.forEach(([f, t]) => { const o = sctx.createOscillator(), g = sctx.createGain(), n = sctx.currentTime + t; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(.08 * (s.settings.audio.volume / 100), n + .02); g.gain.exponentialRampToValueAtTime(.0001, n + .22); o.connect(g); g.connect(sctx.destination); o.start(n); o.stop(n + .25); });
      } catch (e) { }
    }
  };
  // ---- Web Speech API (voice → text in chat composer), only where supported ----
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  HD.speech = {
    supported: !!SR,
    listen(onText, onEnd) { if (!SR) return null; const r = new SR(); r.lang = HD.i18n.get() === 'hi' ? 'hi-IN' : HD.i18n.get() === 'ml' ? 'ml-IN' : 'en-US'; r.interimResults = false; r.onresult = e => onText(e.results[0][0].transcript); r.onend = () => onEnd && onEnd(); r.onerror = () => onEnd && onEnd(); try { r.start(); } catch (e) { onEnd && onEnd(); } return r; }
  };
})();
