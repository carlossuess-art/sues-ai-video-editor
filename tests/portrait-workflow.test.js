import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {fixture} from './helpers/editor-fixture.js';
import {VideoIntake} from '../src/video-intake.js';

test('portrait workflow keeps one selected template, two truthful modes and distinct video states',()=>{
 const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../web/studio.css',import.meta.url),'utf8');
 const js=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(html,/id="new-project-style"/);
 assert.match(html,/DOPAMIN · edición dinámica/);
 assert.match(html,/id="choose-external"[^>]*>Dar instrucciones/);
 assert.match(html,/id="choose-automatic"[^>]*disabled[^>]*>Edición automática/);
 assert.match(html,/id="render-state-overlay"/);
 assert.match(html,/id="source-video"[^>]*preload="none"/);
 assert.match(html,/id="video"[^>]*preload="none"/);
 assert.match(css,/aspect-ratio:9\/16/);
 assert.match(css,/grid-template-columns:minmax\(0,46fr\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(js,/automaticInstant=false;chooseEditRoute\('automatic'\)/);
 assert.match(js,/\$\('choose-automatic'\)\.disabled=!available\|\|busy/);assert.match(js,/automaticInstant=true;chooseEditRoute\('automatic'\)/);
 assert.match(js,/VÍDEO ORIGINAL/);
 assert.match(js,/VÍDEO EDITADO/);
 assert.match(js,/EDITANDO VÍDEO/);
 assert.match(js,/\$\('new-style-label'\)\.hidden=false/);
 assert.doesNotMatch(js,/editingRoute=route;\$\('edit-route-choices'\)\.hidden=true;\s*\$\('new-project-style'\)\.value=current\?\.settings/);
});

test('uploaded video hashes only once for repeated reads and rechecks when bytes change',async()=>{
 const f=fixture();
 const data=Buffer.from('verified-video-bytes');
 const configPath=f.profiles.test;
 const cfg=JSON.parse(readFileSync(configPath,'utf8'));cfg.source.sha256=createHash('sha256').update(data).digest('hex');writeFileSync(configPath,JSON.stringify(cfg));
 const directory=join(f.dir,'uploads'),intake=new VideoIntake(directory,f.profiles,{probe:async()=>({streams:[{codec_type:'video',width:1080,height:1920},{codec_type:'audio'}],format:{duration:24}})});
 try{
  const input=Readable.from([data]);input.headers={'content-type':'video/mp4','content-length':String(data.length)};
  const result=await intake.receive(input);
  assert.equal(intake.verifiedVideoSignatures.size,0);
  assert.equal(intake.media(result.id),join(directory,result.id+'.video'));
  const first=intake.verifiedVideoSignatures.get(result.id);
  assert.ok(first);
  assert.equal(intake.media(result.id),join(directory,result.id+'.video'));
  assert.equal(intake.verifiedVideoSignatures.get(result.id),first);
  writeFileSync(join(directory,result.id+'.video'),Buffer.from('modified-video-bytes'));
  assert.throws(()=>intake.media(result.id),/Stored video integrity changed/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
