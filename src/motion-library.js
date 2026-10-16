const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const num=x=>typeof x==='number'&&Number.isFinite(x);
export const MOTION_TYPES=Object.freeze(['overlay','layout','transition','badge','audio-cue','background-treatment']);
export const MOTION_IDS=Object.freeze([
  'BLURRED_RESOURCE_01','COMPARE_YES_NO_01','NUMBER_BADGE_GOLD_01',
  'CHECK_GREEN_01','CROSS_RED_01','STRIKE_TEXT_01','DIVIDER_LINE_01'
]);

export function validateMotionAsset(m){
  assert(m&&m.version==='1.0','Motion: versión');
  assert(typeof m.id==='string'&&m.id.length>0,'Motion: id');
  assert(MOTION_TYPES.includes(m.type),'Motion: type');
  assert(Array.isArray(m.tags),'Motion: tags');
  assert(['dynamic','raster'].includes(m.renderMode),'Motion: renderMode');
  assert(Array.isArray(m.layers)&&m.layers.length>0,'Motion: layers');
  for(const l of m.layers){
    assert(typeof l.id==='string'&&l.id.length>0,'Motion layer: id');
    assert(['video','image','text','shape','icon','audio','effect'].includes(l.kind),'Motion layer: kind');
    assert(num(l.start)&&l.start>=0,'Motion layer: start');
    assert(num(l.duration)&&l.duration>0,'Motion layer: duration');
    if(l.replaceable!==undefined) assert(typeof l.replaceable==='boolean','Motion layer: replaceable');
  }
  if(m.trigger){
    assert(Array.isArray(m.trigger.semanticReasons),'Motion: semanticReasons');
    assert(num(m.trigger.minDuration)&&m.trigger.minDuration>0,'Motion: trigger minDuration');
  }
  return true;
}

export function indexMotionLibrary(items){
  assert(Array.isArray(items),'Motion library: lista');
  const byId=new Map();
  for(const item of items){
    validateMotionAsset(item);
    assert(!byId.has(item.id),`Motion duplicado: ${item.id}`);
    byId.set(item.id,item);
  }
  return {
    get:id=>byId.get(id)??null,
    findByTag:tag=>items.filter(x=>x.tags.includes(tag)),
    findByReason:reason=>items.filter(x=>x.trigger?.semanticReasons?.includes(reason)),
    ids:()=>[...byId.keys()]
  };
}

export function instantiateMotion(template,bindings={}){
  validateMotionAsset(template);
  const layers=template.layers.map(layer=>{
    if(!layer.replaceable) return structuredClone(layer);
    const value=bindings[layer.id];
    assert(value!==undefined,`Motion binding faltante: ${layer.id}`);
    return {...structuredClone(layer),content:value};
  });
  return {...structuredClone(template),layers};
}
