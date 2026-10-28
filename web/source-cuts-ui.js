/* Source cut review happens before a new AI edit. No automatic deletion. */
(()=>{
'use strict';
const el=id=>document.getElementById(id);
let uploadId=null,candidates=[],total=0,finish=null;
const draftKey=()=>uploadId?'sues-source-cuts-v1:'+uploadId:null;
function persist(){try{if(draftKey())localStorage.setItem(draftKey(),JSON.stringify({total,candidates}));}catch{}}
const clock=s=>{s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const selected=()=>candidates.filter(c=>c.selected);
const rawVideo=()=>el('source-video');
const cutRanges=()=>{
 const chosen=selected().map(c=>({start:Math.round(c.start*30)/30,end:Math.min(total,Math.round(c.end*30)/30)})).sort((a,b)=>a.start-b.start||a.end-b.end);
 const merged=[];
 for(const c of chosen){if(!merged.length||c.start>merged.at(-1).end+.000001)merged.push({...c});else merged.at(-1).end=Math.max(merged.at(-1).end,c.end);}
 return merged;
};
function refresh(){
 if(!uploadId)return;
 const list=el('source-cut-list'),blocks=el('source-cut-blocks');list.replaceChildren();blocks.replaceChildren();
 for(const c of candidates){
  const label=document.createElement('label');label.className='source-cut-row';
  const input=document.createElement('input');input.type='checkbox';input.checked=c.selected;input.onchange=()=>{c.selected=input.checked;refresh();};
  const text=document.createElement('span');const title=document.createElement('strong');title.textContent=`${clock(c.start)}–${clock(c.end)} · ${c.type==='silence'?'Silencio':c.type==='manual'?'Corte manual':'Fragmento hablado'}`;
  const reason=document.createElement('small');reason.textContent=`${c.reason} · ${(c.end-c.start).toFixed(2)} s a eliminar`;
  text.append(title,reason);label.append(input,text);list.append(label);
  const bar=document.createElement('span');bar.className='source-cut-block'+(c.selected?' selected':'');bar.style.left=(100*c.start/total)+'%';bar.style.width=Math.max(.5,100*(c.end-c.start)/total)+'%';bar.title=title.textContent;
  bar.addEventListener('click',()=>{c.selected=!c.selected;rawVideo().currentTime=Math.max(0,c.start-.3);refresh();});blocks.append(bar);
 }
 if(!candidates.length){const empty=document.createElement('p');empty.className='small';empty.textContent='No se han propuesto cortes automáticos. Puedes marcar cualquier fragmento manualmente.';list.append(empty);}
 const cuts=cutRanges(),removed=cuts.reduce((t,c)=>t+c.end-c.start,0);
 el('source-cut-silence-status').textContent=`${selected().filter(c=>c.type==='silence').length} silencios marcados. Las pausas conservan aproximadamente 0,5 segundos.`;
 el('source-cut-summary').textContent=`${selected().length} elementos seleccionados · ${removed.toFixed(2)} s a eliminar · duración prevista ${(total-removed).toFixed(2)} s`;
 persist();syncPlayhead();
}
function syncPlayhead(){const v=rawVideo();const pos=v?.currentTime??0;if(total)el('source-cut-playhead').style.left=Math.max(0,Math.min(100,pos/total*100))+'%';}
function onTime(){
 syncPlayhead();if(!uploadId||!el('source-cut-preview-jump').checked||rawVideo().paused)return;
 const pos=rawVideo().currentTime;
 const removed=cutRanges().find(c=>pos>=c.start&&pos<c.end-.01);
 if(removed){if(removed.end>=total-.02){rawVideo().pause();rawVideo().currentTime=total;}else rawVideo().currentTime=removed.end;}
}
function done(cuts){const resolve=finish;finish=null;uploadId=null;el('source-cut-panel').hidden=true;el('source-cut-preview-jump').checked=false;if(resolve)resolve(cuts);}
function review(upload){
 if(!upload?.id)throw Error('Selecciona primero un vídeo subido');
 if(finish)throw Error('Hay una revisión de cortes abierta');
 return (async()=>{
  const data=await api('uploads/'+upload.id+'/cut-suggestions');
  uploadId=upload.id;total=data.sourceDuration;
  candidates=[...data.silences,...data.spoken].map(c=>({...c,selected:false}));
  try{const saved=JSON.parse(localStorage.getItem(draftKey()));if(saved&&saved.total===total&&Array.isArray(saved.candidates)&&saved.candidates.length<=200&&saved.candidates.every(c=>Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&c.end<=total&&['silence','speech','manual'].includes(c.type)))candidates=saved.candidates;}catch{}
  el('source-cut-panel').hidden=false;
  el('source-cut-duration').textContent='Original '+clock(total);
  el('source-cut-total').textContent=clock(total);
  el('source-cut-preview-jump').checked=false;
  el('source-cut-start').max=String(total);el('source-cut-end').max=String(total);
  el('source-cut-start').value='0';el('source-cut-end').value=String(Math.min(total,1));
  showTool('material');showPlayer('original');
  if(!rawVideo().currentSrc||!rawVideo().currentSrc.includes(upload.id))originalVideo('/api/uploads/'+upload.id+'/media',upload.name);
  refresh();
  el('source-cut-panel').scrollIntoView({block:'start',behavior:'auto'});
  return await new Promise(resolve=>{finish=resolve;});
 })();
}
el('source-select-silences').onclick=()=>{for(const c of candidates)if(c.type==='silence')c.selected=true;refresh();};
el('source-clear-cuts').onclick=()=>{for(const c of candidates)c.selected=false;refresh();};
el('source-cut-start-now').onclick=()=>{el('source-cut-start').value=rawVideo().currentTime.toFixed(3);};
el('source-cut-end-now').onclick=()=>{el('source-cut-end').value=rawVideo().currentTime.toFixed(3);};
el('source-cut-add').onclick=()=>{
 let start=Number(el('source-cut-start').value),end=Number(el('source-cut-end').value);
 start=Math.round(start*30)/30;end=Math.min(total,Math.round(end*30)/30);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>total||end-start<1/30-1e-8){el('source-cut-warning').textContent='Indica un inicio y final válidos. El intervalo debe ser al menos un fotograma.';return;}
 candidates.push({id:'manual-'+Date.now()+'-'+candidates.length,type:'manual',start,end,reason:'Fragmento señalado manualmente',selected:true});
 candidates.sort((a,b)=>a.start-b.start);el('source-cut-warning').textContent='Fragmento añadido. Revisa la lista; se conservará el original.';refresh();
};
el('source-cut-timeline').addEventListener('click',event=>{
 if(event.target!==event.currentTarget)return;
 const rect=event.currentTarget.getBoundingClientRect();rawVideo().currentTime=Math.max(0,Math.min(total,(event.clientX-rect.left)/rect.width*total));
});
el('source-cut-continue').onclick=()=>{
 const cuts=cutRanges();
 if(cuts.some(c=>c.end-c.start<1/30-.0000001)||cuts.reduce((a,c)=>a+c.end-c.start,0)>total-.1){el('source-cut-warning').textContent='Estos cortes dejan el vídeo vacío o tienen un intervalo inválido.';return;}
 if(selected().some(c=>c.type==='speech'||c.type==='manual')&&!confirm('Has marcado fragmentos que pueden contener voz. ¿Confirmas eliminarlos? El original no se borrará.'))return;
 done(cuts);
};
el('source-cut-skip').onclick=()=>done([]);
rawVideo().addEventListener('timeupdate',onTime);rawVideo().addEventListener('seeked',syncPlayhead);
window.suesSourceCuts={review};
})();
