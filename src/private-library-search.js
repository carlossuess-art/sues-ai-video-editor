import {readFileSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';

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
const STOP=new Set(['un','una','de','del','el','la','los','las','en','al','para','que','ponga','poner','quiero','crear','efecto','segundo','durante','con']);
const tokens=(text)=>new Set(String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9-]+/g)?.filter(w=>w.length>2&&!STOP.has(w))??[]);
const intersections=(a,b)=>[...a].filter(x=>b.has(x)).length;
const safeJSON=(p,maxBytes)=>{
 const s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size<2||s.size>maxBytes)throw Error('Unsafe private library index');
 return JSON.parse(readFileSync(p,'utf8'));
};
export function searchPrivateLibrary(jobsDirectory,query,{limit=8}={}){
 if(typeof query!=='string'||!query.trim()||query.length>250||!Number.isInteger(limit)||limit<1||limit>20)throw Error('Consulta no válida');
 const root=resolve(jobsDirectory,'library'),d=lstatSync(root);if(!d.isDirectory()||d.isSymbolicLink())throw Error('Private library index unavailable');
 const official=safeJSON(join(root,'official-library-v1.json'),2*1024*1024);
 const remote=safeJSON(join(root,'purchased-source-index-309-v1.json'),6*1024*1024);
 if(!Array.isArray(official.runtimeItems)||!Array.isArray(remote.items))throw Error('Invalid library index');
 const exact=tokens(query),expanded=new Set(exact);
 for(const word of exact)for(const w of (SYNONYMS[word]??[]))expanded.add(w);
 const results=[];
 for(const item of official.runtimeItems){
  const text=[item.titleEs,...(Array.isArray(item.keywords)?item.keywords:[]),...(Array.isArray(item.emotionTags)?item.emotionTags:[])].join(' ');
  const t=tokens(text),score=intersections(exact,t)*10+intersections(expanded,t)*2;
  if(score<1)continue;
  results.push({id:item.id,title:item.titleEs,kind:item.kind,availability:item.storedInEditor===true?'private-operational':'reference-only',creativeApproval:item.approvedForProduction===true?'approved':'review-required',score});
 }
 for(const item of remote.items){
  if(item.installedInEditor)continue;
  const text=[item.originalName,...(Array.isArray(item.categoryHint)?item.categoryHint:[])].join(' ');
  const t=tokens(text),score=intersections(exact,t)*4+intersections(expanded,t);
  if(score<2)continue;
  results.push({id:item.id,title:item.originalName,kind:'source-reference',availability:'remote-drive-only',creativeApproval:'visual-inspection-required',score});
 }
 const rank={'private-operational':0,'reference-only':1,'remote-drive-only':2};
 results.sort((a,b)=>(rank[a.availability]??3)-(rank[b.availability]??3)||b.score-a.score||String(a.title).localeCompare(String(b.title),'es'));
 return {schema:'sues-private-library-search/v1',query,sourceIndexOnly:true,approvedToAutoPublish:false,
  results:results.slice(0,limit),
  rule:'Sugerencias: no descargar, aprobar ni insertar medios sin verificar procedencia, licencia, semántica y compatibilidad.'};
}
