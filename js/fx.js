/* Gift & celebration effects: canvas particles + CSS/SVG overlays. No external assets. */
(function () {
  const HD = window.HD, U = HD.utils, fx = HD.fx = {}; let cv, ctx, parts = [], raf = 0, last = 0;
  const size = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  function ensure() { if (!cv) { cv = U.$('#fx'); ctx = cv.getContext('2d'); size(); addEventListener('resize', size); } }
  function loop(t) {
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; ctx.clearRect(0, 0, cv.width, cv.height); const k = devicePixelRatio;
    parts = parts.filter(p => (p.life -= dt) > 0);
    for (const p of parts) {
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt; if (p.sway) p.x += Math.sin(p.life * 4 + p.ph) * p.sway * dt;
      ctx.save(); ctx.globalAlpha = U.clamp(p.life / (p.fade || .6), 0, 1); ctx.translate(p.x * k, p.y * k); ctx.rotate(p.rot);
      if (p.ch) { ctx.font = p.s * k + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.ch, 0, 0); }
      else if (p.rect) { ctx.fillStyle = p.c; ctx.fillRect(-p.s * k / 2, -p.s * k / 4, p.s * k, p.s * k / 2); }
      else { ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8 * k; ctx.beginPath(); ctx.arc(0, 0, p.s * k, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  const add = a => { ensure(); parts.push(...a); if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const R = (a, b) => a + Math.random() * (b - a), W = () => innerWidth, H = () => innerHeight;
  const glyphs = (chars, n, o = {}) => add(Array.from({ length: n }, () => ({ ch: U.pick(chars), x: R(0, W()), y: o.up ? H() + 20 : R(-80, -10), vx: R(-30, 30), vy: o.up ? R(-260, -120) : R(80, 220), g: o.up ? -20 : 40, rot: R(-1, 1), vr: R(-2, 2), s: R(o.min || 22, o.max || 42), life: R(2.6, 4.2), sway: R(20, 60), ph: R(0, 6) })));
  const burst = (x, y, n, hue) => add(Array.from({ length: n }, () => { const a = R(0, 6.28), v = R(80, 320); return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 160, s: R(1.6, 3.2), c: `hsl(${(hue + R(-25, 25)) | 0} 100% 65%)`, life: R(.9, 1.7), fade: .5 }; }));
  fx.confetti = () => { if (HD.reducedMotion()) return; add(Array.from({ length: 110 }, () => ({ rect: 1, x: R(0, W()), y: R(-H() * .4, -10), vx: R(-60, 60), vy: R(120, 360), g: 120, rot: R(0, 6), vr: R(-8, 8), s: R(8, 15), c: `hsl(${R(0, 360) | 0} 90% 62%)`, life: R(2.2, 3.6), sway: R(10, 40), ph: R(0, 6) }))); };
  const overlay = (html, ms) => { const d = document.createElement('div'); d.className = 'fxlayer'; d.innerHTML = html; document.body.appendChild(d); setTimeout(() => d.remove(), ms); };
  fx.play = function (gift, from, to) {
    const label = `<div class="fxlabel">${gift.icon} ${U.esc(from)} → ${U.esc(to)}</div>`;
    if (HD.reducedMotion()) { overlay(label, 2200); return; }
    HD.sfx && HD.sfx.play('gift');
    switch (gift.anim) {
      case 'petals': glyphs(['🌹', '🌸', '🌹', '🥀'], 46); break;
      case 'hearts': glyphs(['❤️', '💖', '💗', '💕'], 44, { up: true, min: 26, max: 52 }); break;
      case 'sparkle': glyphs(['✨', '💎', '⭐', gift.icon], 46, { up: false, min: 20, max: 40 }); break;
      case 'confetti': fx.confetti(); glyphs([gift.icon], 10); break;
      case 'steam': glyphs(['💨', gift.icon, '☁️'], 22, { up: true, min: 26, max: 46 }); break;
      case 'crown': overlay(`<div class="fxbig crown">👑</div>`, 2800); glyphs(['✨', '⭐'], 40, { min: 18, max: 34 }); break;
      case 'rocket': overlay(`<div class="fxrocket">🚀</div>`, 2600); setTimeout(() => glyphs(['🔥', '✨', '💥'], 30, { up: true }), 1000); break;
      case 'castle': overlay(`<div class="fxbig castle">🏰</div>`, 3200); glyphs(['✨', '🎆', '⭐'], 40); break;
      case 'lion': overlay(`<div class="fxbig lion">🦁</div>`, 2600); fx.confetti(); break;
      case 'fireworks': for (let i = 0; i < 7; i++) setTimeout(() => burst(R(W() * .15, W() * .85), R(H() * .15, H() * .5), 70, R(0, 360)), i * 340); break;
      default: fx.confetti();
    }
    overlay(label, 2600);
  };
  fx.reaction = function (emoji) {
    const e = document.createElement('div'); e.className = 'floaty'; e.textContent = emoji;
    e.style.left = (U.clamp(innerWidth / 2 + R(-140, 140), 20, innerWidth - 50)) + 'px'; e.style.setProperty('--dx', R(-90, 90) + 'px'); e.style.setProperty('--rot', R(-30, 30) + 'deg'); e.style.setProperty('--dur', R(2.2, 3.2) + 's');
    document.body.appendChild(e); setTimeout(() => e.remove(), 3400);
  };
})();
