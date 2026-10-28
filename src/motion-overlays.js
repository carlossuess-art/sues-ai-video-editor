// Shapes are authored here, independent of symbol fonts or third-party assets.
export const EDITOR_MOTIONS=Object.freeze({check:'Marca de verificación',cross:'Cruz',strike:'Texto tachado',number:'Paso numerado',divider:'Separador'});
export const EDITOR_MOTION_IDS=Object.freeze({check:'CHECK_GREEN_01',cross:'CROSS_RED_01',strike:'STRIKE_TEXT_01',number:'NUMBER_BADGE_GOLD_01',divider:'DIVIDER_LINE_01'});
export function validateMotionChoices(choices=[]){
 const fail=message=>{throw new Error('Motion choices: '+message);};
 if(!Array.isArray(choices)||choices.length>50)fail('up to 50 choices');
 for(const c of choices){
  if(!c||!Object.keys(c).every(k=>['captionId','type','number'].includes(k))||!/^seg-\d{3,}$/.test(c.captionId)||!Object.hasOwn(EDITOR_MOTIONS,c.type))fail('invalid choice');
  if(c.type==='number'&&(!Number.isInteger(c.number)||c.number<1||c.number>99))fail('number 1..99');
  if(c.type!=='number'&&c.number!==undefined)fail('unexpected number');
 }
 if(new Set(choices.map(c=>c.captionId)).size!==choices.length)fail('duplicate caption');
}
export function motionChoicesToDecisions(choices,plan,enabled=true){
 validateMotionChoices(choices);
 return choices.flatMap(choice=>{
  const c=plan.captions.find(c=>c.id===choice.captionId);if(!c)throw new Error('Unknown motion caption: '+choice.captionId);
  if(!enabled)return [];
  const end=Math.max(c.end,c.start+(choice.type==='divider'?1.2:1.6));
  if(c.start<2||end>plan.duration-plan.policy.outro.duration||end-c.start>6)throw new Error('Motion choice too close to opening or closing');
  const bindings=choice.type==='number'?{number:String(choice.number),label:c.text}:choice.type==='strike'?{text:c.text}:{};
  return [{type:'motion',start:c.start,end,reason:'Recurso elegido por usuario: '+choice.captionId,rule:'user-motion-choice-v1',params:{motionId:EDITOR_MOTION_IDS[choice.type],bindings,semanticReason:{check:'positive',cross:'negative',strike:'correction',number:'steps',divider:'comparison'}[choice.type]},evidence:{method:'explicit-editor-choice-not-semantic-inference',captionId:c.id,sourceWordIndexes:c.wordIndexes,textOrigin:c.source==='manual'?'user-edited-caption':'transcript-caption',originalText:c.originalText??c.text}}];
 });
}
export function drawSymbolMotion(m,plan,event,safeText,assColor){
 const id=m.params.motionId;if(!['CHECK_GREEN_01','CROSS_RED_01','STRIKE_TEXT_01'].includes(id))return;
 const b=m.box,cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2,clip=`\\clip(${b.left},${b.top},${b.right},${b.bottom})`;
 const shape=(start,color,path,x,y)=>event(3,start,m.end,'Outro',`{${clip}\\an7\\pos(${x},${y})\\p1\\bord0\\shad0\\1c${assColor(color)}&\\fad(100,150)}${path}`);
 if(id==='STRIKE_TEXT_01'){
  const size=m.fontSize;
  event(2,m.start,m.end,'Outro',`{${clip}\\pos(${cx},${cy})\\fs${size}\\b1\\1c${assColor('#FFFFFF')}&\\fad(120,150)}${m.lines.map(safeText).join('\\N')}`);
  for(let i=0;i<m.lines.length;i++){
   const y=cy+(i-(m.lines.length-1)/2)*size*1.2;
   event(3,m.layerTimes.strike.start,m.end,'Outro',`{${clip}\\an7\\pos(${b.left+20},${y})\\p1\\bord0\\shad0\\1c${assColor('#FF786B')}&\\fscx0\\t(0,180,\\fscx100)\\fad(60,150)}m 0 0 l ${b.right-b.left-40} 0 ${b.right-b.left-40} 5 0 5`);
  }
 }else if(id==='CHECK_GREEN_01')shape(m.start,'#67D79A','m 0 50 l 14 36 38 60 86 6 100 20 39 88',cx-50,cy-50);
 else shape(m.start,'#FF786B','m 0 14 l 14 0 50 36 86 0 100 14 64 50 100 86 86 100 50 64 14 100 0 86 36 50',cx-50,cy-50);
}
