const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const num = x => typeof x === 'number' && Number.isFinite(x);
const clean = s => String(s ?? '').replace(/\s+/g,' ').trim();

export function validateTranscript(t) {
  assert(t && t.version === '1.0', 'Transcript: version 1.0 obligatoria');
  assert(typeof t.language === 'string' && t.language.length >= 2 && t.language.length <= 12, 'Transcript: language inválido');
  assert(num(t.sourceDuration) && t.sourceDuration > 0 && t.sourceDuration <= 6*60*60, 'Transcript: duración fuente inválida');
  assert(Array.isArray(t.words) && t.words.length > 0, 'Transcript: words obligatorio');
  let lastStart = -1;
  for (const [i,w] of t.words.entries()) {
    assert(clean(w.text).length > 0 && clean(w.text).length <= 80, `Transcript: word ${i} sin texto válido`);
    assert(num(w.start) && num(w.end) && w.start >= 0 && (w.end > w.start || (w.end === w.start && w.timingUncertain === true)) && w.end <= t.sourceDuration + 1e-6, `Transcript: word ${i} fuera de rango`);
    assert(w.start >= lastStart - 1e-6, `Transcript: words desordenadas en ${i}`);
    if (w.confidence !== undefined) assert(num(w.confidence) && w.confidence >= 0 && w.confidence <= 1, `Transcript: confidence inválida en ${i}`);
    lastStart = w.start;
  }
  if (t.text !== undefined) assert(typeof t.text === 'string', 'Transcript: text debe ser string');
  return true;
}

export function mapWordsToTimeline(transcript, segments) {
  validateTranscript(transcript);
  assert(Array.isArray(segments) && segments.length > 0, 'Timeline: segments obligatorio');
  const mapped = [];
  let cursor = 0;
  for (const [si,s] of segments.entries()) {
    assert(num(s.in) && num(s.out) && s.in >= 0 && s.out > s.in && s.out <= transcript.sourceDuration + 1e-6, `Timeline: segmento ${si} inválido`);
    for (const [wi,w] of transcript.words.entries()) {
      const start = Math.max(w.start, s.in);
      const end = Math.min(w.end, s.out);
      const point = w.start === w.end && w.timingUncertain === true;
      if (point ? !(w.start >= s.in && w.start < s.out) : end <= start) continue;
      const clipped = start !== w.start || end !== w.end;
      // A cut through a spoken word must not display the complete word as a caption.
      // Future semantic cutting should avoid this situation; for now fail safe by omitting it.
      if (clipped) continue;
      mapped.push({
        ...w,
        text: clean(w.text),
        start: cursor + (start - s.in),
        end: cursor + (end - s.in),
        sourceStart: w.start,
        sourceEnd: w.end,
        sourceWordIndex: wi,
        sourceSegmentIndex: si,
        clipped
      });
    }
    cursor += s.out - s.in;
  }
  mapped.sort((a,b)=>a.start-b.start || a.end-b.end);
  return {words:mapped,duration:cursor};
}

export function segmentWords(words,{maxWords=8,maxChars=42,maxDuration=4.5,gapBreak=0.65}={}) {
  assert(Array.isArray(words), 'segmentWords: words debe ser lista');
  if (!words.length) return [];
  const out=[];
  let current=[];
  const flush=()=>{
    if(!current.length) return;
    const start=current[0].start,end=current.at(-1).end;
    assert(end > start, 'Caption sin intervalo temporal: revisar marcas inciertas');
    out.push({
      id:`seg-${String(out.length+1).padStart(3,'0')}`,
      text:clean(current.map(w=>w.text).join(' ')),
      start,
      end,
      wordIndexes:current.map(w=>w.sourceWordIndex ?? null),
      source:'auto'
    });
    current=[];
  };
  for (const w of words) {
    const text=clean(w.text);
    if(!text) continue;
    const prev=current.at(-1);
    const proposed=clean([...current.map(x=>x.text),text].join(' '));
    const wouldOverflow=current.length>0 && (
      current.length+1>maxWords ||
      proposed.length>maxChars ||
      w.end-current[0].start>maxDuration ||
      (prev && w.start-prev.end>gapBreak) ||
      (prev && prev.sourceSegmentIndex !== w.sourceSegmentIndex)
    );
    if(wouldOverflow) flush();
    current.push({...w,text});
    if(/[.!?…:]$/.test(text) || current.length>=maxWords || clean(current.map(x=>x.text).join(' ')).length>=maxChars || current.at(-1).end-current[0].start>=maxDuration) flush();
  }
  flush();
  return out;
}

export function applySegmentEdits(segments, edits=[]) {
  assert(Array.isArray(segments) && Array.isArray(edits), 'Edición: listas obligatorias');
  const byId=new Map(edits.map(e=>[e.id,e]));
  return segments.flatMap(seg=>{
    const e=byId.get(seg.id);
    if(!e) return [seg];
    if(e.delete===true) return [];
    const next={...seg,source:'manual'};
    if(e.text!==undefined){const t=clean(e.text);assert(t.length>0&&t.length<=90,'Edición: texto 1–90 caracteres');next.text=t;}
    if(e.start!==undefined)next.start=e.start;
    if(e.end!==undefined)next.end=e.end;
    assert(num(next.start)&&num(next.end)&&next.start>=0&&next.end>next.start,'Edición: tiempos inválidos');
    return [next];
  });
}

export function transcriptToCaptionTexts(transcript, plan,{edits=[],segmentation={}}={}) {
  assert(plan?.source && Math.abs(plan.source.duration-transcript.sourceDuration)<0.05, 'Transcript y plan no corresponden a la misma duración fuente');
  const mapped=mapWordsToTimeline(transcript,plan.segments);
  const auto=segmentWords(mapped.words,segmentation);
  const segments=applySegmentEdits(auto,edits);
  assert(segments.length<=58,'Demasiados captions para el límite actual del plan');
  const captions=segments.map(s=>({role:'caption',text:s.text,start:s.start,length:s.end-s.start,id:s.id,source:s.source}));
  return {captions,segments,mappedDuration:mapped.duration};
}

export function withTranscriptCaptions(plan, transcript, options={}) {
  const {captions,segments,mappedDuration}=transcriptToCaptionTexts(transcript,plan,options);
  const cleanTexts=(plan.texts??[]).filter(t=>t.role!=='caption');
  return {plan:{...plan,texts:[...cleanTexts,...captions.map(({id,source,...t})=>t)]},segments,mappedDuration};
}
