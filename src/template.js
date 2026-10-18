import {validateCinematicStyle} from './cinematic-style.js';
import {validateBrandKit} from './brand-kit.js';
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const num=x=>typeof x==='number'&&Number.isFinite(x);

export const STYLE_IDS=Object.freeze(['SUES_CALMA','SUES_IMPACTO','SUES_EXPLICA','SUES_HISTORIA']);

export function validateTemplate(t,brand){
  validateBrandKit(brand);
  assert(t&&t.version==='1.0','Template: versión no soportada');
  assert(STYLE_IDS.includes(t.id),'Template: estilo desconocido');
  assert(['slow','medium','fast'].includes(t.pacing),'Template: pacing');
  assert(num(t.cuts?.minShot)&&num(t.cuts?.maxShot)&&t.cuts.minShot>0&&t.cuts.maxShot>=t.cuts.minShot,'Template: cortes');
  assert(num(t.camera?.baseZoom)&&num(t.camera?.maxZoom)&&t.camera.baseZoom>=1&&t.camera.maxZoom>=t.camera.baseZoom&&t.camera.maxZoom<=1.6,'Template: zoom');
  assert(Array.isArray(t.camera?.zoomReasons)&&t.camera.zoomReasons.length>0,'Template: zoomReasons');
  assert(['blocks','word-highlight','clean','short-groups'].includes(t.captions?.mode),'Template: captions mode');
  assert(Array.isArray(t.transitions?.allowed),'Template: transitions');
  assert(Array.isArray(t.motion?.allowed),'Template: motions');
  assert(['none','optional','semantic'].includes(t.look?.blackWhite),'Template: blackWhite');
  assert(['none','optional','semantic'].includes(t.look?.relight),'Template: relight');
  assert(Array.isArray(t.audio?.families),'Template: audio families');
  assert(t.constraints?.semanticZoomOnly===true,'Template: semanticZoomOnly obligatorio');
  assert(t.constraints?.respectSafeZones===true,'Template: safe zones obligatorias');
  if(t.captions.mode==='short-groups'){assert(t.captions.font===undefined||t.captions.font==='Inter','Template: caption font');assert([1,2,3].includes(t.captions.maxWords),'Template: caption groups');assert(num(t.captions.fontSize)&&t.captions.fontSize>=56&&t.captions.fontSize<=112,'Template: caption size');assert(brand.captions.maxLines<=2,'Template: caption layout');assert(num(t.captions.tracking)&&t.captions.tracking>=-3&&t.captions.tracking<=0,'Template: tracking');assert(num(t.captions.scaleX)&&t.captions.scaleX>=85&&t.captions.scaleX<=100,'Template: text width');assert(num(t.captions.fadeMs)&&t.captions.fadeMs>=20&&t.captions.fadeMs<=120&&num(t.captions.entranceMs)&&t.captions.entranceMs>=80&&t.captions.entranceMs<=300,'Template: caption animation');}
  if(t.captions.hierarchy!==undefined){const h=t.captions.hierarchy;assert(t.captions.mode==='short-groups'&&h.ratio===2,'Template: hierarchy ratio');assert(h.selection==='editorial-phrase-rules-v1'&&h.metal==='warm-gold-banded','Template: hierarchy renderer');assert(h.keywordWeights&&typeof h.keywordWeights==='object'&&!Array.isArray(h.keywordWeights)&&Object.entries(h.keywordWeights).every(([word,value])=>/^[\p{L}\p{N}]+$/u.test(word)&&num(value)&&value>=0&&value<=100),'Template: hierarchy keywords');assert(Array.isArray(h.exceptionalWords)&&h.exceptionalWords.every(word=>typeof word==='string'&&/^[\p{L}\p{N}]+$/u.test(word)),'Template: hierarchy exceptional words');}
  if(t.visualStyle!==undefined)validateCinematicStyle(t.visualStyle);
  return true;
}

export function compileTemplatePolicy(t,brand){
  validateTemplate(t,brand);
  return Object.freeze({
    templateId:t.id,
    brandKitId:brand.id,
    pacing:t.pacing,
    ...(t.visualStyle?{visualStyle:structuredClone(t.visualStyle)}:{}),
    cuts:{...t.cuts},
    camera:{...t.camera},
    captions:{...brand.captions,...t.captions,font:t.captions.font??brand.fonts.primary,color:brand.colors.text,accent:brand.colors.accent},
    transitions:[...t.transitions.allowed],
    motions:[...t.motion.allowed],
    look:{...t.look},
    audio:{...t.audio},
    outro:{...brand.outro},
    constraints:{...t.constraints}
  });
}
