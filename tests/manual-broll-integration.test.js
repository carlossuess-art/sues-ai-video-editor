import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {buildExplicitBrollPlan} from '../src/cinematic-style.js';
import {compileTemplatePolicy} from '../src/template.js';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {buildPreviewFilter} from '../src/local-preview.js';

const read=path=>JSON.parse(readFileSync(new URL('../examples/'+path,import.meta.url)));
const policy=()=>compileTemplatePolicy(read('templates/sues-calma.template.json'),read('brand-kit.sues.json'));
const SHA='d'.repeat(64);
const event=(options={})=>({assetId:SHA,start:5,end:8,mediaDuration:12,localFile:'/private/verified/footage.mp4',reason:'Metáfora de una presión temporal',...options});

test('manual B-roll respects cinematic shot length, opening, closing, gaps, coverage and uniqueness',()=>{
 const valid=buildExplicitBrollPlan({policy:policy(),duration:24,events:[event()]});
 assert.equal(valid.decisions.length,1);assert.equal(valid.decisions[0].type,'broll');
 assert.equal(valid.decisions[0].originalVoice,true);assert.equal(valid.decisions[0].sourceAudio,false);
 assert.equal(valid.decisions[0].captions,'preserve');
 for(const invalid of [
  [event({start:1,end:4})],
  [event({start:20,end:23})],
  [event({start:5,end:6})],
  [event({start:5,end:12})],
  [event({mediaDuration:2})],
  [event({reason:'No'})],
  [event(),event({start:9,end:12,assetId:'e'.repeat(64)})],
  [event(),event({start:12,end:15})]
 ])assert.throws(()=>buildExplicitBrollPlan({policy:policy(),duration:24,events:invalid}));
});

test('Gemini plan binds a real private video resource and composes video without changing speech/caption timing',()=>{
 const f=fixture();
 try{
  const p=loadProject(f.profiles.test),media=readFileSync(join(f.dir,'source.mp4'));
  const id=createHash('sha256').update(media).digest('hex');
  p.resolveAsset=(selected,kind)=>{assert.equal(selected,id);assert.equal(kind,'video');return {assetId:id,sha256:id,kind:'video',rights:'licensed',localFile:join(f.dir,'source.mp4'),duration:12};};
  const source=p.boundHashes.source;
  const available=[{id,kind:'video',title:'Reloj analógico · presión temporal',duration:12}];
  const instructions=externalCatalog(p,{zoomIntensity:0},available);
  assert.equal(instructions.actions.broll.type,'broll');
  assert.ok(instructions.assets.some(a=>a.id===id&&a.kind==='video'));
  const text=JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:source,
   operations:[{type:'broll',resourceId:id,start:5,end:8,reason:'Representar presión y tiempo de espera'}]});
  const review=reviewExternalPlan(text,{project:p,settings:{zoomIntensity:0},assets:available});
  assert.equal(review.canApply,true,JSON.stringify(review.rows)+JSON.stringify(review.notes));
  assert.equal(review.changes.videoEvents[0].assetId,id);
  const prepared=prepareProject(p,review.changes);
  const clip=prepared.plan.selectedMedia[0];
  assert.equal(clip.assetId,id);assert.equal(clip.start,5);assert.equal(clip.end,8);
  assert.equal(prepared.plan.originalVoice,true);
  assert.equal(prepared.plan.captions.length,prepareProject(p,{zoomIntensity:0}).plan.captions.length);
  const graph=buildPreviewFilter(prepared.plan);
  assert.match(graph,/\[broll0\]/);
  assert.match(graph,/\[0:a\]/);
  assert.equal(prepared.resourceBindings.videoAssets[0].assetId,id);
  assert.equal(reviewExternalPlan(text,{project:p,settings:{zoomIntensity:0},assets:[]}).rows[0].status,'missing-resource');
  assert.equal(reviewExternalPlan(text,{project:p,settings:{zoomIntensity:0},assets:available.map(a=>({...a,kind:'overlay'}))}).rows[0].status,'missing-resource');
  const out=reviewExternalPlan(JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:source,
    operations:[{type:'broll',resourceId:id,start:5,end:14,reason:'Plano demasiado largo'}]}),
    {project:p,settings:{zoomIntensity:0},assets:available});
  assert.equal(out.canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('portable project backup preserves selected B-roll bytes, rights and timings without external account access',async()=>{
 const {createProjectBackup,verifyProjectBackup}=await import('../src/project-backup.js');
 const {mkdtempSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const f=fixture(),backupRoot=mkdtempSync(join(tmpdir(),'sues-broll-portable-'));
 try{
  const p=loadProject(f.profiles.test),id=createHash('sha256').update(readFileSync(join(f.dir,'source.mp4'))).digest('hex');
  p.resolveAsset=(candidate,kind)=>{assert.equal(candidate,id);assert.equal(kind,'video');return {assetId:id,sha256:id,kind:'video',rights:'licensed',localFile:join(f.dir,'source.mp4'),duration:12};};
  const prepared=prepareProject(p,{zoomIntensity:0,motions:false,videoEvents:[{assetId:id,start:5,end:8,reason:'Metáfora de cambio de situación'}]});
  const out=join(backupRoot,'project');
  await createProjectBackup(p,prepared,out);
  const checked=verifyProjectBackup(out);assert.equal(checked.valid,true);
  const cfg=JSON.parse(readFileSync(join(out,'project.json'),'utf8'));
  assert.equal(cfg.videoAssets.length,1);
  assert.equal(cfg.videoAssets[0].assetId,id);
  const settings=JSON.parse(readFileSync(join(out,'settings.json'),'utf8'));
  assert.equal(settings.videoEvents.length,1);
  const restored=loadProject(join(out,'project.json'));
  const rebuilt=prepareProject(restored,settings);
  assert.equal(rebuilt.plan.selectedMedia[0].assetId,id);
  assert.equal(rebuilt.plan.originalVoice,true);
 }finally{rmSync(backupRoot,{recursive:true,force:true});rmSync(f.dir,{recursive:true,force:true});}
});

test('authenticated Gemini HTTP review uses imported B-roll and creates a new version, leaving its parent unchanged',async()=>{
 const {createEditorServer}=await import('../src/editor-server.js');
 const {Readable}=await import('node:stream');
 const {randomUUID}=await import('node:crypto');
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,
  assetProbe:async()=>({streams:[{codec_type:'video',codec_name:'mpeg4',width:720,height:1280,avg_frame_rate:'30/1'}],
   format:{format_name:'mov,mp4,m4a,3gp,3g2,mj2',duration:'4.5',tags:{major_brand:'isom'}}})});
 app.jobs.autoStart=false;
 try{
  const url=(await app.listen()).split('/#')[0];
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const bytes=Buffer.from('video fixture');
  const upload=await fetch(url+'/api/assets?kind=video&rights=licensed&name=Reloj',{method:'POST',
   headers:{...headers,'Content-Type':'video/mp4'},body:bytes});
  assert.equal(upload.status,201,await upload.clone().text());
  const resource=await upload.json();
  const parent=app.jobs.create('test',{zoomIntensity:0});
  const before=JSON.stringify(app.jobs.get(parent.id));
  const catalog=await (await fetch(url+'/api/jobs/'+parent.id+'/external-catalog',{headers})).json();
  assert.equal(catalog.assets.find(x=>x.id===resource.id).kind,'video');
  const text=JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:catalog.sourceSha256,
    operations:[{type:'broll',resourceId:resource.id,start:5,end:8,reason:'Representar la urgencia de la espera'}]});
  assert.equal((await fetch(url+'/api/jobs/'+parent.id+'/external-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})})).status,401);
  const proposal=await (await fetch(url+'/api/jobs/'+parent.id+'/external-review',{method:'POST',headers,body:JSON.stringify({text})})).json();
  assert.equal(proposal.canApply,true,JSON.stringify(proposal));
  assert.equal(app.jobs.list().length,1);
  const create=await fetch(url+'/api/jobs/'+parent.id+'/external-execute',{method:'POST',headers,
   body:JSON.stringify({text,reviewId:proposal.reviewId,requestId:randomUUID()})});
  assert.equal(create.status,202,await create.clone().text());
  const child=await create.json();
  assert.equal(child.parentId,parent.id);
  assert.equal(child.settings.videoEvents.length,1);
  assert.equal(app.jobs.plan(child.id).manifest.selectedMedia[0].assetId,resource.id);
  assert.equal(app.jobs.plan(child.id).manifest.originalVoice,true);
  assert.equal(JSON.stringify(app.jobs.get(parent.id)),before);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
