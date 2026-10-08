"""Lightweight accessibility self-audit (no external libraries): names, labels, alt text, ids, headings, tab order, contrast."""
import asyncio, http.server, threading, socketserver, os, functools, sys, json
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9801
ACC=sys.argv[2] if len(sys.argv)>2 else 'purple'
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory='.')); threading.Thread(target=srv.serve_forever,daemon=True).start()
from playwright.async_api import async_playwright
AUDIT = r"""
() => {
  const out = {names:[], labels:[], alts:[], ids:[], h1:0, tabidx:[], contrast:[], roles:[]};
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width>0 && r.height>0 && cs.visibility!=='hidden' && cs.display!=='none'; };
  const name = e => (e.getAttribute('aria-label')||'').trim() || (e.getAttribute('aria-labelledby') ? (document.getElementById(e.getAttribute('aria-labelledby'))||{}).innerText : '') || (e.innerText||'').trim() || (e.getAttribute('title')||'').trim() || (e.querySelector('img[alt]:not([alt=""])')||{}).alt || '';
  const root = document.querySelector('.room-screen') || document.querySelector('#view');
  const scope = [root, document.querySelector('.bottomnav'), document.querySelector('.sidebar')].filter(Boolean);
  const all = sel => scope.flatMap(s => Array.from(s.querySelectorAll(sel)));
  all('button,a[href],[role=button],[role=tab],[role=link],[role=option],[role=radio]').filter(vis).forEach(e => { if (!name(e)) out.names.push(e.outerHTML.slice(0,110)); });
  all('input:not([type=hidden]):not([type=file]),select,textarea').filter(e=>vis(e)||e.type==='checkbox').forEach(e => {
    const id = e.id, lab = (id && document.querySelector('label[for="'+id+'"]')) || e.closest('label');
    if (!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || lab)) out.labels.push(e.outerHTML.slice(0,110)); });
  all('img').forEach(e => { if (!e.hasAttribute('alt')) out.alts.push(e.outerHTML.slice(0,90)); });
  const seen = {}; document.querySelectorAll('[id]').forEach(e => { seen[e.id] = (seen[e.id]||0)+1; }); Object.keys(seen).forEach(k => { if (seen[k]>1) out.ids.push(k); });
  out.h1 = document.querySelectorAll('#view h1, .room-screen h1').length;
  document.querySelectorAll('[tabindex]').forEach(e => { if (+e.getAttribute('tabindex')>0) out.tabidx.push(e.outerHTML.slice(0,80)); });
  all('[role=tab]').forEach(e => { if (!e.closest('[role=tablist]') && !e.parentElement.classList.contains('tabs')) out.roles.push('tab outside tablist'); });
  // contrast (solid backgrounds only)
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(',').map(x=>parseFloat(x)); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; };
  const lum = c => { const f = v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); }; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b); };
  const bgOf = e => { let n = e, acc = null; const layers=[]; while (n && n.nodeType===1) { const c = parse(getComputedStyle(n).backgroundColor); const bi = getComputedStyle(n).backgroundImage; if (bi && bi!=='none') return null; if (c && c.a>0) { layers.push(c); if (c.a>=.98) break; } n = n.parentElement; } if (!layers.length) return parse(getComputedStyle(document.body).backgroundColor); let base = layers[layers.length-1].a>=.98 ? layers.pop() : parse(getComputedStyle(document.body).backgroundColor); while (layers.length) { const t = layers.pop(); base = {r:t.r*t.a+base.r*(1-t.a), g:t.g*t.a+base.g*(1-t.a), b:t.b*t.a+base.b*(1-t.a), a:1}; } return base; };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, count=0; const bad = {};
  while ((n = walker.nextNode()) && count<400) { const t = n.nodeValue.trim(); if (t.length<2 || !/[A-Za-z0-9]/.test(t)) continue; const e = n.parentElement; if (!e || !vis(e)) continue; const cs = getComputedStyle(e); if (cs.backgroundClip==='text'||cs.webkitBackgroundClip==='text') continue; count++;
    const fg = parse(cs.color), bg = bgOf(e); if (!fg||!bg) continue; const a = fg.a; const f2 = {r:fg.r*a+bg.r*(1-a), g:fg.g*a+bg.g*(1-a), b:fg.b*a+bg.b*(1-a)}; const L1 = lum(f2), L2 = lum(bg), ratio = (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05); const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight)>=700; const need = (size>=24 || (size>=18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) { const k = cs.color+'|'+Math.round(ratio*10)/10+'|'+size; if (!bad[k]) bad[k] = {ratio: Math.round(ratio*100)/100, need, size, color: cs.color, text: t.slice(0,30)}; } }
  out.contrast = Object.values(bad);
  return out;
}
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}); pg=await ctx.new_page(); E=pg.evaluate
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html'); await pg.wait_for_timeout(2300)
        await pg.click('text=Create account'); await pg.fill('#a-n','Audit'); await pg.fill('#a-h','audit_u'); await pg.click('button[type=submit]'); await pg.wait_for_timeout(600)
        await E("(()=>{const s=HD.state.getState();s.wallet.balance=100000;HD.vip.buy(4,30);s.cp={partnerId:'u7',level:2,intimacy:200,since:Date.now()};HD.state.persistState()})()")
        routes=['home','discover','rooms','messages','messages/u2','profile','profile/u3','editprofile','friends','following','followers','notifications','leaderboard','wallet','rewards','settings','help','about','demo','host','history','search','create','matches','shop','vip','prestige','titles','influence','specialid','mystery','missions','gamelevel','moments','announcements','cp','family','family/fam1','visitors','welcome']
        rid=await E("HD.rooms.list({}).find(r=>!r.password&&r.seats.length>=4&&r.hostId!=='me').id"); routes.append('room/'+rid)
        total={'names':0,'labels':0,'alts':0,'ids':0,'noh1':0,'contrast':0}; report=[]
        for theme in ['dark','light']:
            await E(f"HD.state.getState().settings.theme='{theme}';HD.state.getState().settings.accent='{ACC}';HD.applySettings()")
            for r in routes:
                if r=='welcome': await E("HD.auth.logout&&0"); 
                await E("document.querySelectorAll('.scrim').forEach(x=>x.remove());location.hash='#"+r+"'"); await pg.wait_for_timeout(700); await E("document.querySelectorAll('.scrim').forEach(x=>x.remove())")
                res=await E(AUDIT)
                if r.startswith('room/'): await pg.wait_for_timeout(300)
                issues={k:v for k,v in res.items() if k in ('names','labels','alts','ids','tabidx','roles','contrast') and v}
                if res['h1']==0 and not r.startswith('room/'): issues['noh1']=True
                for k in ('names','labels','alts','ids'): total[k]+=len(res[k])
                total['contrast']+=len(res['contrast']); total['noh1']+= 1 if issues.get('noh1') else 0
                if issues: report.append((theme,r,issues))
        for t,r,i in report: print(t,r,json.dumps(i)[:420])
        print('TOTALS',total); await b.close()
asyncio.run(main())
