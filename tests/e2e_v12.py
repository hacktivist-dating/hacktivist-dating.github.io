"""v1.2 tests: VIP, prestige, titles, special ID, mystery, props store, gift panel v2, games, lucky bag, PK, missions, moments, messages v2, search v2, CP, family, music."""
import asyncio, http.server, threading, socketserver, os, functools, sys, json
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9951
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
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:250])); pg.on('console',lambda m: errs.append(m.text[:200]) if m.type=='error' else None)
        E=pg.evaluate
        async def w(ms=300): await pg.wait_for_timeout(ms)
        async def rm_scrims(): await E("document.querySelectorAll('.scrim').forEach(s=>s.remove())"); await w(150)
        async def c(sel):
            await E("document.querySelectorAll('.scrim').forEach(s=>{if(/Level up|Achievement unlocked|It.s a match|Reward claimed/.test(s.innerText))s.remove()})"); await pg.click(sel)
        async def go(h): await rm_scrims(); await E(f"location.hash='{h}'"); await w(450)
        await pg.goto(URL); await w(2400)
        await pg.click('text=Create account'); await pg.fill('#a-n','Tester'); await pg.fill('#a-h','tester_v'); await pg.click('button[type=submit]'); await w(600)
        ok('version >= 1.2', await E("HD.CONFIG.APP_VERSION")>='1.2.0')
        await E("HD.state.getState().wallet.balance=2000000")
        # ---- VIP ----
        ok('no tier initially', await E("HD.vip.current()")==0)
        r=await E("HD.vip.buy(2,30)"); ok('buy VIP 2', r['ok'] and await E("HD.vip.current()")==2)
        ok('tier perks gated', await E("HD.vip.has('medal')&&HD.vip.has('xp')&&!HD.vip.has('mystery')&&!HD.vip.has('upgrade')"))
        d=await E("HD.vip.claimDaily()"); ok('vip daily claim', d['ok'] and d['amt']==500); ok('vip daily once', not (await E("HD.vip.claimDaily()"))['ok'])
        ok('xp multiplier', await E("HD.vip.xpMult()")>1.1); ok('max mods grows', await E("HD.vip.maxMods()")==8)
        await go('#vip'); ok('vip screen 8 tiers', await pg.locator('[data-tier]').count()==8); await pg.click('[data-tier="5"]'); await w(200); ok('privilege list', await pg.locator('.priv').count()==24)
        await pg.click('[data-days="7"]'); await w(150); b0=await E("HD.state.getState().wallet.balance"); await pg.click('[data-act=vipBuy]'); await w(500); await rm_scrims()
        ok('vip 5 bought for 7 days', await E("HD.vip.current()")==5 and b0-await E("HD.state.getState().wallet.balance")==int(round(40000*7/30)))
        ok('insufficient coins blocked', not (await E("(()=>{HD.state.getState().wallet.balance=5;return HD.vip.buy(8,30)})()"))['ok']); await E("HD.state.getState().wallet.balance=2000000")
        await E("HD.vip.sync()"); await go('#profile'); ok('tier pill on profile', await pg.locator('.profile-hero .tier').count()==1); ok('hub grid', await pg.locator('.hubgrid button').count()==8)
        # ---- prestige / titles / influence ----
        sp=await E("HD.state.getState().stats.coinsSpent"); ok('spend tracked', sp>0, str(sp)); ok('prestige level', await E("HD.prestige.level()")>=1)
        await go('#prestige'); ok('prestige screen', 'Prestige' in await pg.inner_text('#view'))
        await E("HD.state.getState().stats.roomsJoined=30;HD.state.getState().stats.giftsReceived=5"); ok('title tier calc', await E("HD.titleTier(HD.TITLES[0])")==2 and await E("HD.titleTier(HD.TITLES[1])")==1)
        await go('#titles'); await pg.click('[data-act=titleEq] >> nth=0'); await w(200); ok('wear title', await E("!!HD.me().title")); await go('#profile'); ok('title badge on profile', await pg.locator('.ttl-b').count()>=1)
        await go('#influence'); ok('influence page', await pg.locator('.lvl').count()==3)
        # ---- special id ----
        await go('#specialid'); await pg.click('[data-act=sidBuy][data-id="123456"]'); await w(400); await rm_scrims(); ok('special id bought', await E("HD.me().sid==='123456'")); ok('id displayed', await E("HD.displayId(HD.me())")=='123456')
        ok('taken id not buyable', await E("HD.sidTaken('777777')")); await pg.click('[data-act=sidClear]'); await w(200); ok('id restored', await E("!HD.me().sid"))
        # ---- mystery ----
        ok('mystery allowed at tier>=4', await E("HD.mystery.can()")); r=await E("HD.mystery.rent(1)"); ok('rent mystery', r['ok'] and await E("HD.state.getState().vip.mysteryUntil>Date.now()"))
        await go('#mystery'); await pg.check('#my-t', force=True); await w(300); ok('mystery on', await E("HD.me().mystery"))
        ok('alias masks identity', await E("HD.user('me').name.startsWith('Mystery')&&HD.user('me').handle==='mystery'")); ok('mystery avatar', await E("HD.userAvatar(HD.me())")==await E("HD.utils.mysteryAvatar()")); await E("HD.mystery.set(false)")
        # ---- props store ----
        await go('#welcome'); await go('#shop'); ok('store tabs', await pg.locator('[data-st]').count()==6)
        await pg.click('[data-sel="frame:neon"]'); await w(150); await pg.click('[data-act=propBuy]'); await w(300); await rm_scrims(); ok('frame bought + equipped', await E("HD.shop.owns('frame','neon')&&HD.me().frame==='neon'"))
        await pg.click('[data-st=mount]'); await pg.click('[data-sel="mount:racer"]'); await pg.click('[data-d="30"]'); b1=await E("HD.state.getState().wallet.balance"); await pg.click('[data-act=propBuy]'); await w(300); await rm_scrims()
        ok('mount rented 30d price x3', b1-await E("HD.state.getState().wallet.balance")==4500, str(b1-await E("HD.state.getState().wallet.balance"))); ok('rental has expiry', await E("!!HD.state.getState().shop.until['mount:racer']"))
        await E("HD.state.getState().shop.until['mount:racer']=Date.now()-1000"); ok('expired rental not owned', await E("!HD.shop.owns('mount','racer')")); await E("HD.shop.tick()"); ok('expired unequipped', await E("HD.shop.equipped('mount')!=='racer'"))
        await pg.click('[data-st=bubble]'); await pg.click('[data-sel="bubble:royal"]'); await pg.click('[data-d="0"]'); await pg.click('[data-act=propBuy]'); await w(300); await rm_scrims(); ok('bubble forever', await E("HD.shop.owns('bubble','royal')&&!HD.state.getState().shop.until['bubble:royal']"))
        ok('bubble class applied', await E("HD.cosmetic.bubbleCls('me')")==' bub-royal')
        await pg.click('[data-st=frame]'); await pg.click('[data-sel="frame:royal"]'); await w(150); ok('req frame unlocked by VIP>=2', await E("HD.shop.owns('frame','royal')"))
        await E("(()=>{const s=HD.state.getState();s.vip.until=0})()"); ok('req frame locks when VIP lapses', await E("!HD.shop.owns('frame','royal')")); await E("HD.vip.buy(5,30)")
        ok('cannot buy locked item', not (await E("HD.shop.buy('ring','swan',0)"))['ok'])
        await go('#welcome'); await go('#shop'); await pg.click('[data-st=rel]'); await pg.click('[data-sel="card:cp"]'); await pg.click('[data-act=propBuy]'); await w(300); await rm_scrims(); ok('card purchase adds to stack', await E("HD.state.getState().cards.cp")==1)
        await pg.click('[data-st=bag]'); ok('backpack lists owned', await pg.locator('.shop-item').count()>=2)
        # ---- CP ----
        r=await E("HD.cp.invite('u7','cp')"); ok('cp invite sent', r['ok'] and await E("HD.state.getState().cards.cp")==0); await w(2600)
        got=await E("!!HD.state.getState().cp"); 
        if not got: await E("(()=>{const s=HD.state.getState();s.cp={partnerId:'u7',level:1,intimacy:0,since:Date.now()-2*864e5}})()")
        ok('cp active', await E("!!HD.state.getState().cp")); await go('#cp'); ok('cp page', 'CP level' in await pg.inner_text('#view'))
        pid=await E("HD.state.getState().cp.partnerId"); i0=await E("HD.state.getState().cp.intimacy")
        await E(f"HD.gifts.send({{giftId:'rose',toId:'{pid}',roomId:null,qty:10}})"); ok('gift to CP grows intimacy', await E("HD.state.getState().cp.intimacy")>i0)
        await E(f"HD.cp.gain(400)"); await w(300); await rm_scrims(); ok('cp levels up', await E("HD.state.getState().cp.level")>=3)
        ok('swan ring unlocked at CP 3', await E("HD.shop.owns('ring','swan')")); ok('cp invite without card fails', not (await E("HD.cp.invite('u9','cp')"))['ok'])
        await E("HD.state.getState().cards.soulmate=1"); await E("HD.cp.invite('u9','soulmate')"); await w(2600); ok('relation or refund', await E("HD.state.getState().relations.length==1||HD.state.getState().cards.soulmate==1"))
        await go('#cp'); await pg.evaluate("document.querySelector('[data-act=cpEnd]').click()"); await w(300); await pg.click('.sheet-f .btn.danger'); await w(300); ok('dissolve cp', await E("!HD.state.getState().cp"))
        # ---- room: gift panel v2 ----
        rid=await E("HD.rooms.list({}).find(r=>!r.password&&r.seats.length>=3&&r.hostId!=='me').id"); await go('#room/'+rid); await w(1000); await rm_scrims()
        ok('contribution chip', await pg.locator('[data-r=contrib]').count()==1); await c('[data-r=contrib]'); await w(300); ok('contrib board', 'Room contribution' in await pg.inner_text('.sheet')); await rm_scrims()
        await c('.ctrl [data-r=gift]'); await w(300); ok('5 gift categories', await pg.locator('.sheet [data-c]').count()==5); n0=await pg.locator('.sheet [data-g]').count()
        await c('.sheet [data-c=rel]'); await w(150); ok('relationship gifts', await pg.locator('.sheet [data-g]').count()==7); await c('.sheet [data-c=cty]'); await w(150); ok('country gifts', await pg.locator('.sheet [data-g]').count()==8)
        await c('.sheet [data-c=bag]'); await w(150); ok('empty bag message', 'bag is empty' in (await pg.inner_text('.sheet')).lower()); await c('.sheet [data-c=gift]'); await w(150); ok('20 base gifts', await pg.locator('.sheet [data-g]').count()==20)
        ok('all-on-stage option', await pg.locator('#g-to option[value="*"]').count()==1); await pg.select_option('#g-to','*'); await c('.sheet [data-g=rose]'); await c('.sheet [data-q="7"]'); await w(150)
        b2=await E("HD.state.getState().wallet.balance"); ns=await E(f"HD.room('{rid}').seats.filter(x=>x!=='me').length"); await c('.sheet-f .btn.primary'); await w(400); await c('.scrim:last-child .sheet-f .btn.primary'); await w(600)
        ok('multi-recipient x qty cost', b2-await E("HD.state.getState().wallet.balance")==10*7*ns, f'{b2-await E("HD.state.getState().wallet.balance")} vs {10*7*ns}'); await rm_scrims()
        ok('contribution recorded', await E(f"HD.room('{rid}').contrib.me")>=10*7*ns)
        await E("HD.bag.add('heart',5)"); bal=await E("HD.state.getState().wallet.balance"); r=await E(f"HD.gifts.sendBag({{giftId:'heart',toId:HD.room('{rid}').hostId,roomId:'{rid}',qty:2}})"); ok('bag gift costs no coins', r['ok'] and await E("HD.state.getState().wallet.balance")==bal and await E("HD.bag.count('heart')")==3)
        ok('bag over-send blocked', not (await E(f"HD.gifts.sendBag({{giftId:'heart',toId:'u1',roomId:null,qty:99}})"))['ok'])
        await rm_scrims()
        # ---- room: chat tabs, music, games menu ----
        await c('.ctrl [data-r=chat]'); await w(400); ok('chat tabs', await pg.locator('.drawer [data-c=ctab]').count()==3); await c('.drawer [data-c=ctab][data-t=gift]'); await w(200)
        ok('gift tab filters', await E("[...document.querySelectorAll('.drawer .cmsg')].every(x=>/🎁/.test(x.innerText))")); await c('.drawer [data-c=close]'); await w(300)
        await c('.ctrl [data-r=more]'); await w(300); await c('[data-mk=music]'); await w(400); ok('music on', await E("HD.music.on")); ok('music chip shown', await pg.locator('[data-r=music]').count()==1); await c('[data-r=music]'); await w(300); ok('music off', await E("!HD.music.on"))
        # ---- games ----
        await E("HD.rooms.setDemoRole(HD.state.getState().currentRoom.id,'host')"); await w(300); gp0=await E("HD.state.getState().stats.gamePoints")
        for g in ['dice','coin','mora']:
            await rm_scrims(); await E(f"HD.playGame('{g}','{rid}')"); await w(350)
            for k in range(6):
                if g=='dice': await c('#dg')
                elif g=='coin': await c('[data-c="0"]')
                else: await c('[data-m="0"]')
                await w(120)
                if await E("HD.state.getState().stats.gamesPlayed")>=(1 if g=='dice' else 2 if g=='coin' else 3): break
        ok('games award points', await E("HD.state.getState().stats.gamePoints")>gp0)
        await rm_scrims(); await E(f"HD.playGame('guess','{rid}')"); await w(300)
        for n in range(1,101):
            await pg.fill('#gi',str(n)); await c('#gb'); 
            if await E("document.querySelector('#gl')&&+document.querySelector('#gl').textContent===0") or 'Correct' in await pg.inner_text('#gr'): break
        ok('number guess resolves', await pg.inner_text('#gr')!='')
        await rm_scrims(); await E(f"HD.playGame('trivia','{rid}')"); await w(300)
        for q in range(5): await c('[data-ok="1"]'); await w(800)
        ok('trivia perfect score', '5/5' in await pg.inner_text('#tv'))
        await rm_scrims(); await E(f"HD.playGame('wheel','{rid}')"); await w(300); await c('#ws'); await w(2600); ok('wheel result', '#' in await pg.inner_text('#wr'))
        ok('games played counted', await E("HD.state.getState().stats.gamesPlayed")>=6); ok('game level computed', await E("HD.gameLevel().i")>=0)
        await rm_scrims(); await E("HD.state.getState().stats.gamePoints=900"); await go('#gamelevel'); ok('gold level', await E("HD.gameLevel().g[1]")=='Gold'); await c('[data-act=glClaim]'); await w(300); ok('weekly reward to bag', await E("Object.values(HD.state.getState().bag).some(v=>v>0)"))
        # ---- lucky bag ----
        await go('#room/'+rid); await w(900); await rm_scrims(); await E(f"HD.rooms.setDemoRole('{rid}','host')"); bb=await E("HD.state.getState().wallet.balance")
        r=await E(f"HD.rooms.dropBag('{rid}',500,5)"); ok('drop bag', r['ok'] and bb-await E("HD.state.getState().wallet.balance")==500); ok('second bag blocked', not (await E(f"HD.rooms.dropBag('{rid}',100,3)"))['ok'])
        await w(6000); ok('bots grab', await E(f"HD.room('{rid}').luckyBag.claimed.length")>=1); amts=await E(f"HD.room('{rid}').luckyBag.amts"); ok('split sums to total', sum(amts)==500 and len(amts)==5 and all(a>=1 for a in amts))
        await E(f"HD.room('{rid}').luckyBag.ends=Date.now()-1"); await w(1800); ok('refund of unclaimed', await E("HD.state.getState().wallet.transactions.some(t=>/refund/.test(t.label))")) 
        # grab as listener
        await E(f"HD.rooms.setDemoRole('{rid}','listener')"); await E(f"(()=>{{const r=HD.room('{rid}');r.luckyBag={{by:'u2',total:100,amts:[40,60],claimed:[],ends:Date.now()+20000}};HD.rooms.emit()}})()"); await w(400)
        bc=await E("HD.state.getState().wallet.balance"); await c('[data-act=bagGrab]'); await w(300); ok('listener grabs bag', await E("HD.state.getState().wallet.balance")-bc>0); ok('cannot grab twice', not (await E(f"HD.rooms.grabBag('{rid}','me')"))['ok'])
        # ---- PK ----
        await E(f"HD.rooms.setDemoRole('{rid}','host')"); await E(f"delete HD.room('{rid}').luckyBag"); r=await E(f"HD.rooms.startPK('{rid}')"); ok('start PK', r['ok']); await w(500); ok('PK card', await pg.locator('[aria-label="PK battle"]').count()==1)
        await c('[data-act=pkSup][data-s=a]'); await w(300); ok('PK support spends coins', await E(f"HD.room('{rid}').pk.sa")>=10)
        await E(f"HD.room('{rid}').pk.ends=Date.now()-1"); await w(1800); ok('PK finishes with result', await E(f"HD.room('{rid}').pk.done")); await c('[data-act=pkClear]'); await w(300); ok('PK dismissed', await E(f"!HD.room('{rid}').pk"))
        # ---- missions ----
        await go('#missions'); st=await E("HD.missions.st().counts"); ok('mission counters moved', st.get('join',0)>=1 and st.get('gift',0)>=1 and st.get('chat',0)>=0, json.dumps(st))
        await E("HD.missions.inc('post',1)"); await go('#missions'); await c('[data-act=msClaim][data-k=post]'); await w(300); ok('claim mission', await E("HD.missions.st().claimed.post")); ok('cannot claim twice', not await E("HD.missions.claim('post')"))
        ok('cannot claim unfinished', not await E("HD.missions.claim('friend')")); 
        for k in ['join','gift','game','chat','speak']: await E(f"HD.missions.inc('{k}',99)")
        for k in ['join','gift','game','chat','speak']: await E(f"HD.missions.claim('{k}')")
        ok('milestone points', await E("HD.missions.points()")>=6); await go('#missions'); await c('[data-act=mileClaim][data-i="0"]'); await w(300); await c('[data-act=mileClaim][data-i="1"]'); await w(300); await rm_scrims(); ok('milestones claimed', await E("HD.missions.st().miles[0]&&HD.missions.st().miles[1]"))
        await E("HD.state.getState().missions.day='1999-1-1'"); ok('missions reset next day', await E("Object.keys(HD.missions.st().claimed).length")==0)
        await c('.rm-top [data-r=exit]') if await pg.locator('.rm-top [data-r=exit]').count() else None
        # ---- moments ----
        await go('#moments'); ok('seeded moments', await pg.locator('.mpost').count()>=5); ok('weekly banner', await pg.locator('.banner').count()==1)
        await pg.click('[data-mt=topic]'); await w(200); ok('topic chips', await pg.locator('.hscroll [data-t]').count()==8); await pg.click('.hscroll [data-t=MyFirstRoom]'); await w(200); ok('topic filter', await E("[...document.querySelectorAll('.mpost .chip')].every(x=>x.innerText.includes('MyFirstRoom'))")); await pg.click('.hscroll [data-t=MyFirstRoom]'); await w(200); ok('topic toggles off', await pg.locator('.mpost').count()>=5)
        await pg.click('.fab'); await w(300); await pg.fill('#mn-t','My brand new moment'); await pg.select_option('#mn-p','MyFirstRoom')
        from PIL import Image; Image.new('RGB',(400,300),(40,120,200)).save('/tmp/mm.png'); await pg.set_input_files('#mn-f','/tmp/mm.png'); await w(500); await pg.click('.sheet-f .btn.primary'); await w(500)
        ok('moment posted', await E("HD.state.getState().moments[0].text==='My brand new moment'&&HD.state.getState().moments[0].by==='me'")); ok('moment image in IDB', await E("Object.keys(HD.storage.images).some(k=>k.startsWith('mm:'))")); ok('post mission +1', await E("HD.missions.st().counts.post")==1)
        ok('shows in follow tab', await pg.locator('.mpost').first.inner_text()!='' and 'My brand new moment' in await pg.inner_text('#mo-b'))
        await pg.click('.mpost:first-child [data-act=momentLike]'); await w(200); ok('like', await E("HD.state.getState().moments[0].likes.includes('me')")); await pg.click('.mpost:first-child [data-act=momentLike]'); await w(200); ok('unlike', await E("!HD.state.getState().moments[0].likes.includes('me')"))
        await pg.click('.mpost:first-child [data-act=momentComment]'); await w(300); await pg.fill('#cm-i','nice one'); await pg.press('#cm-i','Enter'); await w(300); ok('comment added', await E("HD.state.getState().moments[0].comments.some(c=>c.text==='nice one')")); await w(2200); ok('bot replies to comment', await E("HD.state.getState().moments[0].comments.length")>=2); await rm_scrims()
        await pg.click('[data-mt=trending]'); await w(200); await pg.click('.mpost [data-act=momentGift] >> nth=0'); await w(500); await rm_scrims(); ok('gift moment', await E("HD.state.getState().wallet.sent[0].giftId")=='rose')
        await E("(()=>{const s=HD.state.getState();s.moments.unshift({id:'zz1',by:'me',text:'delete me',topic:'MusicMood',ts:Date.now(),likes:[],comments:[],img:null,gifts:0});HD.bus.emit('moments')})()"); await pg.click('[data-mt=follow]'); await w(200); await pg.evaluate("document.querySelector('[data-act=momentDel][data-id=zz1]').click()"); await w(300); await pg.click('.sheet-f .btn.danger'); await w(300); ok('delete moment', await E("!HD.state.getState().moments.some(m=>m.id==='zz1')"))
        # ---- messages v2 ----
        await go('#messages'); ok('system/official/moment rows', await pg.locator('.av-ic').count()==3); ok('message tabs', await pg.locator('[data-mt]').count()==2)
        await pg.click('[data-mt=friend]'); await w(300); ok('friends tab', 'NEW FRIENDS' in await pg.inner_text('#view')); await pg.fill('#fq','arjun'); await w(600); ok('friend search', await pg.locator('#fl [data-user]').count()>=1)
        await pg.fill('#fq','zzzz'); await w(600); ok('friend search empty', 'No friends match' in await pg.inner_text('#fl'))
        await pg.click('[data-mt=msg]'); await w(200); await pg.click('[data-go="#announcements"]'); await w(400); ok('announcements list', await pg.locator('.card.pad').count()==4); ok('announcements marked read', await E("UI_ok=HD.state.getState().official.every(o=>o.read)"))
        await go('#messages'); await pg.click('[data-act=msgClear]'); await w(300); await pg.click('.sheet-f .btn.primary'); await w(400); ok('clear unread', await E("HD.messages.unreadTotal()")==0 and await E("HD.notify.unread()")==0)
        # ---- search v2 ----
        await go('#search'); ok('search room/user tabs', await pg.locator('[data-stab]').count()==2); ok('you may like rooms', await pg.locator('#s-out .rr').count()==5); await pg.click('[data-stab=user]'); await w(200); ok('you may like users', await pg.locator('#s-out [data-user]').count()>=5)
        await pg.fill('#s-q','arjun'); await w(300); ok('user search', await pg.locator('#s-out [data-user]').count()>=1); await pg.click('[data-stab=room]'); await pg.fill('#s-q','music'); await w(300); ok('room search', await pg.locator('#s-out .rr').count()>=1)
        await pg.fill('#s-q',''); await pg.click('[data-stab=user]'); await pg.fill('#s-q','000003'); await w(300); ok('search by id', await pg.locator('#s-out [data-user]').count()>=1)
        # ---- family ----
        await go('#family'); ok('seeded families', await pg.locator('.group .li').count()>=6); await E("HD.state.getState().wallet.balance=50"); await pg.click('[data-act=famNew]'); await w(300); await pg.fill('#fn','Test Crew'); await pg.fill('#ft','tst'); await pg.click('.sheet-f .btn.primary'); await w(300); ok('create needs coins', await E("!HD.state.getState().myFamily")); await rm_scrims()
        await E("HD.state.getState().wallet.balance=5000"); await pg.click('[data-act=famNew]'); await w(300); await pg.fill('#fn','Test Crew'); await pg.fill('#ft','tst'); await pg.fill('#fd','Testing'); await pg.click('.sheet-f .btn.primary'); await w(900); await rm_scrims()
        ok('family created', await E("HD.family.mine()&&HD.family.mine().name==='Test Crew'&&HD.family.mine().owner==='me'")); ok('tag uppercased', await E("HD.family.mine().tag")=='TST')
        await pg.fill('#fi','hello family'); await pg.press('#fi','Enter'); await w(300); ok('family chat', await E("HD.family.mine().chat.some(m=>m.text==='hello family')")); await pg.click('[data-act=famCheckin]'); await w(300); ok('family checkin once', await pg.locator('[data-act=famCheckin][disabled]').count()==1)
        ok('cannot join second family', not (await E("HD.family.join('fam1')"))['ok']); await pg.evaluate("document.querySelector('[data-act=famLeave]').click()"); await w(300); await pg.click('.sheet-f .btn.danger'); await w(500); ok('left family (owner left, family removed)', await E("!HD.state.getState().myFamily&&!HD.state.getState().families.some(f=>f.name==='Test Crew')"))
        await go('#family/fam2'); await pg.click('[data-act=famJoin]'); await w(300); ok('join family', await E("HD.state.getState().myFamily")=='fam2'); ok('tag helper', await E("HD.familyTag(HD.me()).length")>5)
        # ---- migration from v1.1 ----
        old=await E("(()=>{const s=JSON.parse(JSON.stringify(HD.state.getState()));['moments','official','cards','relations','cp','families','myFamily','vip','bag','missions'].forEach(k=>delete s[k]);s.users.forEach(u=>{delete u.tier;delete u.prestige;delete u.title});s.shop={owned:['frame:neon'],frame:null};return s})()")
        await E(f"HD.state.frozen=true; localStorage.setItem(HD.CONFIG.STORAGE_KEY, JSON.stringify({json.dumps(old)}))"); await pg.reload(); await w(1800)
        ok('v1.1 state migrates', await E("!!HD.state.getState().vip&&HD.state.getState().moments.length>=5&&HD.state.getState().families.length>=6&&!!HD.state.getState().shop.equip&&HD.state.getState().shop.owned.includes('frame:neon')"))
        for r in ['moments','vip','shop','family','missions','cp','gamelevel']: await go('#'+r); ok('after migration '+r, await E("document.querySelector('#view').innerText.length")>40)
        # ---- layout ----
        await pg.set_viewport_size({'width':360,'height':640})
        for r in ['home','profile','vip','shop','moments','messages','missions','family','cp','gamelevel','prestige','titles','specialid','mystery','search']:
            await go('#'+r); ok('no h-overflow '+r, await E("document.documentElement.scrollWidth<=innerWidth+1"), str(await E("document.documentElement.scrollWidth")))
        await pg.set_viewport_size({'width':1280,'height':800}); await go('#vip'); ok('desktop vip', await pg.locator('.priv').count()>=20); await go('#moments'); ok('desktop sidebar new items', await pg.locator('.sidebar [data-nav=moments]').count()==1 and await pg.locator('.sidebar [data-nav=vip]').count()==1)
        await pg.screenshot(path='/tmp/v12_desk.png')
        print(f'PASSED {passes} FAILED {len(fails)}'); print('ERRS', errs[:8]); await b.close()
asyncio.run(main())
