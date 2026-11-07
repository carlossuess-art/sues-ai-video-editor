import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
import {rmSync} from 'node:fs';
import {join} from 'node:path';

test('staging media gate requires SUES session and supports range requests',async()=>{
 const f=fixture(),prev=process.env.SUES_ENGINE_NEXT_FABLECUT_URL;
 process.env.SUES_ENGINE_NEXT_FABLECUT_URL='http://127.0.0.1:7780';
 let app;
 try{
  app=createEditorServer({directory:join(f.dir,'nle-jobs'),profiles:f.profiles});
  const base=(await app.listen()).split('/#')[0];
  assert.equal((await fetch(base+'/api/engine-next/media/m_sues_158404_video')).status,401);
  const sess=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={cookie:sess.headers.get('set-cookie').split(';')[0]};
  const proj=await fetch(base+'/api/engine-next/project',{headers});assert.equal(proj.status,200);
  const parsed=await proj.json();assert.ok(parsed.media.some(m=>m.id==='m_sues_158404_video'));
  const part=await fetch(base+'/api/engine-next/media/m_sues_158404_video',{headers:{...headers,range:'bytes=0-63'}});
  assert.equal(part.status,206);assert.equal((await part.arrayBuffer()).byteLength,64);
  assert.equal((await fetch(base+'/api/engine-next/media/unknown',{headers})).status,404);
  assert.equal((await fetch(base+'/api/engine-next/media/m_sues_158404_video',{headers:{...headers,range:'bytes=abc'}})).status,404);
 }finally{await app?.close();rmSync(f.dir,{recursive:true,force:true});if(prev===undefined)delete process.env.SUES_ENGINE_NEXT_FABLECUT_URL;else process.env.SUES_ENGINE_NEXT_FABLECUT_URL=prev;}
});