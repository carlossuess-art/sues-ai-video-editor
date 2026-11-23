#!/usr/bin/env python3
"""Offline reproducible RGB fringe correction for an ALREADY generated MODNet RGBA cutout.

This never changes the PNG alpha channel, source JPG, editor timeline or project.
It is an optional candidate; human inspection of hair, clothing and silhouettes is mandatory.
Requires numpy and ffmpeg (no cloud API, Pillow or OpenCV).

Usage: python refine-modnet-still-edge.py --input /absolute/input.png
  --input-sha256 SHA256 --output-dir /absolute/nonexistent-dir --strength 0.5
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import time

import numpy as np

W, H = 512, 896

def digest(p):
    with p.open('rb') as fp:
        return hashlib.file_digest(fp, 'sha256').hexdigest()


def refine(rgba, strength, radius=12):
    """Propagate nearest orthogonal opaque RGB into semitransparent fringe.

    RGB adjustment is blended only where alpha is small; alpha is byte-identical.
    No assumptions about background color; avoids global tint/desaturation.
    """
    if rgba.shape != (H, W, 4) or rgba.dtype != np.uint8:
        raise ValueError('Expected 512x896 RGBA uint8 source')
    if strength not in (0.5, 0.85) or radius != 12:
        raise ValueError('Only audited parameters 0.5/0.85, radius 12 are allowed')
    alpha = rgba[:, :, 3].astype(np.float32) / 255.0
    original_rgb = rgba[:, :, :3].astype(np.float32)
    propagated = original_rgb.copy()
    covered = alpha > .92
    for _ in range(radius):
        nxt = propagated.copy()
        known = covered.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if dy == 1:
                source = (slice(None, -1), slice(None))
                target = (slice(1, None), slice(None))
            elif dy == -1:
                source = (slice(1, None), slice(None))
                target = (slice(None, -1), slice(None))
            elif dx == 1:
                source = (slice(None), slice(None, -1))
                target = (slice(None), slice(1, None))
            else:
                source = (slice(None), slice(1, None))
                target = (slice(None), slice(None, -1))
            take = covered[source] & (~known[target])
            nxt[target] = np.where(take[:, :, None], propagated[source], nxt[target])
            known[target] |= take
        propagated, covered = nxt, known
    weight = (strength * np.clip((.91 - alpha) / .85, 0, 1) * (alpha > .02) * covered)
    updated = rgba.copy()
    updated[:, :, :3] = np.clip(np.rint(original_rgb * (1 - weight[:, :, None]) + propagated * weight[:, :, None]), 0, 255).astype(np.uint8)
    if not np.array_equal(updated[:, :, 3], rgba[:, :, 3]):
        raise RuntimeError('Alpha was modified')
    return updated, int(np.any(updated[:, :, :3] != rgba[:, :, :3], axis=2).sum())


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument('--input', required=True)
    cli.add_argument('--input-sha256', required=True)
    cli.add_argument('--output-dir', required=True)
    cli.add_argument('--strength', type=float, choices=(0.5, 0.85), required=True)
    args = cli.parse_args()
    source, directory = pathlib.Path(args.input), pathlib.Path(args.output_dir)
    if not source.is_absolute() or source.is_symlink() or source.suffix.lower() != '.png' or not source.is_file() or source.stat().st_size > 30_000_000:
        raise ValueError('Source must be an absolute regular bounded PNG')
    if not directory.is_absolute() or directory.is_symlink() or directory.exists() or not directory.parent.is_dir():
        raise ValueError('Destination must be a new absolute directory')
    if len(args.input_sha256) != 64 or digest(source) != args.input_sha256:
        raise ValueError('Source SHA256 mismatch')
    start = time.monotonic()
    decoded = subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', str(source), '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], capture_output=True, check=True, timeout=45)
    if len(decoded.stdout) != H * W * 4:
        raise ValueError('Expected a 512x896 RGBA image')
    original = np.frombuffer(decoded.stdout, dtype=np.uint8).copy().reshape(H, W, 4)
    updated, changed = refine(original, args.strength)
    directory.mkdir(mode=0o750)
    try:
        image = directory / 'modnet-child-edge-rgb-CANDIDATE.png'
        subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-i', 'pipe:0', '-frames:v', '1', '-y', str(image)], input=updated.tobytes(), capture_output=True, check=True, timeout=45)
        check = subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', str(image), '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], capture_output=True, check=True, timeout=45)
        returned = np.frombuffer(check.stdout, dtype=np.uint8).reshape(H, W, 4)
        if not np.array_equal(returned[:, :, 3], original[:, :, 3]):
            raise RuntimeError('Output PNG alpha channel differs from input')
        result = {'schema': 'sues-modnet-edge-rgb/v1', 'status': 'NOT_VISUALLY_APPROVED',
                  'inputSha256': args.input_sha256, 'outputSha256': digest(image),
                  'changedRgbPixels': changed, 'alphaByteExact': True,
                  'strength': args.strength, 'radius': 12, 'dimensions': [W, H],
                  'elapsedSeconds': round(time.monotonic() - start, 2),
                  'limitations': ['No body/face/child preservation proof from numeric check',
                                  'Human inspection of hair and clothing mandatory',
                                  'No FableCut timeline mutation or publication approval']}
        (directory / 'manifest.json').write_text(json.dumps(result, indent=2))
        print(json.dumps(result))
    except BaseException:
        for p in directory.iterdir():
            if p.is_file() and not p.is_symlink(): p.unlink()
        directory.rmdir()
        raise


if __name__ == '__main__':
    main()
