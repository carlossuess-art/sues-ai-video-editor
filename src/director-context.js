import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
export function saveDirectorJSON(file,value){const temporary=file+'.'+randomUUID()+'.tmp';writeFileSync(temporary,JSON.stringify(value),{mode:0o600,flag:'wx'});renameSync(temporary,file);}
export function directorAssets(library,directory){
 const semantics=new Map(library.semanticCatalog().assets.map(a=>[a.id,a.metadata]));
 const visual=new Map();
 for(const name of ['complete-visual-audit-v1.json','asset-visual-review-v1.json']){
  const file=join(directory,'library',name);if(!existsSync(file))continue;
  for(const row of JSON.parse(readFileSync(file,'utf8')).items??[]){if(!row.assetId)continue;const previous=visual.get(row.assetId)??{};visual.set(row.assetId,{...previous,...row,riskFlags:[...new Set([...(previous.riskFlags??[]),...(row.riskFlags??[])])]});}
 }
 return library.list().filter(a=>!/(?:QA|comprobación|revisión interna)/i.test(a.title??'')).filter(a=>!(visual.get(a.id)?.riskFlags??[]).some(f=>['visible-third-party-marking','unrelated-on-screen-text'].includes(f))).map(a=>({...a,emotions:semantics.get(a.id)?.semantics?.emotionTags??[],narrativeRoles:semantics.get(a.id)?.semantics?.narrativeRoles??[],creativeApproval:semantics.get(a.id)?.approvedForProduction===true?'approved':'review-required',visualDescription:visual.get(a.id)?.descriptionEs,visualReviewScope:visual.get(a.id)?.reviewScope??visual.get(a.id)?.scope}));
}

export function completeDirectorCatalog(catalog,settings){
 const next={...catalog,assets:catalog.assets.filter(a=>a.kind!=='audio'||Number.isFinite(a.duration)&&a.duration>=catalog.duration)};
 const keys=['styleId','captionWords','voiceGain','voiceNormalization','sfxGain','sfxEnabled','levelResources','musicAssetId','musicGain','musicEnabled','duckMusic','zoomIntensity','motions','graphicCards','transitions','videoEvents','overlayEvents','sfxEvents'];
 next.currentSettings=Object.fromEntries(keys.filter(k=>settings[k]!==undefined).map(k=>[k,structuredClone(settings[k])]));
 return next;
}
