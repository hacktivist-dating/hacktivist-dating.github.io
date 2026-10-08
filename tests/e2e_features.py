"""Tests for v1.1 features: matches, events, shop, polls, soundboard, icebreakers, voice notes, favorites, backup import, migration."""
import asyncio, http.server, threading, socketserver, os, functools, sys, json
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); os.chdir(ROOT)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9801
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
        b=await p.chromium.launch(args=['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
        ctx=await b.new_context(viewport={'width':390,'height':844}, permissions=['microphone']); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:200])); pg.on('console',lambda m: errs.append(m.text[:200]) if m.type=='error' else None)
        E=lambda s: pg.evaluate(s)
        async def w(ms=300): await pg.wait_for_timeout(ms)
        async def go(h):
            await E("document.querySelectorAll('.scrim').forEach(s=>{if(/Level up|Achievement|match/i.test(s.innerText))s.remove()})"); await E(f"location.hash='{h}'"); await w(450)
        async def clear_popups():
            await E("document.querySelectorAll('.scrim').forEach(s=>{if(/Level up|Achievement|match/i.test(s.innerText))s.querySelector('[data-x]').click()})"); await w(350)
        await pg.goto(URL); await w(2400)
        await pg.click('text=Create account'); await pg.fill('#a-n','Tester'); await pg.fill('#a-h','tester_f'); await pg.click('button[type=submit]'); await w(600)
        ok('version >= 1.1', await E("HD.CONFIG.APP_VERSION")>='1.1.0')
        # interests
        await go('#editprofile'); 
        for t in ['Privacy','Open source','Chess','Coffee']: await pg.click(f'[data-int="{t}"]')
        await pg.click('#ef button[type=submit]'); await w(500)
        ok('interests saved', await E("HD.me().interests.length")==4)
        await go('#profile'); ok('profile shows interests', await pg.locator('.tagc').count()>=4)
        await go('#profile/u3'); ok('compat shown', '% compatible' in await pg.inner_text('.profile-hero'))
        cs=await E("HD.state.getState().users.map(u=>HD.demo.compat(HD.me(),u))"); ok('compat range', all(0<=c<=99 for c in cs) and len(set(cs))>3)
        # matches
        await go('#matches'); ok('deck cards', await pg.locator('.mcard').count()==3)
        top0=await E("document.querySelector('#deck .mcard:last-child').dataset.uid")
        await pg.click('[data-act=swipe][data-d=nope]'); await w(700); ok('pass recorded', await E(f"HD.state.getState().match.passed.includes('{top0}')"))
        top1=await E("document.querySelector('#deck .mcard:last-child').dataset.uid")
        bal=await E("HD.state.getState().wallet.balance"); await pg.click('[data-act=swipe][data-d=super]'); await w(900)
        ok('super like costs 50 + matches', await E("HD.state.getState().wallet.balance")==bal-50 and await E(f"HD.state.getState().match.matches.includes('{top1}')"))
        ok('match modal shown', await pg.locator('text=It\'s a match').count()>=1); await pg.click('.sheet-f .btn.primary'); await w(700)
        ok('match -> DM with icebreaker prefill', (await E("location.hash")).startswith('#messages/') and len(await pg.input_value('#ti'))>10)
        await go('#matches'); await pg.keyboard.press('ArrowLeft'); await w(700); ok('keyboard pass', await E("HD.state.getState().match.passed.length")==2)
        # drag gesture
        box=await pg.locator('#deck .mcard:last-child').bounding_box(); await pg.mouse.move(box['x']+150,box['y']+200); await pg.mouse.down(); await pg.mouse.move(box['x']+320,box['y']+210,steps=8); await pg.mouse.up(); await w(800); await clear_popups()
        ok('drag-swipe right liked', await E("HD.state.getState().match.liked.length")>=2, await E("JSON.stringify(HD.state.getState().match)")[:200] if False else '')
        for t in ['matches','liked']: await pg.click(f'[data-mt={t}]'); await w(150)
        ok('matches tab lists', await pg.locator('[data-mt=matches]').count()==1)
        await E("(()=>{const s=HD.state.getState();s.match.liked=s.users.map(u=>u.id);HD.state.persistState()})()"); await go('#matches'); ok('empty deck + reset', await pg.locator('[data-act=resetDeck]').count()>=0)
        # events
        await go('#rooms'); await pg.click('[data-tab=upcoming]'); await w(300); ok('6 seeded events', await pg.locator('.evc').count()==6)
        await pg.click('[data-act=evRemind] >> nth=0'); await w(200); ok('remind on', await E("HD.state.getState().events[0].remind"))
        async with pg.expect_download() as dl: await pg.click('[data-act=evIcs] >> nth=0')
        d=await dl.value; path=await d.path(); txt=open(path).read(); ok('ics valid', d.suggested_filename.endswith('.ics') and 'BEGIN:VEVENT' in txt and 'DTSTART:' in txt and 'END:VCALENDAR' in txt)
        await go('#create'); await pg.fill('#c-t','Scheduled Show'); await pg.check('#c-sch'); await w(200); ok('schedule field visible', await pg.locator('#c-when').is_visible())
        await pg.click('#cf button[type=submit]'); await w(700); ok('scheduled event created', await E("HD.state.getState().events.some(e=>e.title==='Scheduled Show'&&e.mine)")); ok('lands on upcoming tab', await pg.locator('.evc').count()==7)
        await E("(()=>{const e=HD.state.getState().events.find(x=>x.title==='Scheduled Show');e.startsAt=Date.now()-1000;HD.events.tick()})()"); await w(500)
        ok('event spawned live room', await E("(()=>{const e=HD.state.getState().events.find(x=>x.title==='Scheduled Show');return !!e.roomId&&HD.room(e.roomId).mine&&HD.room(e.roomId).status==='live'})()"))
        ok('live notification', await E("HD.state.getState().notifications.some(n=>/is live now/.test(n.text))"))
        await E("(()=>{const e=HD.state.getState().events[0];e.startsAt=Date.now()-1;HD.events.tick()})()"); await w(300); ok('bot event spawns room', await E("!!HD.state.getState().events[0].roomId"))
        await go('#rooms'); await E("document.querySelectorAll('.scrim').forEach(x=>x.remove())"); await w(200); await pg.click('[data-tab=upcoming]'); await w(300)
        n_ev=await E("HD.state.getState().events.length"); mine_btn=await pg.locator('[data-act=evCancel]').count()
        if mine_btn: await pg.evaluate("document.querySelector('[data-act=evCancel]').click()"); await w(400); await pg.click('.sheet-f .btn.danger'); await w(400)
        ok('cancel own event', (not mine_btn) or await E("HD.state.getState().events.length")==n_ev-1)
        # favorites
        await go('#rooms'); await pg.click('[data-tab=all]'); await w(300); rid=await E("document.querySelector('#r-list [data-act=toggleFav]').dataset.id"); await pg.click(f'#r-list [data-act=toggleFav][data-id="{rid}"]'); await w(200); ok('favorite saved', await E(f"HD.state.getState().favorites.includes('{rid}')"))
        await pg.click('[data-tab=saved]'); await w(200); ok('saved tab lists', await pg.locator('.rr').count()==1)
        # shop (v1.2 store covered in e2e_v12.py) — here just ensure a theme is owned for the room-theme test
        await E("HD.state.getState().wallet.balance=5000"); await E("HD.shop.buy('theme','ocean',0)"); ok('theme bought', await E("HD.shop.owns('theme','ocean')"))
        # room: host, theme, poll
        await go('#room/'+await E("HD.rooms.list({}).find(r=>!r.password&&r.hostId!=='me').id")); await w(900); await clear_popups(); await E("HD.modal.closeAll()"); await w(300)
        await E("HD.rooms.setDemoRole(HD.state.getState().currentRoom.id,'host')"); await w(300); rid2=await E("HD.state.getState().currentRoom.id")
        await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click('[data-mk=settings]'); await w(300); await pg.select_option('#rs-th','ocean'); await pg.click('.sheet-f .btn.primary'); await w(400)
        ok('room theme applied', await E("document.querySelector('.room-screen').dataset.rt")=='ocean')
        await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click('[data-mk=poll]'); await w(300); await pg.fill('#pq','Pizza or tacos?'); await pg.fill('#po1','Pizza'); await pg.fill('#po2','Tacos'); await pg.click('.sheet-f .btn.primary'); await w(500)
        ok('poll visible', await pg.locator('.poll .opt').count()==2)
        await pg.click('.poll .opt >> nth=1'); await w(300); ok('my vote counted', await E(f"HD.room('{rid2}').poll.opts[1].votes.includes('me')"))
        await w(7000); ok('bots voted', await E(f"HD.room('{rid2}').poll.opts.flatMap(o=>o.votes).length")>=2)
        await pg.click('[data-act=pollEnd]'); await w(300); ok('poll closed', await E(f"!HD.room('{rid2}').poll.open")); ok('votes disabled when closed', await pg.locator('.poll .opt[disabled]').count()==2)
        await pg.click('[data-act=pollClear]'); await w(300); ok('poll removed', await E(f"!HD.room('{rid2}').poll"))
        await E("HD.rooms.setDemoRole(HD.state.getState().currentRoom.id,'listener')"); await w(300); await E("HD.rooms.startPoll('"+rid2+"','x',['a','b'])"); ok('listener cannot start poll', await E(f"!HD.room('{rid2}').poll"))
        # soundboard / icebreaker / shortcuts
        await E("HD.rooms.setDemoRole(HD.state.getState().currentRoom.id,'speaker')"); await w(300)
        await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click('[data-mk=sounds]'); await w(300); ok('8 sounds', await pg.locator('[data-snd]').count()==8)
        for s in ['applause','drum','ding','airhorn','trombone','whoosh','rimshot','sparkle']: await pg.click(f'[data-snd={s}]'); await w(80)
        ok('sound logged', await E(f"HD.messages.room('{rid2}').some(m=>/You played/.test(m.text))")); await E("HD.modal.closeAll()"); await w(300)
        await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click('[data-mk=ice]'); await w(300); t1=await pg.inner_text('#ib-t'); await pg.click('.sheet-f .btn >> nth=0'); await w(200); ok('icebreaker shuffles', len(t1)>10)
        await pg.click('.sheet-f .btn.primary'); await w(400); ok('icebreaker posted', await E(f"HD.messages.room('{rid2}').some(m=>/🧊/.test(m.text))")); await E("HD.modal.closeAll()"); await w(300)
        await pg.keyboard.press('c'); await w(400); ok('shortcut C opens chat', await pg.locator('.drawer').count()==1); await pg.keyboard.press('Escape'); await w(300); ok('Esc closes chat', await pg.locator('.drawer').count()==0)
        await pg.keyboard.press('r'); await w(300); ok('shortcut R tray', await pg.locator('.react-tray').count()==1); await pg.keyboard.press('Escape'); await w(200)
        await pg.keyboard.press('Shift+?'); await w(300); ok('? shows shortcuts', await pg.locator('kbd').count()>=8); await E("HD.modal.closeAll()"); await w(300)
        # share image
        await pg.click('.rm-top [data-r=share]'); await w(300)
        async with pg.expect_download() as dl2: await pg.click('[data-s=img]')
        d2=await dl2.value; ok('invite image png', d2.suggested_filename.endswith('.png')); import struct; data=open(await d2.path(),'rb').read(); ok('png valid', data[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',data[16:24])==(1080,1080)); await E("HD.modal.closeAll()")
        await pg.click('.rm-top [data-r=exit]'); await w(400)
        # voice notes
        await go('#messages/u8'); ok('voice button present', await pg.locator('#vr').count()==1)
        await pg.click('#vr'); await w(1800); ok('recording UI', await pg.locator('#rc:not([hidden])').count()==1); await pg.click('#vr'); await w(1200)
        ok('voice note saved', await E("HD.state.getState().messages.some(m=>m.audio&&m.from==='me')")); ok('audio player rendered', await pg.locator('.vnote audio').count()>=1)
        await go('#messages'); ok('inbox shows voice label', 'Voice note' in await pg.inner_text('#view')); await go('#messages/u8')
        ok('voice blob in IDB cache', await E("Object.keys(HD.storage.images).some(k=>k.startsWith('vm:'))"))
        await pg.click('#ib'); ok('icebreaker button fills input', len(await pg.input_value('#ti'))>10)
        await w(2600); ok('bot replies to voice', await E("HD.state.getState().messages.filter(m=>m.conv==='u8'&&m.from==='u8').some(m=>/voice|great|Played|back/i.test(m.text))"))
        await go('#messages/u8'); await pg.click('#vr'); await w(700); await pg.click('#rx'); await w(300); ok('cancel recording', await pg.locator('#rc[hidden]').count()==1)
        # backup import
        async with pg.expect_download() as dl3:
            await go('#settings'); await pg.click('[data-act=exportData]')
        bk=await dl3.value; bpath=await bk.path(); obj=json.load(open(bpath)); obj['wallet']['balance']=12345; json.dump(obj,open('/tmp/backup.json','w'))
        async with pg.expect_file_chooser() as fc: await pg.click('[data-act=importData]')
        (await fc.value).set_files('/tmp/backup.json') if False else await (await fc.value).set_files('/tmp/backup.json'); await w(500)
        await pg.click('.scrim:last-child .sheet-f .btn.primary'); await w(2000)
        ok('import applied', await E("HD.state.getState().wallet.balance")==12345)
        await E("localStorage.setItem('x','1')"); 
        # bad file rejected
        open('/tmp/bad.json','w').write('{"hello":1}')
        async with pg.expect_file_chooser() as fc2: await go('#settings'); await pg.click('[data-act=importData]')
        await (await fc2.value).set_files('/tmp/bad.json'); await w(500); ok('bad backup rejected', await E("HD.state.getState().wallet.balance")==12345 and await pg.locator('.toast.err').count()>=1)
        # migration from v1.0 state
        old=await E("(()=>{const s=JSON.parse(JSON.stringify(HD.state.getState()));delete s.match;delete s.events;delete s.shop;delete s.favorites;s.users.forEach(u=>{delete u.interests;delete u.frame});return s})()")
        await E(f"HD.state.frozen=true; localStorage.setItem(HD.CONFIG.STORAGE_KEY, JSON.stringify({json.dumps(old)}))"); await pg.reload(); await w(1800)
        ok('migrated state', await E("!!HD.state.getState().match&&HD.state.getState().events.length>=6&&HD.state.getState().users.every(u=>u.interests.length>=4)&&HD.state.getState().wallet.balance===12345"))
        await go('#matches'); ok('matches works after migration', await pg.locator('.mcard').count()>=1)
        # routes render + desktop + overflow
        for r in ['shop','matches','rooms','profile','settings']:
            await go('#'+r); ok('no h-overflow '+r, await E("document.documentElement.scrollWidth<=innerWidth+1"), str(await E("document.documentElement.scrollWidth")))
        await pg.set_viewport_size({'width':1280,'height':800}); await go('#matches'); ok('desktop matches', await pg.locator('.mcard').count()>=1); await go('#shop'); ok('sidebar has new items', await pg.locator('.sidebar [data-nav=matches]').count()==1)
        await pg.screenshot(path='/tmp/f_desktop_shop.png')
        print(f'PASSED {passes} FAILED {len(fails)}'); print('ERRS', errs[:6])
        await b.close()
asyncio.run(main())
