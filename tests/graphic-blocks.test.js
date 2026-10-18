import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
test('editorial graphic cards replace auto quotes, preserve speech and use verified current caption text',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project),id=base.plan.captions[0].id;
 for(const type of ['grid','compare','secret']){const p=prepareProject(project,{captionOverrides:{[id]:'Mira hacia dentro.'},graphicCards:[{captionId:id,type,...(type==='compare'?{left:'Ruido',right:'Escucha'}:{})}]});assert.equal(p.plan.graphics.length,1);assert.equal(p.plan.semantic.motions.length,0);assert.equal(p.plan.graphics[0].text,'Mira hacia dentro.');assert.equal(p.plan.graphics[0].textOrigin,'user-edited-caption');assert.equal(p.director.audit.omittedWords,0);const ass=buildPreviewASS(p.plan);assert.ok(ass.includes(type==='secret'?'TOP SECRET':type==='compare'?'Ruido':'Mira hacia'));assert.ok(ass.includes('\\blur')); assert.ok(!ass.includes('UNA IDEA PARA RECORDAR')&&!ass.includes('DOS PERSPECTIVAS')&&!ass.includes('IDEA CLAVE'));}
 assert.throws(()=>prepareProject(project,{graphicCards:[{captionId:'seg-999',type:'grid'}]}),/unknown caption/);
 assert.throws(()=>prepareProject(project,{graphicCards:[{captionId:id,type:'compare',left:'x',right:''}]}),/two short labels/);
 assert.throws(()=>prepareProject(project,{graphicCards:[{captionId:id,type:'grid'},{captionId:base.plan.captions[1].id,type:'grid'}]}),/overlap/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('global transitions include the composited captions and leave the voice/audio graph untouched',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),id=prepareProject(project).plan.captions[0].id;
 for(const type of ['blur','warm','radial']){const p=prepareProject(project,{transitions:[{captionId:id,type}]}),graph=buildPreviewFilter(p.plan);assert.equal(p.plan.globalTransitions[0].scope,'entire-composition-including-captions');assert.ok(graph.indexOf('ass=filename=')<graph.indexOf('global-effect'));assert.ok(graph.includes('[video]'));assert.ok(!graph.includes('atrim=start=2'));assert.equal(p.plan.globalTransitions[0].duration,.4);}
 const disabled=prepareProject(project,{motions:false,graphicCards:[{captionId:id,type:'grid'}],transitions:[{captionId:id,type:'warm'}]});assert.deepEqual(disabled.plan.graphics,[]);assert.deepEqual(disabled.plan.globalTransitions,[]);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('voice-bound card ranges replace captions only when every spoken token is represented',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project),[first,second]=base.plan.captions;
  const card={captionId:first.id,endCaptionId:second.id,type:'grid',heading:first.text,bodyLines:[second.text],icons:['eye','heart']};
  const p=prepareProject(project,{graphicCards:[card],transitions:[{captionId:first.id,type:'radialBurst',phase:'exit'}]}),g=p.plan.graphics[0];
  assert.deepEqual(g.replacedCaptionIds,[first.id,second.id]);assert.equal(g.voiceCues.heading,first.wordCues[0].start);assert.equal(g.voiceCues.body[0],second.wordCues[0].start);
  assert.ok(g.end>=second.end&&g.end<=base.plan.captions[2].start);assert.equal(p.plan.globalTransitions[0].start,g.end-.2);
  const modified=prepareProject(project,{graphicCards:[{...card,heading:'Una idea diferente'}]});assert.deepEqual(modified.plan.graphics[0].replacedCaptionIds,[]);assert.equal(modified.plan.graphics[0].voiceCues.heading,null);
  assert.throws(()=>prepareProject(project,{graphicCards:[{...card,captionId:second.id,endCaptionId:first.id}]}),/invalid card range/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
