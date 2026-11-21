"""Conservative acoustic audit of Whisper word onsets (offline, non-mutating).

A long quiet interval inside a word's ASR timestamps is evidence for REVIEW,
not evidence of the exact phonetic onset. Never silently shift source timings.
"""
from math import sqrt

def audit_word_silence(words, pcm, rate=16000, *, threshold_db=-55,
                       window_ms=20, min_quiet=0.35, min_word=0.90):
    if not isinstance(rate, int) or not 1000 <= rate <= 96000:
        raise ValueError('invalid sample rate')
    hop = max(1, round(rate * window_ms / 1000))
    floor = 10 ** (threshold_db / 20)
    findings = []
    for index, word in enumerate(words):
        start, end = float(word['start']), float(word['end'])
        if end - start < min_word:
            continue
        lo = max(0, int(start * rate))
        hi = min(len(pcm), int(end * rate))
        if hi - lo < hop * 10:
            continue
        quiet_start = None
        segments = []
        voiced = []
        for a in range(lo, hi - hop + 1, hop):
            b = a + hop
            rms = sqrt(sum(float(x) * float(x) for x in pcm[a:b]) / hop)
            if rms < floor:
                if quiet_start is None:
                    quiet_start = a
            else:
                voiced.append(a / rate)
                if quiet_start is not None:
                    if (a - quiet_start) / rate >= min_quiet:
                        segments.append((quiet_start / rate, a / rate))
                    quiet_start = None
        if quiet_start is not None and (hi - quiet_start) / rate >= min_quiet:
            segments.append((quiet_start / rate, hi / rate))
        # An isolated quiet word is not evidence of a correction: could be
        # whispered speech, a muted track or a silent passage.
        if len(voiced) < 3:
            continue
        for a, b in segments:
            if a > start + 0.25 or b > end - 0.055:
                continue
            # Require actual post-gap energy, not trailing silence after a word.
            if sum(1 for v in voiced if b <= v < end) < 2:
                continue
            findings.append(dict(wordIndex=index, start=round(start, 3),
                                 end=round(end, 3),
                                 silenceStart=round(a, 3),
                                 silenceEnd=round(b, 3),
                                 suggestedReviewAt=round(b, 3),
                                 code='WORD_ONSET_SILENCE_REVIEW'))
            break
    return findings
