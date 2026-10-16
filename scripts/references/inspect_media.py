#!/usr/bin/env python3
"""Inspect local reference videos without ASR, models or network.
Usage: python scripts/references/inspect_media.py --out runtime/references video.mp4 ...
Originals are opened read-only. Never treats reference footage as reusable B-roll.
Requires ffprobe/ffmpeg on PATH; Python standard library only.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess


def run(args):
    return subprocess.check_output(args, text=True)


def inspect(path, output):
    path = path.resolve(strict=True)
    probe = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)]))
    video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    audio = [s for s in probe['streams'] if s['codec_type'] == 'audio']
    duration = float(probe['format']['duration'])
    with path.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    stream_hashes = {}
    for kind in ['v'] + (['a'] if audio else []):
        stream_hashes[kind] = run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', f'0:{kind}:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-']).strip().split('=', 1)[1]
    samples = []
    # A source digest avoids collisions between different files with the same stem.
    stem = path.stem + '-' + digest[:12]
    for index, fraction in enumerate([.1, .35, .65, .9]):
        at = duration * fraction
        dest = output / f'{stem}-{index}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(at), '-i', str(path), '-frames:v', '1', '-vf', 'scale=270:480:force_original_aspect_ratio=decrease', '-y', str(dest)], check=True)
        samples.append({'requestedTime': round(at, 4), 'path': dest.name})
    return {'filename': path.name, 'sha256': digest, 'bytes': path.stat().st_size,
            'duration': duration, 'width': video['width'], 'height': video['height'],
            'frameRate': video['avg_frame_rate'], 'videoCodec': video['codec_name'],
            'audioPresent': bool(audio), 'streamPayloadHashes': stream_hashes,
            'samples': samples, 'role': 'style-reference', 'brollEligible': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=pathlib.Path)
    parser.add_argument('videos', nargs='+', type=pathlib.Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    if any(args.out.resolve() == p.resolve() for p in args.videos):
        parser.error('output must be a directory distinct from sources')
    assets = [inspect(p, args.out) for p in args.videos]
    groups = {}
    for asset in assets:
        key = tuple(sorted(asset['streamPayloadHashes'].items()))
        groups.setdefault(key, []).append(asset['filename'])
    report = {'version': '1.0', 'method': 'ffprobe + compressed stream hashes + four sampled frames',
              'limitations': ['no full visual review', 'no listening or ASR', 'stream hashes exclude timestamps and container metadata', 'not a shot or zoom detector'],
              'assets': assets, 'samePayloadGroups': [g for g in groups.values() if len(g) > 1]}
    (args.out / 'inventory.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(assets)} references; {len(report["samePayloadGroups"])} repeated payload groups; originals preserved')


if __name__ == '__main__':
    main()
