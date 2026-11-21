/** Read-only, constrained version status for SUES Studio. No restore/actions. */
const safeId=/^p_[a-zA-Z0-9_-]{2,96}$/;
export function summarizeNativeHistory({project,projectId,versionResponse}={}){
 if(!project||!Number.isInteger(project.revision)||project.revision<0||!safeId.test(projectId||'')||
   !versionResponse||versionResponse.project!==projectId||!Array.isArray(versionResponse.versions)||versionResponse.versions.length>5000)
   throw Error('Native version history does not match the active project');
 const found=new Set();let previous=Infinity;
 for(const v of versionResponse.versions){
   if(!v||!Number.isInteger(v.v)||v.v<1||found.has(v.v)||v.v>=previous||
     !Number.isInteger(v.revision)||v.revision<0||v.revision>project.revision||
     typeof v.created!=='string'||!Number.isFinite(Date.parse(v.created))||
     typeof v.name!=='string'||v.name.length>150||
     !['auto','manual'].includes(v.kind)||typeof v.final!=='boolean')
     throw Error('Unsafe or inconsistent native version history');
   found.add(v.v);previous=v.v;
 }
 const versions=versionResponse.versions.slice(0,8).map(v=>({version:v.v,revision:v.revision,
   name:v.name,kind:v.kind,created:v.created,final:v.final}));
 return {schema:'sues-engine-next-history/v1',projectId,currentRevision:project.revision,
   versionCount:versionResponse.versions.length,versions,readOnly:true,canRestore:false,
   notice:'Historial informativo: restaurar exige una operación de recuperación validada fuera de este estudio.'};
}
