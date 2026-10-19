const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const num=x=>typeof x==='number'&&Number.isFinite(x);

export const MUSIC_MOODS=Object.freeze([
  'intrigue','expansion','reflective','tension','resolution','neutral'
]);

export function validateMusicJourney(journey,{duration}={}){
  assert(journey&&journey.version==='1.0','Music Journey: versión');
  assert(Array.isArray(journey.segments)&&journey.segments.length>0,'Music Journey: segments');
  let previousEnd=0;
  for(const [index,s] of journey.segments.entries()){
    assert(MUSIC_MOODS.includes(s.mood),'Music Journey: mood');
    assert(num(s.start)&&num(s.end)&&s.start>=0&&s.end>s.start,'Music Journey: rango');
    assert(index===0||s.start>=previousEnd-1e-6,'Music Journey: segmentos solapados/desordenados');
    assert(typeof s.source==='string'&&s.source.length>0,'Music Journey: source');
    assert(num(s.gain)&&s.gain>=0&&s.gain<=0.35,'Music Journey: gain');
    assert(['cut','crossfade','fade'].includes(s.transitionIn),'Music Journey: transitionIn');
    assert(['cut','crossfade','fade'].includes(s.transitionOut),'Music Journey: transitionOut');
    assert(typeof s.duckUnderVoice==='boolean','Music Journey: duckUnderVoice');
    previousEnd=s.end;
  }
  if(num(duration))assert(previousEnd<=duration+1e-6,'Music Journey: excede duración');
  return true;
}

export function normalizeMusicJourney(journey,{duration}={}){
  validateMusicJourney(journey,{duration});
  return {
    version:'1.0',
    segments:journey.segments.map((s,index)=>({
      id:s.id??`music-${String(index+1).padStart(2,'0')}`,
      mood:s.mood,
      start:s.start,
      end:s.end,
      source:s.source,
      gain:s.gain,
      transitionIn:s.transitionIn,
      transitionOut:s.transitionOut,
      duckUnderVoice:s.duckUnderVoice,
      reason:s.reason??''
    }))
  };
}

export function singleBedToJourney({source,duration,gain=.16,duckUnderVoice=true,mood='neutral'}){
  assert(typeof source==='string'&&source.length>0,'Music Journey: source');
  assert(num(duration)&&duration>0,'Music Journey: duration');
  return normalizeMusicJourney({
    version:'1.0',
    segments:[{
      mood,start:0,end:duration,source,gain,
      transitionIn:'fade',transitionOut:'fade',duckUnderVoice,
      reason:'single-bed fallback'
    }]
  },{duration});
}
