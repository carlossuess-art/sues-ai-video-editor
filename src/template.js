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
  assert(['blocks','word-highlight','clean'].includes(t.captions?.mode),'Template: captions mode');
  assert(Array.isArray(t.transitions?.allowed),'Template: transitions');
  assert(Array.isArray(t.motion?.allowed),'Template: motions');
  assert(['none','optional','semantic'].includes(t.look?.blackWhite),'Template: blackWhite');
  assert(['none','optional','semantic'].includes(t.look?.relight),'Template: relight');
  assert(Array.isArray(t.audio?.families),'Template: audio families');
  assert(t.constraints?.semanticZoomOnly===true,'Template: semanticZoomOnly obligatorio');
  assert(t.constraints?.respectSafeZones===true,'Template: safe zones obligatorias');
  return true;
}

export function compileTemplatePolicy(t,brand){
  validateTemplate(t,brand);
  return Object.freeze({
    templateId:t.id,
    pacing:t.pacing,
    cuts:{...t.cuts},
    camera:{...t.camera},
    captions:{...t.captions,font:brand.fonts.primary,color:brand.colors.text,accent:brand.colors.accent},
    transitions:[...t.transitions.allowed],
    motions:[...t.motion.allowed],
    look:{...t.look},
    audio:{...t.audio},
    outro:{...brand.outro},
    constraints:{...t.constraints}
  });
}
