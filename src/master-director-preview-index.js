import {readdirSync,lstatSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {join,resolve,dirname,basename} from 'node:path';
import {fileSha256} from './local-pipeline.js';
const DIR=/^master-preview-[A-Za-z0-9]{6}$/;
const HASH=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function regular(path){const st=lstatSync(path);return st.isFile()&&!st.isSymbolicLink();}
function validOutput(root,path){
 const parent=dirname(resolve(path));if(dirname(parent)!==resolve(root)||!DIR.test(basename(parent))||basename(path)!=='preview.mp4')throw Error('Invalid preview location');
 const st=lstatSync(parent);if(!st.isDirectory()||st.isSymbolicLink()||!regular(path))throw Error('Invalid preview file');return parent;
}
export function sealMasterPreview(root,path,seal){
 const parent=validOutput(root,path),r=seal?.record,a=seal?.audit;
 if(seal?.schema!=='sues-master-preview-seal/v1'||!UUID.test(seal.requestId??'')||!UUID.test(r?.id??'')||
    !HASH.test(r?.outputSha256??'')||a?.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||a.outputSha256!==r.outputSha256||
    lstatSync(path).size!==r.bytes||fileSha256(path)!==r.outputSha256)throw Error('Preview seal invalid');
 writeFileSync(join(parent,'verified.json'),JSON.stringify(seal),{flag:'wx',mode:0o600});
}
export function findMasterPreview(root,{previewId,requestId}={}){
 if(previewId!==undefined&&!UUID.test(previewId)||requestId!==undefined&&!UUID.test(requestId))throw Error('Invalid preview identifier');
 if(!existsSync(root))return null;
 const names=readdirSync(root);if(names.length>1000)throw Error('Preview index limit');
 let found=null;
 for(const name of names){
  if(!DIR.test(name))continue;
  try{
   const parent=join(root,name),st=lstatSync(parent);if(!st.isDirectory()||st.isSymbolicLink())continue;
   const sealPath=join(parent,'verified.json');if(!regular(sealPath)||lstatSync(sealPath).size>262144)continue;
   const seal=JSON.parse(readFileSync(sealPath,'utf8'));
   if(previewId!==undefined&&seal.record?.id!==previewId||requestId!==undefined&&seal.requestId!==requestId)continue;
   if(found)throw Error('Duplicate preview identifier');
   const file=join(parent,'preview.mp4'),r=seal.record,a=seal.audit;
   if(seal.schema!=='sues-master-preview-seal/v1'||!UUID.test(seal.requestId??'')||!UUID.test(r?.id??'')||
      !HASH.test(r?.outputSha256??'')||a?.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||a.outputSha256!==r.outputSha256||
      !regular(file)||lstatSync(file).size!==r.bytes||fileSha256(file)!==r.outputSha256)throw Error('Preview integrity failure');
   found={file,seal};
  }catch(e){if(e.code!=='ENOENT')throw e;}
 }
 return found;
}

export function discardUnsealedMasterPreview(root,path){
 const parent=validOutput(root,path);if(existsSync(join(parent,'verified.json')))throw Error('Cannot discard verified preview');
 rmSync(parent,{recursive:true,force:true});
}

// Listing is metadata-only; media hash is verified again when opened.
export function listMasterPreviews(root){
 if(!existsSync(root))return [];
 const names=readdirSync(root);if(names.length>1000)throw Error('Preview index limit');const items=[];
 for(const name of names){
  if(!DIR.test(name))continue;
  try{const parent=join(root,name),st=lstatSync(parent);if(!st.isDirectory()||st.isSymbolicLink())continue;
   const sealPath=join(parent,'verified.json');if(!regular(sealPath)||lstatSync(sealPath).size>262144)continue;
   const seal=JSON.parse(readFileSync(sealPath,'utf8')),r=seal.record,a=seal.audit;
   if(seal.schema!=='sues-master-preview-seal/v1'||!UUID.test(r?.id??'')||!UUID.test(seal.requestId??'')||
      !HASH.test(r?.outputSha256??'')||a?.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||a.outputSha256!==r.outputSha256)continue;
   items.push({previewId:r.id,revision:seal.revision,createdAt:r.createdAt??new Date(st.mtimeMs).toISOString(),durationFrames:r.durationFrames??null,fps:r.fps??null,quality:r.quality??'preview',width:r.width??null,height:r.height??null,final:false});
  }catch(e){if(e.code!=='ENOENT')throw e;}
 }
 return items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.previewId.localeCompare(b.previewId));
}
