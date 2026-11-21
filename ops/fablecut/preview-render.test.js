const test=require('node:test');
const assert=require('node:assert/strict');
const Preview=require('../preview-render.js');
const Delivery=require('../delivery.js');
test('preview scales 1080x1920 to 540x960 at 15 fps while preserving source project dimensions',()=>{
 const p=Preview.dimensions(1080,1920);assert.deepEqual(p,{w:540,h:960,sx:0.5,sy:0.5,fps:15});
 const spec=Delivery.normalize({preset:'sues-preview'}).spec;
 assert.equal(spec.preset,'sues-preview');assert.equal(spec.fps,15);
 assert.equal(spec.width,null);assert.equal(spec.height,null);
 assert.equal(spec.video.codec,'h264');assert.equal(spec.audio.codec,'aac');
 assert.equal(Delivery.PRESETS['instagram-reels'].width,1080);assert.equal(Delivery.PRESETS['instagram-reels'].height,1920);
});
test('preview preserves aspect ratio of landscape and never upscales small canvas',()=>{
 const a=Preview.dimensions(1920,1080);assert.equal(a.w,540);assert.equal(a.h,302);
 const b=Preview.dimensions(400,700);assert.equal(b.w,400);assert.equal(b.h,700);
});
test('export frame crop is transformed by the same pixel ratio',()=>{
 assert.deepEqual(Preview.region({x:200,y:100,w:600,h:800},Preview.dimensions(1080,1920)),
  {x:100,y:50,w:300,h:400});
 assert.equal(Preview.region(null,Preview.dimensions(1080,1920)),null);
});
test('final export has no preview characteristics',()=>{
 assert.equal(Preview.applies(Delivery.normalize({preset:'instagram-reels'}).spec),false);
 assert.equal(Preview.applies(Delivery.normalize({preset:'master'}).spec),false);
 assert.throws(()=>Preview.dimensions(0,1920),/Invalid source/);
});
