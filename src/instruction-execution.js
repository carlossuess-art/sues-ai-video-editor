// Check the compiled result, not merely the accepted configuration switches.
// This review runs before a version is created or a render is queued.
export function reviewInstructionExecution(proposal, plan) {
 const changes=proposal.changes, counts=plan.editionCounts;
 const missing=[],notes=[...(proposal.notes??[])];
 const visuals=counts.zoomCycles+counts.motions+counts.cards+counts.images+
  (plan.selectedMedia?.length??0)+(plan.ambientOverlays?.length??0)+counts.transitions;
 if((changes.musicEnabled===true||changes.musicGain>0)&&
    (!plan.audioMix||plan.audioMix.gain<=0))
  missing.push('Música solicitada sin pista válida: elige una canción de duración suficiente en Música. Cambiar el volumen no añade una pista.');
 if(changes.zoomIntensity>0&&!counts.zoomCycles)
  missing.push(plan.camera.mode==='full-frame-fit'?
   'Zoom solicitado sin análisis de encuadre: este vídeo solo tiene transcripción. Se conserva el plano completo; no hay seguimiento facial preparado.':
   'Zoom solicitado sin eventos válidos. La intensidad no crea acercamientos: indica momentos narrativos o revisa el análisis.');
 if(changes.motions===true&&!counts.motions&&!counts.cards&&
    !(plan.illustrations?.length)&&!(plan.ambientOverlays?.length))
  missing.push('Recursos animados solicitados sin eventos válidos. Selecciona recursos y momentos concretos; activar el control no crea gráficos.');
 if(changes.sfxEnabled===true&&!counts.soundEffects)
  missing.push('Efectos de sonido solicitados sin eventos. Vincula un sonido real a una acción o añade un motion con sonido.');
 if(changes.styleId==='SUES_DOPAMIN'&&!visuals)
  missing.push('DOPAMIN no tiene intervenciones visuales en esta propuesta: solo generaría subtítulos. Revisa el plan antes de renderizar.');
 if(plan.camera.mode==='full-frame-fit')notes.push('Sin análisis facial: no se aplican acercamientos ni colocación de motions basada en rostro.');
 for(const r of plan.automaticDirector?.rejections??[])
  notes.push(`Evento descartado en ${r.start.toFixed(1)} s: ${r.reason}`);
 notes.push('La propuesta conserva la voz y sus tiempos. El Director semántico completo sigue pendiente.');
 return {canApply:proposal.canApply&&!missing.length,
  unsupported:[...proposal.unsupported,...missing],notes,
  editionCounts:counts,recipe:plan.templateRecipe,
  execution:{musicPresent:!!plan.audioMix,sfxEvents:counts.soundEffects,
   visualEvents:visuals,captionsOnly:visuals===0,missing}};
}
