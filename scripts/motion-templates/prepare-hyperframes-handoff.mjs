#!/usr/bin/env node
/**
 * Generate verifiable, read-only HyperFrames source handoff without a render.
 * Usage:
 * node scripts/motion-templates/prepare-hyperframes-handoff.mjs \
 *  /path/to/isolated/hyperframes-project /path/to/new/private-source-handoff.json \
 *  /path/to/canonical/repo/src/motion-templates
 *
 * Never writes to a FableCut project, changes a Reel, publishes, or asserts
 * that the presence of an SVG/FFmpeg proxy constitutes native HF rendering.
 */
import {readFileSync,writeFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildHyperFramesMotionHandoff,REQUIRED_SOURCE_FILES} from '../../src/motion-templates/hyperframes-motion-handoff.js';

const argv=process.argv.slice(2);
if(argv.length!==3)throw Error('Provide isolated HyperFrames dir, NEW output JSON path and canonical repo motion source dir');
const directory=realpathSync(resolve(argv[0]));
const output=resolve(argv[1]);
const canonicalSource=realpathSync(resolve(argv[2]));
if(!statSync(canonicalSource).isDirectory())throw Error('Canonical motion templates must be a directory');
if(!statSync(directory).isDirectory())throw Error('HyperFrames source is not a directory');
if(output.startsWith(directory+'/'))throw Error('Output must be outside the HyperFrames project (non-mutating source)');
const hashes={},byPath={};
for(const path of REQUIRED_SOURCE_FILES){
 const requested=resolve(directory,path),canonical=realpathSync(requested);
 if(!canonical.startsWith(directory+'/'))throw Error('Source file escapes isolated root: '+path);
 const bytes=readFileSync(canonical);
 if(!bytes.length||bytes.length>250000)throw Error('Unexpected source size: '+path);
 hashes[path]=createHash('sha256').update(bytes).digest('hex');
 byPath[path]=bytes.toString('utf8');
}
for(const name of ['hook-drop-card-engine.js','sequence-card-to-space.js']){
 const canonical=readFileSync(join(canonicalSource,name));
 const reference=createHash('sha256').update(canonical).digest('hex');
 if(hashes['runtime/'+name]!==reference)throw Error('HyperFrames runtime is out of sync with canonical source: '+name);
}
const html=byPath['index.html'];
function findNumericAttr(name){
 const match=html.match(new RegExp('\\b'+name+'="([0-9.]+)"'));
 if(!match)throw Error('Missing HyperFrames composition field '+name);
 const number=Number(match[1]);
 if(!Number.isFinite(number))throw Error('Invalid numeric composition field '+name);
 return number;
}
for(const [attribute,want] of [
 ['data-width',1080],['data-height',1920],['data-fps',30]
]){
 if(findNumericAttr(attribute)!==want)throw Error(attribute+' drifted from verified template');
}
if(Math.abs(findNumericAttr('data-duration')-151/30)>1e-8)throw Error('HyperFrames duration drift');
for(const source of ['hf-seek','__timelines.main','renderCardToSpaceSvg','data-composition-variables']){
 if(!html.includes(source))throw Error('Missing deterministic HyperFrames seek/parameter support: '+source);
}
const packageRecord=buildHyperFramesMotionHandoff({sourceHashes:hashes,mode:'SYNTHETIC_DEMO'});
packageRecord.source.htmlRuntimeChecks={
 attrsVerified:true,wordByWordTemplateVerified:true,
 directSourceFileHashesVerified:true,
 checkedAtUtc:new Date().toISOString()
};
// Don't let this package look like a real asset or publishable scene.
packageRecord.validation='SOURCE_ONLY_NO_RENDER';
packageRecord.execution={writingExistingProject:false,mediaRender:false,fablecutImport:false};
const body=JSON.stringify(packageRecord,null,2)+'\n';
if(Buffer.byteLength(body)>18000)throw Error('Unexpected source manifest size');
writeFileSync(output,body,{flag:'wx',mode:0o600});
console.log(JSON.stringify({
 status:packageRecord.validation,
 sourceFingerprint:packageRecord.source.fingerprint,
 fps:packageRecord.timeline.fps,frames:packageRecord.timeline.frames,
 sourceFiles:packageRecord.source.files.length,
 outputFile:basename(output),
 canImportToProduction:packageRecord.gates.canImportToProduction
}));
