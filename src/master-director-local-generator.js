// Optional local llama.cpp planning provider. It creates drafts only; the
// existing authenticated review is the sole authority on validity/approval.
import {spawn} from 'node:child_process';
import {accessSync,constants,lstatSync,readFileSync,realpathSync,statSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {dirname,isAbsolute,join,parse,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileSha256} from './local-pipeline.js';
const HASH=/^[a-f0-9]{64}$/;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(o,keys)=>record(o)&&Object.keys(o).every(k=>keys.includes(k));

export function loadMasterLocalGenerator(path){
 if(path===undefined||path===null||path==='')return null;
 if(typeof path!=='string'||!isAbsolute(path)||resolve(path)!==path)throw Error('Invalid local director config path');
 const uid=typeof process.getuid==='function'?process.getuid():null;
 for(let dir=dirname(path);;dir=dirname(dir)){
  const p=lstatSync(dir);
  if(!p.isDirectory()||p.isSymbolicLink()||(uid!==null&&p.uid!==0&&p.uid!==uid)||((p.mode&0o022)!==0&&(p.mode&0o1000)===0))
   throw Error('Untrusted local director config directory');
  if(dir===parse(dir).root)break;
 }
 const st=lstatSync(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size>16384||(st.mode&0o022)!==0||(uid!==null&&st.uid!==0&&st.uid!==uid))
  throw Error('Untrusted local director config');
 const config=JSON.parse(readFileSync(path,'utf8'));
 if(!same(config,['schema','binary','model','modelFamily'])||config.schema!=='sues-master-local-generator/v1'||config.modelFamily!=='qwen3')
  throw Error('Invalid local director config');
 const deps={};
 for(const key of ['binary','model']){
  const item=config[key];
  if(!same(item,['path','sha256'])||typeof item.path!=='string'||!isAbsolute(item.path)||resolve(item.path)!==item.path||!HASH.test(item.sha256??''))
   throw Error('Invalid local director dependency');
  const actual=realpathSync(item.path),file=statSync(actual);
  if(!file.isFile()||file.size<1||file.size>4*1024*1024*1024||fileSha256(actual)!==item.sha256)
   throw Error('Local director dependency changed');
  if(key==='binary')accessSync(actual,constants.X_OK);
  deps[key]={path:actual,sha256:item.sha256};
 }
 return createMasterLocalGenerator(deps);
}

export function createMasterLocalGenerator(deps,{spawnProcess=spawn,timeoutMs=300000}={}){
 if(!same(deps,['binary','model'])||!['binary','model'].every(k=>same(deps[k],['path','sha256'])&&isAbsolute(deps[k].path??'')&&HASH.test(deps[k].sha256??'')))
  throw Error('Invalid local director dependencies');
 let busy=false;
 const verify=()=>['binary','model'].every(k=>fileSha256(deps[k].path)===deps[k].sha256);
 return Object.freeze({verifiedFree:true,maxCostUSD:0,async generate({brief,context,outputSchema}={}){
  if(busy)throw Error('Local director is busy');
  if(typeof brief!=='string'||brief.trim().length<5||brief.length>4000||!record(context)||context.schema!=='sues-master-generation-context/v1'||outputSchema!=='sues-master-story/v1')
   throw Error('Invalid local director input');
  const input=JSON.stringify({brief,context}).replaceAll('<','\\u003c').replaceAll('>','\\u003e');
  if(Buffer.byteLength(input)>24000)throw Error('Local director context exceeds limit');
  busy=true;let promptDir=null;
  try{
   if(!verify())throw Error('Local director dependency changed');
   const prompt='<|im_start|>user\n'+[
    'You are a video director. Return exactly one JSON object and no markdown.',
    'The only allowed schema is sues-master-story/v1. Use the facts in the input; do not invent assets, timings, rights, approval, or evidence.',
    'Copy sourceSha256 and timeline fingerprint, duration, fps and timeSpace from the context.',
    'Root fields: schema, sourceSha256, timeline, visual, narrative, resources, operations.',
    'timeline has fingerprint, duration, fps and timeSpace. visual has mode. narrative has centralMessage, intendedExperience, scenes, motifs and arc.',
    'Each scene has id, start, end and purpose; scenes cover the timeline without gaps.',
    'Each operation has id, sceneId, start, end, track, effect, renderer, reason, parameters, dependsOn and requiredQA.',
    'Use only explicitly supplied capabilities, word anchors, fonts and asset candidates. A proposal must be reviewed; do not claim it is approved.',
    'INPUT JSON: '+input,
    '/no_think'
   ].join('\n')+'<|im_end|>\n<|im_start|>assistant\n';
   promptDir=mkdtempSync(join(tmpdir(),'sues-local-director-'));
   const promptPath=join(promptDir,'prompt.txt');writeFileSync(promptPath,prompt,{mode:0o600,flag:'wx'});
   const output=await new Promise((resolveOutput,reject)=>{
    let child,stdout='',size=0,settled=false,timer;
    const done=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolveOutput(value);};
    const schema={type:'object',additionalProperties:false,properties:{schema:{type:'string'},sourceSha256:{type:'string'},timeline:{type:'object'},visual:{type:'object'},narrative:{type:'object'},resources:{type:'array'},operations:{type:'array'}},required:['schema','sourceSha256','timeline','visual','narrative','resources','operations']};
    try{child=spawnProcess(deps.binary.path,['--model',deps.model.path,'--file',promptPath,'--no-display-prompt','--no-conversation','--no-context-shift','--no-warmup','--threads','1','--ctx-size','8192','--n-predict','3072','--temp','0.2','--json-schema',JSON.stringify(schema)],{stdio:['ignore','pipe','ignore'],env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'}});}
    catch(e){done(e);return;}
    timer=setTimeout(()=>{child.kill('SIGKILL');done(Error('Local director timed out'));},timeoutMs);
    child.on('error',e=>done(e));
    child.stdout.on('data',data=>{size+=data.length;if(size>60000){child.kill('SIGKILL');done(Error('Local director output too large'));}else stdout+=data.toString('utf8');});
    child.on('close',code=>code===0?done(null,stdout.trim()):done(Error('Local director process failed')));
   });
   if(!verify())throw Error('Local director dependency changed');
   return output.replace(/\s+\[end of text\]\s*$/,'').trim();
  }finally{if(promptDir)rmSync(promptDir,{recursive:true,force:true});busy=false;}
 }});
}
