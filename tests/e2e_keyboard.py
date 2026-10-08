"""Keyboard & focus checks: skip link, tab order, visible focus, modal focus trap, Esc, focus return, room shortcuts."""
import asyncio, http.server, threading, socketserver, os, functools, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9821
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.TCPServer(('127.0.0.1',PORT), functools.partial(Q, directory='.')); threading.Thread(target=srv.serve_forever,daemon=True).start()
from playwright.async_api import async_playwright
fails=[]; passes=0
def ok(n,c,x=''):
    global passes
    if c: passes+=1
    else: fails.append(n); print('FAIL',n,x)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:250]))
        E=pg.evaluate
        async def w(ms=250): await pg.wait_for_timeout(ms)
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html'); await w(2400)
        # welcome: keyboard-only sign up
        await pg.keyboard.press('Tab'); ok('skip link first focus', await E("document.activeElement.className")=='skip')
        for i in range(6):
            await pg.keyboard.press('Tab')
            if 'Create account' in await E("document.activeElement.innerText"): break
        ok('reach Create account by Tab', 'Create account' in await E("document.activeElement.innerText")); await pg.keyboard.press('Enter'); await w(400)
        ok('enter activates link', await E("location.hash")=='#register')
        await pg.fill('#a-n','Key'); await pg.fill('#a-h','key_u'); await pg.focus('#a-h'); await pg.keyboard.press('Enter'); await w(600)
        ok('enter submits form', await E("location.hash")=='#home')
        # focus ring visible
        await pg.keyboard.press('Tab'); await E("document.querySelector('.bottomnav a').focus()")
        outline=await E("(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle+'|'+s.outlineWidth})()"); ok('visible focus outline on nav', outline=='solid|2px', outline)
        # open a modal by keyboard from room info, trap focus
        await E("location.hash='#wallet'"); await w(500)
        await E("document.querySelector('[data-act=recharge]').focus()"); await pg.keyboard.press('Enter'); await w(500)
        ok('modal opened', await pg.locator('.scrim [role=dialog]').count()==1); ok('dialog aria-modal', await E("document.querySelector('[role=dialog]').getAttribute('aria-modal')")=='true')
        ok('focus moved into dialog', await E("!!document.activeElement.closest('.scrim')"))
        inside=True
        for i in range(12):
            await pg.keyboard.press('Tab'); inside = inside and await E("!!document.activeElement.closest('.scrim')")
        ok('Tab stays trapped in dialog (12 presses)', inside)
        inside=True
        for i in range(8):
            await pg.keyboard.press('Shift+Tab'); inside = inside and await E("!!document.activeElement.closest('.scrim')")
        ok('Shift+Tab stays trapped', inside)
        await pg.keyboard.press('Escape'); await w(500); ok('Esc closes dialog', await pg.locator('.scrim').count()==0)
        ok('focus returns to opener', await E("document.activeElement.dataset.act")=='recharge', await E("document.activeElement.outerHTML.slice(0,60)"))
        # stacked modals: Esc closes top only
        await E("HD.modal.open({title:'A',body:'<button id=ba>a</button>'}); HD.modal.open({title:'B',body:'<button id=bb>b</button>'})"); await w(400)
        await pg.keyboard.press('Escape'); await w(400); ok('Esc closes only top modal', await pg.locator('.scrim').count()==1); await E("HD.modal.closeAll()"); await w(300)
        # tabs: roles/aria-selected change
        await E("location.hash='#discover'"); await w(500); ok('chips expose aria-pressed', await pg.locator('#d-cats [aria-pressed]').count()>=10)
        # keyboard activation of role=link cards
        await E("location.hash='#rooms'"); await w(500); await E("document.querySelector('.rr[data-room]').focus()"); await pg.keyboard.press('Enter'); await w(900)
        ok('Enter on room card opens room', (await E("location.hash")).startswith('#room/')); await E("HD.modal.closeAll()"); await w(300)
        # room shortcuts
        await pg.keyboard.press('c'); await w(400); ok('C opens chat', await pg.locator('.drawer').count()==1)
        await pg.keyboard.press('Escape'); await w(300); ok('Esc closes chat', await pg.locator('.drawer').count()==0)
        await pg.keyboard.press('p'); await w(400); ok('P opens people', await pg.locator('.scrim [data-pt]').count()>=1); await pg.keyboard.press('Escape'); await w(400)
        await pg.keyboard.press('c'); await w(300); await pg.focus('#cin'); await pg.keyboard.type('mmm'); ok('typing in chat does not trigger shortcuts', await pg.locator('.scrim').count()==0 and await pg.input_value('#cin')=='mmm')
        # live regions
        ok('toast live region', await E("document.querySelector('#toast-root').getAttribute('aria-live')")=='polite'); ok('chat log live', await pg.locator('.drawer [role=log][aria-live]').count()==1)
        # reduced motion honours setting
        await E("HD.state.getState().settings.motion='reduce';HD.applySettings()"); ok('reduced motion attr', await E("document.documentElement.dataset.motion")=='reduce')
        d=await E("getComputedStyle(document.querySelector('.rm-top')).animationDuration"); ok('animations suppressed when reduced', d in ('1e-05s','0.00001s','0s'), d)
        # lang attr follows language
        await E("HD.i18n.set('hi')"); ok('html lang updates', await E("document.documentElement.lang")=='hi')
        print(f'PASSED {passes} FAILED {len(fails)}'); print('ERRS', errs[:5]); await b.close()
asyncio.run(main())
