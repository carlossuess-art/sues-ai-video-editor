export const MODNET_SHA='07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9';
const norm=s=>s.normalize('NFC').replace(/[^\p{L}]/gu,'').toLocaleUpperCase('es');
export const FOREGROUND_WEIGHTS=new Map([['MIEDO',6],['BLOQUEO',6],['BLOQUEOS',6],['LIBERTAD',5],['MUNDO',5],['INTERIOR',5],['OJOS',5],['CADENAS',5],['CULPA',4],['RECONOCER',4],['MIRAR',3],['CRECIMIENTO',4]]);
const overlap=(a,b)=>a.start<b.end&&a.end>b.start;
export function automaticTitleTop(plan,start,end){const points=(plan.semantic?.anchors??[]).flatMap(a=>a.points??[]).filter(p=>p.time>=start&&p.time<=end&&Number.isFinite(p.y));if(!points.length)throw Error('Automatic foreground: missing eye placement');const ys=points.map(p=>p.y).sort((a,b)=>a-b);return Math.round(Math.max(380,Math.min(1100,ys[Math.floor(ys.length/2)]*1920-320)));}

export function validateAutomaticForegroundPolicy(data,plan,spaceHash){
 const weights=FOREGROUND_WEIGHTS,fail=m=>{throw Error('Automatic foreground: '+m);};
 const keys=['schema','sourceSha256','cameraSpaceSha256','runtime','startFrame','activeFrames','frames','events','evidence'];
 if(!data||Object.keys(data).some(k=>!keys.includes(k))||data.schema!=='sues-automatic-foreground/v1'||data.sourceSha256!==plan.source.sha256||data.cameraSpaceSha256!==spaceHash)fail('source/camera/timeline binding');
 if(data.runtime?.modelSha256!==MODNET_SHA)fail('unapproved model');
 const {startFrame,activeFrames,frames}=data;
 if(![startFrame,activeFrames,frames].every(Number.isInteger)||startFrame<0||activeFrames<30||activeFrames>90||startFrame+activeFrames>frames||frames!==Math.ceil(plan.duration*30-1e-7)||frames>3600)fail('bounded inference window');
 const a=startFrame/30,b=(startFrame+activeFrames)/30;
 const es=data.events;
 if(!Array.isArray(es)||es.length!==2||es[0].type!=='background-blur'||es[0].sigma!==12||es[0].start!==a||es[0].end!==b||es[1].type!=='behind-text'||Math.abs(es[1].start-(a+.2))>1e-8||es[1].end!==b||!Array.isArray(es[1].lines)||es[1].lines.length!==1)fail('supported composition contract');
 if(es[1].top!==automaticTitleTop(plan,a,b))fail('eye-derived text placement changed');
 if(Object.keys(es[0]).some(k=>!['type','sigma','start','end'].includes(k))||Object.keys(es[1]).some(k=>!['type','start','end','lines','top'].includes(k)))fail('unknown event parameter');
 const e=data.evidence,c=plan.captions.find(c=>c.id===e?.captionId),i=e?.displayWordIndex;
 if(!e||Object.keys(e).some(k=>!['captionId','displayWordIndex','word','method'].includes(k))||e.word!==es[1].lines[0]||!c||c.source!=='auto'||!Number.isInteger(i)||norm(c.text.split(/\s+/)[i]??'')!==es[1].lines[0]||!weights.has(es[1].lines[0])||e.method!=='explicit-lexical-baseline-not-creative-model')fail('literal spoken evidence');
 const cue=c.wordCues.find(q=>q.wordIndexes.includes(c.wordIndexes[i]));
 if(!cue||cue.timingUncertain||startFrame!==Math.round((cue.start-.1)*30))fail('spoken timing changed');
 const hidden=[...(plan.selectedMedia??[]),...(plan.subjectLayers??[]),...(plan.illustrations??[]),...(plan.semantic?.motions??[]),...(plan.graphics??[]),...(plan.elements??[]),...(plan.depthText??[])];
 if(hidden.some(o=>overlap({start:a,end:b},o)))fail('incompatible resource overlap');
 return structuredClone(data);
}
