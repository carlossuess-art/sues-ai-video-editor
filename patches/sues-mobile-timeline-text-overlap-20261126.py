from pathlib import Path

app = Path("app.js")
source = app.read_text()

def substitute(old, new):
    global source
    if source.count(old) != 1:
        raise RuntimeError(f"Expected one match for {old[:90]}")
    source = source.replace(old, new, 1)

anchor = "function suesRefreshTrackLabels(){"
substitute(anchor, """let suesExpandedTextTrack = null;

function suesSyncTextOverlap() {
  const header = id => els.trackHeaders.querySelector(`.track-head[data-track="${CSS.escape(id)}"]`);
  const rowFor = id => els.tracks.querySelector(`.track[data-track="${CSS.escape(id)}"]`);
  if (suesExpandedTextTrack) {
    const { id, h } = suesExpandedTextTrack;
    const row = rowFor(id);
    const head = header(id);
    if (head) head.style.height = h + "px";
    if (row) {
      row.style.height = h + "px";
      delete row.dataset.suesTextSublanes;
      for (const el of row.querySelectorAll("[data-sues-text-sublane]")) {
        delete el.dataset.suesTextSublane;
        delete el.dataset.suesTextOverlap;
        el.style.removeProperty("--sues-word-top");
        el.style.removeProperty("--sues-word-height");
      }
    }
    suesExpandedTextTrack = null;
  }
  const selected = getClip(state.selId);
  if (!mobileTimeline() || selected?.kind !== "text") return;
  const track = trackOf(selected);
  const family = suesClipFamily(selected);
  const clips = project.clips.filter(clip => clip.track === track?.id);
  if (!track || !clips.every(clip => clip.kind === "text" && suesClipFamily(clip) === family)) return;

  // A chain of intersecting intervals is one group. Touching edges need one lane.
  const overlapGroups = [];
  for (const clip of clips.sort((a, b) => a.start - b.start || clipEnd(a) - clipEnd(b))) {
    const group = overlapGroups.at(-1);
    if (!group || clip.start >= group.end - 0.00001) {
      overlapGroups.push({ end: clipEnd(clip), clips: [clip] });
    } else {
      group.end = Math.max(group.end, clipEnd(clip));
      group.clips.push(clip);
    }
  }
  const group = overlapGroups.find(item => item.clips.includes(selected));
  if (!group || group.clips.length < 2) return;
  const ends = [];
  const lanes = new Map();
  for (const clip of group.clips) {
    let lane = ends.findIndex(end => clip.start >= end - 0.00001);
    if (lane < 0) lane = ends.length;
    ends[lane] = clipEnd(clip);
    lanes.set(clip.id, lane);
  }
  if (ends.length < 2) return;

  const row = rowFor(track.id);
  const head = header(track.id);
  if (!row || !head) return;
  suesExpandedTextTrack = track;
  row.dataset.suesTextSublanes = String(ends.length);
  row.style.height = head.style.height = (track.h * ends.length) + "px";
  for (const element of row.querySelectorAll(".clip[data-id]")) {
    const lane = lanes.get(element.dataset.id) ?? 0;
    element.dataset.suesTextSublane = String(lane);
    if (lanes.has(element.dataset.id)) element.dataset.suesTextOverlap = "true";
    element.style.setProperty("--sues-word-top", (lane * track.h + 3) + "px");
    element.style.setProperty("--sues-word-height", Math.max(8, track.h - 6) + "px");
  }
}

""" + anchor)
substitute("paintBeats();suesRefreshTrackLabels();", "paintBeats();suesRefreshTrackLabels();suesSyncTextOverlap();")
substitute('el.classList.toggle("primary",el.dataset.id===state.selId)}}else state.dirtyTimeline=true;', 'el.classList.toggle("primary",el.dataset.id===state.selId)}suesSyncTextOverlap()}else state.dirtyTimeline=true;')
app.write_text(source)

css = Path("sues-mobile.css")
css.write_text(css.read_text() + """
@media (max-width: 980px) {
  #tracks .clip[data-sues-text-sublane] {
    top: var(--sues-word-top);
    height: var(--sues-word-height);
    bottom: auto;
  }
}
""")

context = Path("sues-mobile-context.js")
source = context.read_text()
substitute(' const key=[mode,allLayers,family,category,compCtxId(),', ''' const overlap=selected&&els.tracks.querySelector('.clip[data-id="'+CSS.escape(selected.id)+'"][data-sues-text-overlap]');
 const extra=overlap?[...overlap.closest(".track").querySelectorAll("[data-sues-text-overlap]")].map(el=>el.dataset.id):[];
 const key=[mode,allLayers,family,category,compCtxId(),...extra,''')
substitute('const ids=new Set(chosen.map(c=>c.id)),rows=', 'const ids=new Set([...chosen.map(c=>c.id),...extra]),rows=')
substitute(' if(/caption|subtítul|subtitul|', ' if(p.caption===true||/caption|subtítul|subtitul|')
context.write_text(source)
