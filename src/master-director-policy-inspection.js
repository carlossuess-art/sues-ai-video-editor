// Read-only policy inspection: no library constructor, uploads, changes or deletion.
import {lstatSync,readFileSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';
import {fileSha256} from './local-pipeline.js';
import {validateAssetMetadata} from './asset-metadata.js';
import {buildMasterDirectorPolicy} from './master-director-policy-builder.js';
const HASH=/^[a-f0-9]{64}$/;
function regular(path,max){
 const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size<1||st.size>max)throw Error('asset file unavailable');return st;
}
// The caller supplies IDs of explicitly selected masters, never a creative prompt.
// Approved metadata references are assertions, not independent proof of their contents.
export function inspectMasterPolicyCandidates({directory,masters,approvedRulesText}){
 if(typeof directory!=='string'||!isAbsolute(directory)||resolve(directory)!==directory)throw Error('Absolute normalized asset directory required');
 const dir=lstatSync(directory),metadataDir=lstatSync(join(directory,'metadata-v2'));
 if(!dir.isDirectory()||dir.isSymbolicLink()||!metadataDir.isDirectory()||metadataDir.isSymbolicLink())throw Error('Unsafe asset directory');
 const checked=new Map();
 const assets={resolve(id){
  if(!HASH.test(id??''))throw Error('Invalid master resource ID');
  if(checked.has(id))return checked.get(id);
  const recordPath=join(directory,id+'.json'),mediaPath=join(directory,id+'.media');
  regular(recordPath,65536);const record=JSON.parse(readFileSync(recordPath,'utf8'));
  const media=regular(mediaPath,40*1024*1024);
  if(record.id!==id||!['image','video','overlay','audio','sfx'].includes(record.kind)||
     !Number.isSafeInteger(record.bytes)||record.bytes!==media.size||fileSha256(mediaPath)!==id)throw Error('Asset integrity changed');
  const result={...record,sha256:id};checked.set(id,result);return result;
 },metadata(id){
  const asset=this.resolve(id),metadata=join(directory,'metadata-v2',id+'.json');regular(metadata,65536);
  return validateAssetMetadata(JSON.parse(readFileSync(metadata,'utf8')),asset);
 }};
 return buildMasterDirectorPolicy({approvedRulesText,masters,assets});
}
