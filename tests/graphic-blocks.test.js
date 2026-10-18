import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
test('editorial graphic cards replace auto quotes, preserve speech and use verified current caption text',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project),id=base.plan.captions[0].id;
 for(const type of ['grid','compare','secret']){const p=prepareProject(project,{captionOverrides:{[id]:'Mira hacia dentro.'},graphicCards:[{captionId:id,type,...(type==='compare'?{left:'Ruido',right:'Escucha'}:{})}]});assert.equal(p.plan.graphics.length,1);assert.equal(p.plan.semantic.motions.length,0);assert.equal(p.plan.graphics[0].text,'Mira hacia dentro.');assert.equal(p.plan.graphics[0].textOrigin,'user-edited-caption');assert.equal(p.director.audit.omittedWords,0);const ass=buildPreviewASS(p.plan);assert.ok(ass.includes(type==='secret'?'MIRA HACIA DENTRO':type==='compare'?'Ruido':'dentro.'));assert.ok(!ass.includes('UNA IDEA PARA RECORDAR')&&!ass.includes('DOS PERSPECTIVAS')&&!ass.includes('IDEA CLAVE'));}
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
