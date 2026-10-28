// Structural minimum for the agreed short DOPAMIN format. This is not an
// aesthetic assessment: every choice still needs narrative and visual review.
export function dopaminQualityGate(plan){
 if(plan?.policy?.templateId!=='SUES_DOPAMIN'||plan.duration<60||plan.duration>75)return {applicable:false,pass:true,issues:[]};
 const broll=plan.selectedMedia??[], motions=[...(plan.semantic?.motions??[]),...(plan.graphics??[]),...(plan.elements??[]),...(plan.masterGraphics??[])];
 const cutouts=[...(plan.subjectLayers??[]),...(plan.foregroundEffects?.events??[]).filter(e=>e.type==='behind-video'||e.type==='background-blur')];
 const visuals=[...broll,...motions,...cutouts,...(plan.semantic?.zooms??[]),...(plan.ambientOverlays??[]),...(plan.globalTransitions??[]),...(plan.illustrations??[]),...(plan.foregroundEffects?.events??[])].filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end>e.start&&e.end<=plan.duration);
 const starts=visuals.map(e=>e.start).sort((a,b)=>a-b),distinct=[];
 for(const start of starts)if(!distinct.length||start-distinct.at(-1)>=.3)distinct.push(start);
 const issues=[];
 if(broll.length<5)issues.push('al menos cinco B-rolls');
 if(motions.length<2)issues.push('al menos dos motion graphics');
 if(!cutouts.length)issues.push('al menos una composición con sujeto recortado');
 if(!distinct.some(t=>t<=3))issues.push('un apoyo visual durante los tres primeros segundos');
 if(distinct.length<Math.floor(plan.duration/3))issues.push('más cambios visuales distribuidos durante el vídeo');
 const intervals=visuals.map(e=>[e.start,e.end]).sort((a,b)=>a[0]-b[0]);let covered=0,maxGap=0;
 for(const [start,end]of intervals){maxGap=Math.max(maxGap,start-covered);covered=Math.max(covered,end);}
 maxGap=Math.max(maxGap,plan.duration-covered);
 if(maxGap>6)issues.push('ningún tramo de más de seis segundos sin apoyo visual');
 return {applicable:true,pass:issues.length===0,issues,counts:{broll:broll.length,motions:motions.length,cutouts:cutouts.length,visualChanges:distinct.length},maxGap};
}
