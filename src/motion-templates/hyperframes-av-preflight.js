/**
 * Human A/V view 1:1 with the source-bound HyperFrames preflight variable file.
 * It is a proposal, not an approved Reel plan. No audio/video has been
 * inspected by this function. Output is non-importable Markdown.
 */
const safe=s=>String(s??'').replaceAll('|','\\|').replace(/[\r\n\t]+/g,' ').trim();
const sec=(f,base)=>((base+f)/30).toFixed(3);
const t=(a,b,base)=>'['+sec(a,base)+','+sec(b,base)+') s · F'+(base+a)+'–F'+(base+b-1);
const anchors=xs=>xs.map(w=>safe(w.text)+' {ID '+safe(w.id)+', bruto '+w.sourceStartSec.toFixed(3)+' s, edit. F'+w.editedFrame+'}').join(' · ');
export function makeHyperFramesAVPreflight(preflight){
 if(preflight?.schema!=='sues-editor-hyperframes-preflight/v1'||
  preflight.status!=='READY_FOR_CREATIVE_REVIEW'||
  preflight.creativeApproved!==false||preflight.canExecute!==false||
  preflight.scene?.fps!==30||preflight.scene?.frames!==151||
  preflight.words?.card?.length!==4||preflight.words?.follow?.length!==4)
  throw Error('A/V view requires the exact unapproved source-bound HyperFrames preflight');
 const p=preflight,base=p.scene.startFrame,card=anchors(p.words.card),following=anchors(p.words.follow);
 const all=preflight.words.card.map(w=>w.id).concat(preflight.words.follow.map(w=>w.id));
 if(new Set(all).size!==8||!all.every(id=>typeof id==='string'&&id.trim()))
  throw Error('Preflight must contain eight distinct authentic source word IDs');
 const lines=[
  '# SUES AI VIDEO EDITOR · GUION TÉCNICO A/V · HYPERFRAMES',
  '',
  '**Estado: PROPUESTO / NO IMPORTABLE / SIN APROBACIÓN CREATIVA.**',
  'Este documento se deriva de las palabras del archivo original y de sus tiempos, pero NO acredita escucha de voz, revisión de imagen, sincronización final ni permiso para editar.',
  '',
  '- Proyecto/revisión: '+safe(p.jobFingerprint),
  '- Fuente SHA-256: '+safe(p.sourceSha256),
  '- Mapa temporal: '+safe(p.timelineFingerprint)+(p.sourceTimeSpace==='original-seconds-linear-cut-map'
   ?' (cortes lineales verificados, bruto a montaje)':' (1:1 verificado, sin cortes)'),
  '- Perfil: '+safe(p.profile)+'; motor animación **HyperFrames**, editor final **FableCut**',
  '- Lienzo: 1080×1920, 30 fps; inicio de la composición: '+p.scene.startSec.toFixed(3)+' s; duración 151/30 s; pantalla completa propuesta.',
  '- Palabras seleccionadas por el usuario: '+p.words.selectedKeywordIds.map(safe).join(', '),
  '- Identidad propuesta HyperFrames: '+safe(p.proposedPlanFingerprint)+' (NO es aprobación).',
  '',
  '| ID · tiempo editado [inicio, fin) · fotogramas | VOZ EXACTA · anclas de palabra | A-ROLL · CÁMARA | CAPAS · B-ROLL · MÁSCARAS | MOTION · VFX · TÍTULOS · SUBTÍTULOS | SFX · MÚSICA · MEZCLA | RECURSOS · QA · ESTADO |',
  '|---|---|---|---|---|---|---|',
  '| H01 · '+t(0,8,base)+' | Voz original conservada, segmento aún no escuchado para QA | Imagen de Carlos no inspeccionada; propuesta [FULL MOTION] | Fondo antracita + cuadrícula z0; tarjeta z10 | Rectángulo x130, centro y830: altura 8→538 px, radio inicial 0; sin texto anticipado | Ningún audio nuevo; preservar pista original | HyperFrames SVG/GSAP; verificar zona segura y causa narrativa · PENDIENTE |',
  '| H02 · '+t(8,32,base)+' | '+card+' | Cámara fija; A-roll no visible durante [FULL MOTION] | Tarjeta recortada, cuatro palabras independientes z20 | Radio 0→62 px desde primera palabra; blur y opacidad individual; textos EXACTOS del bruto, sin normalizar | Preservar voz sin SFX inventados | Revisar máscara, Montserrat, legibilidad y subtítulos sin duplicado · PENDIENTE |',
  '| H03 · '+t(32,51,base)+' | Las palabras anteriores permanecen en pantalla; no inventar voz | Encuadre fijo | Tarjeta y palabras | Retención legible, sin efectos decorativos | Conservar audio fuente | Revisar duración en contexto real · PENDIENTE |',
  '| H04 · '+t(51,70,base)+' | Transición entre ideas, voz sin alterar | Cámara DE LA TARJETA: escala 1→4,5, Y 0→−1950 px | Tarjeta/textos salen; tapiz permanece | Zoom completo fuera del lienzo, no corte a negro | No añadir whoosh hasta aprobarlo | Controlar continuidad y corte de pantalla · PENDIENTE |',
  '| H05 · '+t(59,92,base)+' | Metáfora de abrir espacio; escucha real no acreditada | Fondo fijo, transición solapada con H04 | Dos rieles vectoriales x540±20→x540±426, y1540→895 | Separación causal de rieles; NO esfera ni ondas gratuitas | Preservar voz original | QA de solape con H04, blur, máscara, overflow intencional · PENDIENTE |',
  '| H06 · '+t(81,119,base)+' | '+following+' | Plano gráfico [FULL MOTION] | Dos rieles y cuatro palabras independientes z20 | Palabras entran durante apertura de rieles; dos líneas, hueco ~84 px entre palabras; fade+blur por voz | Ningún SFX/música añadido | Comprobar texto/posición de rostro si se cambia a overlay · PENDIENTE |',
  '| H07 · '+t(119,151,base)+' | Retención, voz no inventada | Cámara fija | Texto final y rieles | Lectura hasta salida final todavía sin diseñar | Mantener mezcla original | Transición siguiente PENDIENTE; no publicar |',
  '',
  '**Solapes causales:** H04/H05 y H05/H06 representan capas simultáneas, no huecos ni cortes.',
  '',
  '**Subtítulos:** conservar TODAS las palabras reales. Neutralizar resaltados duplicados solo tras verificar cobertura temporal exacta del motion y aprobación de Carlos; no ocultar automáticamente los captions.',
  '',
  '**Faltan antes de ejecutar:** revisión creativa de esta tabla, inspección del bruto y rostro, ruta de FableCut con CAS/ledger, verificación de render HF con estas mismas variables, derechos, doble QA real de vídeo/audio y aprobación de publicación separada.',
  '',
  '**Origen editable:** HTML/SVG/GSAP de HyperFrames. El MP4 resultante es un clip en FableCut y NO expone los keyframes internos para editarlos allí.',
  ''
 ];
 return lines.join('\n');
}
