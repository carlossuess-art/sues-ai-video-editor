import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {secretRevealTime} from '../src/graphic-timing.js';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
test('spoken neon titles and their sound share one cue rather than a later decorative delay',()=>{
 assert.equal(secretRevealTime({start:10,end:13,voiceCues:{title:10}}),10.04);
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project),id=base.plan.captions[0].id,p=prepareProject(project,{sfxEnabled:true,graphicCards:[{captionId:id,type:'secret'}]});const g=p.plan.graphics[0],neon=p.plan.soundEffects.events.find(e=>e.preset==='neon');assert.equal(neon.start,Number(secretRevealTime(g).toFixed(6)));assert.equal(g.voiceCues.title,base.plan.captions[0].wordCues[0].start);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('path drawing and fades emit no inverted or out-of-scene ASS intervals',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project),[a,b]=base.plan.captions,p=prepareProject(project,{graphicCards:[{captionId:a.id,endCaptionId:b.id,type:'compare',left:a.text,right:b.text,icons:['eye','heart']}]});const ass=buildPreviewASS(p.plan)+'\n'+buildPreviewASS({...p.plan,policy:{...p.plan.policy,outro:{...p.plan.policy.outro,duration:0}}}),time=s=>{const[h,m,sec]=s.split(':').map(Number);return h*3600+m*60+sec;};
 for(const line of ass.split('\n').filter(l=>l.startsWith('Dialogue:'))){const fields=line.split(',');assert.ok(time(fields[2])>=time(fields[1]),line);assert.ok(time(fields[2])<=p.plan.duration+.01);}
 assert.ok(!ass.includes('\\clip(200,250,220,680)'),'arrow must follow its path');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('finishing fades protect the last spoken caption and require a closing hold',async()=>{
 const {finishFadeFor}=await import('../src/graphic-timing.js');
 assert.equal(finishFadeFor({duration:10,policy:{outro:{duration:1}},captions:[{end:9.8}]}),null);
 const f=finishFadeFor({duration:10,policy:{outro:{duration:1}},captions:[{end:9}]});assert.ok(f.start>f.speechEnd);assert.ok(f.start+f.duration<=10-1/30);
});
