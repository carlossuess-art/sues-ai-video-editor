#!/usr/bin/env python3
"""Full-frame scene-change candidates.
Scores are FFmpeg scene-change scores, not confirmed cut counts or zoom tracking.
Requires ffmpeg/ffprobe. No audio interpretation.
"""
import argparse
import json
import pathlib
import re
import subprocess


def scan(video, output, threshold=.12):
    video = video.resolve(strict=True)
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-of', 'json', str(video)], text=True))
    duration = float(info['format']['duration'])
    directory = output / video.stem
    directory.mkdir(parents=True, exist_ok=True)
    # Keep the filter path relative to cwd; filenames cannot become filter syntax.
    subprocess.run(['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(video), '-an', '-vf', f"scale=180:320,select='gt(scene,{threshold})',metadata=print:file=scenes.txt", '-f', 'null', '-'], cwd=directory, check=True)
    matches = re.findall(r'pts_time:([\d.]+)\s+lavfi.scene_score=([\d.]+)', (directory / 'scenes.txt').read_text())
    events = [{'time': float(t), 'score': float(v)} for t, v in matches]
    return {'file': video.name, 'duration': duration, 'method': 'ffmpeg scene at 180x320, all source frames', 'threshold': threshold,
            'events': events, 'candidateEventsPerMinute': len(events)*60/duration,
            'limitations': ['candidates may be graphics, fades, camera changes or motion', 'small cuts/zooms may be missed', 'not verified shot rate', 'no music or SFX analysis']}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out', type=pathlib.Path, required=True)
    p.add_argument('--threshold', type=float, default=.12)
    p.add_argument('videos', nargs='+', type=pathlib.Path)
    a = p.parse_args()
    if not 0 < a.threshold < 1:
        p.error('threshold must be between 0 and 1')
    a.out.mkdir(parents=True, exist_ok=True)
    results = [scan(v, a.out, a.threshold) for v in a.videos]
    (a.out / 'scenes.json').write_text(json.dumps(results, indent=2)+'\n')
    print(json.dumps([{'file': r['file'], 'candidateEvents': len(r['events'])} for r in results]))


if __name__ == '__main__':
    main()
