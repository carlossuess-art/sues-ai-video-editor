#!/usr/bin/env python3
"""Measure original input loudness/true peak and mono fold; never write audio.

FFmpeg loudnorm's input_* fields describe the input, not its normalized output.
Targets are review criteria only. Human audibility/phase review remains necessary.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess


def measure(path, mono=False, channels=2):
    prefix = 'pan=mono|c0=0.5*c0+0.5*c1,' if mono and channels == 2 else ''
    command = ['ffmpeg', '-nostdin', '-hide_banner', '-v', 'info',
               '-protocol_whitelist', 'file,pipe', '-i', str(path), '-map', '0:a:0',
               '-vn', '-af', prefix + 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json',
               '-f', 'null', '-']
    run = subprocess.run(command, capture_output=True, text=True, timeout=300, check=True)
    matches = re.findall(r'\{\s*"input_i"[\s\S]*?\}', run.stderr)
    if not matches:
        raise ValueError('FFmpeg did not return input measurements')
    raw = json.loads(matches[-1])
    def number(key):
        value = float(raw[key])
        return value if math.isfinite(value) else None
    return {'integratedLufs': number('input_i'), 'truePeakDbtp': number('input_tp'),
            'loudnessRangeLu': number('input_lra'), 'thresholdLufs': number('input_thresh')}


def audit(path, min_lufs=-16, max_lufs=-14, max_peak=-1):
    if not min_lufs <= max_lufs or not all(map(math.isfinite, [min_lufs, max_lufs, max_peak])):
        raise ValueError('Invalid targets')
    path = Path(path).resolve(strict=True)
    if not path.is_file():
        raise ValueError('A local media file is required')
    probe = subprocess.run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe',
                            '-select_streams', 'a:0', '-show_streams', '-of', 'json', str(path)],
                           capture_output=True, text=True, timeout=30, check=True)
    streams = json.loads(probe.stdout).get('streams', [])
    if not streams:
        raise ValueError('No audio stream')
    channels = int(streams[0]['channels'])
    if channels not in (1, 2):
        raise ValueError('This audit supports mono/stereo only')
    with path.open('rb') as media:
        digest = hashlib.file_digest(media, 'sha256').hexdigest()
    stereo = measure(path, channels=channels)
    mono = measure(path, mono=True, channels=channels) if channels == 2 else stereo.copy()
    with path.open('rb') as media:
        if hashlib.file_digest(media, 'sha256').hexdigest() != digest:
            raise ValueError('Input changed during measurement')
    measured = stereo['integratedLufs'] is not None and stereo['truePeakDbtp'] is not None
    return {'schema': 'sues-audio-measurement/v1', 'sha256': digest, 'channels': channels,
            'input': stereo, 'monoFold': mono,
            'targets': {'minIntegratedLufs': min_lufs, 'maxIntegratedLufs': max_lufs, 'maxTruePeakDbtp': max_peak},
            'withinTargets': bool(measured and min_lufs <= stereo['integratedLufs'] <= max_lufs and stereo['truePeakDbtp'] <= max_peak),
            'audioModified': False, 'humanAudibilityReview': 'pending'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('media')
    parser.add_argument('--min-lufs', type=float, default=-16)
    parser.add_argument('--max-lufs', type=float, default=-14)
    parser.add_argument('--max-peak', type=float, default=-1)
    args = parser.parse_args()
    print(json.dumps(audit(args.media, args.min_lufs, args.max_lufs, args.max_peak), allow_nan=False))
