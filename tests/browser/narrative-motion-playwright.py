"""Optional real-Chromium UI regression of the actual panel JS. Read-only fake job.

Usage: python tests/browser/narrative-motion-playwright.py [output-dir]
Requires installed Python playwright and Chromium (or SUES_CHROME path).
No FableCut credentials or production services are used. This tests panel
logic and representative responsive layout, NOT the published editor's CSS.
"""
from pathlib import Path
import json, os, shutil, sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
SOURCE=(ROOT/'web/narrative-motion-panel.js').read_text(encoding='utf-8')
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'browser-qa-output'
OUT.mkdir(parents=True, exist_ok=True)
CHROME=os.environ.get('SUES_CHROME') or shutil.which('chromium') or shutil.which('google-chrome')
if not CHROME:
    raise SystemExit('Chromium not installed; only browser QA is unavailable.')
HTML="""<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}body{margin:0;background:#181918;color:#fff;font:16px Arial,sans-serif}
main{max-width:720px;margin:auto;padding:24px}section,details{background:#252521;border:1px solid #777;border-radius:10px;padding:15px;margin:15px 0}
select,textarea{display:block;width:100%;padding:9px;margin:6px 0 13px;background:#151515;color:#fff}
button{border:0;padding:12px;border-radius:7px;background:#dec88a;color:#111;font-weight:700;margin:10px 0}
button:disabled{opacity:.5}article{border:1px solid #666;padding:13px;margin:12px 0;border-radius:7px}
p,article{overflow-wrap:anywhere;line-height:1.45}</style>
<main><h2>QA aislada de Motion narrativo</h2><p>Transcripción ficticia. Sin editor ni voz real.</p>
<section><h3>Subtítulos y elementos</h3><div id="captions">
<select data-keyword="seg-001"><option value="auto">Automático</option><option value="3">escucharas?</option></select><textarea data-id="seg-001">¿Y si te escucharas?</textarea>
<select data-keyword="seg-002"><option value="auto">Automático</option><option value="1">espacio</option></select><textarea data-id="seg-002">Haz espacio para escucharte.</textarea>
</div></section>
<details open id="narrative-motion-panel"><summary>Motion narrativo · propuestas por palabras</summary>
<button id="narrative-motion-propose">Analizar palabras marcadas</button><p id="narrative-motion-status"></p>
<div id="narrative-motion-results"></div><button id="narrative-motion-export">Guardar guion A/V de revisión</button></details></main>"""
STUB="""() => {
 window.__requests=[];
 window.fetch=async (url,options) => {
  window.__requests.push({url,options});
  return {ok:true,json:async()=>({avMarkdown:'# QA A/V sintético',review:{candidates:[{
   sourceSpeech:{quote:'¿Y si te escucharas?',anchorWordId:'demo-3',start:0,end:1.1},
   reason:'Gancho narrativo',visualMechanism:'Tarjeta con texto individual',
   templateId:'TPL_HOOK_DROP_CARD',implementation:'standalone-svg-prototype',
   blockReasons:['Sin render nativo verificado']
  }]}})};
 };
}"""
EVENT="""() => window.dispatchEvent(new CustomEvent('sues:motion-context',{detail:{
 jobId:'fixture-only',fingerprint:'revision-QA',captions:[
 {id:'seg-001',text:'¿Y si te escucharas?',wordIndexes:[0,1,2,3]},
 {id:'seg-002',text:'Haz espacio para escucharte.',wordIndexes:[4,5,6,7]}
 ]}}))"""
results={}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=CHROME, args=['--no-sandbox'])
    for label,view in [('mobile',{'width':390,'height':844}),('desktop',{'width':1280,'height':900})]:
        page=browser.new_page(viewport=view,accept_downloads=True)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(HTML)
        page.evaluate(STUB)
        page.add_script_tag(content=SOURCE)
        page.evaluate(EVENT)
        page.locator('select[data-keyword="seg-001"]').select_option('3')
        page.locator('select[data-keyword="seg-002"]').select_option('1')
        page.get_by_role('button',name='Analizar palabras marcadas').click()
        page.wait_for_function("document.querySelectorAll('#narrative-motion-results article').length===1")
        sent=page.evaluate('window.__requests')[0]
        assert sent['options']['method']=='POST'
        assert sent['options']['headers']['x-sues-request']=='editor'
        selected=json.loads(sent['options']['body'])['selections']
        assert [s['sourceWordIndex'] for s in selected]==[3,5]
        assert page.evaluate('document.documentElement.scrollWidth')==view['width']
        assert not errors,errors
        page.screenshot(path=str(OUT/f'{label}.png'),full_page=True)
        if label=='mobile':
            with page.expect_download() as info:
                page.get_by_role('button',name='Guardar guion A/V de revisión').click()
            assert info.value.suggested_filename=='SUES_MOTION_GUION_AV_NO_IMPORTABLE.md'
            page.locator('textarea[data-id="seg-001"]').fill('Texto nuevo')
            assert page.get_by_role('button',name='Guardar guion A/V de revisión').is_disabled()
            assert page.locator('#narrative-motion-results article').count()==0
            page.evaluate("window.dispatchEvent(new Event('sues:plan-updated'))")
            assert page.get_by_role('button',name='Analizar palabras marcadas').is_disabled()
        results[label]={'result':'PASS','sourceIndexes':[3,5],'viewport':view,'jsErrors':errors}
        page.close()
    browser.close()
(OUT/'report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False))
