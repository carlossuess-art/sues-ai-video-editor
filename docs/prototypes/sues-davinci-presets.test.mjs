import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,samplePreset} from './sues-davinci-presets.mjs';
test('four prototypes',()=>assert.equal(Object.keys(PRESETS).length,4));
test('zoom endpoints',()=>{assert.equal(samplePreset('sues-camera-zoom-in',0).scale,1);assert.equal(samplePreset('sues-camera-zoom-in',84).scale,1.15)});
test('slide endpoints',()=>{assert.ok(Math.abs(samplePreset('sues-slide-text-up',0).translateYPx+176.64)<1e-8);assert.equal(samplePreset('sues-slide-text-up',43).translateYPx,0)});
test('blur endpoints',()=>{assert.equal(samplePreset('sues-intro-blur',0).blurPx,30);assert.equal(samplePreset('sues-intro-blur',21).blurPx,0)});
test('posterize',()=>assert.equal(samplePreset('sues-posterize-time',7).sampleFrame,5));
test('reject invalid',()=>assert.throws(()=>samplePreset('bad',0)));
