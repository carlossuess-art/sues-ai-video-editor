import {customSfxFilter} from './custom-sfx.js';
import {voiceEffectsFilter} from './voice-effects.js';
import {secretRevealTime} from './graphic-timing.js';
import {backgroundAudioFilter} from './audio-mix.js';
const assert=(ok,msg)=>{if(!ok)throw Error('Sound effects: '+msg);};
// Original deterministic synthesis recipes. No stock downloads or external models.
export const SOUND_PRESETS=Object.freeze({
 whoosh:{duration:.36,source:'anoisesrc=color=pink:amplitude=0.16:seed=731:sample_rate=48000:duration=0.36,highpass=f=700,lowpass=f=4800',attack:.08},
 impact:{duration:.22,source:"aevalsrc='0.22*sin(2*PI*(100*t-80*t*t))*exp(-24*t)+0.04*sin(2*PI*1200*t)*exp(-70*t)':s=48000:d=0.22",attack:.005},
 draw:{duration:.36,source:'anoisesrc=color=white:amplitude=0.055:seed=947:sample_rate=48000:duration=0.36,highpass=f=1500,lowpass=f=3500',attack:.015},
 neon:{duration:.3,source:"aevalsrc='(0.06*sin(2*PI*880*t)+0.03*sin(2*PI*1760*t))*exp(-12*t)':s=48000:d=0.3",attack:.008}
});
export function prepareSoundEffects(plan,{sfxEnabled=false,sfxGain=.35}={}){
 assert(typeof sfxEnabled==='boolean'&&Number.isFinite(sfxGain)&&sfxGain>=0&&sfxGain<=.7,'settings');
 const events=[],add=(preset,start,reason,weight=1)=>{start=Math.max(0,start);const duration=Math.min(SOUND_PRESETS[preset].duration,plan.duration-start);if(duration<.05||events.some(e=>Math.abs(e.start-start)<.08))return;events.push({preset,weight,start:Number(start.toFixed(6)),duration:Number(duration.toFixed(6)),reason,provenance:'original-procedural-sues-v1'});};
 if(sfxEnabled&&sfxGain>0){
  for(const e of plan.elements??[])add('whoosh',e.start,'elements-entry',.65);
  for(const g of plan.graphics??[]){add(g.type==='secret'?'impact':'whoosh',g.start-.06,'graphic-entry',g.type==='secret'?.75:.65);if(g.type==='secret')add('neon',secretRevealTime(g),'neon-reveal',.55);if(g.type==='compare')for(const at of [g.voiceCues?.left??g.start+.1,g.voiceCues?.right??g.start+1.1])if(at+.4<g.end)add('draw',at+.4,'arrow-draw',.7);}
  for(const t of plan.globalTransitions??[])add('whoosh',t.start,'transition',t.type==='radialBurst'?1:t.type==='warm'?.75:.5);
  for(const m of plan.semantic?.motions??[])add('impact',m.start,'motion-entry');
 }
 assert(events.length<=40,'too many events');return {enabled:sfxEnabled,gain:sfxGain,events:events.sort((a,b)=>a.start-b.start),ducking:true,recipeVersion:'sues-original-sfx-v1',humanListeningAccepted:false};
}
export function soundEffectsFilter(sfx,duration,base){
 if(!sfx?.events?.length)return [];
 assert(Number.isFinite(duration)&&duration>0&&Number.isFinite(sfx.gain)&&sfx.gain>=0&&sfx.gain<=.7&&sfx.events.length<=40,'mix bounds');
 const filters=[`[${base}]asplit=2[sfx-main][sfx-key]`];
 sfx.events.forEach((e,i)=>{
  const preset=SOUND_PRESETS[e.preset];assert(preset&&Number.isFinite(e.start)&&e.start>=0&&Number.isFinite(e.duration)&&e.duration>=.05&&e.duration<=preset.duration&&e.start+e.duration<=duration+.000002&&Number.isFinite(e.weight??1)&&(e.weight??1)>=0&&(e.weight??1)<=1,'event bounds');
  const attack=Math.min(preset.attack,e.duration/3),release=Math.min(.09,e.duration/2);
  filters.push(`${preset.source},atrim=duration=${e.duration},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${attack},afade=t=out:st=${e.duration-release}:d=${release},volume=${sfx.gain*(e.weight??1)},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,adelay=${Math.round(e.start*48000)}S:all=1[sfx${i}]`);
 });
 filters.push(`anullsrc=r=48000:cl=stereo:d=${duration},aformat=sample_fmts=fltp[sfx-silence]`);
 filters.push(`[sfx-silence]${sfx.events.map((_,i)=>`[sfx${i}]`).join('')}amix=inputs=${sfx.events.length+1}:duration=first:dropout_transition=0:normalize=0,atrim=duration=${duration}[sfx-bus]`);
 filters.push('[sfx-bus][sfx-key]sidechaincompress=threshold=0.03:ratio=4:attack=5:release=100:makeup=1[sfx-ducked]');
 filters.push(`[sfx-main][sfx-ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95:level=0:latency=1,atrim=duration=${duration}[mixed-audio]`);
 return filters;
}
export function renderAudioFilters(plan,musicIndex,{hasAudio=true}={}){
 const procedural=!!plan.soundEffects?.events?.length,custom=!!plan.customSfx?.events?.length,voice=!!plan.voiceEffects?.events?.length;
 assert(hasAudio||!procedural&&!custom&&!voice&&!plan.audioMix,'effects require original audio');
 let filters=voiceEffectsFilter(plan.voiceEffects,plan.duration);
 const input=voice?'voice-styled':'audio';
 const background=backgroundAudioFilter(plan.audioMix,musicIndex).map(f=>f.replaceAll('[audio]',`[${input}]`));
 filters.push(...background);
 let mixed=!!plan.audioMix;
 if(procedural){filters=filters.map(f=>f.replaceAll('[mixed-audio]','[before-sfx-audio]'));filters.push(...soundEffectsFilter(plan.soundEffects,plan.duration,mixed?'before-sfx-audio':input));mixed=true;}
 if(custom){filters=filters.map(f=>f.replaceAll('[mixed-audio]','[before-custom-audio]'));filters.push(...customSfxFilter(plan.customSfx,plan.duration,musicIndex+(plan.audioMix?1:0),mixed?'before-custom-audio':input));mixed=true;}
 if(voice&&!mixed)filters.push('[voice-styled]anull[mixed-audio]');
 if(plan.mastering?.enabled){
  const upstream=filters.length?'pre-master-audio':'audio';
  if(filters.length)filters=filters.map(f=>f.replaceAll('[mixed-audio]','[pre-master-audio]'));
  filters.push(`[${upstream}]volume=-1.8dB,alimiter=limit=0.97:level=0:latency=1,atrim=duration=${plan.duration}[mixed-audio]`);
 }
 return filters;
}
