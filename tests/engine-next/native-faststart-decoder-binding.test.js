import test from 'node:test';import assert from 'node:assert/strict';
import {bindVerifiedNativeDecoderCache as bind} from '../../src/engine-next/native-faststart-decoder-binding.js';
const A='a'.repeat(64),B='b'.repeat(64);
const manifest=()=>({schema:'sues-native-faststart-cache/v1',sourcePreserved:true,decoderOnly:true,noReencoding:true,
 videoPacketTimelineExact:true,audioPacketTimelineExact:true,videoBitstreamEqual:true,audioBitstreamEqual:true,
 productionActivation:false,creativeApproved:false,sourceSha256:A,cacheSha256:B,
 sourceMediaUrl:'/media/original.mp4',cacheMediaUrl:'/media/original-faststart.mp4'});
const opts=()=>({sourceSha256:A,cacheSha256:B,activeMediaSrc:'/media/original.mp4'});
test('only mapped video decoder opens a cache; project media stays on authenticated original',()=>{
 const r=bind(manifest(),opts());assert.equal(r.resolveVideoDecodeUrl('/media/original.mp4'),'/media/original-faststart.mp4');
 assert.equal(r.resolveVideoDecodeUrl('/media/voice.m4a'),'/media/voice.m4a');
 assert.equal(r.preserveProjectMediaUrl('/media/original.mp4'),'/media/original.mp4');
 assert.equal(r.decoderOnly,true);assert.ok(Object.isFrozen(r));
});
test('no provenance, timeline, audio or hash shortcuts',()=>{
 for(const key of ['sourcePreserved','decoderOnly','noReencoding','videoPacketTimelineExact','audioPacketTimelineExact','videoBitstreamEqual','audioBitstreamEqual']){
  const x=manifest();x[key]=false;assert.throws(()=>bind(x,opts()),/Unverified/);
 }
 const wrong=opts();wrong.sourceSha256='c'.repeat(64);assert.throws(()=>bind(manifest(),wrong),/SHA256/);
 const altered=manifest();altered.cacheSha256='b'.repeat(63);assert.throws(()=>bind(altered,opts()),/SHA256/);
});
test('refuse unsafe paths, switched source and premature production activation',()=>{
 for(const p of ['/media/%2e%2e/a.mp4','/media/a%2Fb.mp4','/media/a%5Cb.mp4','/api/cache.mp4','/media/%00.mp4','/media/Other.MP4?query=1']){
  const x=manifest();x.cacheMediaUrl=p;assert.throws(()=>bind(x,opts()),/path|URL/);
 }
 const switched=opts();switched.activeMediaSrc='/media/other.mp4';assert.throws(()=>bind(manifest(),switched),/path/);
 const x=manifest();x.productionActivation=true;assert.throws(()=>bind(x,opts()),/Unverified/);
});
