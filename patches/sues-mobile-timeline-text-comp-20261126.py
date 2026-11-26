from pathlib import Path

def replace_once(source, old, new):
    if source.count(old) != 1:
        raise RuntimeError(f"Expected exactly one match: {old[:100]}")
    return source.replace(old, new, 1)

app = Path("app.js")
source = app.read_text()
source = replace_once(source, 'if(c.kind==="text")return /^(CAP-|SUB-|SUBTÍTULO|SUBTITULO|CAPTION)/i.test(name)?', 'if(c.kind==="text")return (c.caption===true||/^(CAP-|SUB-|SUBTÍTULO|SUBTITULO|CAPTION)/i.test(name))?')
anchor = 'const label=role?role+" · "+nativeLabel:nativeLabel;'
source = replace_once(source, anchor, '''const family = suesRoleIcon(role);
 const label = family === "T" || family === "ST"
   ? String(c.props?.text || c.name || "").trim().split("\\n")[0]
   : family === "MG" && c.kind === "comp"
     ? (getComp(c.compId)?.name || c.name || nativeLabel)
     : role ? role + " · " + nativeLabel : nativeLabel;''')
anchor = 'div.innerHTML=inner;if(hasWave)div.classList.add("has-wave");'
source = replace_once(source, anchor, '''div.innerHTML=inner;
 if (family === "MG" && c.kind === "comp" && getComp(c.compId)) {
   const open = document.createElement("button");
   open.type = "button";
   open.className = "sues-open-comp";
   open.textContent = "›";
   open.setAttribute("aria-label", "Abrir capas de " + label);
   open.addEventListener("pointerdown", event => event.stopPropagation());
   open.addEventListener("click", event => {
     event.stopPropagation();
     if (state.exporting || !suesFamilyAllows(c) || !getComp(c.compId)) return;
     suesActiveFamily = null;
     enterComp(c.compId, c);
   });
   div.appendChild(open);
 }
 if(hasWave)div.classList.add("has-wave");''')
app.write_text(source)
gestures = Path("sues-mobile-gestures.js")
source = gestures.read_text()
source = replace_once(source, 'if(e.pointerType!=="touch"||!isMobile())return;\n const f=', 'if(e.pointerType!=="touch"||!isMobile()||e.target.closest(".sues-open-comp"))return;\n const f=')
source = replace_once(source, 'if(g.clip){if(state.playing)pause();selectMobileTimelineClip(g.clip.id);}', '''if (g.clip) {
       const clip = getClip(g.clip.id);
       if (state.playing) pause();
       selectMobileTimelineClip(g.clip.id);
       if (clip?.kind === "text" && state.selId === clip.id &&
           suesFamilyAllows(clip) && !isGroupLocked(clip) && !g.edge) {
         window.SuesMobileText?.openEditor();
       }
     }''')
gestures.write_text(source)

css = Path("sues-mobile.css")
css.write_text(css.read_text() + """
@media (max-width: 980px) {
  #tracks .clip:has(> .sues-open-comp) .clip-label { padding-right: 30px; }
  #tracks .clip > .sues-open-comp {
    position: absolute;
    z-index: 4;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    min-width: 22px;
    height: 24px;
    border: 0;
    border-radius: 4px;
    background: #263714;
    color: #ddf8b0;
    font: 700 18px/1 system-ui, sans-serif;
    touch-action: manipulation;
  }
}
""")
