import test from 'node:test';import assert from 'node:assert/strict';
import {assetRecord,manifestFromV8,makeV8PrivateOps,sourceSha256} from '../src/motion-templates/asset-first-v1.mjs';
import {existsSync} from 'node:fs';import {join} from 'node:path';
const ROOT=process.env.ASSET_QA_ROOT||'/mnt/data';
const transcript={words:[{text:'buf,',start:15.28,end:15.54,asrWordId:'word-42'},{text:'que',start:15.98,end:16.26,asrWordId:'word-43'},{text:'peresa.',start:16.26,end:17.1,asrWordId:'word-44'}]};
const inputs={pfffFile:join(ROOT,'SUES_PFFF_EXPLOSION_SOLO.png'),sofaFile:join(ROOT,'SUES_SOFA_PERSONA_PAPELES_ORIGINAL.png'),transcript};
const assetsAvailable=existsSync(inputs.pfffFile)&&existsSync(inputs.sofaFile);
test('PNG contains actual cut-out alpha channel, not simulated checkerboard',{skip:!assetsAvailable},()=>{const e=assetRecord('pfff',inputs.pfffFile,'','');assert.equal(e.mediaKind,'image');assert(e.transparentFraction>.05);assert(e.opaqueFraction+e.translucentFraction>.05);assert(e.cornerAlpha.filter(x=>x<=16).length>=3)});
test('V8 manifest uses real words, exact source and distinct assets',{skip:!assetsAvailable},()=>{const m=manifestFromV8(inputs);assert.equal(m.sourceSha256,sourceSha256);assert.equal(m.assets.length,2);assert.notEqual(m.assets[0].sha256,m.assets[1].sha256);assert.equal(m.anchors.buf.spokenAt,15.28);assert.equal(m.anchors.pereza.spokenAt,16.26);assert.equal(m.typography.lineHeight,1.02)});
test('FableCut operations keep separate editable PNG images and per-word text',{skip:!assetsAvailable},()=>{const m=manifestFromV8(inputs);const ops=makeV8PrivateOps(m);assert(ops.length<100);const imgs=ops.filter(x=>x.op==='addClip'&&x.clip.kind==='image');assert.equal(imgs.length,2);assert(imgs[0].clip.start>=15.28&&imgs[0].clip.start-15.28<1/30);assert(imgs[1].clip.start>=16.26&&imgs[1].clip.start-16.26<1/30);assert.equal(ops.filter(x=>x.op==='addClip'&&x.clip.kind==='text').length,10);assert(ops.some(x=>x.op==='addSequence'&&x.from==='empty'));assert(ops.some(x=>x.op==='addClip'&&x.clip.id==='af_tapiz'))});

test('V8 keeps original speech on the same clock as motion anchors',()=>{
 const ops=makeV8PrivateOps({schema:'sues-asset-first/v1',durationSeconds:18.2,assets:[],
  anchors:{buf:{spokenAt:15.28},que:{spokenAt:15.98},pereza:{spokenAt:16.26}}});
 const voice=ops.find(op=>op.clip?.id==='af_voice').clip;
 assert.equal(voice.start,0);
 assert.equal(voice.in,0);
 assert.equal(voice.duration,18.2);
 assert.equal(voice.mediaId,'source-voice');
});
