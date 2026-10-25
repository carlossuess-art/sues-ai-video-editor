import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {foregroundSpaceHash,prepareForegroundEffects,foregroundEffectFilters} from '../src/foreground-effects.js';
const dir=mkdtempSync(join(tmpdir(),'sues-foreground-')),file=join(dir,'mask.mkv');
writeFileSync(file,'test fixture, not a real matte');
const digest=createHash('sha256').update('test fixture, not a real matte').digest('hex');
const plan={source:{sha256:'a'.repeat(64)},duration:10,timeMap:{duration:10},camera:{keyframes:[]},semantic:{zooms:[],anchors:[]},policy:{captions:{font:'Montserrat'}}};
const fixture=()=>({schema:'sues-foreground-effects/v1',sourceSha256:plan.source.sha256,cameraSpaceSha256:foregroundSpaceHash(plan),matte:{localFile:file,sha256:digest,modelSha256:'b'.repeat(64),method:'modnet-onnx-cpu',width:512,height:896,fps:30,frames:300,duration:10,activeRanges:[{start:6,end:8.8}],reviewStatus:'sample-reviewed'},events:[{type:'background-blur',start:6,end:8.8,sigma:12},{type:'behind-text',start:6.4,end:8.8,lines:['MUNDO','INTERIOR']}]});
test.after(()=>rmSync(dir,{recursive:true,force:true}));
test('foreground compiles only after bound camera-space validation and preserves defaults',()=>{
 assert.equal(prepareForegroundEffects(null,plan),null);assert.deepEqual(foregroundEffectFilters(null,'base',1),{filters:[],base:'base'});
 const d=prepareForegroundEffects(fixture(),plan),f=foregroundEffectFilters(d,'base',3).filters.join(';');
 assert.match(f,/\[3:v\]fps=30/);assert.match(f,/alphamerge/);assert.match(f,/MUNDO/);assert.match(f,/gblur=sigma=12/);assert.doesNotMatch(f,/trim=/);assert.equal(d.acceptance,'pending-human-review');
 assert.doesNotThrow(()=>prepareForegroundEffects(d,plan));
});
test('source, camera, timeline and mask changes invalidate the cache',()=>{
 for(const change of [d=>d.sourceSha256='c'.repeat(64),d=>d.cameraSpaceSha256='c'.repeat(64),d=>d.matte.sha256='c'.repeat(64),d=>d.matte.frames=299,d=>delete d.matte.duration]){
 const d=fixture();change(d);assert.throws(()=>prepareForegroundEffects(d,plan));}
 assert.throws(()=>prepareForegroundEffects(fixture(),{...plan,camera:{keyframes:[{zoom:1.1}]}}));
 const link=join(dir,'mask-link.mkv');symlinkSync(file,link);const d=fixture();d.matte.localFile=link;assert.throws(()=>prepareForegroundEffects(d,plan),/file changed/);
});
test('uncovered intervals, arbitrary effects and injected text are rejected',()=>{
 for(const change of [d=>d.events[0].start=5.9,d=>d.events[0].end=8.9,d=>d.events[0].sigma=21,d=>d.events[1].lines=["MUNDO':movie=x"],d=>d.events[0].filter='movie=x',d=>d.events[0].type='full-frame-fit']){
 const d=fixture();change(d);assert.throws(()=>prepareForegroundEffects(d,plan));}
});
test('foreground cannot be silently hidden by other resources',()=>{
 assert.throws(()=>prepareForegroundEffects(fixture(),{...plan,selectedMedia:[{start:6.5,end:7}]}),/another composition/);
});