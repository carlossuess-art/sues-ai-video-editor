import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const api = JSON.parse(readFileSync(new URL('../vendor/shotstack-edit.openapi.json', import.meta.url)));
// OpenAPI puts additionalProperties:false on the Asset union wrapper without
// properties. JSON Schema interprets that as rejecting EVERY asset property.
// Keep the original snapshot intact; member schemas enforce their own fields.
const schemas = structuredClone(api.components);
delete schemas.schemas.Asset.additionalProperties;
delete schemas.schemas.Destinations.additionalProperties;
const ajv = new Ajv({strict:false, allErrors:true, validateFormats:false});
const validateEdit = ajv.compile({$ref:'#/components/schemas/Edit', components:schemas});
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const num = x => typeof x === 'number' && Number.isFinite(x);
export function httpsURL(value) {
  const u = new URL(value);
  assert(u.protocol==='https:' && !u.username && !u.password && !u.hash, 'HTTPS sin credenciales ni fragmento obligatorio');
  assert(!['localhost','127.0.0.1','[::1]'].includes(u.hostname), 'No se admiten URLs locales');
  return u;
}
export function validatePlan(p) {
  assert(p && p.version==='1.0' && p.template==='SUES_CALMA_POC', 'Contrato/template no soportado');
  assert(p.source && num(p.source.duration) && p.source.duration>=30 && p.source.duration<=60, 'Fuente: duración 30–60 segundos');
  httpsURL(p.source.url);
  assert(p.output?.width===1080 && p.output?.height===1920 && p.output?.fps===30 && p.output?.format==='mp4', 'Salida fija 1080x1920 MP4 a 30fps');
  assert(Array.isArray(p.segments) && p.segments.length>=1 && p.segments.length<=8, 'Entre 1 y 8 segmentos');
  for (const s of p.segments) {
    assert(num(s.in) && num(s.out) && s.in>=0 && s.out>s.in && s.out<=p.source.duration, 'Corte fuera de fuente');
  }
  const duration = p.segments.reduce((a,s)=>a+s.out-s.in,0);
  assert(duration>0 && duration<=60, 'Timeline excede 60 segundos');
  assert(Array.isArray(p.texts) && p.texts.length<=60, 'texts debe ser una lista, máximo 60');
  for (const t of p.texts) {
    assert(typeof t.text==='string' && t.text.trim().length>0 && t.text.length<=90, 'Texto: entre 1 y 90 caracteres');
    assert(num(t.start) && num(t.length) && t.start>=0 && t.length>0 && t.start+t.length<=duration+1e-6, 'Texto fuera de timeline');
    assert(['title','caption','outro'].includes(t.role), 'Rol de texto inválido');
  }
  assert(num(p.originalVolume) && p.originalVolume>=0 && p.originalVolume<=1, 'Volumen inválido');
  if (p.music) {
    httpsURL(p.music.url);
    assert(num(p.music.duration) && p.music.duration>=duration, 'Música demasiado corta: no hay loop automático');
    assert(num(p.music.volume) && p.music.volume>=0 && p.music.volume<=0.2, 'Música: volumen máximo 0.2');
  }
  return duration;
}
export function buildEdit(p) {
  validatePlan(p);
  let cursor=0;
  const clips=p.segments.map(s=> {
    const c={asset:{type:'video',src:p.source.url,trim:s.in,volume:p.originalVolume},start:cursor,length:s.out-s.in,fit:'contain'};
    cursor+=c.length; return c;
  });
  // Each text gets its own track: intentional overlaps never share a track.
  const tracks=p.texts.map(t=>({clips:[{
    asset:{type:'rich-text',text:t.text,font:{family:'Open Sans',size:t.role==='title'?64:48,color:'#ffffff',weight:'600'},background:{color:'#101820',opacity:0.8,padding:16},align:{horizontal:'center',vertical:'middle'}},
    start:t.start,length:t.length,fit:'none',width:840,height:240,position:'center',offset:{x:0,y:t.role==='title'?0.28:-0.27}
  }]}));
  tracks.push({clips});
  if(p.music) tracks.push({clips:[{asset:{type:'audio',src:p.music.url,volume:p.music.volume},start:0,length:cursor}]});
  const edit={timeline:{background:'#101820',tracks},output:{format:'mp4',size:{width:1080,height:1920},fps:30,quality:'medium',destinations:[{provider:'shotstack',exclude:true}]}};
  validatePayload(edit);
  return edit;
}
export function validatePayload(edit) {
  assert(validateEdit(edit), `Shotstack schema: ${ajv.errorsText(validateEdit.errors)}`);
  assert(!edit.timeline.soundtrack && !edit.callback && JSON.stringify(edit.output.destinations)===JSON.stringify([{provider:'shotstack',exclude:true}]), 'POC: hosting desactivado, sin callbacks ni servicios extras');
  assert(edit.output.format==='mp4' && edit.output.size?.width===1080 && edit.output.size?.height===1920 && edit.output.fps===30, 'Salida POC inválida');
  for(const track of edit.timeline.tracks) {
    let end=0;
    for(const c of [...track.clips].sort((a,b)=>a.start-b.start)) {
      assert(num(c.start)&&num(c.length)&&c.length>0&&c.start>=end-1e-6, 'Solapamiento o tiempo inválido');
      end=c.start+c.length;
      assert(end<=60+1e-6,'Timeline excede 60 segundos');
      const a=c.asset;
      assert(['video','audio','rich-text'].includes(a.type), 'Sólo assets sin generación');
      // Reject generative options, even in sandbox.
      assert(!['prompt','model','options','enhance','transcription'].some(k=>k in a), 'Generación/transformación con coste prohibida');
      if(a.src) httpsURL(a.src);
    }
  }
  return true;
}
export const fingerprint = p => createHash('sha256').update(JSON.stringify(p)).digest('hex');
export function defaultPlan(url,duration) {
  const segments=[{in:0,out:12},{in:13,out:duration}];
  const end=duration-1;
  return {version:'1.0',template:'SUES_CALMA_POC',source:{url,duration},segments,
    texts:[{role:'title',text:'SUES HOLISTICS',start:0,length:3},{role:'outro',text:'Vuelve a ti · Sues Holistics',start:end-3,length:3}],
    originalVolume:1,output:{width:1080,height:1920,fps:30,format:'mp4'}};
}
