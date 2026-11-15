import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync(new URL('../web/narrative-motion-panel.js',import.meta.url),'utf8');
class El {
 constructor(id=''){this.id=id;this.textContent='';this.value='';this.disabled=false;this.dataset={};this.children=[];this.handlers=new Map();}
 addEventListener(name,fn){this.handlers.set(name,fn);}
 replaceChildren(){this.children=[];}
 append(el){this.children.push(el);}
 click(){return this.handlers.get('click')?.();}
}
function rig({selection='1',disabled=false}={}){
 const ids=['narrative-motion-panel','narrative-motion-propose','narrative-motion-status','narrative-motion-results','narrative-motion-export'];
 const elements=Object.fromEntries(ids.map(id=>[id,new El(id)]));
 const select=new El('choice');select.dataset.keyword='seg-001';select.value=selection;select.disabled=disabled;
 const textarea=new El('caption');textarea.value='¿Y SI TE ESCUCHARAS?';
 const listeners=new Map(),requests=[];
 const response={review:{candidates:[{sourceSpeech:{quote:'¿Y SI TE ESCUCHARAS?',anchorWordId:'hash-w1',start:1,end:2},reason:'Pregunta',visualMechanism:'Tarjeta con texto',templateId:'TPL_HOOK_DROP_CARD',implementation:'standalone-svg-prototype',blockReasons:['No mapping nativo']} ]},avMarkdown:'# A/V',readOnly:true};
 const document={getElementById:id=>elements[id]??null,
  querySelectorAll:s=>s==='#captions select[data-keyword]'?[select]:[],
  querySelector:s=>s.startsWith('#captions textarea')?textarea:null,
  createElement:tag=>new El(tag)};
 const fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,json:async()=>response};};
 const win={addEventListener:(k,fn)=>listeners.set(k,fn)};
 const env={document,window:win,fetch,Blob,URL:{createObjectURL:()=>'/blob/demo',revokeObjectURL:()=>{}},setTimeout:()=>{}};
 runInNewContext(script,env);
 const selectProject=()=>listeners.get('sues:motion-context')({detail:{
  jobId:'11111111-1111-4111-8111-111111111111',fingerprint:'revision-1',
  captions:[{id:'seg-001',text:'¿Y SI TE ESCUCHARAS?',wordIndexes:[0,1,2,3]}]
 }});
 return {elements,select,textarea,listeners,requests,selectProject,response};
}
test('UI sends existing caption selected source-word ID, not new invented selection',async()=>{
 const r=rig();r.selectProject();
 assert.equal(r.elements['narrative-motion-propose'].disabled,false);
 await r.elements['narrative-motion-propose'].click();
 assert.equal(r.requests.length,1);
 assert.match(r.requests[0].url,/motion-narrative$/);
 assert.equal(r.requests[0].opts.method,'POST');
 assert.equal(r.requests[0].opts.headers['x-sues-request'],'editor');
 const body=JSON.parse(r.requests[0].opts.body);
 assert.equal(body.fingerprint,'revision-1');
 assert.deepEqual(JSON.parse(JSON.stringify(body.selections)),[{captionId:'seg-001',displayWordIndex:1,sourceWordIndex:1,captionText:'¿Y SI TE ESCUCHARAS?'}]);
 assert.equal(r.elements['narrative-motion-export'].disabled,false);
 const child=r.elements['narrative-motion-results'].children[0];
 assert.equal(child.children[0].textContent,'¿Y SI TE ESCUCHARAS?');
});
test('automatic or disabled keyword never constitutes an explicit choice',async()=>{
 for(const opts of [{selection:'auto'},{selection:'none'},{selection:'1',disabled:true}]){
  const r=rig(opts);r.selectProject();await r.elements['narrative-motion-propose'].click();
  assert.deepEqual(JSON.parse(JSON.stringify(JSON.parse(r.requests[0].opts.body).selections)),[]);
 }
});
test('project revision invalidation clears stale review without silently editing',async()=>{
 const r=rig();r.selectProject();await r.elements['narrative-motion-propose'].click();
 assert.equal(r.elements['narrative-motion-export'].disabled,false);
 r.listeners.get('sues:plan-updated')();
 assert.equal(r.elements['narrative-motion-export'].disabled,true);
 assert.equal(r.elements['narrative-motion-propose'].disabled,true);
 assert.equal(r.elements['narrative-motion-results'].children.length,0);
});
