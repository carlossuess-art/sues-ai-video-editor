#!/usr/bin/env python3
"""Small VIDEO-mode MediaPipe adapter. Coordinates are upright source pixels."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def face_record(landmarks, width, height):
    def point(i):
        p = landmarks[i]
        return {'x': round(min(width, max(0, p.x * width)), 3),
                'y': round(min(height, max(0, p.y * height)), 3)}
    def eye(a, b):
        p, q = point(a), point(b)
        return {k: round((p[k] + q[k]) / 2, 3) for k in ('x', 'y')}
    pts = [point(i) for i in range(len(landmarks))]
    x, y = min(p['x'] for p in pts), min(p['y'] for p in pts)
    right, bottom = max(p['x'] for p in pts), max(p['y'] for p in pts)
    if right <= x or bottom <= y:
        raise ValueError('Degenerate landmark bbox')
    return {'x': x, 'y': y, 'width': round(right-x, 3), 'height': round(bottom-y, 3),
            'leftEye': eye(263, 362), 'rightEye': eye(33, 133),
            'score': 1, 'scoreKind': 'presence-proxy-not-confidence',
            'landmarkCount': len(landmarks)}


def detect(video, model, sample_fps=2, max_side=640):
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import FaceLandmarker, FaceLandmarkerOptions, RunningMode
    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened():
        raise ValueError('Cannot open video')
    cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not math.isfinite(fps) or fps <= 0:
        raise ValueError('Invalid video FPS')
    options = FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=str(model)),
        running_mode=RunningMode.VIDEO, num_faces=1, min_face_detection_confidence=.5,
        min_face_presence_confidence=.5, min_tracking_confidence=.5)
    frames, index, next_time, previous_ms, fallbacks = [], 0, 0., -1, 0
    try:
        with FaceLandmarker.create_from_options(options) as detector:
            while True:
                ok, bgr = cap.read()
                if not ok:
                    break
                time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                if not math.isfinite(time_ms) or time_ms < 0 or (index and time_ms <= previous_ms):
                    time_ms = max(previous_ms+1, index/fps*1000)
                    fallbacks += 1
                previous_ms = time_ms
                index += 1
                if time_ms/1000 + 1e-6 < next_time:
                    continue
                next_time = time_ms/1000 + 1/sample_fps
                h, w = bgr.shape[:2]
                scale = min(1., max_side/max(w, h))
                small = cv2.resize(bgr, (round(w*scale), round(h*scale))) if scale < 1 else bgr
                rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
                result = detector.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), round(time_ms))
                frames.append({'time': round(time_ms/1000, 6), 'frameWidth': w, 'frameHeight': h,
                    'faces': [face_record(lm, w, h) for lm in result.face_landmarks]})
    finally:
        cap.release()
    if not frames:
        raise ValueError('No decoded samples')
    return {'version': '1.0', 'provider': 'mediapipe/face-landmarker', 'mode': 'VIDEO',
        'model': {'file': model.name, 'sha256': hashlib.sha256(model.read_bytes()).hexdigest()},
        'dependencies': {'mediapipe': mp.__version__, 'opencv': cv2.__version__},
        'coordinates': 'upright-source-pixels', 'sampleFpsTarget': sample_fps,
        'decodedFrames': index, 'timestampFallbacks': fallbacks,
        'scoreMeaning': '1 means landmark result present; Python result exposes no detection confidence. Not probability.',
        'eyeMeaning': 'Subject left: mean landmarks 263/362; subject right: 33/133; no mirroring.',
        'frames': frames}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('video', type=Path)
    p.add_argument('--model', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--sample-fps', type=float, default=2)
    a = p.parse_args()
    if not 0 < a.sample_fps <= 30:
        p.error('--sample-fps must be >0 and <=30')
    result = detect(a.video, a.model, a.sample_fps)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')
    print(json.dumps({'samples': len(result['frames']), 'detected': sum(bool(f['faces']) for f in result['frames']),
                      'timestampFallbacks': result['timestampFallbacks'], 'output': str(a.out)}))


if __name__ == '__main__':
    main()
