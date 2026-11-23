"use strict";
const fs=require('fs'),r=__dirname,a=r+'/app',d=r+'/data',R=require(a+'/sues-export-reuse.cjs'),W=require(a+'/sues-window-reuse.cjs'),S=require(a+'/sues-window-cache.cjs');
const current=JSON.parse(fs.readFileSync(d+'/project.json','utf8')),old=JSON.parse(fs.readFileSync(d+'/analysis/q03-r32-before-brains-overlay.json','utf8'));
if(old.revision!==32||current.revision!==33||current.media.length!==old.media.length+1)throw Error('unexpected revisions/media');
const before={...old,media:current.media};
const oldById=new Map(old.clips.map(c=>[c.id,c]));
const changed=current.clips.filter(c=>JSON.stringify(c)!==JSON.stringify(oldById.get(c.id))).map(x=>x.id);
const removed=old.clips.filter(c=>!current.clips.some(x=>x.id===c.id)).map(c=>c.id);
if(JSON.stringify(changed.sort())!==JSON.stringify(['SC01-BRAIN-MIRROR-CHROMA','SC01-TITLE','V5-SC01-CAP02-1','V5-SC01-CAP03-0'].sort())||JSON.stringify(removed)!==JSON.stringify(['SC08-OBSERVADOR-FOCUS-RING']))throw Error('unapproved clip diffs '+JSON.stringify({changed,removed}));
const fp=p=>{
 const stable={...p,clips:[],revision:null,name:null};delete stable.comps;
 const global=R.fingerprint({projectFile:d+'/project.json',appDir:a,profile:'webcodecs:resident-16Mbps',chunkFrames:180,snapshotRaw:Buffer.from(JSON.stringify(stable))});
 const renderer=S.shaFile(a+'/sues-segmented-export.js')+':'+S.shaFile(a+'/sues-window-reuse.cjs');
 return W.windows(p,{frames:1667,fps:30,chunkFrames:180,globalMediaProof:global,rendererProof:renderer,compScoped:true})
};
const oldW=fp(before),nowW=fp(current);
if(oldW.length!==10||nowW.length!==10)throw Error('window plan mismatch');
const invalid=oldW.map((w,i)=>w.key===nowW[i].key?null:i).filter(i=>i!==null);
if(JSON.stringify(invalid)!=='[0,5]')throw Error('unexpected invalid windows '+JSON.stringify(invalid));
const mp4=d+'/exports/SUES_export_xs_82c6624a1ff2.mp4',sha=S.shaFile(mp4);
if(sha!=='54eea1b5b5011e65317326f508969221ea78cca5b5c48f237bd2e407cde4db23')throw Error('unverified source master');
if(!S.remember({exportsDir:d+'/exports',src:'/exports/SUES_export_xs_82c6624a1ff2.mp4',windows:oldW,frames:1667,fps:30}))throw Error('manifest write failed');
const check=S.lookup({exportsDir:d+'/exports',windows:nowW,frames:1667,fps:30});
if(check?.reused!==8)throw Error('expected 8 reusable windows, got '+check?.reused);
console.log(JSON.stringify({sha,changed,removed,invalid,reusable:check.reused,master:check.file}));
