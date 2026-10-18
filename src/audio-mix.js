const assert=(ok,msg)=>{if(!ok)throw new Error(`Audio mix: ${msg}`);};
export function prepareBackgroundAudio(value,duration){
 if(value===undefined)return null;
 assert(value&&typeof value==='object'&&!Array.isArray(value),'background object');
 assert(typeof value.assetId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value.assetId),'asset id');
 assert(['owned','licensed'].includes(value.rights),'explicit rights declaration required');
 assert(typeof value.localFile==='string'&&value.localFile.length>0&&!value.localFile.includes('\0'),'local file');
 const gain=value.gain??.12,sourceIn=value.sourceIn??0;
 assert(Number.isFinite(gain)&&gain>0&&gain<=.18,'gain >0 and <=0.18');
 assert(Number.isFinite(sourceIn)&&sourceIn>=0,'source in');
 assert(Number.isFinite(duration)&&duration>=3,'duration');
 return {duckEnabled:value.duckEnabled!==false,assetId:value.assetId,rights:value.rights,localFile:value.localFile,gain,sourceIn,sourceOut:sourceIn+duration,duration,fadeIn:Math.min(1.2,duration/4),fadeOut:Math.min(2,duration/4),duck:{threshold:.025,ratio:6,attack:25,release:350},voice:'original continuous timeline',limiter:.95};
}
export function backgroundAudioFilter(mix,index){
 if(!mix)return [];
 const d=mix.duck;
 if(mix.duckEnabled===false)return [
 `[${index}:a]atrim=start=${mix.sourceIn}:end=${mix.sourceOut},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${mix.gain},afade=t=in:st=0:d=${mix.fadeIn},afade=t=out:st=${mix.duration-mix.fadeOut}:d=${mix.fadeOut}[music-bed]`,
 `[audio][music-bed]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=${mix.limiter}:level=0:latency=1[mixed-audio]`];
 return [`[audio]asplit=2[voice-original][voice-key]`,
  `[${index}:a]atrim=start=${mix.sourceIn}:end=${mix.sourceOut},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${mix.gain},afade=t=in:st=0:d=${mix.fadeIn},afade=t=out:st=${mix.duration-mix.fadeOut}:d=${mix.fadeOut}[music-bed]`,
  `[music-bed][voice-key]sidechaincompress=threshold=${d.threshold}:ratio=${d.ratio}:attack=${d.attack}:release=${d.release}:makeup=1[ducked-music]`,
  `[voice-original][ducked-music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=${mix.limiter}:level=0:latency=1[mixed-audio]`];
}
