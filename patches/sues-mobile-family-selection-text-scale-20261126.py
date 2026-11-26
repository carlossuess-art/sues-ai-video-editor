"""Apply after the timeline family and quick font-size patches to FableCut 1.18."""
from pathlib import Path
import sys


app = Path(sys.argv[1])
source = app / "app.js"
js = source.read_text()


def replace(old, new):
    global js
    if js.count(old) != 1:
        raise SystemExit(f"Unexpected FableCut source near {old[:100]}")
    js = js.replace(old, new, 1)


replace(
    "function suesRefreshTrackLabels(){",
    """const SUES_FAMILY_LABELS = {
  V:"Vídeo", T:"Títulos", ST:"Subtítulos", F:"Fondos", I:"Imágenes",
  E:"Elementos", BR:"B-roll (vídeo de apoyo)", MR:"Máscara Roll",
  MG:"Motion Graphics (gráficos animados)", VFX:"Efectos visuales",
  CE:"Color Emocional", IL:"Iluminación", A:"Audio original",
  VS:"Voz superpuesta", M:"Música", SFX:"Efectos sonoros"
};
const SUES_FAMILY_STROKES = {
  V:"#3675c5", T:"#ffda35", ST:"#ffffff", F:"#999999", I:"#e7a455",
  E:"#e7a455", BR:"#a17add", MR:"#e8c4ff", MG:"#b5dc69",
  VFX:"#d4af37", CE:"#d4af37", IL:"#d4af37", A:"#45d9e5",
  VS:"#45d9e5", M:"#45d9e5", SFX:"#45d9e5"
};
let suesActiveFamily = null;

function suesClipFamily(clip) {
  return suesRoleIcon(suesLayerRole(clip));
}
function suesFamilyAllows(clip) {
  return !mobileTimeline() || !suesActiveFamily ||
    (!!clip && suesClipFamily(clip) === suesActiveFamily);
}
function suesToggleFamily(family) {
  suesActiveFamily = suesActiveFamily === family ? null : family;
  if (suesActiveFamily && [...state.selIds].some(id => !suesFamilyAllows(getClip(id)))) {
    setSelection([...state.selIds].filter(id => suesFamilyAllows(getClip(id))));
  }
  suesRefreshTrackLabels();
  toast(SUES_FAMILY_LABELS[family] + (suesActiveFamily ? "" : " · selección libre"));
}
function suesRefreshTrackLabels(){""",
)
replace(
    "if(!mobileTimeline())return;\n for(const t of TRACKS){",
    """if(!mobileTimeline())return;
 if(suesActiveFamily) els.tracks.dataset.suesActiveFamily = suesActiveFamily;
 else delete els.tracks.dataset.suesActiveFamily;
 for(const t of TRACKS){""",
)
replace(
    'h.dataset.suesRole=role;h.dataset.suesFamily=suesRoleIcon(role);if(label){label.textContent=suesRoleIcon(role)+" "+role;label.title=t.id+" · "+role}',
    """const family = suesRoleIcon(role);
  const button = h.querySelector(".track-id");
  h.dataset.suesRole = role;
  h.dataset.suesFamily = family;
  if (label) label.textContent = family;
  if (button) {
    const description = SUES_FAMILY_LABELS[family] || role;
    button.title = t.id + " · " + description;
    button.setAttribute("aria-label", description);
    if (SUES_FAMILY_LABELS[family]) button.setAttribute("aria-pressed", String(suesActiveFamily === family));
    else button.removeAttribute("aria-pressed");
  }""",
)
replace(
    'if(mobileTimeline()){const candidates=project.clips.filter(c=>c.track===t.id);',
    'if(mobileTimeline()){const family=suesRoleIcon(suesTrackRole(t));if(SUES_FAMILY_LABELS[family]){suesToggleFamily(family);return}const candidates=project.clips.filter(c=>c.track===t.id&&suesFamilyAllows(c));',
)
replace(
    "function selectMobileTimelineClip(id){const c=getClip(id);",
    "function selectMobileTimelineClip(id){const c=getClip(id);if(c&&!suesFamilyAllows(c))return;",
)
replace(
    "function setSelection(ids,primary){mobileExplicitSelection=null;",
    """function setSelection(ids,primary){mobileExplicitSelection=null;
 if (mobileTimeline() && suesActiveFamily) {
   ids = ids.filter(id => suesFamilyAllows(getClip(id)));
   if (primary && !ids.includes(primary)) primary = undefined;
 }""",
)
replace(
    "function selectClip(id,opts){if",
    "function selectClip(id,opts){if(id!=null&&!suesFamilyAllows(getClip(id)))return;if",
)
replace(
    "isVisualClip(c)&&!mattes.has(c.track)",
    "isVisualClip(c)&&!mattes.has(c.track)&&suesFamilyAllows(c)",
)
replace(
    'ctx2d.lineWidth=lw;ctx2d.strokeStyle="#4f8cff";ctx2d.save();ctx2d.translate(b.cx,b.cy)',
    'ctx2d.lineWidth=lw;ctx2d.strokeStyle=mobileTimeline()?(SUES_FAMILY_STROKES[suesClipFamily(c)]||"#4f8cff"):"#4f8cff";ctx2d.save();ctx2d.translate(b.cx,b.cy)',
)
replace(
    'const ANIMATABLE=["x","y","scale",',
    'const ANIMATABLE=["x","y","scale","textScaleX","textScaleY",',
)
replace(
    "function layerScreenMatrix(c,p,W,H,t){const as=Motion.contentScale(c,p);return parentScreenMatrix(c,W,H,t).translate(+p.x||0,+p.y||0).rotate(+p.rotation||0).translate(-(+p.anchorX||0)*as,-(+p.anchorY||0)*as)}",
    """function suesTextAxis(value) {
  return Number.isFinite(value) ? clamp(value, .05, 12) : 1;
}
function layerScreenMatrix(c,p,W,H,t) {
  const as = Motion.contentScale(c,p);
  const matrix = parentScreenMatrix(c,W,H,t).translate(+p.x||0,+p.y||0)
    .rotate(+p.rotation||0).translate(-(+p.anchorX||0)*as,-(+p.anchorY||0)*as);
  return c.kind==="text" ? matrix.scale(suesTextAxis(p.textScaleX),suesTextAxis(p.textScaleY)) : matrix;
}""",
)
replace(
    "hh:box.hh*k,rot:Math.atan2(m.b,m.a)",
    "hh:box.hh*(Math.hypot(m.c,m.d)||1),rot:Math.atan2(m.b,m.a)",
)
replace(
    'if(c.kind==="text"){const b=layerBox(c,p,W,H,t);geom=noteMaskGeom',
    'if(c.kind==="text"){ctx2d.scale(suesTextAxis(p.textScaleX),suesTextAxis(p.textScaleY));const b=layerBox(c,p,W,H,t);geom=noteMaskGeom',
)
replace(
    "function drawSelectionOverlay(W,H,t){",
    """function suesTextHandles(box, W, H) {
  const {hs,corners} = overlayHandles(box,W,H);
  const middle = (a,b,axis) => ({
    x:(a.x+b.x)/2, y:(a.y+b.y)/2, axis
  });
  return [
    ...corners.map(point => ({...point,axis:"both"})),
    middle(corners[0],corners[1],"y"), middle(corners[2],corners[3],"y"),
    middle(corners[0],corners[3],"x"), middle(corners[1],corners[2],"x")
  ].map(point => ({...point,hs}));
}
function suesTextHandleAt(clip, box, point, W, H) {
  if (!mobileTimeline() || clip?.kind !== "text") return null;
  return suesTextHandles(box,W,H).map(handle => ({
    ...handle,distance:Math.hypot(point.x-handle.x,point.y-handle.y)
  })).filter(handle => handle.distance <= handle.hs * 1.8)
    .sort((a,b) => a.distance-b.distance)[0] || null;
}
function drawSelectionOverlay(W,H,t){""",
)
replace(
    "for(const h of hd.corners){ctx2d.beginPath();ctx2d.rect(h.x-hs,h.y-hs,hs*2,hs*2);",
    'for(const h of (mobileTimeline()&&c.kind==="text"?suesTextHandles(b,W,H):hd.corners)){ctx2d.beginPath();ctx2d.rect(h.x-hs,h.y-hs,hs*2,hs*2);',
)
replace(
    "preserveHandle=runtime.anchorTool||Math.hypot",
    "preserveHandle=runtime.anchorTool||suesTextHandleAt(previous,b,pt,W,H)||Math.hypot",
)
replace(
    'const hd=overlayHandles(b,W,H),grab=hd.hs*1.8;if(runtime.anchorTool){',
    """const hd=overlayHandles(b,W,H),grab=hd.hs*1.8;
 const axisHandle = suesTextHandleAt(cur,b,pt,W,H);
 if (axisHandle&&!runtime.anchorTool) {
   const axes = propsAtPlayhead(cur);
   canvasDrag = {mode:"textAxes",id:cur.id,axis:axisHandle.axis,box:b,
     x:suesTextAxis(axes.textScaleX),y:suesTextAxis(axes.textScaleY),from:lp};
 } else if(runtime.anchorTool){""",
)
replace(
    '}else if(canvasDrag.mode==="box"){',
    """}else if(canvasDrag.mode==="textAxes"){
 const {from,box,axis,x,y}=canvasDrag;
 const now=toLocal(pt,box);
 const axisRatio=(key,half)=>1+(now[key]-from[key])*Math.sign(from[key]||1)/Math.max(1,half);
 const uniform=Math.hypot(now.x,now.y)/Math.max(1,Math.hypot(from.x,from.y));
 if(axis==="both"){
   const ratio=clamp(uniform,Math.max(.05/x,.05/y),Math.min(12/x,12/y));
   setAnimProp(c,"textScaleX",+(x*ratio).toFixed(4));
   setAnimProp(c,"textScaleY",+(y*ratio).toFixed(4));
 }else if(axis==="x")setAnimProp(c,"textScaleX",suesTextAxis(+(x*axisRatio("x",box.hw)).toFixed(4)));
 else setAnimProp(c,"textScaleY",suesTextAxis(+(y*axisRatio("y",box.hh)).toFixed(4)));
}else if(canvasDrag.mode==="box"){""",
)


replace(
    "function pickClipAt(pt,W,H){",
    """let suesHitCanvas;
function suesVisiblePixel(clip,point,W,H,t) {
  const main = ctx2d;
  const sampling = runtime.sampling;
  const masks = clipMasksAt(clip,t);
  const matte = clipMatte(clip);
  const needsMatte = !!(masks||matte);
  let sample, x, y;
  if (needsMatte) {
    sample = maskCtx("suesHit",W,H);
    x = Math.floor(point.x);
    y = Math.floor(point.y);
  } else {
    if (!suesHitCanvas) {
      suesHitCanvas = document.createElement("canvas");
      suesHitCanvas.width = suesHitCanvas.height = 1;
    }
    sample = suesHitCanvas.getContext("2d",{willReadFrequently:true});
    x = y = 0;
  }
  sample.setTransform(1,0,0,1,0,0);
  sample.clearRect(x,y,1,1);
  ctx2d = sample;
  runtime.sampling = true;
  sample.save();
  try {
    if (needsMatte) drawMaskedClip(clip,W,H,t,masks,matte);
    else {
      sample.translate(-Math.floor(point.x),-Math.floor(point.y));
      drawClipPicture(clip,W,H,t,false);
    }
    return sample.getImageData(x,y,1,1).data[3] > 5;
  } catch (error) {
    if (error.name !== "SecurityError") throw error;
    if (!needsMatte) suesHitCanvas = null;
    return false;
  } finally {
    sample.restore();
    ctx2d = main;
    runtime.sampling = sampling;
  }
}
function pickClipAt(pt,W,H,visiblePixels=false){""",
)
replace(
    "if(Math.abs(lp.x)<=b.hw&&Math.abs(lp.y)<=b.hh)return c}}return null}",
    """if(Math.abs(lp.x)<=b.hw&&Math.abs(lp.y)<=b.hh &&
  (!visiblePixels||c.kind==="null"||suesVisiblePixel(c,pt,W,H,state.time)))return c}}return null}""",
)
replace(
    "if(mobileTap&&!preserveHandle){const hit=pickClipAt(pt,W,H);",
    "if(mobileTap&&!preserveHandle){const hit=pickClipAt(pt,W,H,true);",
)
replace(
    'else if(insideExplicit&&cur.id===mobileExplicitSelection||Math.abs(lp.x)<=b.hw&&Math.abs(lp.y)<=b.hh){const ep=propsAtPlayhead(cur);',
    """else if((insideExplicit&&cur.id===mobileExplicitSelection||Math.abs(lp.x)<=b.hw&&Math.abs(lp.y)<=b.hh)
  && (!mobileTimeline()||cur.kind==="null"||suesVisiblePixel(cur,pt,W,H,state.time))){const ep=propsAtPlayhead(cur);""",
)
replace(
    'if(!canvasDrag){if(explicit)return;const hit=pickClipAt(pt,W,H);',
    'if(!canvasDrag){if(explicit)return;const hit=pickClipAt(pt,W,H,mobileTimeline());',
)
source.write_text(js)
css = app / "sues-mobile.css"
with css.open("a") as file:
    file.write("\n@media (max-width: 980px) {\n")
    file.write('  .track-id[aria-pressed="true"] { outline: 1px solid currentColor; outline-offset: -2px; }\n')
    for family in ("V", "T", "ST", "F", "I", "E", "BR", "MR", "MG", "VFX", "CE", "IL", "A", "VS", "M", "SFX"):
        file.write(
            f'  [data-sues-active-family="{family}"] '
            f'.clip:not([data-sues-family="{family}"]) '
            '{ pointer-events: none; opacity: .55; }\n'
        )
    file.write("}\n")
