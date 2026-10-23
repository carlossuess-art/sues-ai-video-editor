import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('web/app.js','utf8'),code=source.slice(source.indexOf('async function api('),source.indexOf('\nasync function work'));
function client(responses){let calls=[],auth=null;const banner={dataset:{transient:'true'},hidden:false};const context={current:null,$:()=>banner,authenticated:v=>auth=v,setTimeout:cb=>cb(),fetch:async(_url,options)=>{calls.push(options.method);const r=responses.shift();return {ok:r.status<400,status:r.status,text:async()=>r.body};}};vm.createContext(context);vm.runInContext(code,context);return {context,calls,banner,auth:()=>auth};}
test('frontend recovers one read-only upstream failure without duplicating mutations or leaking raw proxy text',async()=>{
 const read=client([{status:502,body:'upstream connect error'},{status:200,body:'{"state":"RENDERING"}'}]);
 const result=await read.context.api('jobs/id');assert.equal(result.state,'RENDERING');assert.equal(read.calls.length,2);assert.equal(read.banner.hidden,true);
 const write=client([{status:502,body:'upstream connect error'}]);
 await assert.rejects(write.context.api('jobs/id/external-execute','POST',{}),e=>e.status===502&&e.transient&&!e.message.includes('Unexpected token')&&!e.message.includes('upstream connect'));
 assert.equal(write.calls.length,1);
 const denied=client([{status:401,body:'{"error":"Session required"}'}]);await assert.rejects(denied.context.api('jobs'),/Session required/);assert.equal(denied.auth(),false);
});
