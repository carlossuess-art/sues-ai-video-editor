from pathlib import Path

def replace_once(path, old, new):
    file = Path(path)
    source = file.read_text()
    if source.count(old) != 1:
        raise RuntimeError(f"{path}: expected one match for {old[:90]}")
    file.write_text(source.replace(old, new, 1))

replace_once("captions.js", "    const room = chars * lines;", """    if (maxWords === 1) {
      // Keep each spoken word, even when two onsets share a project frame.
      return words.flatMap((word) => {
        const text = String(wordOf(word)).trim();
        const start = r4(Math.max(0, startOf(word)));
        const spokenEnd = endOf(word);
        if (!text || !Number.isFinite(start) || !Number.isFinite(spokenEnd)) return [];
        const end = r4(Math.max(start + 0.05, spokenEnd));
        return [{ start, end, text, words: [{ w: text, s: start, e: spokenEnd }] }];
      });
    }
    const room = chars * lines;""")
replace_once("app.js", 'c.caption===true||/^(CAP-', 'c.props?.caption===true||c.caption===true||/^(CAP-')
replace_once("app.js", '        <button type="button" class="btn tiny" data-tr-cap-file="srt"', '''        <button type="button" class="btn tiny" data-tr-cap-words title="Crea un bloque por palabra con los tiempos de la voz. Reemplaza los subtítulos generados y se puede deshacer.">Subtítulos por palabra</button>
        <button type="button" class="btn tiny" data-tr-cap-file="srt"''')
replace_once("app.js", 'root.querySelectorAll("[data-tr-cap-file]").forEach', '''q("[data-tr-cap-words]").addEventListener("click", () => addCaptionsFromTranscript(q("[data-tr-cap-style]").value, 1));root.querySelectorAll("[data-tr-cap-file]").forEach''')
replace_once("app.js", 'function addCaptionsFromTranscript(styleKey){', 'function addCaptionsFromTranscript(styleKey, wordsPerClip){')
replace_once("app.js", 'words:m.words,maxDur:m.maxDur,fps:projectFps()', 'words:wordsPerClip ?? m.words,maxDur:m.maxDur,fps:projectFps()')

replace_once("README.md", "  the canvas. Export or import SRT and WebVTT. Agents use `fablecut_captions`.", """  the canvas. **Subtítulos por palabra** creates one independently editable clip per
  transcript word, keeping its onset. Agents use `fablecut_captions` with `words: 1`.
  Export or import SRT and WebVTT.""")
replace_once("CLAUDE.md", "**SRT** and **VTT** download the timeline's", """**Subtítulos por palabra** creates a separate clip at each transcript word's onset.
Very short words use the normal 0.05 s clip minimum, so adjacent words can overlap.
It uses the same replacement and undo behaviour as **Add captions** and matches
`fablecut_captions {words:1}`. **SRT** and **VTT** download the timeline's""")
