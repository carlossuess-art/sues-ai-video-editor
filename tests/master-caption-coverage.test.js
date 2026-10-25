import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {masterGraphicCoversCaption} from '../src/dopamin-master.js';
test('a fully timed literal hero renders the spoken word once',()=>{
 const f=fixture();try{
 const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0,motions:false}).plan;
 p.captions=[{id:'seg-001',start:3,end:4,text:'runas,',lines:['runas,'],wordIndexes:[0],source:'manual',keyword:null}];
 p.masterGraphics=[{start:3,end:5,label:'RUNAS',color:'#FF7A18',kind:'runes'}];
 assert.equal(masterGraphicCoversCaption(p,p.captions[0]),true);
 const ass=buildPreviewASS(p);assert.ok(ass.includes('}RUNAS'));assert.ok(!ass.includes('}runas,'));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('partial ranges, extra spoken words and paraphrases retain their captions',()=>{
 const plan={masterGraphics:[{start:3,end:5,label:'EGO'}]};
 for(const c of [{start:2.9,end:4,text:'ego,'},{start:4,end:5.1,text:'ego'},{start:3,end:4,text:'al ego'},{start:3,end:4,text:'crecimiento'}])assert.equal(masterGraphicCoversCaption(plan,c),false);
 assert.equal(masterGraphicCoversCaption(plan,{start:3,end:4,text:'¡Ego!'}),true);
 assert.equal(masterGraphicCoversCaption({},{start:3,end:4,text:'ego'}),false);
});