/** Pure fail-closed inventory before preview/exporting a cloned FableCut scene.
 * Never treats a project JSON or media filename as proof of actual bytes or rights.
 * Caller must supply verified regular-file basenames (not symlinks).
 */
// FableCut encodes each filename with encodeURIComponent (including spaces and Unicode).
// Accept only canonical, single URL path segments; never decoded separators or controls.
const BAD_NAME=/[\/\\\x00-\x1f\x7f]/;
export function inspectNativeMediaDependencies(project, availableNames){
 if(!project||!Array.isArray(project.media)||!Array.isArray(project.clips)||!(availableNames instanceof Set))
  throw Error('Native project and verified media inventory required');
 const ids=new Set(),referenced=new Set(project.clips.map(c=>c?.mediaId).filter(Boolean));
 const assets=[];
 for(const m of project.media){
  if(!m||typeof m.id!=='string'||ids.has(m.id)||typeof m.src!=='string'||
     !m.src.startsWith('/media/'))throw Error('Invalid or duplicate native media entry');
  ids.add(m.id);
  const encoded=m.src.slice('/media/'.length);
  let name;try{name=decodeURIComponent(encoded);}catch{throw Error('Unsafe media URL encoding');}
  if(!name||name.length>200||name==='.'||name==='..'||BAD_NAME.test(name)||encodeURIComponent(name)!==encoded)
   throw Error('Unsafe native media path');
  assets.push({id:m.id,filename:name,usedByClip:referenced.has(m.id),present:availableNames.has(name)});
 }
 for(const ref of referenced)if(!ids.has(ref))throw Error('Native clip references a missing media ID');
 return {schema:'sues-native-media-preflight/v1',assetCount:assets.length,
   presentCount:assets.filter(x=>x.present).length,
   missing:assets.filter(x=>!x.present).map(x=>({id:x.id,filename:x.filename,usedByClip:x.usedByClip})),
   missingUsed:assets.filter(x=>!x.present&&x.usedByClip).length,
   editableProjectPortable:assets.every(x=>x.present),
   playbackReady:assets.every(x=>x.present||!x.usedByClip)};
}
