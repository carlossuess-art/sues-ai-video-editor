"""Offline regression tests: false positives must never rewrite timestamps."""
import unittest
from word_timing_silence import audit_word_silence

R = 1000
def signal(duration=4):
    return [0.0] * (duration * R)
def speak(audio, a, b, amplitude=.05):
    for i in range(round(a * R), round(b * R)):
        audio[i] = amplitude

class TestWordSilence(unittest.TestCase):
    def test_real_pattern_flags_without_shifting(self):
        pcm = signal()
        speak(pcm, .42, .50)
        speak(pcm, 2.02, 2.12)
        word = {'start':.42,'end':2.12,'text':'para'}
        before = dict(word)
        findings = audit_word_silence([word], pcm, R)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]['code'], 'WORD_ONSET_SILENCE_REVIEW')
        self.assertAlmostEqual(findings[0]['suggestedReviewAt'], 2.02, places=2)
        self.assertEqual(word, before)
    def test_continuous_voice_is_not_flagged(self):
        pcm = signal()
        speak(pcm, .2, 2)
        self.assertEqual(audit_word_silence([{'start':.2,'end':2}], pcm, R), [])
    def test_trailing_pause_does_not_move_spoken_word(self):
        pcm = signal()
        speak(pcm, .2, .65)
        self.assertEqual(audit_word_silence([{'start':.2,'end':2}], pcm, R), [])
    def test_whispered_or_muted_passage_is_inconclusive(self):
        pcm = signal()
        speak(pcm, .2, .5, .0002)
        speak(pcm, 1.8, 2, .0002)
        self.assertEqual(audit_word_silence([{'start':.2,'end':2}], pcm, R), [])
    def test_short_or_late_pause_is_not_flagged(self):
        pcm = signal()
        speak(pcm, 0, .47)
        speak(pcm, .85, 1.8)
        self.assertEqual(audit_word_silence([{'start':0,'end':1.8}], pcm, R), [])
    def test_invalid_rate_rejected(self):
        with self.assertRaises(ValueError):
            audit_word_silence([], [], 0)

if __name__ == '__main__':
    unittest.main()
