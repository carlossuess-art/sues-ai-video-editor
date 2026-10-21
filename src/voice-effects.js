const assert=(condition,message)=>{if(!condition)throw Error('Voice effects: '+message);};
const PRESETS=Object.freeze(['cinematic-echo','vintage-tv']);
const numeric=n=>typeof n==='number'&&Number.isFinite(n);
export const VOICE_PRESETS=Object.freeze({
 'cinematic-echo':Object.freeze({label:'Eco cinematográfico',intention:'Dar profundidad a una frase sin ocultar la voz'}),
 'vintage-tv':Object.freeze({label:'Televisión antigua',intention:'Voz filtrada con interferencia analógica sutil'})
});
export function validateVoiceEvents(events=[]){
 assert(Array.isArray(events)&&events.length<=4,'máximo cuatro efectos de voz');
 let lastEnd=-Infinity;
 for(const e of events){
  assert(e&&typeof e==='object'&&!Array.isArray(e)&&
    Object.keys(e).every(k=>['preset','start','end','intensity'].includes(k))&&
    PRESETS.includes(e.preset)&&numeric(e.start)&&numeric(e.end)&&
    e.start>=0&&e.end-e.start>=.7&&e.end-e.start<=6&&
    numeric(e.intensity)&&e.intensity>=.1&&e.intensity<=.85&&
    e.start>=lastEnd+.15-1e-6,'preset, intensidad, duración o separación inválida');
  lastEnd=e.end;
 }
 return structuredClone(events);
}
export function prepareVoiceEffects(events=[],duration){
 const validated=validateVoiceEvents(events);
 assert(numeric(duration)&&duration>0,'duración del vídeo');
 assert(validated.every(e=>e.end<=duration-1e-6&&e.start>=.25),'fuera de la duración o comienzo protegido');
 return {version:'sues-voice-fx-v1',events:validated,originalVoice:true,
  sourceAudio:'unchanged-timestamps',stockFiles:0,humanListeningAccepted:false};
}
const secs=n=>Number(n.toFixed(5));
const wetFade=e=>secs(Math.min(.14,(e.end-e.start)/4));
export function voiceEffectsFilter(voice,duration){
 if(!voice?.events?.length)return [];
 assert(numeric(duration)&&duration>0,'duración');
 const events=validateVoiceEvents(voice.events);
 assert(events.every(e=>e.end<=duration),'efecto fuera del metraje');
 const filters=[`[audio]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=${events.length+1}[voice-dry-base]${events.map((_,i)=>`[voice-fx-source${i}]`).join('')}`];
 let dry='voice-dry-base';
 for(const [i,e]of events.entries()){
  if(e.preset!=='vintage-tv')continue;
  const next=`voice-dry-${i}`,cut=secs(.86*e.intensity);
  // Evaluated on audio frames; a short ramp avoids pops at preset boundaries.
  const window=`max(0,min(min(1,(t-${e.start})/.12),(${e.end}-t)/.12))`;
  filters.push(`[${dry}]volume='1-${cut}*${window}':eval=frame[${next}]`);
  dry=next;
 }
 const cues=[];
 for(const [i,e]of events.entries()){
  const length=secs(e.end-e.start),fade=wetFade(e),delay=Math.round(e.start*48000);
  const base=`[voice-fx-source${i}]atrim=start=${e.start}:end=${e.end},asetpts=PTS-STARTPTS`;
  const stereo='aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
  if(e.preset==='cinematic-echo'){
   const gain=secs(.10+.22*e.intensity);
   filters.push(`${base},${stereo},aecho=0.8:0.6:110|230:0.23|0.10,atrim=duration=${length},afade=t=in:d=${fade},afade=t=out:st=${secs(length-fade)}:d=${fade},volume=${gain},adelay=${delay}S:all=1[voice-wet${i}]`);
  }else{
   const gain=secs(.45+.35*e.intensity);
   filters.push(`${base},${stereo},highpass=f=320,lowpass=f=2900,acrusher=bits=10:mix=0.38,afade=t=in:d=${fade},afade=t=out:st=${secs(length-fade)}:d=${fade},volume=${gain},adelay=${delay}S:all=1[voice-wet${i}]`);
   // Procedurally generated and seeded: no third-party SFX or cost.
   filters.push(`anoisesrc=color=pink:amplitude=0.018:seed=${510+i}:sample_rate=48000:duration=${length},${stereo},afade=t=in:d=${fade},afade=t=out:st=${secs(length-fade)}:d=${fade},volume=${secs(.25*e.intensity)},adelay=${delay}S:all=1[voice-static${i}]`);
   cues.push(`[voice-static${i}]`);
  }
  cues.push(`[voice-wet${i}]`);
 }
 filters.push(`[${dry}]${cues.join('')}amix=inputs=${cues.length+1}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.93:level=0:latency=1,atrim=duration=${duration}[voice-styled]`);
 return filters;
}
