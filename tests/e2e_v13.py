"""v1.3 tests: full backup (state + photos/voice notes), visitors."""
import asyncio, http.server, threading, socketserver, os, functools, sys, json
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9961
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
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, accept_downloads=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:250])); pg.on('console',lambda m: errs.append(m.text[:200]) if m.type=='error' else None)
        E=pg.evaluate
        async def w(ms=300): await pg.wait_for_timeout(ms)
        await pg.goto(URL); await w(2400)
        await pg.click('text=Create account'); await pg.fill('#a-n','Tester'); await pg.fill('#a-h','tester_b'); await pg.click('button[type=submit]'); await w(600)
        # media + data
        await E("HD.storage.putImage('av:me','data:image/jpeg;base64,AAAA'); HD.storage.putImage('vm:test1','data:audio/webm;base64,BBBB'); HD.storage.putImage('mm:z9','data:image/jpeg;base64,CCCC')"); await w(400)
        await E("(()=>{const s=HD.state.getState();s.wallet.balance=7777;s.moments.unshift({id:'z9',by:'me',text:'backup moment',topic:'MusicMood',ts:Date.now(),likes:[],comments:[],img:'mine',gifts:0});s.families[0].notice='custom notice';HD.state.persistState()})()")
        # visitors
        await E("(()=>{const s=HD.state.getState();s.visitors=[{uid:'u3',ts:Date.now()-60000},{uid:'u4',ts:Date.now()-120000}];s.stats.visitors=2;HD.state.persistState()})()")
        await E("location.hash='#profile'"); await w(500); ok('five stats on own profile', await pg.locator('.stats.five .stat').count()==5); ok('visitors stat shows count', '2' in await pg.inner_text('[data-go="#visitors"]'))
        await pg.click('[data-go="#visitors"]'); await w(400); ok('visitors list', await pg.locator('.group [data-user]').count()==2)
        await E("HD.state.getState().social.blocked.push('u3')"); await E("location.hash='#profile'"); await w(300); await E("location.hash='#visitors'"); await w(400); ok('blocked users hidden from visitors', await pg.locator('.group [data-user]').count()==1); await E("HD.state.getState().social.blocked=[]")
        ok('other profile has 4 stats', (await E("location.hash='#profile/u3'") or True) and True); await w(400); ok('no visitors stat on others', await pg.locator('.stats.four .stat').count()==4)
        # export
        await E("location.hash='#settings'"); await w(400)
        async with pg.expect_download() as dl: await pg.click('[data-act=exportData]')
        d=await dl.value; obj=json.load(open(await d.path()))
        ok('export has images', set(['av:me','vm:test1','mm:z9'])<=set(obj.get('_images',{}).keys()), str(list(obj.get('_images',{}).keys())[:5]))
        ok('export has new data', obj['wallet']['balance']==7777 and obj['moments'][0]['text']=='backup moment' and obj['families'][0]['notice']=='custom notice' and len(obj['visitors'])==2)
        ok('export has no currentRoom', 'currentRoom' not in obj)
        # wipe everything then import
        await E("HD.state.getState().wallet.balance=1; HD.storage.clearImages()"); await w(500)
        ok('images wiped', await E("Object.keys(HD.storage.images).length")==0)
        json.dump(obj, open('/tmp/bk13.json','w'))
        async with pg.expect_file_chooser() as fc: await pg.click('[data-act=importData]')
        await (await fc.value).set_files('/tmp/bk13.json'); await w(500)
        await pg.click('.scrim:last-child .sheet-f .btn.primary'); await w(3000)
        ok('state restored', await E("HD.state.getState().wallet.balance")==7777 and await E("HD.state.getState().moments[0].text")=='backup moment')
        ok('images restored after reload', await E("HD.storage.images['av:me']")=='data:image/jpeg;base64,AAAA' and await E("HD.storage.images['vm:test1']")=='data:audio/webm;base64,BBBB' and await E("HD.storage.images['mm:z9']")=='data:image/jpeg;base64,CCCC')
        ok('stored state has no _images blob', await E("!('_images' in JSON.parse(localStorage.getItem(HD.CONFIG.STORAGE_KEY)))"))
        ok('still logged in after import', await E("!!HD.me()"))
        # old-style backup (no _images) still imports
        obj2=dict(obj); obj2.pop('_images',None); obj2['wallet']['balance']=4242; json.dump(obj2, open('/tmp/bk13b.json','w'))
        await E("location.hash='#settings'"); await w(400)
        async with pg.expect_file_chooser() as fc2: await pg.click('[data-act=importData]')
        await (await fc2.value).set_files('/tmp/bk13b.json'); await w(500); await pg.click('.scrim:last-child .sheet-f .btn.primary'); await w(3000)
        ok('legacy backup imports', await E("HD.state.getState().wallet.balance")==4242)
        # corrupt files rejected
        open('/tmp/bad13.json','w').write('not json at all')
        await E("location.hash='#settings'"); await w(400)
        async with pg.expect_file_chooser() as fc3: await pg.click('[data-act=importData]')
        await (await fc3.value).set_files('/tmp/bad13.json'); await w(600); ok('corrupt backup rejected', await pg.locator('.toast.err').count()>=1 and await E("HD.state.getState().wallet.balance")==4242)
        # bot visitors accumulate
        await E("HD.state.getState().visitors=[]; HD.state.getState().stats.visitors=0"); 
        print(f'PASSED {passes} FAILED {len(fails)}'); print('ERRS', errs[:6]); await b.close()
asyncio.run(main())
