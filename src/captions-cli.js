import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {withTranscriptCaptions} from './transcript.js';
const readJson=p=>JSON.parse(readFileSync(p,'utf8'));
export function compileCaptions(planFile,transcriptFile,outDir,{editsFile}={}){
  const plan=readJson(planFile),transcript=readJson(transcriptFile),edits=editsFile?readJson(editsFile):[];
  const result=withTranscriptCaptions(plan,transcript,{edits});
  mkdirSync(outDir,{recursive:true,mode:0o700});
  const captionPath=join(outDir,'captions.json'),planPath=join(outDir,'plan-captioned.json');
  writeFileSync(captionPath,JSON.stringify({version:'1.0',mappedDuration:result.mappedDuration,segments:result.segments},null,2),{mode:0o600});
  writeFileSync(planPath,JSON.stringify(result.plan,null,2),{mode:0o600});
  return {captionPath,planPath,count:result.segments.length};
}
export function main(args=process.argv.slice(2)){
  const [command,planFile,transcriptFile,...rest]=args;
  if(command!=='compile'||!planFile||!transcriptFile)throw new Error('Uso: compile PLAN.json TRANSCRIPT.json --out DIR [--edits edits.json]');
  const oi=rest.indexOf('--out');if(oi<0||!rest[oi+1])throw new Error('--out obligatorio');
  const ei=rest.indexOf('--edits');
  const result=compileCaptions(resolve(planFile),resolve(transcriptFile),resolve(rest[oi+1]),{editsFile:ei>=0?resolve(rest[ei+1]):undefined});
  console.log(`Captions compilados: ${result.count}. Coste remoto: 0 USD. ${result.planPath}`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
