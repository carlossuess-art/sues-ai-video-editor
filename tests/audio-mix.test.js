import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareBackgroundAudio,backgroundAudioFilter} from '../src/audio-mix.js';
const asset={assetId:'owned-01',rights:'owned',localFile:'/local/music.wav'};
test('music is opt-in and requires explicit source rights, bounded gain and local binding',()=>{
 assert.equal(prepareBackgroundAudio(undefined,12),null);
 for(const bad of [{...asset,rights:'unknown'},{...asset,gain:1},{...asset,gain:0},{...asset,sourceIn:-1},{...asset,assetId:'../file'}])assert.throws(()=>prepareBackgroundAudio(bad,12));
 const m=prepareBackgroundAudio({...asset,sourceIn:2},12);assert.equal(m.sourceOut,14);assert.equal(m.gain,.12);
});
test('audio graph retains voice branch, ducks only music, fades and limits with no normalization',()=>{
 const filters=backgroundAudioFilter(prepareBackgroundAudio(asset,12),3).join(';');
 assert.match(filters,/\[3:a\]/);assert.match(filters,/voice-original/);assert.match(filters,/sidechaincompress/);assert.match(filters,/normalize=0/);assert.match(filters,/latency=1/);assert.match(filters,/afade=t=out/);
 assert.deepEqual(backgroundAudioFilter(null,1),[]);
});
