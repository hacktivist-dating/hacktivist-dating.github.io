(function () {
  const HD = window.HD, U = HD.utils;
  HD.toast = {
    show(msg, o = {}) {
      const root = U.$('#toast-root'); if (!root) return;
      const el = document.createElement('div'); el.className = 'toast ' + (o.kind || '');
      el.setAttribute('role', o.kind === 'err' ? 'alert' : 'status');
      el.innerHTML = U.icon(o.icon || (o.kind === 'err' ? 'info' : 'check'), 18) + '<span>' + U.esc(msg) + '</span>';
      root.appendChild(el); while (root.children.length > 3) root.firstChild.remove();
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, o.ms || 2400);
    },
    ok(m, i) { this.show(m, { kind: 'ok', icon: i }); },
    err(m) { this.show(m, { kind: 'err', icon: 'info', ms: 3400 }); }
  };
})();
