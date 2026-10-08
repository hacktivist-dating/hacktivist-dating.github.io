"""v1.4 tests: numbered 10-seat layout vs spotlight 8-seat layout."""
import asyncio, http.server, threading, socketserver, os, functools, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9991
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory='.')); threading.Thread(target=srv.serve_forever,daemon=True).start()
from playwright.async_api import async_playwright
URL=f'http://127.0.0.1:{PORT}/index.html'; fails=[]; passes=0
def ok(n,c,x=''):
    global passes
    if c: passes+=1
    else: fails.append(n); print('FAIL',n,x)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:250])); pg.on('console',lambda m: errs.append(m.text[:200]) if m.type=='error' else None)
        E=pg.evaluate
        async def w(ms=300): await pg.wait_for_timeout(ms)
        async def rm(): await E("document.querySelectorAll('.scrim').forEach(s=>s.remove())"); await w(150)
        await pg.goto(URL); await w(2400)
        await pg.click('text=Create account'); await pg.fill('#a-n','Tester'); await pg.fill('#a-h','tester_s'); await pg.click('button[type=submit]'); await w(600)
        await E("HD.state.getState().wallet.balance=100000")
        g=await E("HD.state.getState().rooms.filter(r=>r.layout==='grid10').length"); sp=await E("HD.state.getState().rooms.filter(r=>r.layout==='spotlight').length"); ok('seeded both layouts', g>=3 and sp>=10, f'{g}/{sp}')
        gid=await E("HD.state.getState().rooms.find(r=>r.layout==='grid10'&&!r.password).id")
        await E(f"location.hash='#room/{gid}'"); await w(1200); await rm()
        ok('grid10 stage rendered', await pg.locator('.stage.grid10').count()==1); ok('10 slots (filled + empty)', await pg.locator('.stage.grid10 .slot, .stage.grid10 .empty-seat').count()==10, str(await pg.locator('.stage.grid10 .slot, .stage.grid10 .empty-seat').count()))
        ok('no host-row in grid', await pg.locator('.host-row').count()==0); ok('slot 1 is host', await E("document.querySelector('.stage.grid10 .slot[data-no=\"1\"] [data-seat]').dataset.seat")==await E(f"HD.room('{gid}').hostId"))
        ok('NO. labels', await pg.locator('.stage.grid10 .no').count()+await pg.locator('.stage.grid10 .empty-seat .nm').count()==10)
        txt=await pg.inner_text('.stage.grid10'); ok('empty seat numbering text', 'NO.10' in txt, txt[-80:])
        ok('capacity 10', await E(f"HD.rooms.capOf(HD.room('{gid}'))")==10)
        # fill to capacity via API
        await E(f"HD.rooms.setDemoRole('{gid}','host')"); await w(300)
        await E(f"(()=>{{const r=HD.room('{gid}');const pool=HD.state.getState().users.map(u=>u.id).filter(x=>!r.seats.includes(x));while(r.seats.length<10){{r.seats.push(pool.shift())}};r.audience=r.audience.filter(x=>!r.seats.includes(x));HD.rooms.emit()}})()"); await w(400)
        ok('grid full: 10 filled, 0 empty', await pg.locator('.stage.grid10 .empty-seat').count()==0 and await pg.locator('.stage.grid10 [data-seat]').count()==10)
        extra=await E(f"HD.room('{gid}').audience.find(x=>x!=='me')"); ok('11th seat refused', not (await E(f"HD.rooms.move('{gid}','{extra}','stage')"))['ok'])
        ok('approve refused when full', not (await E(f"(()=>{{HD.room('{gid}').hands.push('{extra}');return HD.rooms.approve('{gid}','{extra}')}})()"))['ok'])
        await pg.screenshot(path='/tmp/v14_grid.png')
        # switch to spotlight with 10 seated: still renders, capacity 8 (no empties, no crash)
        await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click('[data-mk=settings]'); await w(300); await pg.select_option('#rs-ly','spotlight'); await pg.click('.sheet-f .btn.primary'); await w(500)
        ok('layout switched live', await E(f"HD.room('{gid}').layout")=='spotlight' and await pg.locator('.stage.grid10').count()==0 and await pg.locator('.host-row').count()==1)
        ok('capacity now 8', await E(f"HD.rooms.capOf(HD.room('{gid}'))")==8); ok('overfull spotlight renders all seated', await pg.locator('.stage [data-seat]').count()==10)
        await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click('[data-mk=settings]'); await w(300); await pg.select_option('#rs-ly','grid10'); await pg.click('.sheet-f .btn.primary'); await w(500); ok('switch back to grid', await pg.locator('.stage.grid10').count()==1)
        # spotlight room capacity 8
        await E("location.hash='#rooms'"); await w(400)
        sid=await E("HD.state.getState().rooms.find(r=>r.layout==='spotlight'&&!r.password&&r.seats.length>=3&&r.hostId!=='me'&&r.status==='live').id")
        await E(f"location.hash='#room/{sid}'"); await w(1100); await rm(); await E(f"HD.rooms.setDemoRole('{sid}','host')"); await w(200)
        await E(f"(()=>{{const r=HD.room('{sid}');const pool=HD.state.getState().users.map(u=>u.id).filter(x=>!r.seats.includes(x));while(r.seats.length<8){{r.seats.push(pool.shift())}};r.audience=r.audience.filter(x=>!r.seats.includes(x));HD.rooms.emit()}})()"); await w(300)
        ok('spotlight full at 8', await pg.locator('.host-row [data-seat]').count()==1 and await pg.locator('.stage > [data-seat]').count()==7 and await pg.locator('.stage .empty-seat').count()==0)
        x2=await E(f"HD.room('{sid}').audience.find(x=>x!=='me')"); ok('9th seat refused in spotlight', not (await E(f"HD.rooms.move('{sid}','{x2}','stage')"))['ok'])
        # create room form with layout
        await E(f"HD.rooms.leave(); location.hash='#create'"); await w(500); await pg.fill('#c-t','Grid Party'); await pg.select_option('#c-lay','grid10'); await pg.click('#cf button[type=submit]'); await w(1000); await rm()
        ok('created grid10 room', await E("HD.state.getState().rooms.some(r=>r.title==='Grid Party'&&r.layout==='grid10')")); ok('creator is NO.1', await pg.locator('.stage.grid10 .slot[data-no="1"] [data-seat=me]').count()==1)
        ok('9 empty slots for new room', await pg.locator('.stage.grid10 .empty-seat').count()==9)
        # click empty seat as host opens invite picker
        await pg.click('.stage.grid10 .empty-seat >> nth=0'); await w(400); ok('empty seat opens invite picker (host)', 'Invite' in await pg.inner_text('.sheet-h') if await pg.locator('.sheet-h').count() else False); await rm()
        # migration of old rooms without layout
        old=await E("(()=>{const s=JSON.parse(JSON.stringify(HD.state.getState()));s.rooms.forEach(r=>delete r.layout);return s})()")
        import json
        await E(f"HD.rooms.leave(); HD.state.frozen=true; localStorage.setItem(HD.CONFIG.STORAGE_KEY, JSON.stringify({json.dumps(old)}))"); await pg.reload(); await w(1800)
        ok('rooms get default layout on migrate', await E("HD.state.getState().rooms.every(r=>r.layout==='grid10'||r.layout==='spotlight')"))
        await pg.set_viewport_size({'width':360,'height':640}); await E(f"location.hash='#room/{gid}'"); await w(1000); await rm(); ok('no h-overflow 360 grid room', await E("document.documentElement.scrollWidth<=innerWidth+1"), str(await E("document.documentElement.scrollWidth")))
        print(f'PASSED {passes} FAILED {len(fails)}'); print('ERRS', errs[:6]); await b.close()
asyncio.run(main())
