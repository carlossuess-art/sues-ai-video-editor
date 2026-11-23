// Renderer initialization may fill missing defaults in its private copy.
// Never tolerate changes to existing edit values or arbitrary new properties.
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function assertRenderCopyParity(expected,actual,defaults){
 if(!expected||!actual||!defaults||!Number.isInteger(actual.revision)||actual.revision<expected.revision||actual.revision>expected.revision+1)throw Error('RENDER_COPY_REVISION_INVALID');
 const rootDefaults={panSchema:1,folders:[],markers:[],disabledTracks:[]};
 const walk=(a,b,path=[])=>{
  if(equal(a,b))return;
  if(Array.isArray(a)){
   if(!Array.isArray(b)||a.length!==b.length)throw Error('RENDER_COPY_ARRAY_CHANGED '+path.join('/'));
   a.forEach((v,i)=>walk(v,b[i],[...path,String(i)]));return;
  }
  if(a&&typeof a==='object'&&b&&typeof b==='object'&&!Array.isArray(b)){
   for(const k of Object.keys(a)){
    if(path.length===0&&k==='revision')continue;
    if(!Object.hasOwn(b,k))throw Error('RENDER_COPY_FIELD_LOST '+[...path,k].join('/'));
    walk(a[k],b[k],[...path,k]);
   }
   for(const k of Object.keys(b).filter(k=>!Object.hasOwn(a,k))){
    const allowed=path.length===0&&Object.hasOwn(rootDefaults,k)&&equal(rootDefaults[k],b[k])||
     path.length===2&&path[0]==='media'&&k==='folderId'&&b[k]===null||
     path.length===3&&path[0]==='clips'&&path[2]==='props'&&Object.hasOwn(defaults,k)&&equal(defaults[k],b[k]);
    if(!allowed)throw Error('RENDER_COPY_UNEXPECTED_FIELD '+[...path,k].join('/'));
   }
   return;
  }
  throw Error('RENDER_COPY_VALUE_CHANGED '+path.join('/'));
 };
 walk(expected,actual);return true;
}
