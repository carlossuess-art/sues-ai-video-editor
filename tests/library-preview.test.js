import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('function mountAssetPreview('),source.indexOf('async function refreshAssets('));
const context=vm.createContext({});vm.runInContext(helper,context);
function video(){return {src:'',hidden:true,previousElementSibling:{hidden:false},loads:0,pauses:0,hasAttribute(){return !!this.src;},removeAttribute(){this.src='';},load(){this.loads++;},pause(){this.pauses++;}};}
test('library preview mounts just the chosen media and releases the previous decoder',()=>{
 const a=video(),b=video(),list={querySelectorAll:()=>[a,b]};
 context.mountAssetPreview(a,a.previousElementSibling,list,'/a');assert.equal(a.src,'/a');assert.equal(b.loads,0);
 context.mountAssetPreview(b,b.previousElementSibling,list,'/b');assert.equal(a.src,'');assert.equal(a.pauses,1);assert.equal(a.hidden,true);assert.equal(a.previousElementSibling.hidden,false);assert.equal(b.src,'/b');assert.equal(b.hidden,false);assert.equal(b.previousElementSibling.hidden,true);
});
test('catalogue construction leaves video URLs unattached until the explicit preview action',()=>{
 const branch=source.slice(source.indexOf("else if(a.kind==='video'||a.kind==='overlay')"),source.indexOf("else{if(a.kind==='sfx')"));
 assert.ok(branch.includes("video.preload='none'"));assert.ok(branch.includes('preview.onclick=()=>mountAssetPreview('));assert.ok(!branch.includes('video.src='));assert.ok(!branch.includes("preload='metadata'"));
});