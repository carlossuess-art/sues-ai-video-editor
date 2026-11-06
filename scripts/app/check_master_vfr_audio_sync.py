#!/usr/bin/env python3
"""Signal-only source/derivative timing check; does not certify perceived sync."""
import argparse, array, json, math, sys

RATE = 8000
WINDOWS = (5, 34, 65)

def read_pcm(path):
    with open(path, 'rb') as f:
        data = f.read()
    if len(data) % 2:
        raise ValueError('Incomplete PCM sample')
    samples = array.array('h')
    samples.frombytes(data)
    if sys.byteorder != 'little':
        samples.byteswap()
    return samples

def match(source, derived, second):
    # 1-kHz waveform samples, two-second window, ±120-ms search.
    pos = second * RATE
    a = [source[pos + j] for j in range(0, 2 * RATE, 8)]
    mean_a = sum(a) / len(a)
    a = [x - mean_a for x in a]
    ea = sum(x*x for x in a)
    if ea < 100000:
        return {'atSecond': second, 'status': 'BLOCKED_SILENCE'}
    best = (-1.0, 0)
    for lag in range(-120, 121):
        offset = pos + lag * 8
        if offset < 0 or offset + 2 * RATE >= len(derived):
            continue
        b = [derived[offset + j] for j in range(0, 2 * RATE, 8)]
        mean_b = sum(b) / len(b)
        b = [x - mean_b for x in b]
        eb = sum(x*x for x in b)
        if eb:
            corr = sum(x*y for x, y in zip(a,b)) / math.sqrt(ea*eb)
            if corr > best[0]:
                best = (corr, lag)
    return {'atSecond': second, 'correlation': round(best[0], 4), 'lagMs': best[1]}

def assess(src_path, derived_path):
    src, dst = read_pcm(src_path), read_pcm(derived_path)
    if min(len(src),len(dst)) < 68 * RATE:
        return {'status':'BLOCKED_AUDIO_TOO_SHORT'}
    windows = [match(src, dst, s) for s in WINDOWS]
    ok = all(w.get('correlation',-1) >= .92 and abs(w.get('lagMs',999)) <= 40 for w in windows)
    if ok:
        ok = max(w['lagMs'] for w in windows)-min(w['lagMs'] for w in windows) <= 20
    return {'status':'SIGNAL_TIMING_PASS_NOT_LISTENING' if ok else 'BLOCKED_AUDIO_SYNC',
            'sampleRate':RATE,'windows':windows,'sourceSamples':len(src),'derivedSamples':len(dst)}

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('source_pcm'); p.add_argument('derived_pcm')
    a=p.parse_args()
    result=assess(a.source_pcm,a.derived_pcm)
    print(json.dumps(result,indent=2))
    sys.exit(0 if result['status']=='SIGNAL_TIMING_PASS_NOT_LISTENING' else 2)

[executed on device: srv1841004 (02556f29-b0ec-42da-81b0-a7ef0e517c98)]