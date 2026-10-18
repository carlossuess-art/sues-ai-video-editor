import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fontFiles,textAdvance,typefaceTags} from '../src/font-kits.js';
import {fontCatalog} from '../src/font-catalog.js';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {hierarchyLayout} from '../src/caption-hierarchy.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {createEditorServer} from '../src/editor-server.js';
test('bundled Montserrat faces are original TTF files with the declared weights and source hashes',()=>{
 const dir='assets/fonts/montserrat',sources=JSON.parse(readFileSync(join(dir,'sources.json')));
 for(const name of fontFiles('Montserrat').filter(f=>f.endsWith('.ttf'))){
  const bytes=readFileSync(join(dir,name));assert.equal(bytes.readUInt32BE(0),0x00010000);assert.equal(createHash('sha256').update(bytes).digest('hex'),sources.files[name].sha256);
  let table;for(let i=0;i<bytes.readUInt16BE(4);i++){const at=12+i*16;if(bytes.toString('ascii',at,at+4)==='OS/2')table=bytes.readUInt32BE(at+8);}assert.ok(table);
  assert.equal(bytes.readUInt16BE(table+4),name.includes('ExtraBold')?800:name.includes('Bold')?700:400);
 }
 assert.ok(readFileSync(join(dir,'OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'));assert.ok(readFileSync(join(dir,'Anton-OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'));
});
test('new role metrics align separate glyphs and hierarchy uses the latest 12/14 size recipe without rewriting source text',()=>{
 assert.ok(Math.abs(textAdvance('efectos especiales',{font:'Montserrat',tracking:-2},160)-949.2522407170295)<1e-6);
 const f=fixture();try{const p=prepareProject(loadProject(f.profiles.test),{motions:false}),c={text:'con tu fortuna',lines:['con tu fortuna'],source:'manual',wordIndexes:[0,1,2],start:2,end:4,keyword:{displayWordIndex:2,level:'exceptional',style:'gold'}},rows=hierarchyLayout(c,p.plan.policy.captions,p.plan.layout.caption);
  assert.equal(rows.find(r=>r.role==='keyword').text,'FORTUNA');assert.ok(Math.abs(rows[1].size/rows[0].size-14/12)<1e-9);assert.equal(c.text,'con tu fortuna');
  const ass=buildPreviewASS({...p.plan,captions:[c]});assert.ok(ass.includes('\\fnMontserrat ExtraBold\\b800'));assert.ok(ass.includes('\\1a&H59&\\blur15'));assert.ok(ass.includes('\\blur12\\bord3'));
  assert.equal(typefaceTags(p.plan.policy.captions,'normal',true),'\\fnMontserrat\\b700\\i1');assert.equal(typefaceTags(p.plan.policy.captions,'stamp'),'\\fnAnton\\b0\\i0');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('font catalog downloads are authenticated, fixed to bundled assets and include the runic font and licenses',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});try{
  const url=(await app.listen()).split('/#')[0];assert.equal((await fetch(url+'/api/fonts')).status,401);const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0]};
  const catalog=await(await fetch(url+'/api/fonts',{headers})).json(),rune=catalog.find(f=>f.id==='futhark');assert.equal(rune.family,'Noto Sans Runic');assert.equal(rune.transliteration,false);assert.ok(!JSON.stringify(catalog).includes('/workspace/'));
  const font=await fetch(url+rune.download,{headers});assert.equal(font.status,200);assert.equal(font.headers.get('content-type'),'font/ttf');assert.deepEqual(Buffer.from(await font.arrayBuffer()),readFileSync('assets/fonts/runic/NotoSansRunic-Regular.ttf'));
  assert.ok((await(await fetch(url+rune.license,{headers})).text()).includes('SIL OPEN FONT LICENSE'));assert.equal((await fetch(url+'/api/fonts/unknown/file',{headers})).status,404);
  assert.equal(fontCatalog().filter(f=>f.family==='Montserrat').length,4);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
