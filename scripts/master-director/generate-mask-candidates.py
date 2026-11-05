#!/usr/bin/env python3
"""Generate unverified, editable alpha-mask candidates from supplied PNG frames.

This offline worker is not a server API, a QA pass, or evidence of source
provenance. A trusted workflow must extract and bind the frames to the verified
edited timeline and inspect the masks before any policy attestation.
"""
import argparse
import hashlib
import json
import re
import shutil
import struct
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def generate(args):
    source = Path(args.input_dir)
    output = Path(args.output_dir)
    if not source.is_absolute() or not output.is_absolute() or source.is_symlink() or not source.is_dir():
        raise ValueError("Absolute input directory required")
    if output.exists() or output.is_symlink() or not output.parent.is_dir():
        raise ValueError("Output must be a new directory under an existing parent")
    if not re.fullmatch(r"[a-f0-9]{64}", args.source_sha256):
        raise ValueError("Invalid source fingerprint")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,79}", args.timeline_fingerprint):
        raise ValueError("Invalid timeline fingerprint")
    if args.start_frame < 0:
        raise ValueError("Invalid start frame")
    files = sorted(source.iterdir())
    if not 1 <= len(files) <= 120:
        raise ValueError("Provide between 1 and 120 input frames")
    for index, path in enumerate(files):
        if path.name != f"frame-{index:06d}.png" or path.is_symlink() or not path.is_file() or path.stat().st_size > 20 * 1024 * 1024:
            raise ValueError("Input frames must be consecutive regular PNG files")

    if mp.__version__ != "0.10.14":
        raise ValueError("Unsupported MediaPipe version")
    model_path = Path(mp.__file__).resolve().parent / "modules/selfie_segmentation/selfie_segmentation_landscape.tflite"
    if not model_path.is_file() or model_path.is_symlink():
        raise ValueError("Segmentation model unavailable")
    model_sha = digest(model_path)
    output.mkdir(mode=0o700)
    try:
        entries = []
        dimensions = None
        with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1) as segmenter:
            for index, path in enumerate(files):
                with path.open("rb") as stream:
                    header = stream.read(24)
                if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
                    raise ValueError("Input is not a PNG image")
                declared_width, declared_height = struct.unpack(">II", header[16:24])
                if declared_width < 1 or declared_height < 1 or declared_width * declared_height > 9_000_000:
                    raise ValueError("Declared image dimensions exceed limits")
                input_sha = digest(path)
                image = cv2.imread(str(path), cv2.IMREAD_COLOR)
                if image is None:
                    raise ValueError("Input image cannot be decoded")
                height, width = image.shape[:2]
                if width < 1 or height < 1 or width * height > 9_000_000:
                    raise ValueError("Input dimensions exceed limits")
                if dimensions is not None and dimensions != (width, height):
                    raise ValueError("Input dimensions changed")
                dimensions = (width, height)
                x, y, w, h = args.rect
                if min(x, y) < 0 or min(w, h) <= 0 or x + w > width or y + h > height:
                    raise ValueError("Mask rectangle lies outside input frame")
                rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                result = segmenter.process(rgb)
                confidence = result.segmentation_mask
                if confidence is None or confidence.shape != (height, width) or not np.isfinite(confidence).all():
                    raise ValueError("Segmentation output unavailable")
                alpha = np.clip(confidence[y:y+h, x:x+w], 0, 1)
                if args.mode == "keep-background":
                    alpha = 1 - alpha
                pixels = np.empty((h, w, 4), dtype=np.uint8)
                pixels[:, :, :3] = 255
                pixels[:, :, 3] = np.rint(alpha * 255).astype(np.uint8)
                target = output / f"mask-{index:06d}.png"
                if not cv2.imwrite(str(target), pixels, [cv2.IMWRITE_PNG_COMPRESSION, 3]):
                    raise ValueError("Cannot write mask")
                if digest(path) != input_sha:
                    raise ValueError("Input frame changed during segmentation")
                entries.append({"editFrame": args.start_frame + index, "inputSha256": input_sha,
                                "file": target.name, "sha256": digest(target)})
        report = {"schema": "sues-mask-candidate/v1", "status": "CANDIDATE_NOT_VERIFIED",
                  "sourceSha256Claim": args.source_sha256, "timelineFingerprintClaim": args.timeline_fingerprint,
                  "fps": 30, "coordinateSpace": "layer", "rect": list(args.rect),
                  "mode": args.mode, "model": "mediapipe-selfie-segmentation-0.10.14", "modelSha256": model_sha,
                  "limitations": ["input-provenance-unverified", "silhouette-review-required",
                                  "no-tracking-guarantee", "not-policy-evidence"],
                  "frames": entries}
        (output / "candidate.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        return report
    except BaseException:
        shutil.rmtree(output, ignore_errors=True)
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--source-sha256", required=True)
    parser.add_argument("--timeline-fingerprint", required=True)
    parser.add_argument("--start-frame", type=int, required=True)
    parser.add_argument("--rect", nargs=4, type=int, required=True, metavar=("X", "Y", "WIDTH", "HEIGHT"))
    parser.add_argument("--mode", choices=("keep-subject", "keep-background"), required=True)
    args = parser.parse_args()
    result = generate(args)
    print(json.dumps({"status": result["status"], "frames": len(result["frames"])}))


if __name__ == "__main__":
    main()
