"use strict";
const fs=require('fs'),path=require('path'),r=__dirname,a=r+'/app',d=r+'/data',Reuse=require(a+'/sues-export-reuse.cjs'),Win=require(a+'/sues-window-reuse.cjs'),S=require(a+'/sues-window-cache.cjs');
const p=JSON.parse(fs.readFileSync(d+'/project.json')),prev=JSON.parse(fs.readFileSync(d+'/analysis/q03-typography-rev28-pre-caption-lift.json'));
if(p.revision!==29||prev.revision!==28)throw Error('unexpected revision');
const keys=q=>{
 const stable={...q,clips:[],revision:null,name:null}; delete stable.comps;
 const proof=Reuse.fingerprint({projectFile:d+'/project.json',appDir:a,profile:'webcodecs:resident-16Mbps',chunkFrames:180,snapshotRaw:Buffer.from(JSON.stringify(stable))});
 const renderer=S.shaFile(a+'/sues-segmented-export.js')+':'+S.shaFile(a+'/sues-window-reuse.cjs');
 return Win.windows(q,{frames:1667,fps:30,chunkFrames:180,globalMediaProof:proof,rendererProof:renderer,compScoped:true});
};
const old=keys(prev),now=keys(p);
const hit=S.lookup({exportsDir:d+'/exports',windows:old,frames:1667,fps:30});
if(hit?.reused!==10)throw Error('source master not verified '+hit?.reused);
const reused=S.lookup({exportsDir:d+'/exports',windows:now,frames:1667,fps:30});
const changed=now.map((w,i)=>w.key!==old[i].key?i:null).filter(x=>x!==null);
if(reused?.reused!==9||changed.length!==1||changed[0]!==0)throw Error('wrong targeted window '+JSON.stringify({hit:reused?.reused,changed}));
console.log(JSON.stringify({source:hit.file,sourceSha:hit.sha256,reused:reused.reused,changedWindow:changed}));
