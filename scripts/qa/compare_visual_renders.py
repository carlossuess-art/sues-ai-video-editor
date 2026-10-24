#!/usr/bin/env python3
"""Local/private QA for edits that should NOT alter final audio.
No network, no upload, no writing to job/project files or video input.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

def run(args, timeout=180):
    p = subprocess.run(args, capture_output=True, timeout=timeout, check=False)
    if p.returncode:
        raise RuntimeError(f"Media verification failed: {Path(args[0]).name} (exit={p.returncode})")
    return p.stdout, p.stderr

def probe(path):
    output, _ = run(["ffprobe", "-v", "error", "-show_entries",
        "format=duration,size:stream=codec_type,codec_name,width,height,channels",
        "-of", "json", str(path)], timeout=30)
    return json.loads(output)

def pcm_hash(path):
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
        "-threads", "1", "-i", str(path), "-vn", "-ar", "16000", "-ac", "1",
        "-f", "s16le", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    h = hashlib.sha256()
    assert p.stdout is not None
    for block in iter(lambda: p.stdout.read(1048576), b""):
        h.update(block)
    if p.wait(timeout=180):
        raise RuntimeError("Audio decode failed")
    return h.hexdigest()

def loudness(path):
    _, log = run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "info", "-threads", "1",
                  "-i", str(path), "-vn", "-af",
                  "loudnorm=I=-16:TP=-3:LRA=9:print_format=json", "-f", "null", "-"], 180)
    text = log.decode("utf8", "replace")
    matches = re.findall(r'\{\s*"input_i".+?\}', text, re.S)
    if not matches:
        raise RuntimeError("Unable to measure actual final mix")
    data = json.loads(matches[-1])
    return {key: float(data[key]) for key in ["input_i", "input_tp", "input_lra"]}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--baseline", required=True)
    ap.add_argument("--candidate", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--output", required=True)
    a=ap.parse_args()
    inputs=[Path(a.baseline), Path(a.candidate), Path(a.manifest)]
    if any(not p.is_file() or p.is_symlink() for p in inputs):
        raise SystemExit("Input must be regular non-symlink files")
    dest=Path(a.output)
    if dest.exists() or dest.is_symlink():
        raise SystemExit("Will not overwrite existing QA report")
    b,c=map(probe,inputs[:2])
    bv=next((s for s in b["streams"] if s["codec_type"]=="video"),{})
    cv=next((s for s in c["streams"] if s["codec_type"]=="video"),{})
    ba=next((s for s in b["streams"] if s["codec_type"]=="audio"),{})
    ca=next((s for s in c["streams"] if s["codec_type"]=="audio"),{})
    format_match=(bv.get("width"),bv.get("height"),bv.get("codec_name"),
                  ba.get("codec_name"),ba.get("channels"))==(cv.get("width"),cv.get("height"),cv.get("codec_name"),
                  ca.get("codec_name"),ca.get("channels"))
    duration_gap=abs(float(b["format"]["duration"])-float(c["format"]["duration"]))
    manifest=json.loads(inputs[2].read_text(encoding="utf8"))
    media=manifest.get("selectedMedia",[])
    safe_broll=all(x.get("sourceAudio") is False and x.get("originalVoice") is True and
        x.get("captions")=="preserve" and x.get("sourceOut",0)>x.get("sourceIn",0)
        for x in media) and len(media)>0
    # Full strict video decode, not only ffprobe headers.
    run(["ffmpeg","-nostdin","-v","error","-xerror","-threads","1","-i",str(inputs[1]),
         "-f","null","-"],timeout=300)
    left,right=pcm_hash(inputs[0]),pcm_hash(inputs[1])
    measure=loudness(inputs[1])
    report={"schema":"sues-visual-only-qa/v1","formatMatch":format_match,
      "durationGapSec":round(duration_gap,4),
      "video":{"codec":cv.get("codec_name"),"width":cv.get("width"),"height":cv.get("height")},
      "audio":{"codec":ca.get("codec_name"),"channels":ca.get("channels"),
        "decodedPcmEqual":left==right,"pcmSha256":right,
        "finalIntegratedLufs":measure["input_i"],
        "finalTruePeakDbtp":measure["input_tp"],"finalLraLu":measure["input_lra"]},
      "edit":{"selectedVideoCount":len(media),"originalVoiceNoBrollAudio":safe_broll,
        "captionGroups":len(manifest.get("captions",[]))},
      "fullDecode":"pass",
      "technicalPass":format_match and duration_gap<=0.05 and left==right and safe_broll,
      "humanCreativeAcceptance":False}
    with dest.open("x",encoding="utf8") as f:
        json.dump(report,f,indent=2)
        f.write("\n")
    print(json.dumps(report,ensure_ascii=False))
    if not report["technicalPass"]:
        raise SystemExit("Technical QA validation failed")

if __name__=="__main__":
    main()
