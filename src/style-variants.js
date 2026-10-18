export const STYLE_VARIANTS=Object.freeze({
 SUES_CALMA:{name:'CALMA',status:'functional',pacing:'slow',captions:{fontSize:96,maxDuration:2.4,entranceMs:180,fadeMs:60,characterEntrance:{staggerMs:24,settleMs:130}},camera:{baseZoom:1.04,maxZoom:1.18,targetZoom:1.08}},
 SUES_IMPACTO:{name:'IMPACTO',status:'experimental',pacing:'fast',captions:{fontSize:104,maxDuration:1.8,entranceMs:140,fadeMs:40,characterEntrance:{staggerMs:18,settleMs:100}},camera:{baseZoom:1.04,maxZoom:1.22,targetZoom:1.12}},
 SUES_EXPLICA:{name:'EXPLICA',status:'experimental',pacing:'medium',captions:{fontSize:88,maxDuration:3,entranceMs:160,fadeMs:60,characterEntrance:{staggerMs:24,settleMs:130}},camera:{baseZoom:1.04,maxZoom:1.14,targetZoom:1.06}},
 SUES_HISTORIA:{name:'HISTORIA',status:'experimental',pacing:'slow',captions:{fontSize:92,maxDuration:2.8,entranceMs:220,fadeMs:80,characterEntrance:{staggerMs:30,settleMs:150}},camera:{baseZoom:1.04,maxZoom:1.18,targetZoom:1.08}}
});
export function applyStyleVariant(template,id){
 const style=STYLE_VARIANTS[id];if(!style)throw new Error('Unknown style variant');
 // CALMA's own template remains authoritative, including editable policies.
 if(id==='SUES_CALMA')return {...template,id};
 return {...template,id,pacing:style.pacing,experimental:true,captions:{...template.captions,...structuredClone(style.captions)},camera:{...template.camera,...style.camera}};
}
