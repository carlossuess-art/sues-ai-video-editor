import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/playback-buffer.js';
class Video extends EventTarget{
 constructor(){super();this.attributes=new Map();this.currentTime=0;this.duration=20;this.paused=true;this.preload='none';this.ranges=[];this.buffered={get length(){return this.video.ranges.length;},video:this,start:i=>this.ranges[i][0],end:i=>this.ranges[i][1]};}
 set src(v){this.attributes.set('src',v);}get src(){return this.getAttribute('src')||'';}
 getAttribute(k){return this.attributes.get(k)||null;}hasAttribute(k){return this.attributes.has(k);}removeAttribute(k){this.attributes.delete(k);}
 load(){this.dispatchEvent(new Event('emptied'));}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}
}
function fixture(fetcher,maxBytes){const videos=[new Video(),new Video()],button={},status={},meter={removeAttribute(){this.value=undefined;}},revoked=[],blobs=[];
 const manager=globalThis.createSuesPlayback({videos,button,status,meter,fetcher,maxBytes,urlAPI:{createObjectURL:b=>{blobs.push(b);return 'blob:buffer-'+blobs.length;},revokeObjectURL:u=>revoked.push(u)}});
 return {videos,button,status,meter,manager,revoked,blobs};
}
test('only the visible player downloads and switching restores source and position',()=>{
 const f=fixture();const [a,b]=f.videos;f.manager.source(a,'/original');f.manager.source(b,'/preview');
 assert.equal(a.src,'');assert.equal(b.src,'');f.manager.activate(a);a.currentTime=4;assert.equal(a.src,'/original');f.manager.activate(b);
 assert.equal(a.src,'');assert.equal(a.preload,'none');assert.equal(b.src,'/preview');f.manager.activate(a);a.dispatchEvent(new Event('loadedmetadata'));assert.equal(a.currentTime,4);
 a.ranges=[[0,8],[14,20]];a.dispatchEvent(new Event('progress'));assert.equal(f.meter.value,40);assert.match(f.status.textContent,/4 s por delante/);
});
test('full private download becomes a local blob and preserves playback and export source',async()=>{
 const f=fixture(async(url,options)=>{assert.equal(url,'/media');assert.equal(options.credentials,'same-origin');return new Response(new Uint8Array([1,2,3]),{headers:{'content-length':'3','content-type':'video/mp4'}});});
 const v=f.videos[0];f.manager.source(v,'/media');f.manager.activate(v);v.currentTime=6;v.paused=false;await f.manager.download();
 assert.equal(f.manager.source(v),'/media');assert.equal(v.src,'blob:buffer-1');assert.equal(f.blobs[0].size,3);
 v.currentTime=0;v.dispatchEvent(new Event('loadedmetadata'));assert.equal(v.currentTime,6);v.dispatchEvent(new Event('canplay'));assert.equal(v.paused,false);assert.equal(f.meter.value,100);
 f.manager.clear(v);assert.deepEqual(f.revoked,['blob:buffer-1']);assert.equal(v.src,'');
});
test('an interrupted download or oversized media never replaces the playable source',async()=>{
 for(const [response,limit] of [[()=>new Response(new Uint8Array([1,2]),{headers:{'content-length':'3'}}),4],[()=>new Response(new Uint8Array([1,2,3]),{headers:{'content-length':'3'}}),2]]){
 const f=fixture(async()=>response(),limit);const v=f.videos[0];f.manager.source(v,'/media');f.manager.activate(v);await f.manager.download();assert.equal(v.src,'/media');assert.equal(f.blobs.length,0);assert.equal(f.button.disabled,false);
 }
});
test('changing projects during a pending fetch cannot attach the old video',async()=>{
 let finish;const f=fixture(()=>new Promise(r=>finish=r));const v=f.videos[0];f.manager.source(v,'/old');f.manager.activate(v);const pending=f.manager.download();f.manager.source(v,'/new');finish(new Response(new Uint8Array([1])));await pending;assert.equal(v.src,'/new');assert.equal(f.blobs.length,0);
});
