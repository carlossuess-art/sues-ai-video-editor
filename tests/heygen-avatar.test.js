import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeyGen,HeyGenError} from '../src/heygen-avatar.js';
test('paid calls are disabled by default',async()=>{
 const client=createHeyGen({apiKey:'fake',fetcher:()=>{throw Error('Network called')}});
 await assert.rejects(client.createVideo({avatarId:'avatar1',script:'Hola',voiceId:'voice1',approved:true}),/Paid generation/);
});
test('explicit approved request uses V3 avatar iii and server-only key',async()=>{
 let req;
 const client=createHeyGen({apiKey:'private',allowCharge:true,fetcher:async(url,options)=>{req={url,options};return {ok:true,json:async()=>({data:{id:'vid1'}})};}});
 await client.createVideo({avatarId:'avatar1',script:'Hola',voiceId:'voice1',approved:true});
 assert.equal(req.url,'https://api.heygen.com/v3/videos');
 assert.equal(req.options.headers['x-api-key'],'private');
 assert.equal(JSON.parse(req.options.body).engine.type,'avatar_iii');
 assert.equal(JSON.parse(req.options.body).voice_id,'voice1');
});
test('reject invalid and ambiguous inputs and prevent network',async()=>{
 const client=createHeyGen({apiKey:'x',allowCharge:true,fetcher:()=>{throw Error('Network called')}});
 for(const args of [{avatarId:'../x',script:'Hi',voiceId:'v'}, {avatarId:'a',script:'x',audioUrl:'https://example.com/a.mp3'}, {avatarId:'a',audioUrl:'http://example.com/a.mp3'}]){
  await assert.rejects(client.createVideo({...args,approved:true}));
 }
});
test('sanitizes upstream failure, verifies video ID and permits safe polling',async()=>{
 const bad=createHeyGen({apiKey:'secret',fetcher:async()=>({ok:false,status:401})});
 await assert.rejects(bad.getVideo('valid'),e=>e instanceof HeyGenError&&e.status===401&&!e.message.includes('secret'));
 await assert.rejects(bad.getVideo('../../foo'),/Invalid video ID/);
 const ok=createHeyGen({apiKey:'x',fetcher:async(url)=>({ok:true,json:async()=>({data:{status:'completed',video_url:'https://cdn.test/v.mp4',requested:url}})})});
 assert.equal((await ok.getVideo('v1')).data.status,'completed');
});
test('Digital Twin looks list uses documented endpoint and optional avatar default voice',async()=>{
 const calls=[];const client=createHeyGen({apiKey:'fake',allowCharge:true,fetcher:async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({data:[]})}}});
 await client.listLooks();assert.equal(calls[0].url,'https://api.heygen.com/v3/avatars/looks?avatar_type=digital_twin&ownership=private');
 await client.createVideo({avatarId:'lk_123',script:'Texto breve',approved:true});
 assert.equal(JSON.parse(calls[1].opts.body).voice_id,undefined);
});
