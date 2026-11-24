#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export LC_ALL=C.UTF-8
ROOT=/opt/sues-audio-studio
VERSION=4.0.1
LIMIT=$(ulimit -f)
if [[ "$LIMIT" != unlimited ]]; then
  echo "BLOCKED: finite terminal file-size limit ($LIMIT blocks). Use an authorized administration terminal with sufficient file allowance." >&2
  exit 78
fi
[[ $(id -u) == 0 ]] || { echo "Run as authorized VPS administrator."; exit 77; }
command -v python3 >/dev/null
command -v ffprobe >/dev/null
install -d -m 700 "$ROOT" "$ROOT/cache" "$ROOT/qa"
exec 9>"$ROOT/install.lock"
flock -n 9 || { echo "Installation already running"; exit 75; }
FREE=$(df -Pk "$ROOT" | awk 'NR==2{print $4}')
(( FREE >= 5*1024*1024 )) || { echo "Need at least 5 GiB free for installation."; exit 1; }
export HF_HOME="$ROOT/cache/huggingface" OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
VENV="$ROOT/runtime-$VERSION"
if [[ ! -x "$VENV/bin/pip" ]]; then
  python3 -m venv "$VENV" || { echo "Python venv unavailable: install python3-venv via administrator and rerun."; exit 1; }
fi
P="$VENV/bin/python"
nice -n 15 "$P" -m pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu 'torch>=2.5'
TORCH=$("$P" -c 'import torch; assert torch.version.cuda is None; print(torch.__version__)')
printf 'torch==%s\n' "$TORCH" > "$ROOT/constraints.txt"
nice -n 15 "$P" -m pip install --no-cache-dir --constraint "$ROOT/constraints.txt" --extra-index-url https://download.pytorch.org/whl/cpu "pocket-tts==$VERSION"
"$P" -m pip check
"$P" -m pip freeze > "$ROOT/requirements-installed.txt"
cd "$ROOT"
nice -n 15 "$P" - <<'PY'
import importlib.metadata, json, pathlib, resource, time, wave
import numpy as np
import torch
from pocket_tts import TTSModel
torch.set_num_threads(1)
torch.set_num_interop_threads(1)
assert torch.version.cuda is None
start=time.monotonic()
model=TTSModel.load_model(language="spanish")
voice=model.get_state_for_audio_prompt("lola")
questions=["Si te gritan...", "Si te insultan...", "Si se ríen de ti...", "Si te rechazan...", "Si sientes que no puedes más..."]
out=pathlib.Path("qa")
report={"version":importlib.metadata.version("pocket-tts"), "torch":torch.__version__, "language":"spanish", "voice":"lola", "load_seconds":round(time.monotonic()-start,3), "clips":[]}
for i, text in enumerate(questions,1):
    t=time.monotonic()
    a=model.generate_audio(voice,text).detach().cpu().numpy().reshape(-1)
    assert a.size and np.isfinite(a).all() and np.max(np.abs(a))>0.001
    pcm=(np.clip(a,-1,1)*32767).astype("<i2")
    path=out/f"lola-{i:02d}.wav"
    with wave.open(str(path),"wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(model.sample_rate); w.writeframes(pcm.tobytes())
    report["clips"].append({"file":str(path),"text":text,"duration_seconds":len(a)/model.sample_rate,"generation_seconds":round(time.monotonic()-t,3)})
report["peak_rss_kib"]=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
(out/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
PY
for f in "$ROOT"/qa/lola-*.wav; do ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"; done
du -sh "$VENV" "$ROOT/cache" "$ROOT/qa"
echo "TECHNICAL QA PASS. Human listening and integration still pending."
