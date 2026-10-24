// FFmpeg temporal evidence is technical, not an interpretation of scene meaning or licensing.
import {lstatSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const HASH=/^[a-f0-9]{64}$/;
export const round3=n=>Math.round(n*1000)/1000;
export function parseTemporalFFmpeg(log,duration){
 if(typeof log!=='string'||!Number.isFinite(duration)||duration<=0||duration>600)throw Error('Invalid temporal audit input');
 const cuts=[...log.matchAll(/pts_time:\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]))
  .filter(x=>x>.10&&x<duration-.10).sort((a,b)=>a-b);
 const uniq=cuts.filter((x,i)=>i===0||x-cuts[i-1]>.2).map(round3);
 const intervals=[];
 for(const m of log.matchAll(/black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/g)){
  const a=Number(m[1]),b=Number(m[2]);
  if(Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>a&&b<=duration+.25)intervals.push([round3(a),round3(Math.min(duration,b))]);
 }
 const freezeStarts=[...log.matchAll(/freeze_start:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
 const freezeEnds=[...log.matchAll(/freeze_end:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
 const freezes=freezeStarts.map((a,i)=>[round3(a),round3(Math.min(duration,freezeEnds[i]??duration))])
  .filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>a);
 return {sceneCutTimes:uniq,blackIntervals:intervals,freezeIntervals:freezes};
}
export function selectCutSafeRange({durationSec,sceneCutTimes=[],blackIntervals=[]},requiredSec,{guardSec=.12}={}){
 if(!Number.isFinite(durationSec)||!Number.isFinite(requiredSec)||requiredSec<=0||requiredSec>20||durationSec<requiredSec)return null;
 if(!Array.isArray(sceneCutTimes)||!Array.isArray(blackIntervals)||!Number.isFinite(guardSec)||guardSec<0||guardSec>.5)return null;
 let slots=[[0,durationSec]];
 for(const cut of sceneCutTimes)if(Number.isFinite(cut)&&cut>0&&cut<durationSec){
  slots=slots.flatMap(([a,b])=>cut>a&&cut<b?[[a,Math.max(a,cut-guardSec)],[Math.min(b,cut+guardSec),b]]:[[a,b]]);
 }
 for(const pair of blackIntervals){
  if(!Array.isArray(pair)||pair.length!==2||!pair.every(Number.isFinite))return null;
  const [lo,hi]=pair;
  slots=slots.flatMap(([a,b])=>hi>a&&lo<b?
    [[a,Math.max(a,lo-guardSec)],[Math.min(b,hi+guardSec),b]].filter(([l,r])=>r>l):[[a,b]]);
 }
 const options=slots.filter(([a,b])=>b-a>=requiredSec).sort((a,b)=>(b[1]-b[0])-(a[1]-a[0])||a[0]-b[0]);
 if(!options.length)return null;
 const [a,b]=options[0];
 const start=round3(a+Math.max(0,(b-a-requiredSec)/2));
 return {startSec:start,endSec:round3(start+requiredSec),source:'full-timeline-cut-black-analysis',appliedToVideo:false};
}
export function loadTemporalAudit(jobsDirectory){
 const root=resolve(jobsDirectory,'library'),p=join(root,'asset-temporal-audit-v1.json');
 if(lstatSync(root).isSymbolicLink())throw Error('Unsafe private library root');
 let s;try{s=lstatSync(p);}catch(e){if(e?.code==='ENOENT')return new Map();throw e;}
 if(s.isSymbolicLink()||!s.isFile()||s.size<5||s.size>65536)throw Error('Unsafe private temporal audit');
 const obj=JSON.parse(readFileSync(p,'utf8'));
 if(obj?.schema!=='sues-broll-temporal-audit/v1'||!Array.isArray(obj.entries)||obj.entries.length>128)throw Error('Invalid temporal audit');
 const result=new Map();
 for(const x of obj.entries){
  if(!x||!HASH.test(x.assetId)||x.sha256!==x.assetId||x.scope!=='ffmpeg-full-duration-technical'||x.complete!==true||
  !Number.isFinite(x.durationSec)||x.durationSec<.3||x.durationSec>600||
  !Number.isInteger(x.videoFrames)||x.videoFrames<1||x.videoFrames>150000||
  !Array.isArray(x.sceneCutTimes)||x.sceneCutTimes.length>100||
  !x.sceneCutTimes.every(t=>Number.isFinite(t)&&t>0&&t<x.durationSec)||
  !Array.isArray(x.blackIntervals)||x.blackIntervals.length>100||
  !x.blackIntervals.every(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)&&v[0]>=0&&v[1]>v[0]&&v[1]<=x.durationSec)||
  !Array.isArray(x.freezeIntervals)||x.freezeIntervals.length>100||
  !x.freezeIntervals.every(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)&&v[0]>=0&&v[1]>v[0]&&v[1]<=x.durationSec)||
  result.has(x.assetId))throw Error('Invalid temporal audit entry');
  result.set(x.assetId,{scope:x.scope,complete:true,durationSec:x.durationSec,videoFrames:x.videoFrames,
   sceneCutTimes:[...x.sceneCutTimes],blackIntervals:x.blackIntervals.map(y=>[...y]),freezeIntervals:x.freezeIntervals.map(y=>[...y])});
 }
 return result;
}
