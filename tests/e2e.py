import asyncio, http.server, threading, socketserver, os, functools, json, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9601
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory='.')); threading.Thread(target=srv.serve_forever,daemon=True).start()
from playwright.async_api import async_playwright
URL=f'http://127.0.0.1:{PORT}/index.html'
fails=[]; passes=0
def ok(name,cond,extra=''):
    global passes
    if cond: passes+=1
    else: fails.append(f'{name} {extra}'); print('FAIL',name,extra)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
        ctx=await b.new_context(viewport={'width':390,'height':844}, permissions=['microphone'])
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:200])); pg.on('console',lambda m: errs.append('CONSOLE '+m.text[:200]) if m.type=='error' else None)
        E=lambda s: pg.evaluate(s)
        async def w(ms=300): await pg.wait_for_timeout(ms)
        async def closeall(): await E("HD.modal.closeAll()"); await w(260)
        async def pc(sel,**k):
            await w(700); await E("document.querySelectorAll('.scrim').forEach(s=>{if(/Level up|Achievement unlocked/.test(s.innerText))s.querySelector('[data-x]').click()})"); await w(300); await pg.click(sel,**k)
        async def go(h): await E(f"location.hash='{h}'"); await w(350)
        await pg.goto(URL); await w(2400)
        ok('splash removed', await E("!document.querySelector('#splash')"))
        ok('welcome', 'Hacktivist' in await pg.inner_text('h1'))
        # register
        await pg.click('text=Create account'); await pg.fill('#a-n','Tester'); await pg.fill('#a-h','tester_one'); await pg.click('button[type=submit]'); await w(600)
        ok('home after register', await E("location.hash")=='#home')
        # nav
        for tab in ['discover','rooms','messages','profile','home']:
            await pg.click(f'.bottomnav [data-nav={tab}]'); await w(350); ok('nav '+tab, await E("location.hash")=='#'+tab)
        # every route renders content
        routes=['home','discover','rooms','messages','messages/u2','profile','profile/u3','editprofile','friends','following','followers','notifications','leaderboard','wallet','rewards','settings','help','about','demo','host','history','search','create']
        for r in routes:
            await go('#'+r); n=await E("document.querySelector('#view').innerText.length"); ok('route '+r, n>30, str(n)); await closeall()
        ok('no errors after routes', not errs, str(errs[:3]))
        # ---- click-all fuzz ----
        async def fuzz(route):
            await go('#'+route); cnt=0
            n=await E("document.querySelectorAll('#view button, #view [data-act], #view [data-go], #view a[href]').length")
            for i in range(min(n,40)):
                try:
                    await go('#'+route)
                    handle=await pg.evaluate_handle(f"document.querySelectorAll('#view button, #view [data-act], #view [data-go], #view a[href]')[{i}]")
                    el=handle.as_element()
                    if not el: continue
                    txt=(await el.inner_text())[:20].replace('\n',' ')
                    if 'Log out' in txt or 'Reset' in txt or 'Clear' in txt: continue
                    await el.click(timeout=1500, force=True); cnt+=1; await w(150)
                    await E("document.querySelectorAll('.scrim [data-x]').forEach(x=>x.click())"); await w(120)
                except Exception as ex:
                    pass
            return cnt
        before=len(errs)
        for r in ['home','discover','rooms','profile','friends','wallet','rewards','settings','host','history','leaderboard','notifications','help','about','demo','search']:
            c=await fuzz(r)
            ok('fuzz '+r, len(errs)==before, str(errs[before:before+2]))
            before=len(errs)
            # re-login if fuzz logged us out
            if await E("!HD.state.getState().currentUser"):
                await go('#login'); await pg.fill('#a-h','tester_one'); await pg.click('button[type=submit]'); await w(400)
        await closeall()
        # ---- room features ----
        rid=await E("HD.state.getState().rooms[0].id")
        await go('#room/'+rid); await w(900); await closeall()
        ok('room rendered', await pg.locator('[data-seat]').count()>5)
        ok('joined', await E("!!HD.state.getState().currentRoom"))
        # raise hand -> accepted
        await E('window.__r=Math.random;Math.random=()=>0.1'); await pg.click('[data-r=hand]'); ok('hand raised state', await E("HD.room(HD.state.getState().currentRoom.id).hands.includes('me')"))
        await w(7500); await E('Math.random=window.__r'); ok('hand accepted -> on stage', await E("HD.room(HD.state.getState().currentRoom.id).seats.includes('me')"))
        await closeall()
        # mic
        await pg.click('[data-r=mic]'); await w(900)
        ok('mic unmuted', await E("!HD.room(HD.state.getState().currentRoom.id).muted.me"))
        ok('mic permission granted', await E("HD.audio.micStatus")=='granted', await E("HD.audio.micStatus"))
        lv=await E("new Promise(r=>{let m=0;const off=HD.audio.onLevel(l=>m=Math.max(m,l));setTimeout(()=>{off();r(m)},1200)})"); ok('mic level events flow', lv>=0, str(lv))
        await pg.click('[data-r=mic]'); await w(400); ok('mic muted again', await E("!!HD.room(HD.state.getState().currentRoom.id).muted.me"))
        # chat
        await pg.click('[data-r=chat]'); await w(400)
        await pg.fill('#cin','hello <b>bold</b> world'); await pg.press('#cin','Enter'); await w(300)
        ok('chat sent + escaped', await E("document.querySelector('.drawer .msgs').innerHTML.includes('&lt;b&gt;bold')"))
        await pg.click('.drawer [data-c=reply]'); ok('reply bar', await pg.locator('.replying:not([hidden])').count()==1)
        await pg.fill('#cin','a reply'); await pg.press('#cin','Enter'); await w(300)
        ok('reply stored', await E("HD.messages.room(HD.state.getState().currentRoom.id).some(m=>m.replyTo)"))
        await pg.click('.drawer [data-c=react]'); await w(200); ok('reaction added', await E("HD.messages.room(HD.state.getState().currentRoom.id).some(m=>m.reactions['❤️'])"))
        await pg.click('.drawer [data-c=emoji]'); ok('emoji inserted', len(await pg.input_value('#cin'))>0)
        await pg.click('.drawer [data-c=close]'); await w(300)
        # slow mode as host via role switch
        await pg.click('[data-r=more]'); await w(300); await pg.click('[data-mk=role]'); await w(300); await pg.click('[data-rl=host]'); await w(300)
        ok('now host', await E("HD.rooms.role(HD.room(HD.state.getState().currentRoom.id),'me')")=='host')
        # host controls via UI
        async def more(k):
            await closeall(); await pg.click('.ctrl [data-r=more]'); await w(300); await pg.click(f'.sheet [data-mk={k}]'); await w(350)
        rid2=await E("HD.state.getState().currentRoom.id")
        await more('slow'); ok('slow mode on', await E(f"HD.room('{rid2}').slowMode")); await closeall()
        await pg.click('.ctrl [data-r=chat]'); await w(300); await pg.fill('#cin','one'); await pg.press('#cin','Enter'); await w(200)
        ok('host bypasses slow mode', await E(f"HD.messages.room('{rid2}').filter(m=>m.text==='one').length")==1)
        await pg.click('.drawer [data-c=close]'); await w(300)
        await more('fo'); ok('followers-only on', await E(f"HD.room('{rid2}').followersOnly")); await closeall()
        await more('lock'); await w(400); await pg.fill('#pm-in','9999'); await pg.click('.sheet-f .btn.primary'); await w(300); ok('locked with pw', await E(f"HD.room('{rid2}').locked && HD.room('{rid2}').password==='9999'")); await closeall()
        await more('lock'); ok('unlocked', await E(f"!HD.room('{rid2}').locked")); await closeall()
        await more('settings'); await pg.fill('#rs-t','Renamed Room'); await pg.select_option('#rs-c','gaming'); await pg.click('.sheet-f .btn.primary'); await w(300)
        ok('renamed + category', await E(f"HD.room('{rid2}').title==='Renamed Room' && HD.room('{rid2}').category==='gaming'")); await closeall()
        await more('announce'); await pg.fill('#pm-in','Big announcement'); await pg.click('.sheet-f .btn.primary'); await w(300)
        ok('announcement', await E(f"HD.messages.room('{rid2}').some(m=>m.type==='ann'&&m.text==='Big announcement')")); await closeall()
        # user actions
        R=f"HD.room('{rid2}')"
        tgt=await E(f"{R}.seats.find(x=>x!=='me'&&x!=={R}.hostId)")
        ok('mute participant', (await E(f"HD.rooms.mute('{rid2}','{tgt}')"))['ok'] and await E(f"!!{R}.muted['{tgt}']"))
        ok('unmute participant', (await E(f"HD.rooms.unmuteUser('{rid2}','{tgt}')"))['ok'])
        ok('add mod', (await E(f"HD.rooms.addMod('{rid2}','{tgt}')"))['ok'] and await E(f"{R}.modIds.includes('{tgt}')"))
        ok('remove mod', (await E(f"HD.rooms.removeMod('{rid2}','{tgt}')"))['ok'])
        ok('move to audience', (await E(f"HD.rooms.move('{rid2}','{tgt}','aud')"))['ok'] and await E(f"{R}.audience.includes('{tgt}')"))
        ok('invite speaker', (await E(f"HD.rooms.invite('{rid2}','{tgt}')"))['ok']); await w(2200)
        ok('invite resolved', await E(f"!{R}.invited.includes('{tgt}')"))
        await E(f"(()=>{{const r={R};while(r.seats.length>5){{const u=r.seats.find(x=>x!=='me'&&x!==r.hostId);r.seats=r.seats.filter(x=>x!==u);r.audience.push(u);}}}})()")
        aud=await E(f"{R}.audience.find(x=>x!=='me')")
        await E(f"{R}.hands.push('{aud}')"); ok('approve request', (await E(f"HD.rooms.approve('{rid2}','{aud}')"))['ok'] and await E(f"{R}.seats.includes('{aud}')"))
        aud2=await E(f"{R}.audience.find(x=>x!=='me')"); await E(f"{R}.hands.push('{aud2}')"); ok('reject request', (await E(f"HD.rooms.reject('{rid2}','{aud2}')"))['ok'] and await E(f"!{R}.hands.includes('{aud2}')"))
        ok('move to stage', (await E(f"HD.rooms.move('{rid2}','{aud2}','stage')"))['ok'])
        ok('remove participant', (await E(f"HD.rooms.remove('{rid2}','{aud2}')"))['ok'] and await E(f"!{R}.seats.includes('{aud2}')"))
        # moderator restrictions
        await E(f"HD.rooms.setDemoRole('{rid2}','mod')"); await w(300)
        hid=await E(f"{R}.hostId"); await E(f"{R}.seats.length")
        ok('mod cannot transfer', not (await E(f"HD.rooms.transfer('{rid2}','{tgt}')"))['ok'])
        ok('mod cannot end room', not (await E(f"HD.rooms.end('{rid2}')"))['ok'])
        ok('mod cannot remove host', not (await E(f"HD.rooms.remove('{rid2}','{hid}')"))['ok'])
        ok('mod cannot mute host', not (await E(f"HD.rooms.mute('{rid2}','{hid}')"))['ok'])
        ok('mod cannot lock', not (await E(f"HD.rooms.lock('{rid2}','x')"))['ok'])
        ok('mod cannot add mod', not (await E(f"HD.rooms.addMod('{rid2}','{tgt}')"))['ok'])
        sp=await E(f"{R}.seats.find(x=>x!=='me'&&x!=='{hid}'&&!{R}.modIds.includes(x))")
        ok('mod can mute speaker', (await E(f"HD.rooms.mute('{rid2}','{sp}')"))['ok'])
        ok('mod can slow mode', (await E(f"HD.rooms.setSlow('{rid2}',false)"))['ok'])
        await E("HD.modal.closeAll()"); await pg.click('.ctrl [data-r=people-req]'); await w(400); ok('mod requests sheet', await pg.locator('.sheet').count()>=1); await closeall()
        # listener restrictions
        await E(f"HD.rooms.setDemoRole('{rid2}','listener')"); await w(200)
        ok('listener cannot mute', not (await E(f"HD.rooms.mute('{rid2}','{sp}')"))['ok'])
        ok('listener hand button', await pg.locator('.ctrl [data-r=hand]').count()==1)
        # transfer host as host
        await E(f"HD.rooms.setDemoRole('{rid2}','host')"); await w(200)
        ok('transfer host', (await E(f"HD.rooms.transfer('{rid2}','{tgt}')"))['ok'] and await E(f"{R}.hostId==='{tgt}'"))
        await E(f"HD.rooms.setDemoRole('{rid2}','host')")
        # end room
        await more('end'); await pg.click('.scrim:last-child .sheet-f .btn.danger'); await w(700)
        ok('room ended & left', await E(f"HD.room('{rid2}').status")=='ended' and await E("location.hash")=='#rooms', await E("location.hash"))
        ok('ended room hidden', await E(f"!HD.rooms.list({{}}).some(r=>r.id==='{rid2}')"))
        ok('no errors room', not [e for e in errs if 'PAGEERR' in e], str(errs[-3:]))
        # gifts
        rid3=await E("HD.state.getState().rooms.find(r=>!r.password&&r.status==='live').id")
        await go('#room/'+rid3); await w(800); await closeall()
        bal0=await E("HD.state.getState().wallet.balance")
        await E("HD.gifts.recharge(50000)"); bal0+=50000
        gifts=await E("HD.state.getState().gifts.filter(g=>g.cat==='gift').map(g=>g.id)")
        ok('20 gifts', len(gifts)==20)
        spent=0
        for g in gifts:
            price=await E(f"HD.state.getState().gifts.find(x=>x.id==='{g}').price")
            r=await E(f"HD.gifts.send({{giftId:'{g}',toId:HD.room('{rid3}').hostId,roomId:'{rid3}',qty:1}})"); spent+=price if r['ok'] else 0
            await w(120)
            await E("document.querySelectorAll('.fxlayer').forEach(x=>x.remove())")
        ok('all gifts sent', spent>0 and await E("HD.state.getState().wallet.balance")==bal0-spent, f'{spent}')
        ok('gift tx history', await E("HD.state.getState().wallet.transactions.filter(t=>t.type==='gift').length")>=20)
        ok('insufficient coins blocked', not (await E("HD.gifts.send({giftId:'rocket',toId:'u1',qty:9999})"))['ok'])
        # gift modal UI flow
        await pc('.ctrl [data-r=gift]'); await w(300); await pg.click('[data-g=heart]'); await pg.click('.sheet-f .btn.primary'); await w(400); await pg.click('.scrim:last-child .sheet-f .btn.primary'); await w(500)
        ok('gift modal flow', await E("HD.state.getState().wallet.sent[0].giftId")=='heart')
        # reactions
        await pc('.ctrl [data-r=react]'); await w(200); n0=await E("document.querySelectorAll('.floaty').length")
        for i in range(3): await pc(f'.react-tray [data-e]:nth-child({i+1})')
        ok('floating reactions', await E("document.querySelectorAll('.floaty').length")>=3)
        # share
        await pc('.ctrl [data-r=share], .rm-top [data-r=share]'); await w(300)
        ok('share sheet', await pg.locator('[data-s=copy-link]').count()==1); await pc('[data-s=copy-id]'); await w(200); await closeall()
        # people sheet
        await closeall(); await pc('.ctrl [data-r=people]'); await w(400); pcnt=await pg.locator('[data-pu]').count(); ok('people sheet', pcnt>=2, f'{pcnt} sheets={await pg.locator(".sheet").count()} title={await E("document.querySelector(\'.sheet-h h2\')&&document.querySelector(\'.sheet-h h2\').innerText")}'); await pc('[data-pt=aud]'); await w(200); await closeall()
        # user sheet
        await pc('[data-seat]:not([data-seat=me])'); await w(300); ok('user action sheet', await pg.locator('[data-ua]').count()>=3); await closeall()
        # leave
        await pc('[data-r=exit]'); await w(500); ok('left room', await E("!HD.state.getState().currentRoom"))
        ok('history logged', await E("HD.state.getState().history.length")>=4)
        # ---- social ----
        await E("HD.social.follow('u10')"); ok('follow', await E("HD.social.isFollowing('u10')")); await E("HD.social.unfollow('u10')"); ok('unfollow', await E("!HD.social.isFollowing('u10')"))
        await E("HD.social.addFriend('u20')"); ok('friend pending', await E("HD.social.isPending('u20')")); await w(3000); ok('friend accepted', await E("HD.social.isFriend('u20')"))
        await E("HD.social.removeFriend('u20')"); ok('friend removed', await E("!HD.social.isFriend('u20')"))
        await E("HD.social.block('u5')"); ok('block', await E("HD.social.isBlocked('u5')&&!HD.social.isFollowing('u5')&&!HD.social.isFriend('u5')"))
        ok('blocked hidden in messages', await E("!HD.messages.conversations().some(c=>c.userId==='u5')")); await E("HD.social.unblock('u5')"); ok('unblock', await E("!HD.social.isBlocked('u5')"))
        await E("HD.social.acceptRequest('u9')"); ok('accept friend request', await E("HD.social.isFriend('u9')"))
        # DM
        await go('#messages/u8'); await pg.fill('#ti','hello there'); await pg.press('#ti','Enter'); await w(500); ok('typing indicator', await pg.locator('.typing').count()==1); await w(3500)
        ok('dm reply', await E("HD.messages.thread('u8').filter(m=>m.from==='u8').length")>=2)
        await pg.click('.bubble >> nth=0'); await pg.click('[data-re]'); await w(200); ok('dm reaction', await E("HD.state.getState().messages.some(m=>Object.keys(m.reactions).length)"))
        await go('#messages'); ok('unread cleared', await E("HD.messages.conversations().find(c=>c.userId==='u8').unread")==0)
        # notifications
        await go('#notifications'); n=await E("HD.notify.unread()"); ok('has unread', n>0); await pg.click('[data-act=readAll]'); await w(200); ok('mark all read', await E("HD.notify.unread()")==0)
        await pg.click('[data-del] >> nth=0'); await w(200); ok('delete notification', await E("HD.state.getState().notifications.length")<20+5)
        await E("HD.notify.add({type:'system',text:'x'})"); ok('new notification unread', await E("HD.notify.unread()")==1)
        # search
        await go('#search'); await pg.fill('#s-q','music'); await w(300); ok('search rooms', await pg.locator('[data-room]').count()>=1)
        await pg.click('[data-stab=user]'); await pg.fill('#s-q','arjun'); await w(300); ok('search users', await pg.locator('[data-user]').count()>=1)
        await w(1100); ok('recent saved', await E("HD.state.getState().recentSearches.length")>=1)
        await pg.fill('#s-q',''); await w(200); await pg.click('[data-act=clearRecent]'); ok('clear recent', await E("HD.state.getState().recentSearches.length")==0)
        await pg.fill('#s-q','zzzzqq'); await w(300); ok('empty search', 'found' in await pg.inner_text('#s-out'))
        # discover filters
        await go('#discover'); await pg.click('[data-cat=gaming]'); await w(200); ok('discover gaming', await E("[...document.querySelectorAll('#d-list .rr')].length")>=1)
        cats=await E("[...document.querySelectorAll('#d-list .rr')].every(x=>/Gaming/.test(x.innerText))"); ok('filter correct', cats)
        for s in ['active','newest','listeners','trending']: await pg.click(f'[data-sort={s}]'); await w(120)
        # sort correctness
        cnts=await E("HD.rooms.list({sort:'listeners'}).map(r=>HD.rooms.listenerCount(r))"); ok('sort listeners desc', cnts==sorted(cnts,reverse=True))
        # create room UI
        await go('#create'); await pg.fill('#c-t','UI Room'); await pg.select_option('#c-p','password'); await pg.fill('#c-pw','abc'); await pg.check('#c-s'); await pg.click('#cf button[type=submit]'); await w(900); await closeall()
        ok('created via UI', await E("HD.state.getState().rooms.some(r=>r.title==='UI Room'&&r.password==='abc'&&r.slowMode)"))
        await pg.click('[data-r=exit]'); await w(300)
        ok('created room appears in list', await E("HD.rooms.list({}).some(r=>r.title==='UI Room')"))
        # daily reward
        await E("HD.state.getState().daily={streak:0,last:null,claimed:[]}"); await go('#rewards'); await w(800); await closeall(); b0=await E("HD.state.getState().wallet.balance"); await pc('#claim'); await w(400); await closeall()
        ok('daily claimed', await E("HD.state.getState().wallet.balance")-b0==50); 
        ok('daily second claim blocked', not (await E("HD.gifts.claimDaily()"))['ok'])
        await E("HD.state.getState().daily.last=(()=>{const y=new Date(Date.now()-864e5);return y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate()})()"); r=await E("HD.gifts.claimDaily()"); ok('streak day 2', r['ok'] and r['day']==2 and r['amt']==100, str(r))
        # xp / achievements
        ok('xp accrued', await E("HD.state.getState().stats.xp")>50); ok('achievements unlocked', await E("Object.keys(HD.state.getState().achievements).length")>=3, await E("Object.keys(HD.state.getState().achievements).join()"))
        await closeall()
        # growth
        await E("HD.social.simulateGrowth(1000)"); await closeall(); ok('followers achievements', await E("!!HD.state.getState().achievements.f1000"))
        # leaderboard
        await go('#leaderboard'); await w(900); await closeall(); await w(300)
        for per in ['weekly','monthly','daily']:
            await pg.click(f'[data-p={per}]'); await w(100)
            for c in ['gifters','receivers','speakers','hosts']: await pg.click(f'[data-c={c}]'); await w(80)
        ok('leaderboard 20 entries', await E("HD.demo.leaderboard('daily','hosts').length")==20)
        # profile tabs
        await go('#profile'); 
        for t in ['moments','rooms','gifts','ach','posts']: await pg.click(f'[data-pt={t}]'); await w(100)
        await pg.fill('#pt','my first post'); await pg.press('#pt','Enter'); await w(200); ok('post created', await E("HD.state.getState().posts.length")==1)
        # edit profile + image upload
        await go('#editprofile'); await pg.fill('#e-n','Renamed'); await pg.fill('#e-b','new bio'); await pg.check('#e-v')
        from PIL import Image
        Image.new('RGB',(600,400),(200,50,90)).save('/tmp/av.png'); await pg.set_input_files('#e-f','/tmp/av.png'); await w(500)
        await pg.click('#ef button[type=submit]'); await w(500)
        ok('profile saved', await E("HD.me().name==='Renamed'&&HD.me().vip&&HD.me().bio==='new bio'")); ok('avatar in IDB cache', await E("!!HD.storage.images['av:me']"))
        # settings
        await go('#settings'); await pg.click('[data-seg=theme][data-v=light]'); await w(200); ok('light theme', await E("document.documentElement.dataset.theme")=='light')
        await pg.click('[data-acc=gold]'); await w(200); ok('accent gold', await E("document.documentElement.dataset.accent")=='gold')
        await pg.click('[data-seg=motion][data-v=reduce]'); await w(200); ok('reduced motion', await E("document.documentElement.dataset.motion")=='reduce')
        await pg.select_option('#lg','ml'); await w(500); ok('malayalam nav', 'ഹോം' in await E("document.querySelector('.bottomnav').innerText"))
        await pg.select_option('#lg','hi'); await w(500); ok('hindi nav', 'होम' in await E("document.querySelector('.bottomnav').innerText"))
        await pg.select_option('#lg','en'); await w(400)
        await pg.click('[data-k="notif.gift"]', force=True); ok('toggle persisted', await E("HD.state.getState().settings.notif.gift")==False)
        # persistence
        await pg.reload(); await w(1500)
        ok('persist user', await E("HD.me().name")=='Renamed'); ok('persist theme', await E("document.documentElement.dataset.theme")=='light'); ok('persist rooms', await E("HD.state.getState().rooms.some(r=>r.title==='UI Room')"))
        ok('persist avatar image', await E("!!HD.storage.images['av:me']")); ok('persist wallet', await E("HD.state.getState().wallet.transactions.length")>5)
        # deep link
        rid4=await E("HD.state.getState().rooms.find(r=>!r.password&&r.status==='live').id")
        await pg.goto(URL+'#room/'+rid4); await w(1800); await closeall(); ok('deep link room', await pg.locator('[data-seat]').count()>3)
        await pg.goto(URL+'#wallet'); await w(1200); ok('deep link wallet', 'balance' in (await pg.inner_text('#view')).lower())
        await pg.goto(URL+'#room/00000'); await w(1200); ok('invalid room graceful', 'not found' in (await pg.inner_text('#view')).lower())
        # followers-only gate
        fr=await E("(()=>{const r=HD.state.getState().rooms.find(r=>r.status==='live'&&!r.password&&r.hostId!=='me');r.followersOnly=true;HD.social.unfollow(r.hostId);return r.id})()")
        await go('#room/'+fr); await w(700); ok('followers-only prompt', await pg.locator('text=Followers only').count()>=1); await pg.click('.sheet-f .btn.primary'); await w(700); await closeall(); ok('followed & joined', await E("!!HD.state.getState().currentRoom"))
        await go('#home'); await w(300)
        # export
        async with pg.expect_download() as dl:
            await go('#settings'); await pg.click('[data-act=exportData]')
        d=await dl.value; ok('export json', d.suggested_filename.endswith('.json'))
        # ---- offline / PWA ----
        await pg.goto(URL); await w(2500)
        ok('service worker active', await E("navigator.serviceWorker.ready.then(r=>!!r.active)"))
        cached=await E("caches.keys().then(async k=>k.length? (await (await caches.open(k[0])).keys()).length:0)"); ok('assets cached', cached>=30, str(cached))
        mf=await E("fetch('manifest.json').then(r=>r.json())"); ok('manifest fields', mf['display']=='standalone' and len(mf['icons'])>=3)
        for ic in mf['icons']:
            st=await E(f"fetch('{ic['src']}').then(r=>r.status)"); ok('icon '+ic['src'], st==200)
        await ctx.set_offline(True); await pg.reload(); await w(2000)
        ok('offline reload works', await E("!!window.HD && !!HD.state.getState().currentUser"))
        await go('#discover'); await w(400); ok('offline navigation', await E("document.querySelectorAll('.rr').length")>3)
        await ctx.set_offline(False)
        # reset
        await go('#settings'); await pg.click('[data-act=resetData]'); await w(400); await pg.click('.scrim:last-child .sheet-f .btn.danger'); await w(900)
        ok('reset -> welcome', await E("location.hash")=='#welcome' and await E("!HD.state.getState().currentUser"))
        # guest restrictions
        await pg.click('text=Continue as guest'); await w(500); ok('guest home', await E("HD.me().isGuest"))
        await go('#create'); ok('guest create blocked', 'Account needed' in await pg.inner_text('#view'))
        await go('#wallet'); await pg.click('[data-act=recharge]'); await w(300); ok('guest recharge -> account modal', await pg.locator('text=Create a free account').count()==1); await closeall()
        # desktop layout
        await pg.set_viewport_size({'width':1280,'height':800}); await go('#home'); await w(300)
        ok('desktop sidebar visible', await E("getComputedStyle(document.querySelector('.sidebar')).display")!='none'); ok('desktop bottomnav hidden', await E("getComputedStyle(document.querySelector('.bottomnav')).display")=='none')
        ok('no horizontal overflow desktop', await E("document.documentElement.scrollWidth<=innerWidth+1"))
        await pg.set_viewport_size({'width':360,'height':640})
        for r in ['home','discover','rooms','wallet','settings','profile','leaderboard']:
            await go('#'+r); ok('no h-overflow 360 '+r, await E("document.documentElement.scrollWidth<=innerWidth+1"), str(await E("document.documentElement.scrollWidth")))
        page_errs=[e for e in errs if 'PAGEERR' in e or 'CONSOLE' in e]
        print(f'PASSED {passes}  FAILED {len(fails)}'); print('ERRS',page_errs[:8])
        await b.close()
asyncio.run(main())
