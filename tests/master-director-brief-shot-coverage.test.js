import test from 'node:test';
import assert from 'node:assert/strict';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {inspectFilmBriefShotCoverage} from '../src/master-director-brief-shot-coverage.js';
const O='b'.repeat(64),S='a'.repeat(64);
const text='# Plan\n> NO APROBADO / NO EJECUTAR '+O+'\n'+
 '### Escena 01 · GANCHO · 00:00–00:03\n- `0–1 s`: base **CARLOS**.\n- `1–2 s`: base **B01**.\n- `2–3 s`: base **M01**.\n'+
 '### Escena 02 · CIERRE · 00:03–00:04\n- `3–4 s`: base **CARLOS**.';
const make=()=>translateFilmDirectorBrief({text,sourceSha256:S,originalSha256:O,timelineFingerprint:'timeline',duration:4});
test('all source frames have one base shot and independently layered overlays are allowed',()=>{
 const a=make();const r=inspectFilmBriefShotCoverage(a);
 assert.equal(r.status,'STRUCTURALLY_CONTIGUOUS_REQUIRES_RESOURCE_AND_FRAME_QA');
 assert.equal(r.frameCount,120);assert.equal(r.shotCount,4);assert.equal(r.issues.length,0);
 assert.equal(r.approved,false);assert.equal(r.canExecute,false);
});
test('gaps, overlaps, missing final shot, scene drift and changed base identities block',()=>{
 const a=make();
 const b=structuredClone(a);b.scenes[0].shots[1].editStart=1.1;
 assert.ok(inspectFilmBriefShotCoverage(b).issues.some(x=>x.code==='BASE_SHOT_GAP_OR_OVERLAP'));
 const c=structuredClone(a);c.scenes[0].shots[1].editStart=.9;
 assert.ok(inspectFilmBriefShotCoverage(c).issues.some(x=>x.code==='BASE_SHOT_GAP_OR_OVERLAP'));
 const d=structuredClone(a);d.scenes[0].shots.pop();
 assert.ok(inspectFilmBriefShotCoverage(d).issues.some(x=>x.code==='SCENE_BASE_COVERAGE_INCOMPLETE'));
 const e=structuredClone(a);e.scenes[1].editStart=3.1;
 assert.ok(inspectFilmBriefShotCoverage(e).issues.some(x=>x.code==='SCENE_GAP_OR_OVERLAP'));
 const f=structuredClone(a);f.scenes[0].shots[1].resourceHint='B02';
 assert.ok(inspectFilmBriefShotCoverage(f).issues.some(x=>x.code==='BASE_KIND_RESOURCE_INCONSISTENT'));
});
test('invalid annex metadata, negative frames, duplicate IDs fail closed',()=>{
 assert.equal(inspectFilmBriefShotCoverage({}).code,'UNTRUSTED_SHOT_COVERAGE_INPUT');
 const a=make();a.scenes[1].shots[0].id=a.scenes[0].shots[0].id;
 assert.ok(inspectFilmBriefShotCoverage(a).issues.some(x=>x.code==='INVALID_SHOT'));
});

test('source-to-CFR30 lineage rejects implicit time shifting or inverted original timestamps',()=>{
 const annex=make();
 const shifted=structuredClone(annex);
 shifted.scenes[0].shots[0].sourceStart=1/30;
 const result=inspectFilmBriefShotCoverage(shifted);
 assert.ok(result.issues.some(x=>x.code==='SHOT_SOURCE_TO_CFR30_TIME_DRIFT'));
 assert.equal(result.canExecute,false);
 const reversed=structuredClone(annex);
 reversed.scenes[0].shots[1].sourceStart=3;
 assert.ok(inspectFilmBriefShotCoverage(reversed).issues.some(x=>x.code==='SHOT_SOURCE_TO_CFR30_TIME_DRIFT'));
});
