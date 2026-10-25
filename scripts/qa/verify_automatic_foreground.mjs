// Real-project regression probe: CONFIG VISION_JSON JOBS_ROOT. Requires an eligible spoken concept.
import assert from 'node:assert/strict';
import {loadProject,prepareProject} from '../../src/local-pipeline.js';
import {foregroundRuntime,validateAutomaticForeground} from '../../src/automatic-foreground.js';
import {buildCameraProfilePlan} from '../../src/reframe.js';
import {readFileSync} from 'node:fs';
const [config,visionFile,jobsRoot]=process.argv.slice(2);if(!config||!visionFile||!jobsRoot)throw Error('Usage: node verify_automatic_foreground.mjs CONFIG VISION_JSON JOBS_ROOT');
const p=loadProject(config);
const vision=JSON.parse(readFileSync(visionFile,'utf8'));assert.equal(vision.sourceSha256,p.boundHashes.source,'Vision must match source');p.inputs.visionFrames=vision.frames;p.inputs.camera=buildCameraProfilePlan(vision.frames,{profile:'conservative'});p.inputs.camera.detectionMethod=vision.method;p.visualRuntime=foregroundRuntime(jobsRoot);
const settings={styleId:'SUES_DOPAMIN',autoRecipe:true,depthEnabled:true,profileImages:false,voiceGain:1.5,sfxGain:.3,sfxEnabled:true,musicGain:.18,voiceNormalization:true,levelResources:true,masteringEnabled:true};
const full=prepareProject(p,settings);assert.ok(full.plan.automaticForeground);
for(const delta of [{motions:false},{depthEnabled:false},{autoRecipe:false},{styleId:'SUES_CALMA'}]){const q=prepareProject(p,{...settings,...delta});assert.equal(q.plan.automaticForeground??null,null,JSON.stringify(delta));}
const manual=prepareProject(p,{...settings,graphicCards:[full.plan.templateRecipe.cards[0]]});assert.equal(manual.plan.automaticForeground??null,null);assert.ok(manual.plan.graphics.length);
const savedRuntime=p.visualRuntime;p.visualRuntime=null;assert.equal(prepareProject(p,settings).plan.automaticForeground??null,null);p.visualRuntime=savedRuntime;
const d=full.plan.automaticForeground;
for(const mutate of [d=>d.sourceSha256='0'.repeat(64),d=>d.cameraSpaceSha256='0'.repeat(64),d=>d.activeFrames=91,d=>d.events[1].lines=['INVENTADO'],d=>d.runtime.modelSha256='0'.repeat(64),d=>d.events[1].top=100]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>validateAutomaticForeground(bad,full.plan));}
assert.throws(()=>validateAutomaticForeground(d,{...full.plan,selectedMedia:[{start:d.startFrame/30,end:(d.startFrame+d.activeFrames)/30}]}),/overlap/);
console.log(JSON.stringify({positiveProposal:true,manualChoicesPreserved:true,missingRuntimeSafe:true,disabledModes:4,tamperCases:6,overlapRejected:true,autoWord:d.evidence.word,range:[d.startFrame/30,(d.startFrame+d.activeFrames)/30]}));
