// Native SUES recipes, not an Adobe preset loader. Reuse the existing renderer,
// caption timing and spatial checks; imported text/paths never become bindings.
const recipes=Object.freeze([
 {id:'QUOTE_CARD_01',title:'Cita destacada',choice:'quote'},
 {id:'NUMBER_BADGE_GOLD_01',title:'Paso numerado',choice:'number'},
 {id:'STRIKE_TEXT_01',title:'Texto tachado',choice:'strike'},
 {id:'DIVIDER_LINE_01',title:'Separador',choice:'divider'}
]);
export function externalMotionCatalog(plan){
 return recipes.map(({id,title,choice})=>({id,title,available:plan.camera.mode!=='full-frame-fit',
  ...(choice==='number'?{number:'Entero de 1 a 99, obligatorio'}:{}),
  timing:'Ligado al caption; cita mínimo 2.2 s, número/tachado 1.6 s, separador 1.2 s. Inicio >=2 s; no invadir cierre. El compilador valida duración y colocación.',
  origin:'native-sues-renderer-not-imported-mogrt'}));
}
export function applyExternalMotion(op,settings,plan){
 const fail=message=>{throw Error(message);};
 const recipe=recipes.find(r=>r.id===op.resourceId);
 if(!recipe)fail('Motion no preparado. Usa exclusivamente motionResources del catálogo.');
 if(!Object.keys(op).every(k=>['type','resourceId','captionId','number'].includes(k)))fail('Parámetros de motion no válidos.');
 const caption=plan.captions.find(c=>c.id===op.captionId);
 if(!caption)fail('Subtítulo desconocido para el motion.');
 if(plan.camera.mode==='full-frame-fit')fail('Este vídeo sólo tiene transcripción. El motion requiere análisis facial preparado.');
 if(recipe.choice==='number'){
  if(!Number.isInteger(op.number)||op.number<1||op.number>99)fail('Número del motion: entero entre 1 y 99.');
 }else if(op.number!==undefined)fail('Este motion no admite número.');
 if(recipe.choice==='quote'){
  if((settings.motionChoices??[]).some(c=>c.captionId===op.captionId))fail('Ese subtítulo ya tiene otro motion. Retíralo antes de añadir una cita.');
  settings.highlightCaptions=[...new Set([...(settings.highlightCaptions??[]),op.captionId])];
 }else{
  if((settings.highlightCaptions??[]).includes(op.captionId))fail('Ese subtítulo ya tiene una cita. Retírala antes de añadir otro motion.');
  const existing=(settings.motionChoices??[]).find(c=>c.captionId===op.captionId);
  if(existing&&existing.type!==recipe.choice)fail('Ese subtítulo ya tiene otro tipo de motion. Retíralo antes de cambiarlo.');
  settings.motionChoices=[...(settings.motionChoices??[]).filter(c=>c.captionId!==op.captionId),{captionId:op.captionId,type:recipe.choice,...(recipe.choice==='number'?{number:op.number}:{})}];
 }
 return `${recipe.title}: ${op.captionId} (${caption.start} s)${recipe.choice==='number'?' · '+op.number:''}`;
}
