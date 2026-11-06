import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {MasterDirectorProjectStore} from '../src/master-director-project-store.js';
const cli=new URL('../scripts/master-editor-cli.mjs',import.meta.url);
test('chat CLI reopens a real local edit, changes one caption, persists and refuses stale commands',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-chat-cli-'));
 try{
  const jobs=join(root,'jobs');mkdirSync(jobs);const id=randomUUID(),dir=join(jobs,id);mkdirSync(dir);
  writeFileSync(join(dir,'job.json'),JSON.stringify({id,projectId:id,profileId:'test',instructions:[]}));
  const store=new MasterDirectorProjectStore(dir,async()=>null);
  const draft=store.saveDraft({schema:'sues-master-story/v1',timeline:{duration:22},operations:[
   {id:'sub-17',renderer:'remotion',track:'captions',start:17,end:18,parameters:{text:'Original',visual:{opacity:1}}},
   {id:'broll-5',renderer:'remotion',track:'broll',start:5,end:8,parameters:{visual:{opacity:1}}}]});
  store.setCurrent(draft.revision,null);
  const run=(...args)=>execFileSync(process.execPath,[cli.pathname,...args,'--jobs-dir',jobs,'--job-id',id],{encoding:'utf8'});
  const initial=JSON.parse(run('status'));assert.equal(initial.status,'READ_ONLY');assert.equal(initial.revision,draft.revision);
  const args=['apply','--expected',initial.revision,'--command',JSON.stringify({type:'caption-text',at:17.3,text:'Corregido'}),'--confirm-edit'];
  const revised=JSON.parse(run(...args));assert.equal(revised.status,'CURRENT');assert.notEqual(revised.revision,initial.revision);
  assert.equal(store.readDraft(store.current().revision).operations[0].parameters.text,'Corregido');
  assert.equal(store.readDraft(store.current().revision).operations[1].parameters.visual.opacity,1);
  const stale=spawnSync(process.execPath,[cli.pathname,...args,'--jobs-dir',jobs,'--job-id',id],{encoding:'utf8'});
  assert.equal(stale.status,2);assert.equal(JSON.parse(stale.stdout).code,'STALE_PROJECT_REVISION');
  const missing=spawnSync(process.execPath,[cli.pathname,'apply','--expected',revised.revision,'--command',JSON.stringify({type:'caption-text',at:17.3,text:'Sin permiso'}),'--jobs-dir',jobs,'--job-id',id],{encoding:'utf8'});
  assert.notEqual(missing.status,0);assert.equal(store.current().revision,revised.revision);
 }finally{rmSync(root,{recursive:true,force:true});}
});
