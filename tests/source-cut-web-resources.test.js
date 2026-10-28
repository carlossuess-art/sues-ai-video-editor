import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {rmSync} from 'node:fs';
import {join} from 'node:path';

test('new manual studio and source-cut files are available via protected studio static allowlist',async()=>{
 const f=fixture(),server=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const addr=(await server.listen()).split('/#')[0];
  for(const [path,mime] of [['/source-cuts-ui.js','text/javascript'],['/manual-adjust.js','text/javascript'],['/source-cuts.css','text/css'],['/manual-adjust.css','text/css']]){
   const r=await fetch(addr+path);assert.equal(r.status,200,path);assert.ok(r.headers.get('content-type').includes(mime),path);assert.ok((await r.text()).length>250,path);
  }
  const sw=await fetch(addr+'/sw.js');assert.equal(sw.status,200);assert.ok((await sw.text()).includes('/source-cuts-ui.js'));
 }finally{await server.close();rmSync(f.dir,{recursive:true,force:true});}
});
