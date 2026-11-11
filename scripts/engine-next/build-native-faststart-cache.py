#!/usr/bin/env python3
"""Build a byte-stream-equivalent MP4 container for FableCut's WebCodecs decoder.

Export-only private cache: NEVER modify the source, its project or audio.
No transcoding, skipped frames, changes of video/audio packets, or PTS drift
are permitted. Runtime activation is a separate checked integration decision.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

SHA = re.compile(r"[0-9a-f]{64}\Z")


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def run(argv, timeout=180):
    result = subprocess.run(argv, check=True, capture_output=True, timeout=timeout)
    return result.stdout.decode("utf-8", errors="replace")


def packets(path, stream):
    r = json.loads(run(["ffprobe", "-v", "error", "-select_streams", stream,
                        "-show_entries", "packet=pts_time,dts_time,size,flags",
                        "-of", "json", str(path)]))
    return r.get("packets", [])


def compressed_stream_hash(path, stream):
    return run(["ffmpeg", "-v", "error", "-nostdin", "-i", str(path),
                "-map", stream, "-c", "copy", "-f", "streamhash",
                "-hash", "SHA256", "-"]).strip()


def validate_stream_equivalence(source, cache):
    checks = {}
    for stream in ("v:0", "a:0"):
        original, derived = packets(source, stream), packets(cache, stream)
        if not original or len(original) != len(derived) or original != derived:
            raise ValueError("Packet size, flags or PTS/DTS changed in " + stream)
        if compressed_stream_hash(source, "0:" + stream) != compressed_stream_hash(cache, "0:" + stream):
            raise ValueError("Compressed bitstream changed in " + stream)
        checks["video" if stream == "v:0" else "audio"] = {"packetCount": len(original), "packetTimelineIdentical": True, "compressedBitstreamIdentical": True}
    return checks


def valid_url(src):
    if not src.startswith("/media/"):
        return False
    name = src[7:]
    try:
        from urllib.parse import unquote, quote
        decoded = unquote(name)
        return decoded and decoded not in (".", "..") and not any(c in decoded for c in ("/", "\\", "\x00")) and quote(decoded, safe="") == name
    except Exception:
        return False


def build(source, expected_sha, cache, manifest, source_url, cache_url):
    source, cache, manifest = map(lambda p: Path(p).resolve(), (source, cache, manifest))
    if not SHA.fullmatch(expected_sha) or source.suffix.lower() != ".mp4" or cache.suffix.lower() != ".mp4":
        raise ValueError("Expected lowercase SHA256 and MP4 source/cache required")
    if not source.is_file() or not source.stat().st_size:
        raise FileNotFoundError("Source missing or empty")
    if len({str(source), str(cache), str(manifest)}) != 3 or cache.exists() or manifest.exists():
        raise FileExistsError("Inputs and outputs must be different, new files")
    if not cache.parent.is_dir() or not manifest.parent.is_dir():
        raise FileNotFoundError("QA destination parent must already exist")
    if not valid_url(source_url) or not valid_url(cache_url) or source_url == cache_url or not cache_url.endswith(".mp4"):
        raise ValueError("Unsafe or inconsistent native media URL")
    if source_url != "/media/" + source.name or cache_url != "/media/" + cache.name:
        raise ValueError("Native media URLs must describe the actual filenames")
    initial_sha = sha256_file(source)
    if initial_sha != expected_sha:
        raise ValueError("Source fingerprint mismatch; refusing remux")
    fd, tmp_name = tempfile.mkstemp(prefix=".sues-faststart-stage-", suffix=".mp4", dir=str(cache.parent))
    os.close(fd)
    os.unlink(tmp_name)  # ffmpeg -n refuses overwriting any existing path
    tmp = Path(tmp_name)
    linked = False
    try:
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-n", "-i", str(source),
             "-map", "0", "-c", "copy", "-movflags", "+faststart", str(tmp)], timeout=300)
        if not tmp.is_file() or not tmp.stat().st_size:
            raise ValueError("FFmpeg did not create a valid cache")
        checks = validate_stream_equivalence(source, tmp)
        if sha256_file(source) != initial_sha:
            raise ValueError("Source changed while building cache")
        cache_sha = sha256_file(tmp)
        proof = {
            "schema": "sues-native-faststart-cache/v1",
            "sourceSha256": initial_sha,
            "cacheSha256": cache_sha,
            "sourceMediaUrl": source_url,
            "cacheMediaUrl": cache_url,
            "sourcePreserved": True,
            "decoderOnly": True,
            "noReencoding": True,
            "videoPacketTimelineExact": checks["video"]["packetTimelineIdentical"],
            "audioPacketTimelineExact": checks["audio"]["packetTimelineIdentical"],
            "videoPacketCount": checks["video"]["packetCount"],
            "audioPacketCount": checks["audio"]["packetCount"],
            "videoBitstreamEqual": checks["video"]["compressedBitstreamIdentical"],
            "audioBitstreamEqual": checks["audio"]["compressedBitstreamIdentical"],
            "creativeApproved": False,
            "productionActivation": False,
            "limitations": ["Cache changes the MP4 container, not audio/video packets", "MP4 stream metadata such as last-frame nominal duration can differ", "Must still validate output timing and visual parity with the actual source"],
        }
        os.link(tmp, cache)  # atomic create-only; fails if another process created destination
        linked = True
        with open(manifest, "x", encoding="utf-8") as f:
            os.chmod(manifest, 0o600)
            json.dump(proof, f, indent=2)
            f.write("\n")
        return proof
    except BaseException:
        if linked:
            cache.unlink(missing_ok=True)
        raise
    finally:
        tmp.unlink(missing_ok=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, required=True)
    ap.add_argument("--expected-sha256", required=True)
    ap.add_argument("--cache", type=Path, required=True)
    ap.add_argument("--manifest", type=Path, required=True)
    ap.add_argument("--source-url", required=True)
    ap.add_argument("--cache-url", required=True)
    args = ap.parse_args()
    print(json.dumps(build(args.source, args.expected_sha256, args.cache, args.manifest,
                           args.source_url, args.cache_url)))

if __name__ == "__main__":
    main()
