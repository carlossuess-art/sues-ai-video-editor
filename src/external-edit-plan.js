import {reviewInstructionExecution} from './instruction-execution.js';
import {createHash} from 'node:crypto';
import {prepareProject} from './local-pipeline.js';
import {applyExternalMotion,externalMotionCatalog} from './external-motions.js';
const fail=message=>{throw Error(message);};
const keys=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>allowed.includes(k));
export function externalCatalog(project,settings,assets=[]){
 const prepared=prepareProject(project,settings),p=prepared.plan;
 return {schema:'sues-edit-plan/v1',sourceSha256:p.source.sha256,duration:p.duration,timeSpace:'original-seconds',
  instructions:'Devuelve sólo JSON con schema, sourceSha256 y operations. Usa exclusivamente acciones y recursos descritos. No inventes IDs. Marca tus ideas no ejecutables como type: unsupported con description. Los tiempos son segundos del original; no hay cortes ni cambio de velocidad. El plan modifica la versión actual y conserva sus ajustes no mencionados. No cambies estilo ni agrupación al corregir captions. Prioriza sentido narrativo, voz inteligible, derechos y continuidad. Justifica cada intervención por contenido observable, nunca por una cuota o temporizador. Mantener un plano limpio es válido. No inventes máscaras, stems, seguimiento o emociones detectadas. Los aliases SFX de la documentación V2 son objetivos pendientes, no IDs reales. No devuelvas director-intent/v2 en esta pantalla: sólo sues-edit-plan/v1.',
  actions:{audioLevels:{type:'audio-levels',voiceGain:1.5,sfxGain:.3,musicGain:.18,levelResources:true,limit:'Voz 0–200 %, efectos 0–70 %, música 0–18 %. Recursos nivelados antes de aplicar porcentajes; no es una garantía de escucha. Conserva recursos y tiempos.'},emphasis:{type:'emphasis',captionId:'seg-001',word:0,level:'exceptional',style:'fireMetal',scale:1.45,limit:'Palabra real por índice, escala 1–1.6 dentro de zonas seguras. fire: naranja fuego; fireMetal: bandas metálicas naranjas, sin reflejo 3D.'},voiceLevel:{type:'voice-level',enabled:true,limit:'Nivelar audio original a -16 LUFS/-3dBTP mediante dos pases antes de música/SFX. No separa voz del ambiente ni cambia tiempos. Comprobación de loudness y escucha posterior necesarias.'},card:{type:'card',captionId:'seg-010',endCaptionId:'seg-012',layout:'grid',heading:'Texto literal',bodyLines:['Continuación literal'],limit:'Escena gráfica explícita a pantalla completa: cubre intencionalmente al presentador mientras conserva la voz. Hasta 3 tarjetas, 1.5–6s, texto de hasta 26 caracteres por línea, ligado a captions reales. No equivale a rotoscopia. Revisión visual obligatoria.'},framing:{type:'framing',sourceSha256:p.source.sha256,method:'manual-region-review',face:{x:200,y:400,width:600,height:900},anchor:{x:500,y:750},limit:'Anotación explícita conservadora de la región de cabeza en píxeles del original completo, revisada durante toda la toma. No es detección ni seguimiento automático. Debe preceder a los motions/zooms. Los límites y colisiones se verifican por fotograma. No inventes estas coordenadas: exige revisión visual.'},zoom:{type:'zoom',start:5,end:8,scale:1.07,reason:'Énfasis narrativo observado',limit:'Requiere análisis facial o framing revisado; máximo ocho, 2–6s, escala 1.04–1.22, apertura/cierre protegidos. Se rechaza si recorta la región revisada.'},mastering:{type:'mastering',enabled:true,limit:'Modo de margen seguro: bajar 1,8 dB el máster final para reducir riesgo de picos inter-sample; no altera tiempos ni reemplaza validación LUFS/True Peak.'},overlay:{type:'overlay',resourceId:'SHA256 real de overlay privado',start:5,end:6.2,sourceIn:0,intensity:.2,reason:'Destello suave para acompañar el cambio',limit:'Solo overlays reales importados, máximo 2 clips de 0,4–2,5s, intensidad 0,05–0,35. Mitad inferior, sin tapar el rostro de la mitad superior; requiere revisión visual. No aplica rotoscopia.'},voice:{type:'voice',preset:'cinematic-echo',start:4,end:6,intensity:.4,limit:'Dos presets probables: cinematic-echo y vintage-tv. Una frase por evento, 0,7–6 s, máximo cuatro, sin solaparse y con intensidad 0,1–0,85. Conserva la palabra original y reduce únicamente su calidad tonal; no afecta la música ni cambia el texto.'},broll:{type:'broll',resourceId:'ID SHA256 de vídeo en biblioteca privada',start:5,end:8,reason:'Metáfora visual de cambio',limit:'Plano completo. Clip de 2.5–6 s; hasta 3 clips sin solapamientos, apertura/cierre protegidos y no más del 40% del vídeo. La voz y captions continúan. Solo vídeos propios o licenciados realmente importados; nunca URLs. Comprueba visualmente si encaja.'},motion:{type:'motion',resourceId:'QUOTE_CARD_01',captionId:'ID real de captions',limit:'Usa los IDs de motionResources. Texto y tiempos proceden del caption, incluida su corrección. Requiere análisis facial y motions activos; hasta tres citas y cinco elecciones de los otros tipos. Sin posición libre ni duración inventada. Conflictos bloquean el plan.'},sfx:{type:'sfx',resourceId:'ID de recurso kind=sfx',start:2,gain:.3,limit:'Hasta 40 sonidos, máximo tres simultáneos. Gain 0–0.7. El sonido completo debe caber; se baja durante la voz. Independiente de los SFX sintetizados de motions.'},transition:{type:'transition',resourceId:'blur',start:2,duration:.4,replace:true,limit:'warm, blur o radial. replace sustituye la transición del mismo segundo. Hasta tres transiciones; duración fija 0.4 s; sin solaparse ni invadir cierre. Requiere motions activados.'},image:{type:'image',resourceId:'ID de imagen de assets',start:3,end:5,limit:'Hasta seis imágenes; 0.6–8 s cada una. Requiere análisis facial existente para colocar sin tapar caras. No disponible con Whisper solo/plano completo. No seguimiento ni posición libre.'},music:{type:'music',resourceId:'ID de audio de assets',gain:.1,duck:true,limit:'Pista completa, tan larga como el vídeo; gain 0–0.18. No SFX puntuales.'},caption:{type:'caption',captionId:'seg-001',text:'Texto corregido',limit:'Conserva tiempos; hasta 52 caracteres.'},command:{type:'command',text:'menos zoom',limit:'Sólo controles globales: sin música, música al 10 %, menos zoom, sin zoom, con/sin recursos animados, con/sin efectos de sonido. No son eventos puntuales.'}},
  motionResources:externalMotionCatalog(p),
  existingEvents:[...(p.customSfx?.events??[]).map(e=>({type:'sfx',resourceId:e.assetId,start:e.start,end:e.end,gain:e.gain})),...(p.semantic?.motions??[]).map(e=>({type:'motion',resourceId:e.params.motionId,start:e.start,end:e.end})),...(p.globalTransitions??[]).map(e=>({type:e.type,start:e.start,end:e.end})),...(p.illustrations??[]).map(e=>({type:'image',start:e.start,end:e.end})),...(p.selectedMedia??[]).map(e=>({type:'broll',resourceId:e.assetId,start:e.start,end:e.end})),...(p.voiceEffects?.events??[]).map(e=>({type:'voice',preset:e.preset,start:e.start,end:e.end,intensity:e.intensity})),...(p.ambientOverlays??[]).map(e=>({type:'overlay',resourceId:e.assetId,start:e.start,end:e.end,intensity:e.intensity}))],
  unsupported:['cortes y velocidad','seguimiento de ojos/cuerpo','desenfoque selectivo','posición libre de imágenes','recursos externos, URLs o código'],assets:assets.map(({id,kind,title,duration,emotions,narrativeRoles,creativeApproval,visualDescription,visualReviewScope})=>({id,kind,title,
    ...(duration?{duration}:{}),
    ...(Array.isArray(emotions)?{emotions:emotions.filter(s=>typeof s==='string'&&s.length<=50).slice(0,8)}:{}),
    ...(Array.isArray(narrativeRoles)?{narrativeRoles:narrativeRoles.filter(s=>typeof s==='string'&&s.length<=50).slice(0,8)}:{}),
    ...(creativeApproval?{creativeApproval}:{}),
    ...(visualReviewScope==='sampled-frames-only'&&typeof visualDescription==='string'&&visualDescription.length<=200?{visualDescription,visualReviewScope}:{}),
   })),captions:p.captions.map(({id,start,end,text})=>({id,start,end,text})),
  example:{schema:'sues-edit-plan/v1',sourceSha256:p.source.sha256,operations:[{type:'transition',resourceId:'warm',start:2,duration:.4}]}};
}
export function parseExternalPlan(text){
 if(typeof text!=='string'||text.length>30000)fail('El plan admite hasta 30000 caracteres.');
 let clean=text.trim();const fence=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(clean);if(fence)clean=fence[1];
 let plan;try{plan=JSON.parse(clean);}catch{fail('Pega un plan JSON SUES. Usa «Copiar instrucciones para Gemini» para pedir el formato compatible.');}
 if(!keys(plan,['schema','sourceSha256','operations'])||plan.schema!=='sues-edit-plan/v1'||!Array.isArray(plan.operations)||!plan.operations.length||plan.operations.length>60)fail('Formato SUES inválido: entre 1 y 60 operaciones.');
 return plan;
}
export function reviewExternalPlan(text,{project,settings,assets=[],commandPlanner}){
 const imported=parseExternalPlan(text),baseline=prepareProject(project,settings);let manifest=baseline.plan;
 if(imported.sourceSha256!==manifest.source.sha256)fail('Este plan pertenece a otro vídeo. Copia las instrucciones del proyecto correcto.');
 const commandChanges={};const next=structuredClone(settings),rows=[],seen=new Set(),motionCaptions=new Set();
 for(const [index,op]of imported.operations.entries()){
  const row={index:index+1,status:'ready',description:''};rows.push(row);
  try{
   if(!op||typeof op!=='object'||Array.isArray(op))fail('Operación inválida.');
   const signature=JSON.stringify(op);if(seen.has(signature))fail('Operación duplicada.');seen.add(signature);
   if(op.type==='foreground-effects'){
    if(!keys(op,['type','data'])||!op.data||op.data.schema!=='sues-foreground-effects/v1'||op.data.sourceSha256!==imported.sourceSha256||rows.slice(0,-1).some(r=>r.foreground))fail('Una composición de máscara ligada al vídeo por plan.');
    next.reviewedForeground=structuredClone(op.data);row.foreground=true;
    row.description='Capas con máscara IA: '+(op.data.events?.filter(e=>e.type==='behind-video').length??0)+' vídeos y '+(op.data.events?.filter(e=>e.type==='behind-text').length??0)+' textos detrás del presentador; pendientes de revisión del render';
   }else if(op.type==='audio-levels'){
    if(!keys(op,['type','voiceGain','sfxGain','musicGain','levelResources'])||typeof op.levelResources!=='boolean')fail('Niveles de audio inválidos');
    Object.assign(next,{voiceNormalization:true,voiceGain:op.voiceGain,sfxGain:op.sfxGain,musicGain:op.musicGain,levelResources:op.levelResources});
    next.sfxEvents=(next.sfxEvents??[]).map(e=>({...e,gain:op.sfxGain}));
    row.description=`Voz ${op.voiceGain*100} %, efectos ${op.sfxGain*100} %, música ${op.musicGain*100} %; nivelar recursos: ${op.levelResources}`;
   }else if(op.type==='emphasis'){
    if(!keys(op,['type','captionId','word','level','style','scale'])||!manifest.captions.some(c=>c.id===op.captionId))fail('Énfasis: subtítulo o parámetros inválidos');
    next.keywordOverrides={...next.keywordOverrides,[op.captionId]:{word:op.word,level:op.level,style:op.style,scale:op.scale}};
    row.description=`Énfasis ${op.captionId}: palabra ${op.word+1}, ${op.style}, tamaño ${op.scale*100} %`;
   }else if(op.type==='voice-level'){
    if(!keys(op,['type','enabled'])||typeof op.enabled!=='boolean')fail('Nivel de voz: enabled debe ser boolean');
    next.voiceNormalization=op.enabled;row.description=op.enabled?'Nivelar voz a -16 LUFS / -3 dBTP antes de música y efectos':'Conservar el nivel original de voz';
   }else if(op.type==='card'){
    if(!keys(op,['type','captionId','endCaptionId','layout','heading','bodyLines'])||op.layout!=='grid')fail('Tarjeta disponible: grid con captions y textos breves');
    next.graphicCards=[...(next.graphicCards??[]),{type:'grid',captionId:op.captionId,...(op.endCaptionId?{endCaptionId:op.endCaptionId}:{}),heading:op.heading,bodyLines:op.bodyLines}];
    row.description=`Escena gráfica a pantalla completa: ${op.captionId}–${op.endCaptionId??op.captionId}; presentador cubierto intencionalmente, voz conservada`;
   }else if(op.type==='framing'){
    if(!keys(op,['type','sourceSha256','method','face','anchor'])||rows.slice(0,-1).some(r=>r.framing))fail('Una revisión de encuadre por plan.');
    const {type,...framing}=op;next.reviewedFraming=framing;
    manifest=prepareProject(project,next).plan;row.framing=true;
    row.description='Región de cabeza y ancla revisadas visualmente; sin seguimiento automático';
   }else if(op.type==='zoom'){
    if(!keys(op,['type','start','end','scale','reason']))fail('Parámetros de acercamiento inválidos');
    const {type,...event}=op;next.zoomEvents=[...(next.zoomEvents??[]),event];
    row.description=`Acercamiento ${op.start}–${op.end} s: ${op.reason}`;
   }else if(op.type==='mastering'){
    if(!keys(op,['type','enabled'])||typeof op.enabled!=='boolean')fail('Masterización: enabled debe ser boolean.');
    next.masteringEnabled=op.enabled;
    row.description=op.enabled?'Activar margen de seguridad del audio final (-1,8 dB)':'Desactivar margen de seguridad del audio final';
   }else if(op.type==='overlay'){
    if(!keys(op,['type','resourceId','start','end','sourceIn','intensity','reason']))fail('Parámetros de overlay inválidos.');
    const asset=assets.find(a=>a.id===op.resourceId&&a.kind==='overlay');
    if(!asset){row.status='missing-resource';fail('No existe este overlay en la biblioteca privada.');}
    next.overlayEvents=[...(next.overlayEvents??[]),{assetId:asset.id,start:op.start,end:op.end,
      sourceIn:op.sourceIn??0,intensity:op.intensity,reason:op.reason}];
    row.description=`Overlay suave «${asset.title}»: ${op.start}–${op.end}s, intensidad ${op.intensity}`;
   }else if(op.type==='voice'){
    if(!keys(op,['type','preset','start','end','intensity'])||!['cinematic-echo','vintage-tv'].includes(op.preset)||!Number.isFinite(op.start)||!Number.isFinite(op.end)||!Number.isFinite(op.intensity))fail('Preset de voz inválido.');
    next.voiceEvents=[...(next.voiceEvents??[]),{preset:op.preset,start:op.start,end:op.end,intensity:op.intensity}];
    row.description=`Efecto de voz ${op.preset}: ${op.start}–${op.end} s; intensidad ${Math.round(op.intensity*100)} %`;
   }else if(op.type==='broll'){
    if(!keys(op,['type','resourceId','start','end','sourceIn','reason']))fail('Parámetros B-roll no válidos.');
    const video=assets.find(a=>a.id===op.resourceId&&a.kind==='video');
    if(!video){row.status='missing-resource';fail('Vídeo ausente en tu biblioteca: '+String(op.resourceId??'sin ID').slice(0,100));}
    if(!Number.isFinite(op.start)||!Number.isFinite(op.end)||op.end<=op.start||
       op.sourceIn!==undefined&&(!Number.isFinite(op.sourceIn)||op.sourceIn<0)||
       typeof op.reason!=='string'||op.reason.trim().length<5||op.reason.length>160)fail('B-roll necesita inicio, fin, motivo narrativo y tiempos válidos.');
    next.videoEvents=[...(next.videoEvents??[]),{assetId:video.id,start:op.start,end:op.end,
      ...(op.sourceIn!==undefined?{sourceIn:op.sourceIn}:{}),reason:op.reason}];
    row.description=`B-roll «${video.title}»: ${op.start}–${op.end} s; se mantiene la voz`;
   }else if(op.type==='motion'){
    if(!externalMotionCatalog(manifest).some(m=>m.id===op.resourceId)||manifest.camera.mode==='full-frame-fit')row.status='unsupported';
    if(motionCaptions.has(op.captionId))fail('No añadas dos motions al mismo subtítulo en un plan.');
    motionCaptions.add(op.captionId);
    row.description=applyExternalMotion(op,next,manifest);
   }else if(op.type==='transition'){
    if(!keys(op,['type','resourceId','start','duration','replace'])||!['warm','blur','radial'].includes(op.resourceId)||op.replace!==undefined&&typeof op.replace!=='boolean') {row.status='unsupported';fail('Transiciones disponibles: warm, blur, radial.');}
    if(!Number.isFinite(op.start)||op.start<0||op.duration!==.4||op.start+.4>manifest.duration-manifest.policy.outro.duration)fail('Tiempo inválido o dentro del cierre. Duración del destello: 0.4 s.');
    next.transitions=[...(next.transitions??[]).filter(t=>!(op.replace&&t.start===op.start)),{type:op.resourceId,start:op.start}];row.description=`${op.replace?'Sustituir':'Añadir'} transición ${op.resourceId}: ${op.start}–${op.start+.4} s`;
   }else if(op.type==='image'||op.type==='music'){
    const image=op.type==='image';if(!keys(op,image?['type','resourceId','start','end']:['type','resourceId','gain','duck']))fail('Parámetros de recurso no válidos.');
    const asset=assets.find(a=>a.id===op.resourceId&&a.kind===(image?'image':'audio'));
    if(!asset){row.status='missing-resource';fail('Recurso ausente en tu biblioteca: '+String(op.resourceId??'sin ID').slice(0,100));}
    if(image&&manifest.camera.mode==='full-frame-fit'){row.status='unsupported';fail('Este vídeo sólo tiene transcripción. La colocación segura de imágenes requiere análisis facial preparado.');}
    if(image){next.imageEvents=[...(next.imageEvents??[]),{assetId:asset.id,start:op.start,end:op.end}];row.description=`Imagen «${asset.title}»: ${op.start}–${op.end} s`;}
    else{if(!Number.isFinite(op.gain)||op.gain<0||op.gain>.18||typeof op.duck!=='boolean')fail('Música: gain 0–0.18 y duck true/false.');Object.assign(next,{musicAssetId:asset.id,musicEnabled:true,musicGain:op.gain,duckMusic:op.duck});row.description='Música: '+asset.title;}
   }else if(op.type==='sfx'){
    if(!keys(op,['type','resourceId','start','gain']))fail('Parámetros SFX no válidos.');
    const asset=assets.find(a=>a.id===op.resourceId&&a.kind==='sfx');
    if(!asset){row.status='missing-resource';fail('Sonido ausente en tu biblioteca: '+String(op.resourceId??'sin ID').slice(0,100));}
    next.sfxEvents=[...(next.sfxEvents??[]),{assetId:asset.id,start:op.start,gain:op.gain}];row.description=`Sonido «${asset.title}»: ${op.start} s, ${Math.round(op.gain*100)} %`;
   }else if(op.type==='caption'){
    if(!keys(op,['type','captionId','text'])||!manifest.captions.some(c=>c.id===op.captionId)||typeof op.text!=='string'||!op.text.trim()||op.text.length>52)fail('Subtítulo o texto inválido (máximo 52 caracteres).');
    next.captionOverrides={...next.captionOverrides,[op.captionId]:op.text};row.description='Corregir '+op.captionId+': '+op.text;
   }else if(op.type==='command'){
    if(!keys(op,['type','text'])||typeof op.text!=='string')fail('Comando inválido.');
    const proposal=commandPlanner(op.text,next);if(!proposal.canApply||!proposal.actions.length||proposal.changes.styleId!==undefined||proposal.changes.captionWords!==undefined)fail('Comando no compatible. Mantén estilo y agrupación actuales.');
    Object.assign(next,proposal.changes);Object.assign(commandChanges,proposal.changes);row.description=proposal.actions.join('; ');
   }else{row.status='unsupported';fail('Operación no soportada: '+String(op.description??op.type??'sin tipo').slice(0,150));}
  }catch(error){if(row.status==='ready')row.status='invalid';row.description=error.message;}
 }
 const notes=[];let prepared;
 if(rows.every(r=>r.status==='ready')){
  try{
   prepared=prepareProject(project,next);
   const execution=reviewInstructionExecution({changes:commandChanges,canApply:true,unsupported:[]},prepared.plan);
   if(!execution.canApply)fail(execution.unsupported.join(' '));
   if(imported.operations.some(o=>o.type==='zoom')&&!prepared.plan.semantic.zooms.length)fail('No se ha compilado el acercamiento solicitado.');
   if(imported.operations.some(o=>['transition','image','card','motion'].includes(o.type))&&next.motions===false)fail('Activa los recursos animados para mostrar motions, transiciones e imágenes.');
   if(imported.operations.some(o=>o.type==='command'&&/m[uú]sica/i.test(o.text))&&next.musicEnabled&&!prepared.plan.audioSourceAvailable)fail('No hay pista musical: elige un recurso de audio de la biblioteca.');
  }catch(error){const detail=/resource overlaps motion card/.test(error.message)?'La imagen coincide con un recurso animado existente. Elige otro intervalo.':/transitions overlap/.test(error.message)?'Hay transiciones solapadas. Separa sus tiempos.':error.message;notes.push('El montaje completo no es compatible: '+detail);}
 }
 const canApply=rows.every(r=>r.status==='ready')&&!notes.length;
 const reviewId=createHash('sha256').update(JSON.stringify({imported,base:baseline.fingerprint,result:prepared?.fingerprint,rows,notes})).digest('hex');
 return {canApply,reviewId,rows,notes,changes:canApply?next:null,timeSpace:'original-seconds',duration:manifest.duration,actions:rows.filter(r=>r.status==='ready').map(r=>r.description)};
}
