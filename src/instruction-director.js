// Deliberately bounded local commands. Never pretend to execute an unknown brief.
export function planInstructions(text, base = {}) {
 if(typeof text !== 'string' || text.length > 4000) throw Error('Las instrucciones admiten hasta 4000 caracteres.');
 const changes = {}, actions = [], unsupported = [];
 const add = (key,value,label) => { changes[key]=value; actions.push(label); };
 const clauses=text.split(/[.;\n]+|\s+y\s+/i).map(s=>s.trim()).filter(Boolean);
 for(const raw of clauses){
  const s=raw.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[¡!¿?]/g,'').trim();
  let m;
  if((m=/^(?:usa |usar |estilo |plantilla |cambia a |cambiar a )?(?:sues )?(calma|dopamin|impacto|explica|historia)$/.exec(s)))add('styleId','SUES_'+m[1].toUpperCase(),'Estilo '+m[1].toUpperCase());
  else if(/^(?:sin musica|quita(?:r)? (?:la )?musica|desactiva(?:r)? (?:la )?musica)$/.test(s))add('musicEnabled',false,'Sin música');
  else if(/^(?:con musica|activa(?:r)? (?:la )?musica)$/.test(s))add('musicEnabled',true,'Música activada, si hay una pista disponible');
  else if((m=/^(?:volumen de (?:la )?)?musica (?:al |a )?(\d{1,2})\s*%$/.exec(s))){if(+m[1]>18)unsupported.push(raw+' (máximo actual: 18 %)');else{add('musicGain',+m[1]/100,'Música al '+m[1]+' %');add('musicEnabled',true,'Música activada, si hay una pista disponible');}}
  else if(/^(?:baja(?:r)? (?:la )?musica|menos musica|musica (?:mas baja|suave|discreta))$/.test(s))add('musicGain',Math.max(0,Math.round((base.musicGain??.16)*70)/100),'Reducir el volumen de música un 30 %');
  else if(/^(?:baja(?:r)? (?:la )?musica cuando hablo|activa(?:r)? (?:el )?(?:ducking|auto ducking))$/.test(s))add('duckMusic',true,'Bajar música automáticamente cuando hablas');
  else if(/^(?:sin acercamientos|sin zoom|quita(?:r)? (?:el )?zoom)$/.test(s))add('zoomIntensity',0,'Sin acercamientos');
  else if(/^(?:menos zoom|menos acercamientos|baja(?:r)? (?:el )?zoom)$/.test(s))add('zoomIntensity',Math.max(0,(base.zoomIntensity??1)-.25),'Reducir la intensidad de acercamiento');
  else if((m=/^(?:zoom|acercamientos) (?:al |a )?(\d{1,3})\s*%$/.exec(s))&&+m[1]<=100)add('zoomIntensity',+m[1]/100,'Acercamiento al '+m[1]+' %');
  else if((m=/^subtitulos (?:de |en grupos de )?([123]) palabras?$/.exec(s)))add('captionWords',+m[1],'Subtítulos de hasta '+m[1]+' palabras');
  else if(/^(?:sin efectos de sonido|sin sfx)$/.test(s))add('sfxEnabled',false,'Desactivar efectos de sonido');
  else if(/^(?:con efectos de sonido|con sfx)$/.test(s))add('sfxEnabled',true,'Activar efectos de sonido de los motions');
  else if(/^(?:sin recursos animados|sin motions)$/.test(s))add('motions',false,'Ocultar citas y recursos animados');
  else if(/^(?:con recursos animados|con motions)$/.test(s))add('motions',true,'Mostrar citas y recursos animados');
  else if(/^(?:sin imagenes de (?:la )?plantilla)$/.test(s))add('profileImages',false,'Ocultar imágenes de la plantilla');
  else unsupported.push(raw);
 }
 const regroup=(changes.styleId!==undefined&&changes.styleId!==base.styleId)||(changes.captionWords!==undefined&&changes.captionWords!==(base.captionWords??3));
 const anchored=!!((base.elements?.items??[]).length||(base.motionChoices??[]).length||(base.graphicCards??[]).length||(base.transitions??[]).length||Object.keys(base.keywordOverrides??{}).length||Object.keys(base.captionOverrides??{}).length||(base.highlightCaptions??[]).length);
 if(regroup)Object.assign(changes,{elements:null,motionChoices:[],graphicCards:[],transitions:[],keywordOverrides:{},captionOverrides:{},highlightCaptions:[]});
 return {actions:[...new Set(actions)],unsupported,changes,canApply:unsupported.length===0,requiresResetConfirmation:regroup&&anchored,warning:regroup&&anchored?'Cambiar estilo o agrupación restablece los textos y recursos vinculados a las frases. La versión anterior se conserva.':null};
}
