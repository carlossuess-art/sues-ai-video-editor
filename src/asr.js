import {validateTranscript} from './transcript.js';
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const num=x=>typeof x==='number'&&Number.isFinite(x);
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

export function normalizeWordTimestampResult({language='und',duration,text='',words,provider='generic'}={}){
  assert(num(duration)&&duration>0,'ASR: duración inválida');
  assert(Array.isArray(words)&&words.length>0,'ASR: words obligatorio');
  const transcript={
    version:'1.0',
    language:clean(language)||'und',
    sourceDuration:duration,
    text:clean(text),
    provider,
    timing:'word',
    words:words.map(w=>({
      text:clean(w.text??w.word),
      start:Number(w.start),
      end:Number(w.end),
      ...(Number(w.end)===Number(w.start)?{timingUncertain:true}:{}),
      ...(num(w.confidence)?{confidence:w.confidence}:{})
    }))
  };
  validateTranscript(transcript);
  return transcript;
}

export function normalizeOpenAIWhisperVerbose(payload,{sourceDuration}={}){
  assert(payload&&Array.isArray(payload.words),'OpenAI Whisper: respuesta verbose_json con words obligatoria');
  const duration=num(sourceDuration)?sourceDuration:Number(payload.duration);
  return normalizeWordTimestampResult({
    language:payload.language==='spanish'?'es':payload.language||'und',
    duration,
    text:payload.text||'',
    provider:'openai/whisper-1',
    words:restoreWordPunctuation(payload.words,payload.text).map(w=>({text:w.word,start:w.start,end:w.end}))
  });
}

export function openAIWhisperRequestSpec({language='es'}={}){
  return {
    model:'whisper-1',
    response_format:'verbose_json',
    timestamp_granularities:['word'],
    language
  };
}

export function validateASRAdapter(adapter){
  assert(adapter&&typeof adapter.transcribe==='function','ASR adapter debe implementar transcribe(file, options)');
  return true;
}

// Add punctuation only when full text and timestamp tokens have identical lexical content.
// Never replace words or infer timestamps from the reference script.
export function restoreWordPunctuation(words,text='') {
  const tokens=clean(text).split(' ');
  const lexical=s=>String(s).normalize('NFC').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]/gu,'');
  if(tokens.length!==words.length || words.some((w,i)=>lexical(w.word)!==lexical(tokens[i]))) return words;
  return words.map((w,i)=>({...w,word:tokens[i]}));
}
