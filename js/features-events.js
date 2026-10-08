/* Scheduled rooms ("events"): schedule, remind (in-app + optional browser notification), add to calendar (.ics), go live.
 * Everything runs in the open tab — there is no server to wake you up. */
(function () {
  const HD = window.HD, U = HD.utils, { esc, icon } = U, UI = HD.ui;
  const S = () => HD.state.getState();
  const fmt = ts => new Date(ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const rel = ts => { const m = Math.round((ts - Date.now()) / 60000); if (m <= 0) return 'starting now'; if (m < 60) return 'in ' + m + ' min'; const h = m / 60 | 0; return h < 24 ? `in ${h}h ${m % 60}m` : `in ${h / 24 | 0}d ${h % 24}h`; };
  const Ev = HD.events = {
    list() { return S().events.filter(e => !e.roomId || HD.room(e.roomId) && HD.room(e.roomId).status === 'live').sort((a, b) => a.startsAt - b.startsAt); },
    create(d) { const e = { id: U.uid('ev'), title: d.title, desc: d.desc || 'Come say hi!', category: d.category, language: d.language, hostId: 'me', startsAt: d.startsAt, remind: true, roomId: null, mine: true }; S().events.push(e); HD.state.persistState(); HD.bus.emit('events'); return e; },
    cancel(id) { const s = S(); s.events = s.events.filter(e => e.id !== id || !e.mine); HD.state.persistState(); HD.bus.emit('events'); },
    async toggleRemind(id) {
      const e = S().events.find(x => x.id === id); if (!e) return; e.remind = !e.remind;
      if (e.remind && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (x) { } }
      HD.state.persistState(); HD.bus.emit('events'); return e.remind;
    },
    spawn(e) {
      const s = S(); if (e.roomId && HD.room(e.roomId)) return HD.room(e.roomId); let r;
      if (e.mine) r = HD.rooms.create({ title: e.title, desc: e.desc, category: e.category, language: e.language });
      else {
        const rr = U.rng(e.id), ids = s.users.map(u => u.id).filter(x => x !== e.hostId).sort(() => rr() - .5); let id; do { id = String(40000 + (U.hash(e.id + Math.random()) % 9999)); } while (HD.room(id));
        r = { id, title: e.title, desc: e.desc, category: e.category, language: e.language, hostId: e.hostId, modIds: [], seats: [e.hostId].concat(ids.slice(0, 2)), audience: ids.slice(2, 10), extraListeners: 30, hands: [], invited: [], muted: {}, level: 3, locked: false, password: '', privacy: 'public', vip: false, verified: true, followersOnly: false, slowMode: false, allowGuests: true, coverSeed: 'ev' + e.id, createdAt: Date.now(), status: 'live', peak: 40, giftsTotal: 0, mine: false }; s.rooms.unshift(r);
      }
      e.roomId = r.id; e.startsAt = Math.min(e.startsAt, Date.now()); HD.state.persistState(); HD.bus.emit('events'); return r;
    },
    announce(e, r) {
      if (!e.remind && !e.mine) return; HD.notify.add({ type: 'invite', from: e.mine ? null : e.hostId, roomId: r.id, text: `“${e.title}” is live now` }); HD.toast.show(`“${e.title}” is live now`, { icon: 'mic', ms: 4000 });
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) { try { new Notification(HD.CONFIG.APP_NAME, { body: `“${e.title}” is live now`, icon: 'assets/icons/icon-192.png' }); } catch (x) { } }
    },
    tick() { const s = S(); if (!s.currentUser) return; s.events.forEach(e => { if (!e.roomId && e.startsAt <= Date.now()) { const r = Ev.spawn(e); Ev.announce(e, r); } }); },
    ics(id) {
      const e = S().events.find(x => x.id === id); if (!e) return; const z = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), esc2 = t => String(t).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
      const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + HD.CONFIG.APP_NAME + '//EN', 'BEGIN:VEVENT', 'UID:' + e.id + '@hacktivist-dating', 'DTSTAMP:' + z(Date.now()), 'DTSTART:' + z(e.startsAt), 'DTEND:' + z(e.startsAt + 36e5), 'SUMMARY:' + esc2(e.title), 'DESCRIPTION:' + esc2(e.desc + ' — ' + HD.CONFIG.APP_NAME), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = e.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    html() {
      const l = Ev.list(); if (!l.length) return UI.empty('calendar', 'Nothing scheduled', 'Schedule a room from Create room → “Schedule for later”.', '<button class="btn primary" data-go="#create">Create room</button>');
      return '<div class="grid-rooms">' + l.map(e => { const h = HD.user(e.hostId), live = !!e.roomId;
        return `<article class="evc" aria-label="${esc(e.title)}"><div class="row wrap" style="gap:6px"><span class="when">${icon(live ? 'mic' : 'clock', 14)} ${live ? 'Live now' : esc(fmt(e.startsAt)) + ' · ' + rel(e.startsAt)}</span></div><div><h3>${esc(e.title)}</h3><p class="muted small">${esc(e.desc)}</p></div><div class="row wrap" style="gap:6px"><span class="bdg">${esc(HD.demo.catName(e.category))}</span><span class="bdg">${esc(e.language)}</span></div><div class="row">${UI.av(h, { s: 30 })}<span class="small grow trunc"><b>${e.mine ? 'You' : esc(h.name)}</b></span></div>
        <div class="row wrap" style="gap:6px">${live ? `<button class="btn primary sm" data-act="evOpen" data-id="${e.roomId}">Join room</button>` : `<button class="btn sm ${e.remind ? 'primary' : ''}" data-act="evRemind" data-id="${e.id}" aria-pressed="${e.remind}">${icon('bell', 15)} ${e.remind ? 'Reminder on' : 'Remind me'}</button><button class="btn sm" data-act="evIcs" data-id="${e.id}">${icon('calendar', 15)} Calendar</button>${e.mine ? `<button class="btn sm primary" data-act="evStart" data-id="${e.id}">Go live now</button><button class="btn sm danger" data-act="evCancel" data-id="${e.id}">Cancel</button>` : `<button class="btn sm ghost" data-act="evStart" data-id="${e.id}">Preview live</button>`}`}</div></article>`; }).join('') + '</div>';
    }
  };
  Object.assign(HD.act, {
    evRemind: async ({ id }) => { const on = await Ev.toggleRemind(id); HD.toast.show(on ? 'Reminder set — keep this tab open' : 'Reminder removed', { icon: 'bell' }); },
    evIcs: ({ id }) => { Ev.ics(id); HD.toast.ok('Calendar file downloaded', 'calendar'); },
    evCancel: async ({ id }) => { if (await HD.modal.confirm('Cancel event?', 'The scheduled room will be removed.', { ok: 'Cancel event', danger: true })) Ev.cancel(id); },
    evStart: ({ id }) => { const e = S().events.find(x => x.id === id), r = Ev.spawn(e); HD.router.go('#room/' + r.id); },
    evOpen: ({ id }) => HD.router.go('#room/' + id),
    goTab: ({ t }) => { UI.roomsTab = t; HD.router.go('#rooms'); }
  });
  setInterval(Ev.tick, 15000);
})();
