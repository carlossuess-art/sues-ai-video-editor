import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {readKeywordSelection,saveKeywordSelection,captionStylePlan} from '../src/sues-keyword-selection.js';
test('selection persists per real timeline; stale writer rejected; overlap suppresses only the title interval',()=>{const dir=mkdtempSync(join(tmpdir(),'sues-keywords-'));try{const draft={sourceSha256:'source',timelineFingerprint:'edit',words:[{wordId:'w',text:'Conciencia',startFrame:0,endFrame:30}],captionCues:[{id:'c',wordIds:['w'],text:'Conciencia',startFrame:0,endFrame:30}]};const saved=saveKeywordSelection(dir,draft,{selectedWordIds:['w'],expectedRevision:null});assert.equal(readKeywordSelection(dir,draft).revision,saved.revision);assert.equal(saveKeywordSelection(dir,draft,{selectedWordIds:[],expectedRevision:null}).status,'CONFLICT');const style=captionStylePlan(draft,saved,{sourceSha256:'source',timeline:{fingerprint:'edit'},operations:[{start:0.3,end:0.6,parameters:{command:{action:'add_title',text:'CONCIENCIA'}}}]});assert.equal(style.status,'STYLES_PLANNED_NOT_RENDERED');assert.deepEqual(style.segments.map(s=>s.words[0].style),['gold','white','gold']);assert.equal(readKeywordSelection(dir,{...draft,timelineFingerprint:'other'}),null);}finally{rmSync(dir,{recursive:true,force:true})}});
test('confirmed empty selection keeps all caption words and ignores unrelated graphic text evidence',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-keywords-'));
 try{
  const draft={sourceSha256:'source',timelineFingerprint:'edit',
   words:[{wordId:'w',text:'Sofá',startFrame:2,endFrame:14}],
   captionCues:[{id:'c',wordIds:['w'],text:'Sofá',startFrame:2,endFrame:14}]};
  const story={sourceSha256:'source',timeline:{fingerprint:'edit'},
   operations:[{id:'motion',track:'graphics',start:0,end:1,parameters:{}}]};
  assert.equal(captionStylePlan(draft,null,story).status,'KEYWORD_SELECTION_REQUIRED');
  const selection=saveKeywordSelection(dir,draft,{selectedWordIds:['w'],expectedRevision:null});
  assert.equal(captionStylePlan(draft,selection,story).status,'GRAPHIC_TEXT_NOT_VERIFIED');
  const empty=saveKeywordSelection(dir,draft,{selectedWordIds:[],expectedRevision:selection.revision});
  assert.deepEqual(readKeywordSelection(dir,draft),empty);
  const style=captionStylePlan(draft,empty,story);
  assert.equal(style.status,'STYLES_PLANNED_NOT_RENDERED');
  assert.equal(style.selectionRevision,empty.revision);
  assert.deepEqual(style.segments,[{id:'c-style-0',cueId:'c',startFrame:2,endFrame:14,
   text:'Sofá',words:[{wordId:'w',text:'Sofá',style:'white',suppressed:false}]}]);
  assert.equal(captionStylePlan(draft,empty,{...story,timeline:{fingerprint:'other'}}).status,'TITLE_TIMELINE_REQUIRED');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
