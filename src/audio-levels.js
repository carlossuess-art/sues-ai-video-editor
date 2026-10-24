// Opt-in resource reference levels. Percent controls are applied AFTER leveling.
// Pad short cues for the loudness meter, then trim back before delay: no time shift.
export function resourceLevelFilter(duration,target=-16){
 if(!Number.isFinite(duration)||duration<=0||![-16,-10].includes(target))throw Error('Audio reference invalid');
 return `apad=whole_dur=${Math.max(1,duration)},loudnorm=I=${target}:TP=-1:LRA=7,aresample=48000,atrim=duration=${duration},asetpts=PTS-STARTPTS,`;
}
export function applyResourceLevels(plan){
 if(plan.audioMix){plan.audioMix.levelResources=true;plan.audioMix.duck={threshold:.2,ratio:1.6,attack:30,release:300};}
 for(const bus of [plan.soundEffects,plan.customSfx])if(bus){bus.levelResources=true;bus.duck={threshold:.18,ratio:1.5,attack:5,release:100};}
 return plan;
}
