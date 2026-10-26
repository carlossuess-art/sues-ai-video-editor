import {loadAuditedDrive,auditedCandidates} from './drive-resource-library.js';
import {readFileSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {loadTemporalAudit} from './scene-temporal-qa.js';

// Local-only discovery. Names in the 309-source index are uninspected hints,
// never proof of scene content, license, or render eligibility.
const SYNONYMS={
 opresion:['bloqueo','cadena','tension','pesadez','reloj','estres'],
 bloqueo:['opresion','cadena','tension'],presion:['reloj','tiempo','urgencia','tension'],
 estres:['presion','tension','reloj'],transformacion:['esperanza','sendero','camino','amanecer','libertad'],
 esperanza:['transformacion','amanecer','sendero'],revelacion:['chispas','luz','destello','energia'],
 luz:['destello','chispas','amanecer'],elementos:['circulos','linea','diagrama','enumeracion'],
 comparacion:['diagrama','lineas','estructura'],television:['voz','interferencia','vintage-tv']
};
const STOP=new Set(['un','una','de','del','el','la','los','las','en','al','para','que','ponga','poner','quiero','crear','efecto','segundo','durante','con',
 'hacia','desde','hasta','sin','sobre','por','pero','aunque','si','no','ni',
 'yo','tu','mi','me','se','nos','te','su','sus','es','son','soy','era','ser','estar',
 'como','muy','mas','aqui','alli','esto','esta','este','estos','estas','hay','fue',
 'todo','todos','todas','otro','otra','otros','otras','entonces']);
const tokens=(text)=>new Set(String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9-]+/g)?.filter(w=>w.length>2&&!STOP.has(w))??[]);
const intersections=(a,b)=>[...a].filter(x=>b.has(x)).length;
// This separate private review is created only after inspecting a *sample* of actual frames.
 // Absence of flags is not a clean bill for an entire asset. A text/branding flag blocks
 // autonomous recommendations, without changing the manual asset-picker contract.
const VISUAL_FLAGS=new Set(['visible-third-party-marking','person-visible','unrelated-on-screen-text']);
const SCENE_TAGS=new Set(['analog-clock','person-walking-outdoors','industrial-chain-in-water','mountain-sunrise']);
const loadVisualReview=(root)=>{
 const p=join(root,'asset-visual-review-v1.json');let stat;
 try{stat=lstatSync(p);}catch(error){if(error?.code==='ENOENT')return new Map();throw error;}
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<2||stat.size>65536)throw Error('Unsafe visual review index');
 const data=safeJSON(p,65536);
 if(data?.schema!=='sues-asset-visual-review/v1'||!Array.isArray(data.items)||data.items.length>128)throw Error('Invalid visual review index');
 const reviews=new Map();
 for(const value of data.items){
  if(!value||!(/^[a-f0-9]{64}$/).test(value.assetId)||reviews.has(value.assetId)||
    value.scope!=='sampled-frames-only'||!Array.isArray(value.sampleSeconds)||value.sampleSeconds.length<1||value.sampleSeconds.length>8||
    !value.sampleSeconds.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=600)||
    !Array.isArray(value.riskFlags)||value.riskFlags.length>3||new Set(value.riskFlags).size!==value.riskFlags.length||
    !value.riskFlags.every(x=>VISUAL_FLAGS.has(x))||
    (value.sceneTags!==undefined&&(!Array.isArray(value.sceneTags)||value.sceneTags.length>3||
     new Set(value.sceneTags).size!==value.sceneTags.length||!value.sceneTags.every(x=>SCENE_TAGS.has(x)))))throw Error('Invalid visual review entry');
  reviews.set(value.assetId,{scope:value.scope,sampleCount:value.sampleSeconds.length,riskFlags:[...value.riskFlags],sceneTags:[...(value.sceneTags??[])]});
 }
 return reviews;
};

const safeJSON=(p,maxBytes)=>{
 const s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size<2||s.size>maxBytes)throw Error('Unsafe private library index');
 return JSON.parse(readFileSync(p,'utf8'));
};
export function loadPrivateLibraryIndex(jobsDirectory){
 const root=resolve(jobsDirectory,'library'),d=lstatSync(root);
 if(!d.isDirectory()||d.isSymbolicLink())throw Error('Private library index unavailable');
 const official=safeJSON(join(root,'official-library-v1.json'),2*1024*1024);
 const remote=safeJSON(join(root,'purchased-source-index-309-v1.json'),6*1024*1024);
 if(!Array.isArray(official.runtimeItems)||!Array.isArray(remote.items))throw Error('Invalid library index');
 return {official,remote,audited:loadAuditedDrive(jobsDirectory),visualReviews:loadVisualReview(root)};
}
// Reuse only editor-installed scene media with partial human frame tags and trusted,
// whitelisted V2 technical/licensing metadata. Never put private origin/proof/path in API.
export function reviewedNarrativeVideos(jobsDirectory,index){
 const {official,visualReviews,audited}=index;
 const temporal=loadTemporalAudit(jobsDirectory);
 const dirname=resolve(jobsDirectory,'assets','metadata-v2');
 let st;try{st=lstatSync(dirname);}catch(e){if(e?.code==='ENOENT')return [];throw e;}
 if(!st.isDirectory()||st.isSymbolicLink())throw Error('Unsafe asset metadata directory');
 const out=[];
 for(const item of official.runtimeItems){
  if(item.selectionExcluded===true||item.id==='917ae5425b86ad0d4ef68e1e449567e7c341189e95f3667ed6cd15177e984254'||audited?.excludedHashes.has(item.id))continue;
  if(item.kind!=='video'||item.storedInEditor!==true||!/^[a-f0-9]{64}$/.test(item.id))continue;
  const sample=visualReviews?.get(item.id);
  if(!sample?.sceneTags.length||sample.riskFlags.some(x=>x==='visible-third-party-marking'||x==='unrelated-on-screen-text'))continue;
  const file=join(dirname,item.id+'.json');let doc;
  try{doc=safeJSON(file,65536);}catch(e){if(e?.code==='ENOENT')continue;throw e;}
  if(doc?.assetId!==item.id||doc.sha256!==item.id||doc.kind!=='video')continue;
  if(doc.license?.rightsStatus!=='verified'||doc.license.commercialUseAllowed!==true)continue;
  if(!doc.semantics?.profileCompatibility?.includes('DOPAMIN'))continue;
  const {durationSec,width,height}=doc.technical??{};
  if(!Number.isFinite(durationSec)||durationSec<2.5||!Number.isInteger(width)||!Number.isInteger(height)||height<=width)continue;
  const narrativeRoles=Array.isArray(doc.semantics.narrativeRoles)?doc.semantics.narrativeRoles.filter(x=>typeof x==='string').slice(0,8):[];
  const measurement=temporal.get(item.id);
  // Published ID and real video metadata must refer to exactly the same duration.
  const verified=measurement&&Math.abs(measurement.durationSec-durationSec)<=.15?measurement:null;
  out.push({id:item.id,title:item.titleEs,kind:'video',sceneTags:[...sample.sceneTags],
   sampleCount:sample.sampleCount,riskFlags:[...sample.riskFlags],narrativeRoles,
   duration:durationSec,width,height,approvedForProduction:doc.approvedForProduction===true,
   temporal:verified});
 }
 return out;
}

export function searchPrivateLibrary(jobsDirectory,query,{limit=8,index}={}){
 if(typeof query!=='string'||!query.trim()||query.length>250||!Number.isInteger(limit)||limit<1||limit>20)throw Error('Consulta no válida');
 const {official,remote,visualReviews,audited}=index??loadPrivateLibraryIndex(jobsDirectory);
 const excluded=item=>item.selectionExcluded===true||item.id==='917ae5425b86ad0d4ef68e1e449567e7c341189e95f3667ed6cd15177e984254'||audited?.excluded.has(item.driveId??item.id)||audited?.excludedHashes.has(item.id);
 if(!Array.isArray(official?.runtimeItems)||!Array.isArray(remote?.items))throw Error('Invalid library index');
 const exact=tokens(query),expanded=new Set(exact);
 for(const word of exact)for(const w of (SYNONYMS[word]??[]))expanded.add(w);
 const results=[];
 for(const item of official.runtimeItems){
  if(excluded(item))continue;
  const text=[item.titleEs,...(Array.isArray(item.keywords)?item.keywords:[]),...(Array.isArray(item.emotionTags)?item.emotionTags:[])].join(' ');
  const t=tokens(text),exactTerms=[...exact].filter(term=>t.has(term)).sort();
  const expandedTerms=[...expanded].filter(term=>!exact.has(term)&&t.has(term)).sort();
  const score=exactTerms.length*12+expandedTerms.length*2;
  if(score<1)continue;
  // These are lexical matches in metadata, NOT verified visual or narrative suitability.
  const sampled=visualReviews?.get(item.id);
  results.push({id:item.id,title:item.titleEs,kind:item.kind,availability:item.storedInEditor===true?'private-operational':'reference-only',creativeApproval:item.approvedForProduction===true?'approved':'review-required',score,
   lexicalEvidence:{exactTerms,expandedTerms},
   visualReview:sampled?{scope:sampled.scope,sampleCount:sampled.sampleCount,riskFlags:[...sampled.riskFlags],sceneTags:[...sampled.sceneTags]}:null});
 }
 for(const item of remote.items){
  if(item.installedInEditor||excluded(item)||audited?.cards.some(c=>c.driveId===item.id&&c.visibleContentEs))continue;
  const text=[item.originalName,...(Array.isArray(item.categoryHint)?item.categoryHint:[])].join(' ');
  const t=tokens(text),score=intersections(exact,t)*4+intersections(expanded,t);
  if(score<2)continue;
  results.push({id:item.id,title:item.originalName,kind:'source-reference',availability:'remote-drive-only',creativeApproval:'visual-inspection-required',score});
 }
 for(const c of auditedCandidates(audited??{cards:[],excluded:new Set()})){
  const t=tokens([c.editorialTitleEs,c.visibleContentEs,...(c.proposedUsesEs??[])].join(' '));
  const exactTerms=[...exact].filter(term=>t.has(term)).sort(),expandedTerms=[...expanded].filter(term=>!exact.has(term)&&t.has(term)).sort();
  const score=exactTerms.length*12+expandedTerms.length*2;if(!score)continue;
  const meta=join(jobsDirectory,'assets',c.sha256+'.json'),media=join(jobsDirectory,'assets',c.sha256+'.media');
  let installed=false;try{const record=safeJSON(meta,65536),st=lstatSync(media);installed=record.id===c.sha256&&record.kind==='video'&&record.bytes===c.bytes&&['owned','licensed'].includes(record.rights)&&st.isFile()&&!st.isSymbolicLink()&&st.size===c.bytes;}catch(e){if(e?.code!=='ENOENT')throw e;}
  if(installed&&results.some(r=>r.id===c.sha256))continue;
  results.push({id:installed?c.sha256:c.driveId,driveId:c.driveId,catalogueNumber:c.catalogueNumber,title:c.editorialTitleEs??c.visibleContentEs,kind:'video',availability:installed?'private-operational':'remote-drive-only',creativeApproval:'review-required',score,
   lexicalEvidence:{exactTerms,expandedTerms},needsMaterialization:!installed,
   visualReview:{scope:'sampled-frames-only',sampleCount:c.sampleReviewCount,riskFlags:[...(c.riskFlags??[])],sceneTags:[]},description:c.visibleContentEs,proposedUses:c.proposedUsesEs??[],fragmentApproved:c.fragmentApproved===true});
 }
 const rank={'private-operational':0,'reference-only':1,'remote-drive-only':2};
 results.sort((a,b)=>b.score-a.score||(rank[a.availability]??3)-(rank[b.availability]??3)||String(a.title).localeCompare(String(b.title),'es'));
 return {schema:'sues-private-library-search/v1',query,sourceIndexOnly:true,approvedToAutoPublish:false,
  results:results.slice(0,limit),
  rule:'Recursos locales y fichas Drive por muestras. Los remotos requieren materialización explícita con derechos declarados, validación técnica y revisión del fragmento; no aprobación automática.'};
}
