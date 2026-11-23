#!/usr/bin/env python3
"""Audit an exposed original-source ROI against each FableCut-exported frame.

Use original (VFR) decoded frame PTS, NOT an implicit 30fps conversion. Scope:
source-background timing only, not child/foreground mask, title, voice or art QA.
"""
import argparse
import bisect
import hashlib
import json
from pathlib import Path
import re
import statistics
import subprocess
import tempfile

SHA = re.compile(r"[a-f0-9]{64}\Z")


def file_sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def run(argv, timeout=180):
    return subprocess.run(argv, check=True, capture_output=True, timeout=timeout)


def source_indices(pts, start, frames, fps):
    if not pts or frames < 1 or frames > 15000 or fps < 1 or fps > 240 or start < 0:
        raise ValueError("Invalid VFR source or export frame grid")
    if any(pts[i] > pts[i + 1] for i in range(len(pts) - 1)):
        raise ValueError("Source PTS must be monotone in presentation order")
    indices = [bisect.bisect_right(pts, start + i / fps + 1e-6) - 1 for i in range(frames)]
    if min(indices) < 0 or max(indices) >= len(pts):
        raise ValueError("Render window is outside real source frames")
    return indices


def raw_crop_command(video, roi, count):
    x, y, w, h = roi
    if not (0 <= x < 1080 and 0 <= y < 1920 and 1 <= w <= 1080 - x and 1 <= h <= 1920 - y):
        raise ValueError("Invalid 1080x1920 source ROI")
    return ["ffmpeg", "-v", "error", "-nostdin", "-i", str(video), "-map", "0:v:0", "-an",
            "-vf", f"crop={w}:{h}:{x}:{y}", "-pix_fmt", "rgb24",
            "-vsync", "0",  # CRITICAL: rawvideo would otherwise duplicate/drop VFR source frames
            "-frames:v", str(count), "-f", "rawvideo", "pipe:1"]


def audit(source, rendered, expected_source, expected_rendered, start, fps, count, roi, output, minimum=.95):
    source, rendered, output = Path(source).resolve(), Path(rendered).resolve(), Path(output).resolve()
    if not SHA.fullmatch(expected_source) or not SHA.fullmatch(expected_rendered):
        raise ValueError("Both authentic file hashes are required")
    if not source.is_file() or not rendered.is_file() or output.exists() or output in (source, rendered):
        raise ValueError("Read-only input and new QA output paths required")
    if file_sha(source) != expected_source or file_sha(rendered) != expected_rendered:
        raise ValueError("Input hash differs from the verified files")
    original = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                               "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", str(source)]).stdout)
    pts = [float(x["best_effort_timestamp_time"]) for x in original["frames"]]
    idx = source_indices(pts, start, count, fps)
    x, y, w, h = roi
    nbytes = w * h * 3
    raw_source = run(raw_crop_command(source, roi, max(idx) + 1)).stdout
    raw_output = run(raw_crop_command(rendered, roi, count)).stdout
    if len(raw_source) != (max(idx) + 1) * nbytes or len(raw_output) != count * nbytes:
        raise ValueError("Unexpected decoded raw frame count; never silently trim")
    with tempfile.TemporaryDirectory(prefix="sues-vfr-roi-", dir=str(output.parent)) as folder:
        base = Path(folder)
        authentic, export = base / "authentic.rgb", base / "export.rgb"
        with open(authentic, "wb") as f:
            for i in idx:
                f.write(raw_source[i * nbytes:(i + 1) * nbytes])
        export.write_bytes(raw_output)
        args = ["ffmpeg", "-hide_banner", "-loglevel", "info",
                "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(fps), "-i", str(authentic),
                "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(fps), "-i", str(export),
                "-filter_complex", "[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]ssim=stats_file=-", "-f", "null", "-"]
        result = run(args, timeout=120)
        log = result.stdout.decode(errors="replace") + result.stderr.decode(errors="replace")
        scores = [float(v) for v in re.findall(r"^n:\d+ .*? All:([0-9.]+)", log, re.M)]
        if len(scores) != count:
            raise ValueError("SSIM filter returned an incomplete count of video frames")
    report = {
        "schema": "sues-fablecut-vfr-source-region-qa/v1",
        "status": "SOURCE_BACKGROUND_TECHNICAL_PASS" if min(scores) >= minimum else "SOURCE_BACKGROUND_TECHNICAL_REVIEW_REQUIRED",
        "sourceSha256": expected_source, "renderedSha256": expected_rendered,
        "start": start, "fps": fps, "frames": count,
        "sourceTotalFrames": len(pts), "sourceIndices": idx,
        "roi": {"x": x, "y": y, "width": w, "height": h},
        "minSSIM": min(scores), "medianSSIM": statistics.median(scores),
        "meanSSIM": statistics.mean(scores), "threshold": minimum,
        "belowThreshold": sum(v < minimum for v in scores),
        "perFrameSSIM": scores,
        "ptsAlgorithm": "source PTS <= start + frameIndex/fps + 1 microsecond; FFmpeg -vsync 0",
        "cinematicQA": False, "humanApproved": False,
        "limitations": ["ROI must be independently verified as uncovered by masks, children or foreground for this interval",
                        "Does not certify other image regions, subtitle timing, audio, full Reel or artistic intent",
                        "Preview scrubbing using HTMLVideo may differ from frame-accurate decoded source"],
    }
    with open(output, "x", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        f.write("\n")
    return report


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source", required=True)
    p.add_argument("--rendered", required=True)
    p.add_argument("--source-sha256", required=True)
    p.add_argument("--rendered-sha256", required=True)
    p.add_argument("--start", required=True, type=float)
    p.add_argument("--fps", required=True, type=int)
    p.add_argument("--frames", required=True, type=int)
    p.add_argument("--roi", required=True, help="x,y,width,height")
    p.add_argument("--report", required=True)
    args = p.parse_args()
    roi = tuple(int(v) for v in args.roi.split(","))
    if len(roi) != 4:
        raise ValueError("ROI must contain x,y,width,height")
    report = audit(args.source, args.rendered, args.source_sha256, args.rendered_sha256,
                   args.start, args.fps, args.frames, roi, args.report)
    print(json.dumps({k: report[k] for k in ("status", "frames", "minSSIM", "medianSSIM", "belowThreshold")}))
    if report["belowThreshold"]:
        raise SystemExit(2)

if __name__ == "__main__":
    main()
