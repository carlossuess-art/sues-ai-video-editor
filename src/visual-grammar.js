// SUES 158623 · specialist audiovisual table accepted by Carlos, 04/11/2026.
export const VISUAL_GRAMMAR_158623=Object.freeze({
 id:'sues-visual-grammar-158623-v1',version:1,canvas:{width:1080,height:1920},
 type:{families:['Montserrat','Inter','Poppins'],connector:{minPx:62,maxPx:68,weight:600,alternateWeight:700,color:'#FFFFFF',shadow:{color:'#000000',opacity:.6,blurPx:8,offsetY:4}},hero:{minPx:98,maxPx:115,weight:900,alternateWeight:800,minRatio:1.5,maxRatio:1.8,uppercase:true},maxLines:3,maxWordsPerLine:3,maxLineWidthPx:750},
 palette:{fortune:{text:'#26F7FD',glow:'#00E5FF',radiusPx:25,opacity:.8},money:{text:'#59FF00',glow:'#32CD32',radiusPx:20,ambient:{opacity:.4,blend:'screen'}},contrast:{text:'#FFD000',glow:null}},
 speaker:{centerX:[510,520],chestY:[890,1060],avoid:['eyes','mouth','chin','platform-ui']},
 board:{headingY:[680,890],objectsY:[1000,1400],objectX:[300,780],fill:'#1E1E1E',outline:'#FFFFFF',outlinePx:6,shadowOpacity:.35},
 timing:{source:'spoken-word-timestamps',accumulate:true,resetOnNewSentence:true,entranceFrames:8,exitFrames:8},
 samples:[
  {second:0,x:510,y:[960],lines:[['una auténtica',62,'connector']]},
  {second:1,x:510,y:[940,1035],lines:[['una auténtica',62,'connector'],['FORTUNA',115,'fortune']]},
  {second:2,x:520,y:[930,1020],lines:[['No se compró',65,'connector'],['una',105,'contrast']]},
  {second:3,x:530,y:[910],lines:[['Donó',68,'connector']]},
  {second:4,x:520,y:[890,975,1055],lines:[['Donó',68,'connector'],['75 MILLONES',98,'money'],['de dólares',68,'connector']]},
  {second:5,x:500,y:[680],lines:[['al equipo',85,'board']]},
  {second:6,x:540,y:[680,785,890],lines:[['al equipo de',80,'board'],['efectos especiales',80,'board'],['y maquillaje',80,'board']]}
 ]
});
const validText=t=>typeof t==='string'&&t.trim()&&t.length<=90&&!/[<>]/.test(t);
export function validateVisualBeat(beat){
 if(!beat||!['speaker','fullGraphic'].includes(beat.layoutMode))throw Error('VisualBeat: unknown layout');
 if(!Number.isFinite(beat.start)||!Number.isFinite(beat.end)||beat.start<0||beat.end<=beat.start)throw Error('VisualBeat: invalid interval');
 if(!validText(beat.speechCue)||!Array.isArray(beat.lines)||!beat.lines.length||beat.lines.length>3)throw Error('VisualBeat: speech and 1–3 lines are required');
 let last=beat.start;
 for(const line of beat.lines){
  if(!validText(line.text)||!['connector','hero','fortune','money','contrast','board'].includes(line.role))throw Error('VisualBeat: invalid line');
  if(!Number.isFinite(line.at)||line.at<last||line.at>=beat.end)throw Error('VisualBeat: progressive speech time invalid');
  last=line.at;
  const t=VISUAL_GRAMMAR_158623.type;
  if(line.role==='connector'&&line.sizePx!==undefined&&(line.sizePx<t.connector.minPx||line.sizePx>t.connector.maxPx))throw Error('VisualBeat: connector size invalid');
  if(['hero','fortune','money','contrast'].includes(line.role)&&line.sizePx!==undefined&&(line.sizePx<t.hero.minPx||line.sizePx>t.hero.maxPx))throw Error('VisualBeat: hero size invalid');
 }
 return true;
}
export function compileVisualBeat(input){
 validateVisualBeat(input);
 const s=VISUAL_GRAMMAR_158623,boardMode=input.layoutMode==='fullGraphic';
 const lines=input.lines.map((l,i)=>{
  const hero=['hero','fortune','money','contrast'].includes(l.role),board=boardMode||l.role==='board';
  const pal=s.palette[l.role],sizePx=l.sizePx??(board?80:hero?98:62);
  return {text:l.text,at:l.at,end:input.end,role:l.role,sizePx,x:l.x??input.x??(boardMode?540:515),
   y:l.y??(boardMode?s.board.headingY[0]+i*105:s.speaker.chestY[0]+i*85),
   fontFamily:'Montserrat',fontWeight:board?800:hero?900:600,italic:!!l.italic,
   color:board?s.board.fill:(pal?.text??'#FFFFFF'),
   glow:pal?.glow?{color:pal.glow,radiusPx:pal.radiusPx,opacity:pal.opacity??.8}:null,
   outline:board?{color:s.board.outline,widthPx:s.board.outlinePx}:null,
   shadow:board?{opacity:s.board.shadowOpacity}:s.type.connector.shadow,
   entranceFrames:s.timing.entranceFrames,exitFrames:s.timing.exitFrames};
 });
 return {grammarId:s.id,start:input.start,end:input.end,speechCue:input.speechCue,layoutMode:input.layoutMode,lines,
   objectArea:boardMode?{x:s.board.objectX,y:s.board.objectsY}:null,
   keepSubject:!boardMode,accumulate:s.timing.accumulate,
   ambient:input.lines.some(l=>l.role==='money')?{color:s.palette.money.glow,...s.palette.money.ambient}:null};
}
export function appearanceAtFrame(line,frame,fps=30){
 if(!Number.isInteger(frame)||frame<0||!Number.isFinite(fps)||fps<=0)throw Error('VisualBeat: invalid frame');
 const t=frame/fps,i=Math.max(0,Math.min(1,(t-line.at)*fps/line.entranceFrames)),o=Math.max(0,Math.min(1,(line.end-t)*fps/line.exitFrames));
 return {visible:t>=line.at&&t<line.end,opacity:Math.min(i,o),scale:.93+.07*(1-(1-i)**3),translateY:(1-i)*12};
}
export function visualGrammarForProfile(styleId){
 const s=VISUAL_GRAMMAR_158623;
 return {id:s.id,reference:'158623',styleId,layoutModes:['speaker','fullGraphic'],type:s.type,palette:s.palette,speaker:s.speaker,board:s.board,timing:s.timing,
  colorMode:'reference-exact',intensity:styleId==='SUES_CALMA'?.5:1};
}
