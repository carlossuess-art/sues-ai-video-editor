'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=__dirname;
function makeDom(){
  class El {
    constructor(tag){this.tagName=tag;this.dataset={};this.attrs={};this.children=[];this.events={};}
    setAttribute(k,v){this.attrs[k]=v;}
    getAttribute(k){return this.attrs[k];}
    appendChild(c){this.children.push(c);return c;}
    addEventListener(k,v){this.events[k]=v;}
    querySelectorAll(){return this.children.filter(x=>x.tagName==='button');}
  }
  const app=new El('div'),dock=null,side={inspector:{clicks:0},mixer:{clicks:0},transcript:{clicks:0}};
  for(const item of Object.values(side))item.click=function(){this.clicks++};
  const doc={
    getElementById:id=>id==='app'?app:null,
    createElement:tag=>new El(tag),
    querySelector:sel=>{const m=/data-side="([^"]+)"/.exec(sel);return m?side[m[1]]:null},
    addEventListener:()=>{}
  };
  const win={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'sues-mobile.js'),'utf8'),{document:doc,window:win});
  return {app,side,win,dock:app.children[0]};
}
test('routes mobile modes through original inspector tabs',()=>{
  const x=makeDom();
  assert.equal(x.dock.id,'suesMobileDock');
  assert.equal(x.dock.children.length,5);
  x.win.SuesMobileShell.open('media');
  assert.equal(x.app.dataset.mobilePanel,'media');
  assert.equal(x.side.inspector.clicks,0);
  x.win.SuesMobileShell.open('tools');
  assert.equal(x.app.dataset.mobilePanel,'tools');
  assert.equal(x.side.inspector.clicks,1);
  x.win.SuesMobileShell.open('mixer');
  assert.equal(x.side.mixer.clicks,1);
  assert.equal(x.app.dataset.mobilePanel,'tools');
  x.win.SuesMobileShell.open('transcript');
  assert.equal(x.side.transcript.clicks,1);
  x.win.SuesMobileShell.open('close');
  assert.equal(x.app.dataset.mobilePanel,'');
  assert.equal(x.dock.children.filter(b=>b.attrs['aria-pressed']==='true').length,0);
});
test('mobile shell stays separate from desktop and video compositor',()=>{
  const css=fs.readFileSync(path.join(root,'sues-mobile.css'),'utf8');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(css.includes('@media(max-width:760px)'));
  assert.ok(css.includes('.upper>.monitor{display:flex!important'));
  assert.ok(css.includes('.timeline-panel{flex:'));
  assert.ok(css.includes('.timeline-toolbar{'));
  assert.ok(html.includes('href="sues-mobile.css"'));
  assert.ok(html.includes('src="sues-mobile.js"'));
});

