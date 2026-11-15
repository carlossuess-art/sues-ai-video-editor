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
function rig({selection='1',disabled=false,defer=false,hfResponse=null}={}){
 const ids=['narrative-motion-panel','narrative-motion-propose','narrative-motion-status','narrative-motion-results','narrative-motion-export','narrative-motion-hf-preflight','narrative-motion-hf-status','narrative-motion-hf-results','narrative-motion-hf-export','narrative-motion-hf-stage','narrative-motion-hf-stage-status','captions'];
 const elements=Object.fromEntries(ids.map(id=>[id,new El(id)]));
 const select=new El('choice');select.dataset.keyword='seg-001';select.value=selection;select.disabled=disabled;
 const textarea=new El('caption');textarea.value='¿Y SI TE ESCUCHARAS?';
 const listeners=new Map(),requests=[],pending=[];
 const response={review:{candidates:[{sourceSpeech:{quote:'¿Y SI TE ESCUCHARAS?',anchorWordId:'hash-w1',start:1,end:2},reason:'Pregunta',visualMechanism:'Tarjeta con texto',templateId:'TPL_HOOK_DROP_CARD',implementation:'standalone-svg-prototype',blockReasons:['No mapping nativo']} ]},avMarkdown:'# A/V',readOnly:true};
 const document={getElementById:id=>elements[id]??null,
  querySelectorAll:s=>s==='#captions select[data-keyword]'?[select]:[],
  querySelector:s=>s.startsWith('#captions textarea')?textarea:null,
  createElement:tag=>new El(tag)};
 const fetch=async(url,opts)=>{requests.push({url,opts});if(defer)await new Promise(done=>pending.push(done));if(url.endsWith('/master-current'))return {ok:true,json:async()=>({revision:'a'.repeat(64)})};if(url.endsWith('/motion-hyperframes-stage'))return {ok:true,json:async()=>({status:'NEW_MASTER_DRAFT_REQUIRES_CREATIVE_APPROVAL',storyRevision:'b'.repeat(64),creativeApproved:false,canExecute:false,fablecutEdited:false})};if(url.endsWith('/motion-hyperframes-preflight'))return {ok:hfResponse?.status!=='BLOCKED_FOR_EVIDENCE',status:hfResponse?.status==='BLOCKED_FOR_EVIDENCE'?422:200,json:async()=>hfResponse};return {ok:true,json:async()=>response};};
 const win={addEventListener:(k,fn)=>listeners.set(k,fn)};
 const env={document,window:win,fetch,Blob,URL:{createObjectURL:()=>'/blob/demo',revokeObjectURL:()=>{}},setTimeout:()=>{}};
 runInNewContext(script,env);
 const selectProject=()=>listeners.get('sues:motion-context')({detail:{
  jobId:'11111111-1111-4111-8111-111111111111',fingerprint:'revision-1',
  captions:[{id:'seg-001',text:'¿Y SI TE ESCUCHARAS?',wordIndexes:[0,1,2,3]}]
 }});
 return {elements,select,textarea,listeners,requests,pending,selectProject,response};
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

test('editing the original caption instantly invalidates export and leaves the editor untouched',async()=>{
 const r=rig();r.selectProject();await r.elements['narrative-motion-propose'].click();
 assert.equal(r.elements['narrative-motion-export'].disabled,false);
 r.textarea.value='Texto corregido';
 r.elements.captions.handlers.get('input')();
 assert.equal(r.elements['narrative-motion-export'].disabled,true);
 assert.equal(r.elements['narrative-motion-results'].children.length,0);
 assert.match(r.elements['narrative-motion-status'].textContent,/Vuelve a analizar/);
});
test('inflight review cannot reappear after the user changes selected words',async()=>{
 const r=rig({defer:true});r.selectProject();
 const inflight=r.elements['narrative-motion-propose'].click();
 assert.equal(r.pending.length,1);
 r.select.value='none';
 r.elements.captions.handlers.get('change')();
 r.pending[0]();
 await inflight;
 assert.equal(r.elements['narrative-motion-export'].disabled,true);
 assert.equal(r.elements['narrative-motion-results'].children.length,0);
});
test('out-of-order responses cannot overwrite a later review',async()=>{
 const r=rig({defer:true});r.selectProject();
 const old=r.elements['narrative-motion-propose'].click();
 r.elements.captions.handlers.get('change')();
 const newer=r.elements['narrative-motion-propose'].click();
 assert.equal(r.pending.length,2);
 r.pending[1]();
 await newer;
 assert.equal(r.elements['narrative-motion-export'].disabled,false);
 assert.equal(r.elements['narrative-motion-results'].children.length,1);
 r.pending[0]();
 await old;
 assert.equal(r.elements['narrative-motion-export'].disabled,false);
 assert.equal(r.elements['narrative-motion-results'].children.length,1);
});

test('HyperFrames preflight is separate, explicitly requested and not an editing action',async()=>{
 const base={
  schema:'sues-editor-hyperframes-preflight/v1',status:'READY_FOR_CREATIVE_REVIEW',
  readOnly:true,rendered:false,creativeApproved:false,canExecute:false,
  hyperframes:{variables:{line1:'¿Y si te',line2:'escucharas?',followLine1:'Haz espacio',followLine2:'para escucharte.',wordScheduleJson:'{}'}},
  scene:{startSec:1,frames:151},words:{card:[{text:'¿Y',editedFrame:38}],follow:[{text:'espacio',editedFrame:110}]}
 };
 const r=rig({hfResponse:base});r.selectProject();
 assert.equal(r.elements['narrative-motion-hf-preflight'].disabled,true);
 await r.elements['narrative-motion-propose'].click();
 assert.equal(r.elements['narrative-motion-hf-preflight'].disabled,false);
 await r.elements['narrative-motion-hf-preflight'].click();
 assert.equal(r.requests.length,2);
 assert.match(r.requests[1].url,/motion-hyperframes-preflight$/);
 const sent=JSON.parse(r.requests[1].opts.body);
 assert.deepEqual(JSON.parse(JSON.stringify(sent.selections)),[{captionId:'seg-001',displayWordIndex:1,sourceWordIndex:1,captionText:'¿Y SI TE ESCUCHARAS?'}]);
 assert.equal(r.elements['narrative-motion-hf-export'].disabled,false);
 assert.match(r.elements['narrative-motion-hf-status'].textContent,/No se ha renderizado ni editado/);
 r.elements.captions.handlers.get('change')();
 assert.equal(r.elements['narrative-motion-hf-export'].disabled,true);
 assert.equal(r.elements['narrative-motion-hf-results'].children.length,0);
});
test('a blocked HyperFrames preflight never enables export or edits the Reel',async()=>{
 const r=rig({hfResponse:{status:'BLOCKED_FOR_EVIDENCE',issues:[{code:'SOURCE_TO_EDIT_MAP_NOT_VERIFIED',description:'No hay fuente editada verificada'}]}});r.selectProject();
 await r.elements['narrative-motion-propose'].click();
 await r.elements['narrative-motion-hf-preflight'].click();
 assert.equal(r.elements['narrative-motion-hf-export'].disabled,true);
 assert.match(r.elements['narrative-motion-hf-results'].children[0].textContent,/No hay fuente editada verificada/);
});

test('explicit HF staging uses the observed master head CAS; never auto-approves or executes',async()=>{
 const base={schema:'sues-editor-hyperframes-preflight/v1',status:'READY_FOR_CREATIVE_REVIEW',
  readOnly:true,rendered:false,creativeApproved:false,canExecute:false,
  hyperframes:{variables:{line1:'¿Y si te',line2:'escucharas?',followLine1:'Haz espacio',followLine2:'para escucharte.',wordScheduleJson:'{}'}},
  scene:{startSec:1,frames:151},words:{card:[{text:'¿Y',editedFrame:38}],follow:[{text:'espacio',editedFrame:110}]}};
 const r=rig({hfResponse:base});r.selectProject();
 assert.equal(r.elements['narrative-motion-hf-stage'].disabled,true);
 await r.elements['narrative-motion-propose'].click();
 await r.elements['narrative-motion-hf-preflight'].click();
 assert.equal(r.elements['narrative-motion-hf-stage'].disabled,false);
 assert.equal(r.requests.length,2);
 await r.elements['narrative-motion-hf-stage'].click();
 assert.equal(r.requests.length,4);
 assert.match(r.requests[2].url,/master-current$/);
 assert.match(r.requests[3].url,/motion-hyperframes-stage$/);
 const body=JSON.parse(r.requests[3].opts.body);
 assert.equal(body.expectedStoryRevision,'a'.repeat(64));
 assert.equal(body.fingerprint,'revision-1');
 assert.equal(r.elements['narrative-motion-hf-stage'].disabled,true);
 assert.equal(r.elements['narrative-motion-hf-export'].disabled,true);
 assert.match(r.elements['narrative-motion-hf-stage-status'].textContent,/Revisa el guion completo/);
});
