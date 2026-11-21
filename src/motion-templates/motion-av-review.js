/** Human-friendly A/V report projected from the SAME read-only proposals.
 * It is not an executable FableCut or sues-master-story/v1 contract. */
const protect=v=>String(v).replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ').trim();
const fmt=t=>Number(t).toFixed(3)+' s';
export function makeMotionAVReview(review){
 if(!review||review.schema!=='sues-narrative-motion-review/v1')throw Error('Expected narrative motion review packet');
 const header=[
  '# SUES · Motion graphics narrativos · Propuestas de revisión (NO IMPORTABLE)',
  '',
  '**Estado:** '+review.status+'. **Perfil:** '+review.profile+'. **Tiempo:** palabras del bruto, no timeline editada.',
  '**Fuente:** transcripción proporcionada y validada; no implica audio reproducido ni revisión visual del bruto.',
  '**Selector:** '+(review.selector.selectionSubmitted?'Selección de IDs recibida; aprobación creativa pendiente.':'Seleccionar las palabras reales antes de proponer motions.'),
  '**Caption:** '+review.captionRule,
  '**Bloqueos globales:** '+review.notImportableReasons.join('; '),
  '',
  '| ID / tiempo fuente / palabras | Voz exacta / anclas | A-roll / cámara | Capas / B-roll / máscaras | Motion / VFX / captions | Audio | Recursos / QA / estado |',
  '|---|---|---|---|---|---|---|'
 ];
 if(!review.candidates.length){header.push('| SIN PROPUESTAS | '+(review.selector.selectionSubmitted?'No hay relación semántica suficientemente fundada':'Falta selección de palabras')+' | No analizado | No se añaden capas | No se genera motion | Sin audio | No importable |');}
 for(const c of review.candidates){
  const speech=c.sourceSpeech;
  header.push('| '+protect(c.id)+' / ['+fmt(speech.start)+', '+fmt(speech.end)+') / '+protect(speech.selectedWordIds.join(', '))+
   ' | '+protect(speech.quote)+'; ancla '+protect(speech.anchorWordId)+
   ' | Rostro, gestos, encuadre y tracking PENDIENTES; no se programa cámara'+
   ' | '+protect(c.proposedLayerRoles.join(' + '))+'; máscaras y zIndex por inspeccionar'+
   ' | '+protect(c.templateId)+' · '+protect(c.visualMechanism)+'; '+protect(c.captionAction)+
   ' | Música / SFX no seleccionados; no inventados'+
   ' | '+protect(c.implementation)+'; '+protect(c.blockReasons.join('; '))+'; '+protect(c.factualGate)+' |');
 }
 return header.join('\n')+'\n';
}
