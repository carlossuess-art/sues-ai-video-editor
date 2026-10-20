#!/usr/bin/env python3
"""Offline, one-owner mailbox worker. No credentials, URLs or shell from requests."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import uuid

ENGINE = 'faster-whisper-base-int8'
HASH = re.compile(r'^[a-f0-9]{64}$')


def atomic(path, value):
    temp = path.with_name('.' + uuid.uuid4().hex + '.tmp')
    with temp.open('x', encoding='utf8') as f:
        os.chmod(temp, 0o600)
        json.dump(value, f, ensure_ascii=False)
    temp.replace(path)


def transcribe(root, model_path, source_id):
    if not HASH.fullmatch(source_id):
        raise ValueError('source id')
    mailbox = root / 'asr'
    request = mailbox / (source_id + '.request.json')
    if request.is_symlink() or request.stat().st_size > 8192:
        raise ValueError('request')
    data = json.loads(request.read_text())
    if data['sourceSha256'] != source_id:
        raise ValueError('binding')
    source = root / (source_id + '.video')
    if source.is_symlink() or not source.is_file():
        raise ValueError('source')
    with source.open('rb') as f:
        actual = hashlib.file_digest(f, 'sha256').hexdigest()
    if actual != source_id:
        raise ValueError('source integrity')
    duration = data['source']['duration']
    if not isinstance(duration, (int, float)) or not 0 < duration <= 600:
        raise ValueError('duration')
    import onnxruntime
    onnxruntime.disable_telemetry_events()
    from faster_whisper import WhisperModel
    model = WhisperModel(str(model_path), device='cpu', compute_type='int8', cpu_threads=1,
                         num_workers=1, local_files_only=True)
    segments, info = model.transcribe(str(source), beam_size=5, word_timestamps=True,
                                     vad_filter=True, condition_on_previous_text=False,
                                     temperature=0, hallucination_silence_threshold=2)
    words = []
    for segment in segments:
        for word in segment.words or []:
            text = word.word.strip()
            start, end = max(0, min(duration, word.start)), max(0, min(duration, word.end))
            if not text or len(text) > 80 or end < start:
                continue
            words.append(dict(text=text, start=start, end=end, confidence=word.probability,
                              **({'timingUncertain': True} if end == start else {})))
    if not words:
        raise ValueError('no speech')
    width, height = data['source']['width'], data['source']['height']
    result = dict(sourceSha256=source_id,
                  transcript=dict(version='1.0', language=info.language, sourceDuration=duration,
                                  text=' '.join(w['text'] for w in words), words=words,
                                  provenance=dict(engine=ENGINE, wordTimings='automatic; human review required')),
                  camera=dict(mode='full-frame-fit', keyframes=[dict(time=t, x=0, y=0, width=width,
                                height=height, zoom=1) for t in [0, duration]]),
                  vision=dict(method='not-performed', frames=[dict(time=t, frameWidth=width,
                              frameHeight=height, faces=[]) for t in [0, duration]]))
    atomic(mailbox / (source_id + '.result.json'), result)
    atomic(mailbox / (source_id + '.status.json'),
           dict(state='COMPLETE', finishedAt=int(time.time()*1000), engine=ENGINE,
                wordCount=len(words), language=info.language, externalCostUSD=0))
    # Never put speech, names, tokens or source paths in journald.
    print('TRANSCRIPTION_COMPLETE words=' + str(len(words)), flush=True)


def serve(root, model):
    mailbox = root / 'asr'
    mailbox.mkdir(mode=0o700, parents=True, exist_ok=True)
    if mailbox.is_symlink():
        raise ValueError('mailbox')
    with (mailbox / 'worker.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        child = None
        active_id = None
        started = 0
        while True:
            atomic(mailbox / 'worker.json', dict(engine=ENGINE, at=int(time.time()*1000)))
            if child:
                if time.monotonic()-started > 1800:
                    child.kill()
                    child.wait()
                if child.poll() is not None:
                    status = mailbox / (active_id + '.status.json')
                    if child.returncode != 0:
                        atomic(status, dict(state='FAILED', exitCode=child.returncode,
                               error='No se ha podido transcribir la voz. El original se conserva.'))
                    child = None
            if not child:
                for request in sorted(mailbox.glob('*.request.json')):
                    source_id = request.name.removesuffix('.request.json')
                    if not HASH.fullmatch(source_id):
                        continue
                    status = mailbox / (source_id + '.status.json')
                    try:
                        state = json.loads(status.read_text())['state']
                    except (OSError, ValueError, KeyError):
                        continue
                    if state not in ('QUEUED', 'RUNNING'):
                        continue
                    atomic(status, dict(state='RUNNING', startedAt=int(time.time()*1000)))
                    child = subprocess.Popen([sys.executable, str(Path(__file__).resolve()),
                            '--root', str(root), '--model', str(model), '--one', source_id])
                    active_id, started = source_id, time.monotonic()
                    break
            time.sleep(3)


if __name__ == '__main__':
    os.umask(0o077)
    # Installation downloads the pinned model separately; inference is always offline.
    os.environ.update(HF_HUB_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1', DO_NOT_TRACK='1')
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--model', type=Path, required=True)
    parser.add_argument('--one')
    args = parser.parse_args()
    try:
        if args.one:
            transcribe(args.root, args.model, args.one)
        else:
            serve(args.root, args.model)
    except Exception as error:
        import traceback
        (args.root / 'asr' / 'worker-error.txt').write_text(traceback.format_exc())
        print('TRANSCRIPTION_ERROR ' + type(error).__name__, flush=True)
        sys.exit(1)
