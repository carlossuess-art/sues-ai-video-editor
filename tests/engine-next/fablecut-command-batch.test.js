import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {applyCommandBatch,projectFingerprint,undoCommandBatch,prepareStoryBatch} from '../../src/engine-next/fablecut-command-batch.js';
import {searchResources} from '../../src/engine-next/fablecut-resource-search.js';
const nativePath=process.env.FABLECUT_NATIVE_OPS;
const native=nativePath?createRequire(import.meta.url)(nativePath):null;
const p={revision:7,width:1080,height:1920,fps:30,tracks:[{id:'V2',kind:'video'},{id:'V1',kind:'video'},{id:'A1',kind:'audio'},{id:'A2',kind:'audio'}],media:[{id:'v',kind:'video',src:'/media/v.mp4',duration:5}],clips:[{id:'base',mediaId:'v',kind:'video',track:'V1',start:0,in:0,duration:5,props:{scale:1}}]};
const resolveAsset=id=>({id,kind:id==='music'?'audio':'video',duration:10,src:'/media/'+id+(id==='music'?'.wav':'.mp4'),name:id,verifiedPhysical:true});
const req=commands=>({baseRevision:p.revision,baseFingerprint:projectFingerprint(p),commands});
const opts={native,resolveAsset};
const run=(name,fn)=>test(name,{skip:!native},fn);
const music={id:'music1',action:'add_music',assetId:'music',track:'A1',start:0,duration:5,volume:.3};
const broll={id:'broll1',action:'add_broll',assetId:'video',track:'V2',start:1,duration:2,sourceIn:1,x:12,y:20,scale:.8,opacity:.9,fit:'cover'};
run('native B-roll and music with exact params, volume duck and fades',()=>{
 const first=applyCommandBatch(p,req([music,broll]),opts);const [m,b]=first.receipts.map(x=>x.clipId);
 const q=first.project,r=applyCommandBatch(q,{baseRevision:q.revision,baseFingerprint:projectFingerprint(q),commands:[{id:'duck1',action:'duck',clipId:m,start:1,duration:1,amount:-12,attack:.2,release:.3},{id:'fade1',action:'transition',clipId:b,side:'out',type:'fade',duration:.2}]},opts);
 assert.equal(r.project.clips.find(c=>c.id===b).props.x,12);assert.equal(r.project.clips.find(c=>c.id===b).transitionOut.duration,.2);assert.equal(r.project.clips.find(c=>c.id===m).keyframes.duck[1].v,-12);assert.deepEqual(undoCommandBatch(r.project,r.undo).clips,q.clips);
});
run('invalid second command aborts entire batch without mutating input',()=>{const h=projectFingerprint(p);assert.throws(()=>applyCommandBatch(p,req([music,{...broll,start:1.01}]),opts),/FRAME_RANGE/);assert.equal(projectFingerprint(p),h)});
run('reject track collisions, locks, unknown properties and out-of-range sources',()=>{for(const cmd of [{...broll,track:'V1'},{...broll,sourceIn:9},{...broll,force:true},{...music,track:'V1'}])assert.throws(()=>applyCommandBatch(p,req([cmd]),opts));});
run('move and remove adapter clip are reversible',()=>{const q=applyCommandBatch(p,req([broll]),opts);const cid=q.receipts[0].clipId;const r=applyCommandBatch(q.project,{baseRevision:q.project.revision,baseFingerprint:projectFingerprint(q.project),commands:[{id:'move1',action:'move',clipId:cid,start:2},{id:'remove1',action:'remove',clipId:cid}]},opts);assert.equal(r.project.clips.length,1);assert.equal(undoCommandBatch(r.project,r.undo).clips.length,2);assert.throws(()=>undoCommandBatch(p,r.undo),/STALE_UNDO/)});
test('catalog candidates are not promoted to licensed or semantically verified',()=>{const a=searchResources({assets:[{relativePath:'SFX/Whoosh.wav',type:'audio',license:'UNVERIFIED'},{relativePath:'SFX/other.wav',type:'audio'}]},'whoosh');assert.equal(a.length,1);assert.equal(a[0].license,'UNVERIFIED');assert.equal(a[0].semanticMatch,'NAME_OR_TAG_INFERENCE_ONLY')});
test('canonical story malformed and missing authorization is blocked',async()=>{assert.equal((await prepareStoryBatch({schema:'bad'},{registry:{}})).status,'BLOCKED')});
run('split, trim and replacement preserve source time and deterministic clip identity',()=>{
 const first=applyCommandBatch(p,req([broll]),opts),q=first.project,cid=first.receipts[0].clipId;
 const r=applyCommandBatch(q,{baseRevision:q.revision,baseFingerprint:projectFingerprint(q),commands:[{id:'split1',action:'split',clipId:cid,at:2},{id:'trim1',action:'trim',clipId:cid,duration:.5},{id:'replace1',action:'replace',clipId:cid,assetId:'other',sourceIn:2}]},opts);
 const left=r.project.clips.find(c=>c.id===cid),right=r.project.clips.find(c=>c.id===r.receipts[0].clipId);
 assert.equal(left.duration,.5);assert.equal(left.in,2);assert.equal(right.start,2);assert.equal(right.in,2);assert.equal(right.duration,1);
});
test('canonical story accepts only approved exact clip mapping and retains unsupported operations',async()=>{
 const h='a'.repeat(64),m='b'.repeat(64),registry={sourceSha256:h,timelineFingerprint:'edit-001',projectFingerprint:projectFingerprint(p),approvedRuleVersion:'rules-v1',unresolvedRuleConflicts:[],masterHashes:{tapiz:m},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:m}]},rendererCapabilities:{native:['zoom-native','subject-occlusion']}};
 const story={schema:'sues-master-story/v1',sourceSha256:h,timeline:{fingerprint:'edit-001',timeSpace:'edit-timeline',fps:30,duration:5},visual:{mode:'brand-sues'},narrative:{centralMessage:'Technical test',intendedExperience:'Technical test',scenes:[{id:'scene1',start:0,end:5,purpose:'Technical test'}]},operations:[{id:'zoom1',sceneId:'scene1',start:0,end:5,track:'camera',renderer:'native',effect:'zoom-native',reason:'Technical test',parameters:{scale:1.1},dependsOn:[],requiredQA:['rendered-frame','time-sync']}]};
 const ctx={registry,project:p,bindings:{zoom1:{clipId:'base'}},authorize:async()=>true};
 const prepared=await prepareStoryBatch(story,ctx);assert.equal(prepared.status,'PREPARED_NOT_EXECUTED',JSON.stringify(prepared.issues));assert.equal(prepared.request.commands[0].clipId,'base');
 assert.equal((await prepareStoryBatch(story,{...ctx,authorize:async()=>false})).status,'BLOCKED');
 const unknown=structuredClone(story);unknown.operations[0].effect='subject-occlusion';const denied=await prepareStoryBatch(unknown,ctx);assert.equal(denied.status,'BLOCKED');assert.equal(denied.story.operations[0].effect,'subject-occlusion');
});

test('project-local audio discovery recognizes keyboard synonym without asserting rights', async()=>{
 const {projectAudioCatalog,searchResources}=await import('../../src/engine-next/fablecut-resource-search.js');
 const fs=await import('node:fs');const os=await import('node:os');const path=await import('node:path');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sues-project-audio-'));
 try{
  fs.mkdirSync(root+'/media');fs.writeFileSync(root+'/media/TECLAS_REALES.wav','fixture');
  const c=projectAudioCatalog({media:[{kind:'audio',src:'/media/TECLAS_REALES.wav',duration:1},{kind:'audio',src:'/media/../unsafe.wav'}]},root);
  const found=searchResources(c,'teclado',{availableOnly:true});
  assert.equal(found.length,1);assert.equal(found[0].license,'UNVERIFIED_PROJECT_LOCAL');assert.equal(found[0].relativePath,'media/TECLAS_REALES.wav');
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});

run('native progressive caption uses exact word clock and rejects mismatched/overlapping times',()=>{
 const c={id:'caption1',action:'add_caption',track:'V2',start:1,duration:2,text:'Ahora respira',x:0,y:400,fontSize:70,color:'#ffffff',font:'Montserrat',wordIds:['w1','w2'],wordTimes:[[0,.5],[.5,1]]};
 const result=applyCommandBatch(p,req([c]),opts),cl=result.project.clips.at(-1);
 assert.equal(cl.props.textAnim,'word-pop');assert.deepEqual(cl.props.wordTimes,c.wordTimes);assert.equal(cl.props.caption,true);
 assert.throws(()=>applyCommandBatch(p,req([{...c,wordTimes:[[0,.6],[.5,1]]}]),opts),/CAPTION_WORD_RANGE/);
 const h='a'.repeat(64),m='b'.repeat(64),registry={sourceSha256:h,timelineFingerprint:'edit-001',projectFingerprint:projectFingerprint(p),approvedRuleVersion:'rules-v1',unresolvedRuleConflicts:[],masterHashes:{tapiz:m},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:m}]},rendererCapabilities:{native:['fablecut-command-exact-v1']},nativeTrackRoles:{V2:'captions'},verifiedFonts:{'Montserrat:700':{sha256:m}},wordAnchors:{w1:{time:1,end:1.5,text:'Ahora'},w2:{time:1.5,end:2,text:'respira'}}};
 const {id,...command}=c;
 const story={schema:'sues-master-story/v1',sourceSha256:h,timeline:{fingerprint:'edit-001',timeSpace:'edit-timeline',fps:30,duration:5},visual:{mode:'brand-sues'},narrative:{centralMessage:'Technical caption test',intendedExperience:'Technical test',scenes:[{id:'s1',start:0,end:5,purpose:'Technical test'}]},resources:[],operations:[{id,sceneId:'s1',start:1,end:3,track:'captions',renderer:'native',effect:'fablecut-command-exact-v1',reason:'Verified word timing',parameters:{command},speechAnchor:{wordId:'w1',offsetFrames:0},dependsOn:[],requiredQA:['rendered-frame','time-sync']}]};
 return (async()=>{const ctx={registry,project:p,authorize:async()=>true};const r=await prepareStoryBatch(story,ctx);assert.equal(r.status,'PREPARED_NOT_EXECUTED',JSON.stringify(r.issues));registry.wordAnchors.w2.text='otra';assert.equal((await prepareStoryBatch(story,ctx)).status,'BLOCKED')})();
});

run('native dissolve preserves overlapping source times and applies fade to incoming upper track',()=>{
 const q=structuredClone(p);q.clips.push({id:'incoming',mediaId:'v',kind:'video',track:'V2',start:4,in:0,duration:1,props:{opacity:1}});
 const r=applyCommandBatch(q,{baseRevision:q.revision,baseFingerprint:projectFingerprint(q),commands:[{id:'dissolve1',action:'dissolve',clipId:'incoming',leftClipId:'base',duration:1}]},opts);
 assert.equal(r.project.clips[1].transitionIn.duration,1);assert.equal(r.project.clips[0].duration,5);
 assert.throws(()=>applyCommandBatch(q,{baseRevision:q.revision,baseFingerprint:projectFingerprint(q),commands:[{id:'bad',action:'dissolve',clipId:'incoming',leftClipId:'base',duration:.5}]},opts),/DISSOLVE/);
});
run('native visual effect properties retain exact values and reject existing animation',()=>{
 const r=applyCommandBatch(p,req([{id:'fx',action:'set_visual_effect',clipId:'base',brightness:115,blur:4,shake:7,rotation:3}]),opts);
 assert.equal(r.project.clips[0].props.brightness,115);assert.equal(r.project.clips[0].props.shake,7);
 assert.throws(()=>applyCommandBatch(p,req([{id:'bad',action:'set_visual_effect',clipId:'base',blur:120}]),opts),/INVALID_blur/);
});
