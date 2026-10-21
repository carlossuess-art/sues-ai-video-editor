import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {rmSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject,fileSha256} from '../src/local-pipeline.js';
import {MediaLibrary} from '../src/media-library.js';
import {validateSfxEvents,prepareCustomSfx} from '../src/custom-sfx.js';
import {renderAudioFilters} from '../src/sound-effects.js';
import {createProjectBackup,verifyProjectBackup} from '../src/project-backup.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
const hash='a'.repeat(64),sound={assetId:hash,sha256:hash,kind:'sfx',rights:'licensed',title:'Whoosh',duration:.4,localFile:'/sound.wav'};
test('SFX are explicit independent cues with strict bounds, duplication and overlap guards',()=>{
 for(const events of [[{assetId:hash,start:1,gain:.8}],[{assetId:hash,start:-1,gain:.3}],[{assetId:hash,start:1,gain:.3,url:'https://example.com'}],[null]])assert.throws(()=>validateSfxEvents(events));
 const cue={assetId:hash,start:1,gain:.3};assert.throws(()=>validateSfxEvents([cue,cue]),/duplicado/);
 assert.throws(()=>prepareCustomSfx([{...cue,start:23.9}],24,()=>sound),/caber/);
 assert.throws(()=>prepareCustomSfx([0,.01,.02,.03].map(start=>({...cue,start})),24,()=>sound),/simultáneos/);
 assert.throws(()=>prepareCustomSfx([cue],24,()=>({...sound,kind:'audio'})),/verificado/);
 const f=fixture();try{const p=loadProject(f.profiles.test);p.resolveAsset=()=>sound;const prepared=prepareProject(p,{sfxEvents:[cue],motions:false});assert.equal(prepared.plan.soundEffects.events.length,0);assert.equal(prepared.plan.customSfx.events.length,1);assert.notEqual(prepared.fingerprint,prepareProject(p).fingerprint);
 const filters=renderAudioFilters(prepared.plan,1).join(';');assert.match(filters,/adelay=48000S/);assert.match(filters,/volume=0.3/);assert.match(filters,/level=0/);assert.throws(()=>renderAudioFilters(prepared.plan,1,{hasAudio:false}),/original audio/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('short SFX library resources deduplicate and portable backup restores without the library',async()=>{
 const f=fixture();try{const file=join(f.dir,'short.wav');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=1200:duration=0.12','-ar','48000','-ac','2',file]);const bytes=readFileSync(file),lib=new MediaLibrary(join(f.dir,'assets')),incoming=()=>Object.assign(Readable.from([bytes]),{headers:{'content-length':String(bytes.length)}}),meta={kind:'sfx',rights:'licensed',title:'Click'};
 const item=await lib.receive(incoming(),meta);assert.equal((await lib.receive(incoming(),meta)).id,item.id);assert.equal(lib.list().length,1);assert.equal(lib.resolve(item.id,'sfx').kind,'sfx');assert.throws(()=>lib.resolve(item.id,'audio'),/not found/);await assert.rejects(lib.receive(incoming(),{...meta,kind:'audio'}),/audio de entre/);
 const p=loadProject(f.profiles.test);p.resolveAsset=lib.resolve.bind(lib);const prepared=prepareProject(p,{sfxEvents:[{assetId:item.id,start:2.125,gain:.3},{assetId:item.id,start:4,gain:.2}]}),backup=join(f.dir,'backup');await createProjectBackup(p,prepared,backup);assert.equal(verifyProjectBackup(backup).valid,true);
 rmSync(join(f.dir,'assets'),{recursive:true});const restored=loadProject(join(backup,'project.json')),again=prepareProject(restored,JSON.parse(readFileSync(join(backup,'settings.json'),'utf8')));assert.deepEqual(again.plan.customSfx.events,prepared.plan.customSfx.events);assert.equal(again.plan.customSfx.assets.length,1);assert.equal(fileSha256(again.plan.customSfx.assets[0].localFile),item.id);writeFileSync(again.plan.customSfx.assets[0].localFile,'changed');assert.throws(()=>prepareProject(restored,prepared.settings),/integrity/);assert.throws(()=>verifyProjectBackup(backup),/hash/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('external plans accept timed SFX and reject missing, wrong-kind or out-of-range cues atomically',()=>{
 const f=fixture();try{const p=loadProject(f.profiles.test);p.resolveAsset=()=>sound;const settings=prepareProject(p).settings,assets=[{id:hash,kind:'sfx',title:'Whoosh',duration:.4}],catalog=externalCatalog(p,settings,assets),pack=operations=>JSON.stringify({schema:catalog.schema,sourceSha256:catalog.sourceSha256,operations}),op={type:'sfx',resourceId:hash,start:2.125,gain:.3},review=operations=>reviewExternalPlan(pack(operations),{project:p,settings,assets});
 assert.ok(catalog.actions.sfx);assert.equal(catalog.unsupported.includes('SFX independientes por segundo'),false);const good=review([op]);assert.equal(good.canApply,true,JSON.stringify(good));assert.equal(good.changes.sfxEnabled,false);assert.equal(good.changes.sfxEvents[0].start,2.125);assert.equal(review([{...op,start:24}]).canApply,false);assert.equal(review([{...op,gain:1}]).canApply,false);const missing=review([op,{...op,resourceId:'no'}]);assert.equal(missing.canApply,false);assert.equal(missing.changes,null);assert.equal(missing.rows[1].status,'missing-resource');assert.deepEqual(settings.sfxEvents,[]);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('real FFmpeg places short cues at exact samples, ducks under voice, preserves other samples and mixes after music/procedural effects',()=>{
 const f=fixture();try{const path=join(f.dir,'click.wav');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=1600:duration=0.12:sample_rate=48000','-ac','2',path]);const id=fileSha256(path),asset={...sound,assetId:id,sha256:id,localFile:path,duration:.12},custom=prepareCustomSfx([{assetId:id,start:.507,gain:.3},{assetId:id,start:1.7,gain:.2}],3,()=>asset);
 const render=(voice,gain=1,music=false,procedural=false)=>{const sfx=structuredClone(custom);for(const e of sfx.events)e.gain*=gain;const plan={duration:3,customSfx:sfx,soundEffects:{gain:.1,events:procedural?[{preset:'neon',start:1.2,duration:.15}]:[]},audioMix:music?{assetId:'music',rights:'owned',localFile:path,gain:.05,sourceIn:0,sourceOut:3,duration:3,fadeIn:.1,fadeOut:.1,duckEnabled:false,limiter:.95}:null};
 const inputs=['-f','lavfi','-i',voice];if(music)inputs.push('-f','lavfi','-i','sine=frequency=250:duration=3:sample_rate=48000');inputs.push('-i',path);const graph='[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[audio];'+renderAudioFilters(plan,1).join(';');const b=execFileSync('ffmpeg',['-v','error',...inputs,'-filter_complex_threads','1','-filter_complex',graph,'-map','[mixed-audio]','-f','f32le','-acodec','pcm_f32le','-'],{maxBuffer:4e6});return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);};
 const quiet='anullsrc=r=48000:cl=stereo:d=3',voice='sine=frequency=180:sample_rate=48000:duration=3,volume=3',wet=render(voice),dry=render(voice,0),silent=render(quiet);assert.equal(wet.length,3*48000*2);let outside=0,voicedEnergy=0,silentEnergy=0;for(let i=0;i<wet.length;i++){const t=i/96000,delta=wet[i]-dry[i];assert.ok(Number.isFinite(wet[i])&&Math.abs(wet[i])<=.951);if(!custom.events.some(e=>t>=e.start-.001&&t<e.end+.001))outside=Math.max(outside,Math.abs(delta));voicedEnergy+=delta**2;silentEnergy+=silent[i]**2;}assert.ok(outside<1e-5,String(outside));assert.ok(voicedEnergy>0&&voicedEnergy<silentEnergy*.8);const onset=silent.findIndex(x=>Math.abs(x)>1e-7)/96000;assert.ok(onset>=.507&&onset<.508,String(onset));
 const combined=render(voice,1,true,true);assert.equal(combined.length,wet.length);assert.ok(combined.every(x=>Number.isFinite(x)&&Math.abs(x)<=.951));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('HTTP SFX upload, audition and catalog require a session; exact ranges do not expose local paths',async()=>{
 const {createEditorServer}=await import('../src/editor-server.js');const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});app.jobs.autoStart=false;
 try{const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),cookie=session.headers.get('set-cookie').split(';')[0],headers={Cookie:cookie,'X-Sues-Request':'editor','Content-Type':'audio/wav'},file=join(f.dir,'click.wav');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=1000:duration=0.06','-ar','48000','-ac','2',file]);const bytes=readFileSync(file),target=url+'/api/assets?kind=sfx&rights=owned&name=Click';
 assert.equal((await fetch(target,{method:'POST',headers:{'Content-Type':'audio/wav'},body:bytes})).status,401);const r=await fetch(target,{method:'POST',headers,body:bytes});assert.equal(r.status,201);const asset=await r.json();assert.equal(asset.kind,'sfx');assert.ok(!JSON.stringify(asset).includes(f.dir));const media=url+'/api/assets/'+asset.id+'/media';assert.equal((await fetch(media)).status,401);const range=await fetch(media,{headers:{Cookie:cookie,Range:'bytes=0-1023'}});assert.equal(range.status,206);assert.equal(range.headers.get('content-type'),'audio/wav');assert.deepEqual(Buffer.from(await range.arrayBuffer()),bytes.subarray(0,1024));const job=app.jobs.create('test'),catalog=await (await fetch(url+'/api/jobs/'+job.id+'/external-catalog',{headers:{Cookie:cookie}})).json();assert.equal(catalog.assets[0].kind,'sfx');assert.equal(catalog.assets[0].duration,.06);assert.ok(!JSON.stringify(catalog).includes(f.dir));
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
