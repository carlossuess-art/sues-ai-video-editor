const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const hex=/^#[0-9a-fA-F]{6}$/;
const num=x=>typeof x==='number'&&Number.isFinite(x);

export const DEFAULT_BRAND_KIT=Object.freeze({
  version:'1.0',
  id:'sues-holistics-v1',
  name:'SUES Holistics',
  fonts:{primary:'Open Sans',accent:'Open Sans'},
  colors:{text:'#FFFFFF',accent:'#D7B56D',dark:'#101820',danger:'#C94A37',success:'#4FA36C'},
  captions:{maxLines:2,maxCharsPerLine:26,safeZone:'captions'},
  outro:{text:'Vuelve a ti · Sues Holistics',duration:3}
});

export function validateBrandKit(b){
  assert(b&&b.version==='1.0','BrandKit: versión no soportada');
  assert(typeof b.id==='string'&&b.id.length>0,'BrandKit: id obligatorio');
  assert(typeof b.name==='string'&&b.name.length>0,'BrandKit: name obligatorio');
  for(const k of ['primary','accent']) assert(typeof b.fonts?.[k]==='string'&&b.fonts[k].length>0,`BrandKit: font ${k} inválida`);
  for(const k of ['text','accent','dark','danger','success']) assert(hex.test(b.colors?.[k]),`BrandKit: color ${k} obligatorio`);
  for(const [k,v] of Object.entries(b.colors??{})) assert(hex.test(v),`BrandKit: color ${k} inválido`);
  assert(Number.isInteger(b.captions?.maxLines)&&b.captions.maxLines>=1&&b.captions.maxLines<=3,'BrandKit: maxLines');
  assert(Number.isInteger(b.captions?.maxCharsPerLine)&&b.captions.maxCharsPerLine>=12&&b.captions.maxCharsPerLine<=40,'BrandKit: maxCharsPerLine');
  assert(typeof b.outro?.text==='string'&&b.outro.text.length<=90,'BrandKit: outro text');
  assert(num(b.outro?.duration)&&b.outro.duration>=1&&b.outro.duration<=6,'BrandKit: outro duration');
  return true;
}
