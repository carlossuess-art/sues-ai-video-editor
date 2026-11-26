"""Use FableCut's existing cached /api/frame snapshots in visible mobile video clips."""
from pathlib import Path
import sys


app = Path(sys.argv[1])
source = app / "app.js"
js = source.read_text()


def replace(old, new):
    global js
    if js.count(old) != 1:
        raise SystemExit(f"Unexpected FableCut source near {old[:95]}")
    js = js.replace(old, new, 1)


replace(
    "function rebuildClips(){",
    """let suesFilmstripTimer = null;
let suesFilmstripBusy = false;
const suesFilmstripReady = new Map();
const suesFilmstripFailed = new Map();

function suesScheduleFilmstrip() {
  clearTimeout(suesFilmstripTimer);
  suesFilmstripTimer = setTimeout(suesPaintFilmstrip, 120);
}
els.timelineScroll.addEventListener("scroll", suesScheduleFilmstrip, {passive:true});

function suesFilmstripURL(clip, src, frame, fps) {
  const time = mediaTimeAt(clip,clip.start+frame/fps);
  return "/api/frame?" + new URLSearchParams({src,t:time.toFixed(6),w:"64",q:"5"});
}
function suesLoadFilmstrip(image, url) {
  const cached = suesFilmstripReady.get(url);
  if (cached) {
    suesFilmstripReady.delete(url);
    suesFilmstripReady.set(url,cached);
    image.src = cached;
    return;
  }
  if (suesFilmstripBusy || Date.now() < (suesFilmstripFailed.get(url)||0)) return;
  suesFilmstripBusy = true;
  fetch(url).then(response => {
    if (!response.ok || !response.headers.get("Content-Type")?.startsWith("image/")) {
      throw new Error("Frame unavailable");
    }
    return response.blob();
  }).then(blob => {
    const src = URL.createObjectURL(blob);
    suesFilmstripReady.set(url,src);
    image.src = src;
    if (suesFilmstripReady.size > 96) {
      const [oldURL,oldImage] = suesFilmstripReady.entries().next().value;
      suesFilmstripReady.delete(oldURL);
      URL.revokeObjectURL(oldImage);
    }
  }).catch(() => {
    suesFilmstripFailed.set(url,Date.now()+30000);
    if (suesFilmstripFailed.size > 96) suesFilmstripFailed.delete(suesFilmstripFailed.keys().next().value);
  }).finally(() => {
    suesFilmstripBusy = false;
    suesScheduleFilmstrip();
  });
}
function suesPaintFilmstrip() {
  if (!mobileTimeline() || state.gesture || state.playing || state.exporting || !state.connected) return;
  const viewport = els.timelineScroll.getBoundingClientRect();
  const fps = projectFps();
  const step = Math.max(1,Math.round(fps*Math.min(1,60/state.pps)));
  const jobs = [];
  for (const strip of els.tracks.querySelectorAll(".sues-filmstrip")) {
    const clip = getClip(strip.closest(".clip").dataset.id);
    const src = getMedia(clip?.mediaId)?.src;
    if (!clip || !/^\\/(?:media|library)\\//.test(src || "")) continue;
    const bounds = strip.getBoundingClientRect();
    if (bounds.bottom <= viewport.top || bounds.top >= viewport.bottom || bounds.width < 1) continue;
    const frameCount = Math.max(1,Math.ceil(clip.duration*fps));
    const left = Math.max(0,viewport.left-bounds.left);
    const right = Math.min(bounds.width,viewport.right-bounds.left);
    const from = Math.floor(left*fps/state.pps/step)*step;
    const until = Math.min(frameCount,right*fps/state.pps);
    const signature = JSON.stringify([from,Math.ceil(until/step),step,frameCount,src,clip.in,
      clip.props?.speed,clip.keyframes?.speed]);
    if (strip.dataset.signature !== signature) {
      strip.dataset.signature = signature;
      strip.replaceChildren();
      for (let first=from; first<until; first+=step) {
        const batch = document.createElement("img");
        batch.className = "sues-filmstrip-batch";
        batch.alt = "";
        batch.draggable = false;
        batch.decoding = "async";
        batch.style.left = (first/fps/clip.duration*100)+"%";
        batch.style.width = (Math.min(step/fps,clip.duration-first/fps)/clip.duration*100)+"%";
        batch.dataset.url = suesFilmstripURL(clip,src,first,fps);
        strip.appendChild(batch);
      }
    }
    jobs.push(...strip.children);
  }
  for (const image of jobs) {
    if (!image.hasAttribute("src")) suesLoadFilmstrip(image,image.dataset.url);
  }
}

function rebuildClips(){""",
)
replace(
    'const role=mobileTimeline()?suesLayerRole(c):"";const label=',
    """const role=mobileTimeline()?suesLayerRole(c):"";
 if (c.kind==="video" && suesRoleIcon(role)==="V") body+='<div class="sues-filmstrip" aria-hidden="true"></div>';
 const label=""",
)
replace(
    "paintAudioOverlaps();paintSilences();paintBeats();suesRefreshTrackLabels();",
    "paintAudioOverlaps();paintSilences();paintBeats();suesRefreshTrackLabels();suesScheduleFilmstrip();",
)
source.write_text(js)

with (app / "sues-mobile.css").open("a") as css:
    css.write("""
@media (max-width: 980px) {
  .sues-filmstrip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .sues-filmstrip-batch {
    position: absolute;
    top: 0;
    height: 100%;
    object-fit: fill;
    opacity: .86;
  }
  .sues-filmstrip-batch:not([src]) { display: none; }
}
""")
