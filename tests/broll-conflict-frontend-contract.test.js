import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseExternalPlan,resolveBrollConflicts} from '../src/external-edit-plan.js';
const js=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const fn=/\/\* BEGIN REVIEWED_BROLL_DRAFT \*\/([\s\S]*?)\/\* END REVIEWED_BROLL_DRAFT \*\//.exec(js);
const sha='d'.repeat(64);
const cat={schema:'sues-edit-plan/v1',sourceSha256:sha,assets:[{id:'a'.repeat(64),kind:'video',duration:6.4}]};
const scene={decision:'contextual-review-only',start:9.16,end:12.54,narrative:{reason:'sobrecarga'}};
const proposed={kind:'video',assetId:'a'.repeat(64),needsHumanReview:true,evidence:{visualContentVerified:false,
 suggestedSourceRange:{startSec:1.51,endSec:4.89,source:'full-timeline-cut-black-analysis',appliedToVideo:false}}};

test('published UI must opt-in to backend conflict semantics before PR is mergeable',()=>{
 assert.ok(fn,'reviewed B-roll function must remain available');
 assert.match(js,/Preparar B-roll \(sustituye planos y zooms incompatibles\)/);
 assert.match(fn[1],/replaceExistingBrolls:true\s*,\s*replaceHiddenZooms:true/);
 assert.match(js,/external-draft','POST'/);
});

test('published B-roll click produces same valid operation schema understood by backend',()=>{
 assert.ok(fn);
 const build=new Function(fn[1]+'\nreturn buildSuggestedBrollDraft')();
 const draft=JSON.parse(build(scene,proposed,cat,''));
 const parsed=parseExternalPlan(JSON.stringify(draft));
 assert.equal(parsed.operations.length,1);
 const op=parsed.operations[0];
 assert.equal(op.replaceExistingBrolls,true);
 assert.equal(op.replaceHiddenZooms,true);
 assert.equal(op.sourceIn,1.51);
 const settings={videoEvents:[{start:8.34,end:11.24}],zoomEvents:[{start:11.32,end:14.32},{start:18.92,end:22.02}]};
 const result=resolveBrollConflicts(settings,op);
 assert.equal(result.removedClips,1);
 assert.equal(result.removedZooms,1);
 assert.equal(result.zoomEvents.length,1);
 assert.equal(settings.zoomEvents.length,2,'no original data mutated');
});
