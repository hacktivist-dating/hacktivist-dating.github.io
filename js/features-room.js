/* Room extras: polls, soundboard, icebreakers, invite image, shortcuts help, DM voice notes. All local. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon, $, $$ } = U, UI = HD.ui, M = HD.modal;
  const S = () => HD.state.getState(), cur = () => { const c = S().currentRoom; return c && HD.room(c.id); };

  // ---------- polls ----------
  Object.assign(HD.rooms, {
    startPoll(id, q, opts) { const r = HD.room(id); if (!r || !this.can(r, 'chat')) return { ok: false, msg: 'Only hosts and moderators can start polls' }; r.poll = { id: U.uid('p'), q, opts: opts.map(t => ({ t, votes: [] })), open: true, ts: Date.now() }; HD.messages.system(id, '📊 Poll started: ' + q); this.emit(); return { ok: true }; },
    vote(id, i) { const r = HD.room(id); if (!r || !r.poll || !r.poll.open || !r.poll.opts[i]) return { ok: false }; r.poll.opts.forEach(o => o.votes = o.votes.filter(x => x !== 'me')); r.poll.opts[i].votes.push('me'); this.emit(); return { ok: true }; },
    endPoll(id) { const r = HD.room(id); if (!r || !r.poll || !this.can(r, 'chat')) return { ok: false, msg: 'Only hosts and moderators can do that' }; r.poll.open = false; HD.messages.system(id, '📊 Poll closed: ' + r.poll.q); this.emit(); return { ok: true }; },
    clearPoll(id) { const r = HD.room(id); if (!r || !this.can(r, 'chat')) return { ok: false }; delete r.poll; this.emit(); return { ok: true }; }
  });
  HD.roomUI = {
    poll(r) {
      const p = r.poll; if (!p) return ''; const total = p.opts.reduce((n, o) => n + o.votes.length, 0), mgr = HD.rooms.can(r, 'chat'), mine = p.opts.findIndex(o => o.votes.includes('me'));
      return `<section class="poll" aria-label="Poll"><div class="row between"><b>📊 ${esc(p.q)}</b><span class="bdg ${p.open ? 'live' : ''}">${p.open ? 'Open' : 'Closed'}</span></div>${p.opts.map((o, i) => { const pc = total ? Math.round(o.votes.length / total * 100) : 0; return `<button class="opt ${mine === i ? 'mine' : ''}" data-act="vote" data-i="${i}" ${p.open ? '' : 'disabled'} aria-label="${esc(o.t)}, ${pc}%"><i style="width:${pc}%"></i><span>${esc(o.t)}${mine === i ? ' ✓' : ''}</span><span>${pc}%</span></button>`; }).join('')}<div class="row between" style="margin-top:10px"><span class="faint small">${total} vote${total === 1 ? '' : 's'}</span>${mgr ? `<span class="row" style="gap:6px">${p.open ? '<button class="btn sm" data-act="pollEnd">Close</button>' : ''}<button class="btn sm ghost" data-act="pollClear">Remove</button></span>` : ''}</div></section>`;
    },
    pollDialog(id) {
      M.open({ title: 'Start a poll', body: `<div class="field"><label for="pq">Question</label><input id="pq" class="input" maxlength="80" placeholder="What should we talk about next?"></div>${[1, 2, 3, 4].map(i => `<div class="field"><label for="po${i}">Option ${i}${i > 2 ? ' (optional)' : ''}</label><input id="po${i}" class="input" maxlength="40"></div>`).join('')}`,
        actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Start poll', kind: 'primary', onClick: h => { const q = $('#pq', h.el).value.trim(), o = [1, 2, 3, 4].map(i => $('#po' + i, h.el).value.trim()).filter(Boolean); if (!q || o.length < 2) { HD.toast.err('Add a question and at least 2 options'); return false; } const r = HD.rooms.startPoll(id, q, o); if (!r.ok) HD.toast.err(r.msg); } }] });
    }
  };
  Object.assign(HD.act, {
    vote: ({ i }) => { const r = cur(); r && HD.rooms.vote(r.id, +i); },
    pollEnd: () => { const r = cur(); r && HD.rooms.endPoll(r.id); },
    pollClear: () => { const r = cur(); r && HD.rooms.clearPoll(r.id); }
  });
  setInterval(() => { const r = cur(); if (!r || !r.poll || !r.poll.open) return; const all = r.seats.concat(r.audience).filter(x => x !== 'me'), voted = new Set(r.poll.opts.flatMap(o => o.votes)), pool = all.filter(x => !voted.has(x)); if (!pool.length || Math.random() > .7) return; const u = U.pick(pool), i = Math.floor(Math.random() * r.poll.opts.length); r.poll.opts[i].votes.push(u); HD.rooms.emit(); }, 2500);

  // ---------- soundboard (synthesised locally) ----------
  let ctx = null;
  const AC = () => { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = ctx || new C(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  const vol = () => (S().settings.audio.volume / 100) * .5;
  const noise = (c, dur) => { const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; };
  const env = (c, g, t, a, d, peak) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
  const tone = (c, type, f, t, d, peak, f2) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); env(c, g, t, .01, d, peak); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05); };
  const hit = (c, t, d, f, peak) => { const n = noise(c, d + .05), fl = c.createBiquadFilter(), g = c.createGain(); fl.type = 'bandpass'; fl.frequency.value = f; env(c, g, t, .005, d, peak); n.connect(fl); fl.connect(g); g.connect(c.destination); n.start(t); n.stop(t + d + .05); };
  HD.SOUNDS = [
    ['applause', '👏', 'Applause', (c, t, v) => { for (let i = 0; i < 26; i++) hit(c, t + Math.random() * 1.6, .07, 1500 + Math.random() * 2500, v * .7); }],
    ['drum', '🥁', 'Drumroll', (c, t, v) => { for (let i = 0; i < 30; i++) tone(c, 'triangle', 180 - i, t + i * .05, .06, v * .5, 90); tone(c, 'sine', 120, t + 1.5, .5, v, 50); hit(c, t + 1.5, .4, 4000, v * .6); }],
    ['ding', '🔔', 'Ding', (c, t, v) => { [880, 1320, 1760].forEach((f, i) => tone(c, 'sine', f, t, 1.2 - i * .25, v * (.7 - i * .15))); }],
    ['airhorn', '📣', 'Air horn', (c, t, v) => { [440, 554, 659].forEach(f => { tone(c, 'sawtooth', f, t, .35, v * .35); tone(c, 'sawtooth', f, t + .45, .6, v * .35); }); }],
    ['trombone', '😢', 'Sad trombone', (c, t, v) => { [[293, 0], [277, .4], [261, .8], [246, 1.2]].forEach(([f, o], i) => tone(c, 'sawtooth', f, t + o, i === 3 ? 1.2 : .38, v * .4, i === 3 ? f * .7 : 0)); }],
    ['whoosh', '💨', 'Whoosh', (c, t, v) => { const n = noise(c, 1), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4000, t + .7); env(c, g, t, .3, .6, v); n.connect(f); f.connect(g); g.connect(c.destination); n.start(t); n.stop(t + 1); }],
    ['rimshot', '🎭', 'Rimshot', (c, t, v) => { tone(c, 'sine', 200, t, .12, v, 80); tone(c, 'sine', 160, t + .16, .12, v, 70); hit(c, t + .4, .5, 6000, v * .8); tone(c, 'sine', 90, t + .4, .3, v, 50); }],
    ['sparkle', '✨', 'Sparkle', (c, t, v) => { [1046, 1318, 1568, 2093, 2637, 3136].forEach((f, i) => tone(c, 'sine', f, t + i * .07, .5, v * .45)); }]
  ];
  HD.soundboard = {
    play(key) { const c = AC(); if (!c) return false; const s = HD.SOUNDS.find(x => x[0] === key); if (!s) return false; s[3](c, c.currentTime + .02, vol()); return true; },
    open() {
      const r = cur(); if (!r) return; if (!r.seats.includes('me')) return HD.toast.show('Get on stage to use the soundboard', { icon: 'hand' });
      M.open({ title: 'Soundboard', body: `<p class="muted small" style="margin-bottom:10px">Sounds are synthesised in your browser and play on this device only (demo).</p><div class="sounds">${HD.SOUNDS.map(s => `<button data-snd="${s[0]}"><span class="e">${s[1]}</span>${s[2]}</button>`).join('')}</div>`,
        onOpen: h => h.el.addEventListener('click', e => { const b = e.target.closest('[data-snd]'); if (!b) return; HD.soundboard.play(b.dataset.snd); HD.messages.system(r.id, `You played ${HD.SOUNDS.find(x => x[0] === b.dataset.snd)[1]} ${HD.SOUNDS.find(x => x[0] === b.dataset.snd)[2]}`); }) });
    }
  };

  // ---------- icebreakers ----------
  HD.icebreaker = {
    next(prev) { let t; do { t = U.pick(HD.demo.ICEBREAKERS); } while (t === prev && HD.demo.ICEBREAKERS.length > 1); return t; },
    open(roomId) {
      let txt = HD.icebreaker.next(); const r = roomId && HD.room(roomId), mgr = r && HD.rooms.can(r, 'chat');
      const h = M.open({ title: '🧊 Icebreaker', body: `<div class="card pad center" style="min-height:110px;display:grid;place-items:center"><p id="ib-t" style="font-size:18px;font-weight:650">${esc(txt)}</p></div>`, actions: [{ label: 'Shuffle', keepOpen: true, onClick: hh => { txt = HD.icebreaker.next(txt); $('#ib-t', hh.el).textContent = txt; } }, { label: r ? (mgr ? 'Announce' : 'Post to chat') : 'Close', kind: 'primary', onClick: () => { if (!r) return; if (mgr) HD.messages.announce(r.id, '🧊 ' + txt, 'me'); else { const x = HD.messages.sendRoom(r.id, '🧊 ' + txt); if (!x.ok && x.msg) HD.toast.show(x.msg); } } }] });
    }
  };

  // ---------- keyboard shortcuts help ----------
  HD.shortcutsHelp = () => M.open({ title: 'Keyboard shortcuts', body: `<div class="group">${[['M', 'Mute / unmute'], ['H', 'Raise / lower hand'], ['C', 'Open chat'], ['G', 'Send a gift'], ['R', 'Reactions'], ['P', 'People'], ['S', 'Soundboard'], ['?', 'This help'], ['Esc', 'Close panels']].map(k => `<div class="li"><kbd>${k[0]}</kbd><span class="grow">${k[1]}</span></div>`).join('')}</div>`, actions: [{ label: 'Close', kind: 'primary' }] });

  // ---------- invite image ----------
  HD.shareCard = async function (room) {
    const W = 1080, cv = document.createElement('canvas'); cv.width = cv.height = W; const g = cv.getContext('2d');
    await new Promise(res => { const im = new Image(); im.onload = () => { g.drawImage(im, 0, 0, W, W * (im.height / im.width) < W ? W : W * (im.height / im.width)); res(); }; im.onerror = res; im.src = HD.roomCover(room); });
    const grd = g.createLinearGradient(0, 0, 0, W); grd.addColorStop(0, 'rgba(8,7,13,.25)'); grd.addColorStop(1, 'rgba(8,7,13,.92)'); g.fillStyle = grd; g.fillRect(0, 0, W, W);
    g.fillStyle = '#fff'; g.font = '700 34px ui-monospace,Menlo,Consolas,monospace'; g.fillText('>_ ' + HD.CONFIG.APP_NAME, 70, 110);
    g.fillStyle = '#ff5470'; g.beginPath(); g.arc(80, 200, 12, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 34px system-ui,sans-serif'; g.fillText('LIVE NOW', 105, 212);
    g.font = '800 92px system-ui,sans-serif'; const words = room.title.split(' '); let line = '', y = 620; words.forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - 140 && line) { g.fillText(line, 70, y); line = w; y += 104; } else line = t; }); g.fillText(line, 70, y);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '500 40px system-ui,sans-serif'; g.fillText(`Hosted by ${HD.user(room.hostId).name} · ${HD.demo.catName(room.category)} · ${room.language}`, 70, y + 80);
    g.fillStyle = '#a56bff'; g.font = '700 54px ui-monospace,Menlo,Consolas,monospace'; g.fillText('Room ID ' + room.id, 70, W - 120); g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '500 28px ui-monospace,Menlo,Consolas,monospace'; g.fillText(HD.roomLink(room.id).slice(0, 62), 70, W - 70);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png')), file = new File([blob], 'invite-' + room.id + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: room.title }); return 'shared'; } catch (e) { } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); return 'downloaded';
  };

  // ---------- voice notes (MediaRecorder, stored locally) ----------
  HD.voice = {
    get supported() { return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }, rec: null, chunks: [], t0: 0, stream: null,
    async start() { if (!this.supported) return false; try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return false; } this.chunks = []; this.rec = new MediaRecorder(this.stream); this.rec.ondataavailable = e => e.data.size && this.chunks.push(e.data); this.rec.start(); this.t0 = Date.now(); return true; },
    cleanup() { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; this.rec = null; },
    cancel() { if (this.rec && this.rec.state !== 'inactive') { this.rec.onstop = null; this.rec.stop(); } this.cleanup(); this.chunks = []; },
    stop() { return new Promise(res => { if (!this.rec) return res(null); const dur = Math.round((Date.now() - this.t0) / 1000), type = this.rec.mimeType || 'audio/webm'; this.rec.onstop = () => { const blob = new Blob(this.chunks, { type }); this.cleanup(); const fr = new FileReader(); fr.onload = () => res({ dataUrl: fr.result, dur }); fr.readAsDataURL(blob); }; this.rec.stop(); }); }
  };
  Object.assign(HD.messages, { sendVoice(uid, dataUrl, dur) {
    const s = S(), c = this.ensure(uid), key = 'vm:' + U.uid('v'); HD.storage.putImage(key, dataUrl); s.messages.push({ id: U.uid('m'), conv: uid, from: 'me', text: '', audio: key, dur, ts: Date.now(), reactions: {} }); c.last = Date.now(); HD.state.persistState(); HD.bus.emit('dm', { uid });
    HD.bus.emit('dm:typing', { uid, on: true }); setTimeout(() => { const st = S(); if (!st.currentUser) return; st.messages.push({ id: U.uid('m'), conv: uid, from: uid, text: U.pick(['Love the voice note! 🎧', 'Ha, you sound great', 'Sending one back soon 🎤', 'Played it twice 😄']), ts: Date.now(), reactions: {} }); c.last = Date.now(); if (UI.thread !== uid) c.unread = (c.unread || 0) + 1; HD.state.persistState(); HD.bus.emit('dm:typing', { uid, on: false }); HD.bus.emit('dm', { uid, incoming: true }); }, 1800);
  } });
})();
