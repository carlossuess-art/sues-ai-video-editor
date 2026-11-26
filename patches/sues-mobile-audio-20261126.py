"""Group mobile audio tools and record independent voice-over with the FableCut playhead."""
from pathlib import Path
import sys


app = Path(sys.argv[1])
source = app / "sues-mobile-context.js"
js = source.read_text()


def replace(old, new):
    global js
    if js.count(old) != 1:
        raise SystemExit(f"Unexpected FableCut audio menu near {old[:95]}")
    js = js.replace(old, new, 1)


replace(
    ' ["effects","Efectos","fx"],["voice","Voz","audio"],["music","Música","audio"],["sfx","Sonidos","fx"]',
    ' ["effects","Efectos","fx"],["audio","Audio","audio"]',
)
start = js.index(' if(c.kind==="audio"){', js.index("function familyOf("))
end = js.index('\n if(matteTracks', start)
js = js[:start] + ' if(c.kind==="audio")return "audio";' + js[end:]
replace(
    'b.textContent=c.track+" · "+kind+" · "+(c.name||getComp(c.compId)?.name||c.id);',
    'b.textContent=c.track+" · "+(c.kind==="audio"?(SUES_FAMILY_LABELS[suesClipFamily(c)]||kind):kind)+" · "+(c.name||getComp(c.compId)?.name||c.id);',
)

replace(
    'function visualAdjust(){',
    """let suesVoiceTake = null;
function suesVoiceTrack(start,end) {
  const lanes = TRACKS.filter(t => t.kind === "audio");
  const free = lanes.find(t => isTrackEnabled(t.id) && !isTrackLocked(t.id) &&
    !project.clips.some(c => c.track===t.id && c.start<end && start<c.start+c.duration));
  if(free) return free.id;
  ensureAudioTrackCount(lanes.length+1);
  return TRACKS.filter(t => t.kind==="audio")[lanes.length]?.id || null;
}

function suesEndVoiceTake(take) {
  cancelAnimationFrame(take.frame);
  if(runtime.suesVoiceFrame===take.onFrame) delete runtime.suesVoiceFrame;
  take.timelineEnd=state.time;
  if(runtime.projectGen===take.generation && take.onFrame){
    if(state.playing) pause();
    state.previewRate=take.previousRate;
  }
  if(take.recorder && take.recorder.state!=="inactive") {
    take.recorder.stop();
  } else {
    take.stream?.getTracks().forEach(track => track.stop());
    if(suesVoiceTake===take) suesVoiceTake=null;
    render(true);
  }
}

async function suesRecordVoice() {
  if(suesVoiceTake?.start!=null) {
    suesEndVoiceTake(suesVoiceTake);
    return;
  }
  if(suesVoiceTake || state.exporting || state.rendering) return;
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !state.connected) {
    toast("La grabación necesita micrófono y conexión con el editor.");
    return;
  }
  const from=state.time;
  if(from>=projDur()-.1) {
    toast("Coloca el cabezal antes del final del vídeo.");
    return;
  }
  const take={generation:runtime.projectGen,from,frame:0};
  suesVoiceTake=take;
  try {
    take.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true},video:false});
    if(take.generation!==runtime.projectGen || state.exporting || state.rendering) {
      suesEndVoiceTake(take);
      return;
    }
    take.recorder=new MediaRecorder(take.stream);
    const chunks=[];
    take.recorder.addEventListener("dataavailable",event=>{if(event.data.size)chunks.push(event.data)});
    take.recorder.addEventListener("error",()=>{
      take.invalid=true;
      toast("El micrófono ha interrumpido la grabación.");
      suesEndVoiceTake(take);
    });
    take.recorder.addEventListener("stop",async ()=>{
      take.stream.getTracks().forEach(track=>track.stop());
      try {
        if(take.invalid || take.generation!==runtime.projectGen || !chunks.length) return;
        const span=take.timelineEnd-take.start;
        if(span<.1) {
          toast("La toma es demasiado corta.");
          return;
        }
        const track=suesVoiceTrack(take.start,take.timelineEnd);
        if(!track) {
          toast("No hay una pista de audio libre para la toma.");
          return;
        }
        const type=take.recorder.mimeType || chunks[0].type;
        const ext=type.includes("ogg")?"ogg":type.includes("mp4")?"m4a":"webm";
        const file=new File(chunks,"Voz superpuesta "+new Date().toISOString().replace(/[:.]/g,"-")+"."+ext,
          {type:type.split(";")[0]});
        const [audio]=await importFiles([file]);
        if(!audio || take.generation!==runtime.projectGen) return;
        if(audio.transient) {
          toast("La toma quedó en esta sesión. Revisa la conexión para guardarla.");
          return;
        }
        const clip=addClipFromMedia(audio,track,take.start);
        if(clip) {
          clip.duration=Math.min(span,audio.duration || span);
          ensureWave(audio);
          scheduleSave();
          toast("Voz superpuesta guardada.");
        }
      } catch (error) {
        toast("No se pudo guardar la voz superpuesta.");
      } finally {
        if(suesVoiceTake===take) suesVoiceTake=null;
        render(true);
      }
    },{once:true});
    pause();
    setTime(from);
    take.previousRate=state.previewRate;
    state.previewRate=1;
    take.onFrame=ready=>{
      try {
        if(!ready && take.recorder.state==="recording") take.recorder.pause();
        if(!ready) return;
        if(take.recorder.state==="paused") {
          take.recorder.resume();
        }else if(take.start==null){
          take.start=state.time;
          take.recorder.start();
          render(true);
        }
      }catch(error){
        take.invalid=true;
        suesEndVoiceTake(take);
        toast("No se pudo sincronizar el micrófono.");
      }
    };
    runtime.suesVoiceFrame=take.onFrame;
    play();
    const prepareUntil=performance.now()+10000;
    const tick=()=>{
      if(take.generation!==runtime.projectGen || !state.playing || state.exporting ||
          (take.start==null && performance.now()>prepareUntil)){
        suesEndVoiceTake(take);
        return;
      }
      take.frame=requestAnimationFrame(tick);
    };
    take.frame=requestAnimationFrame(tick);
  }catch(error){
    suesEndVoiceTake(take);
    toast(error.name==="NotAllowedError"?"Activa el permiso del micrófono para grabar.":"No se pudo iniciar la grabación.");
  }
}
function visualAdjust(){""",
)

replace(
    'add("sounds","Sonidos","audio",()=>chooseMedia("project","Sonidos"));add("sfx","Efectos de sonido","fx",()=>chooseMedia("sfx","Efectos de sonido"));',
    '''add("voiceover",suesVoiceTake?.start!=null?"Detener grabación":"Grabar voz superpuesta","audio",suesRecordVoice);
   add("sounds","Música y audio importado","audio",()=>chooseMedia("project","Música y audio importado"));
   add("sfx","Efectos sonoros","fx",()=>chooseMedia("sfx","Efectos sonoros"));''',
)

source.write_text(js)

core = app / "app.js"
core_js = core.read_text()
anchor = "const ready=suesReadyAt(next);if(!ready){"
if core_js.count(anchor) != 1:
    raise SystemExit("Unexpected FableCut playback clock")
core.write_text(core_js.replace(anchor,
    "const ready=suesReadyAt(next);runtime.suesVoiceFrame?.(ready);if(!ready){", 1))
