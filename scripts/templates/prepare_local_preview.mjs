import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
const [inputPath,outputDir]=process.argv.slice(2);
if(!inputPath||!outputDir){console.error('Usage: node scripts/templates/prepare_local_preview.mjs input.json output-directory');process.exit(1);}
try{
 const read=p=>JSON.parse(readFileSync(p,'utf8')),input=read(inputPath);
 const plan=prepareLocalPreview({...input,template:read(input.templatePath),brand:read(input.brandKitPath),transcript:read(input.transcriptPath),camera:read(input.cameraPath)});
 const out=resolve(outputDir);mkdirSync(out,{recursive:true});
 writeFileSync(join(out,'manifest.json'),JSON.stringify(plan,null,2)+'\n');
 writeFileSync(join(out,'captions.ass'),buildPreviewASS(plan,{fontFamily:input.previewFont??plan.policy.captions.font}));
 writeFileSync(join(out,'filter.ffscript'),buildPreviewFilter(plan,{hasAudio:input.hasAudio!==false}));
 console.log(JSON.stringify({duration:plan.duration,captions:plan.captions.length,cameraSpans:plan.cameraSpans.length,outputDirectory:out,fontRequested:plan.policy.captions.font,fontForPreview:input.previewFont??plan.policy.captions.font}));
}catch(e){console.error(e.message);process.exit(1);}
