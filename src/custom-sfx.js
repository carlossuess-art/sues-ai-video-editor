import {resourceLevelFilter} from './audio-levels.js';
const assert=(ok,message)=>{if(!ok)throw Error('SFX: '+message);};
const HASH=/^[a-f0-9]{64}$/;
export function validateSfxEvents(events=[]){
 assert(Array.isArray(events)&&events.length<=40,'máximo 40 sonidos por versión');
 for(const e of events)assert(e&&typeof e==='object'&&!Array.isArray(e)&&Object.keys(e).every(k=>['assetId','start','gain','sourceIn','duration'].includes(k))&&HASH.test(e.assetId)&&Number.isFinite(e.start)&&e.start>=0&&Number.isFinite(e.gain)&&e.gain>=0&&e.gain<=.7,'recurso, tiempo o volumen inválido (0–70 %)');
 for(const e of events){assert(e.sourceIn===undefined||Number.isFinite(e.sourceIn)&&e.sourceIn>=0,'sourceIn inválido');assert(e.duration===undefined||Number.isFinite(e.duration)&&e.duration>=.03&&e.duration<=30,'duration inválida');}
 assert(new Set(events.map(e=>JSON.stringify([e.assetId,e.start,e.gain,e.sourceIn??0,e.duration??null]))).size===events.length,'sonido duplicado');
 return structuredClone(events);
}
export function prepareCustomSfx(events,duration,resolveAsset,{voiceNormalized=false}={}){
 validateSfxEvents(events);const assets=[],cues=[];
 for(const e of events){
  let index=assets.findIndex(a=>a.assetId===e.assetId);
  if(index<0){const a=resolveAsset(e.assetId,'sfx');assert(a.kind==='sfx'&&a.assetId===e.assetId&&a.sha256===e.assetId&&['owned','licensed'].includes(a.rights)&&typeof a.localFile==='string'&&Number.isFinite(a.duration)&&a.duration>=.03&&a.duration<=30,'recurso no válido o no verificado');index=assets.length;assets.push({assetId:a.assetId,sha256:a.sha256,kind:'sfx',rights:a.rights,title:a.title,duration:a.duration,localFile:a.localFile});}
  const sourceIn=e.sourceIn??0,length=e.duration??(assets[index].duration-sourceIn);assert(length>=.03&&sourceIn+length<=assets[index].duration+1e-6,'recorte fuera del sonido');const end=e.start+length;assert(end<=duration+1e-6,'el sonido completo debe caber dentro del vídeo');
  cues.push({...e,end,input:index});
 }
 for(const e of cues)assert(cues.filter(c=>c.start<=e.start&&c.end>e.start).length<=3,'máximo tres sonidos simultáneos');
 return {assets,events:cues,ducking:true,duck:voiceNormalized?{threshold:.12,ratio:2,attack:5,release:100}:{threshold:.03,ratio:4,attack:5,release:100},humanListeningAccepted:false};
}
export function customSfxFilter(sfx,duration,inputIndex,base){
 if(!sfx?.events?.length)return [];
 const d=sfx.duck??{threshold:.03,ratio:4,attack:5,release:100};
 assert([d.threshold,d.ratio,d.attack,d.release].every(Number.isFinite)&&d.threshold>0&&d.threshold<=1&&d.ratio>=1&&d.ratio<=8&&d.attack>=1&&d.attack<=100&&d.release>=50&&d.release<=1000,'duck profile');
 const filters=[`[${base}]asplit=2[custom-main][custom-key]`];
 for(const [i,a]of sfx.assets.entries()){
  const uses=sfx.events.map((e,j)=>e.input===i?j:-1).filter(j=>j>=0);
  filters.push(`[${inputIndex+i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=duration=${a.duration},asetpts=PTS-STARTPTS,asplit=${uses.length}${uses.map(j=>`[custom-source${j}]`).join('')}`);
 }
 sfx.events.forEach((e,i)=>{const d=e.end-e.start,fade=Math.min(.01,d/4);filters.push(`[custom-source${i}]atrim=start=${e.sourceIn??0}:duration=${d},asetpts=PTS-STARTPTS,afade=t=in:d=${fade},afade=t=out:st=${d-fade}:d=${fade},${sfx.levelResources?resourceLevelFilter(d):''}volume=${e.gain},adelay=${Math.round(e.start*48000)}S:all=1[custom-cue${i}]`);});
 filters.push(`anullsrc=r=48000:cl=stereo:d=${duration},aformat=sample_fmts=fltp[custom-silence]`);
 filters.push(`[custom-silence]${sfx.events.map((_,i)=>`[custom-cue${i}]`).join('')}amix=inputs=${sfx.events.length+1}:duration=first:dropout_transition=0:normalize=0[custom-bus]`);
 filters.push('[custom-bus][custom-key]sidechaincompress=threshold='+d.threshold+':ratio='+d.ratio+':attack='+d.attack+':release='+d.release+':makeup=1[custom-ducked]');
 filters.push(`[custom-main][custom-ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95:level=0:latency=1,atrim=duration=${duration}[mixed-audio]`);
 return filters;
}
