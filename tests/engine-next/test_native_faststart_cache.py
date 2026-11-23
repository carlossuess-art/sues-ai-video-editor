import importlib.util
import pathlib
import shutil
import subprocess
import tempfile
import unittest

MODULE = pathlib.Path(__file__).parents[2] / 'scripts/engine-next/build-native-faststart-cache.py'
spec = importlib.util.spec_from_file_location('native_faststart', MODULE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class TestNativeFaststart(unittest.TestCase):
    def test_url_must_remain_one_exact_media_file(self):
        for s in ['/media/clip.mp4', '/media/M%C3%BAsica%20con%20voz.mp4']:
            self.assertTrue(m.valid_url(s))
        for s in ['/api/clip.mp4', '/media/../x.mp4', '/media/a%2Fb.mp4', '/media/a%5Cb.mp4', '/media/a%00b.mp4']:
            self.assertFalse(m.valid_url(s), s)

    def test_packet_mismatch_never_passes(self):
        with tempfile.TemporaryDirectory() as t:
            a, b = pathlib.Path(t)/'original.mp4', pathlib.Path(t)/'cache.mp4'
            if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
                self.skipTest('FFmpeg not installed')
            subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','testsrc2=size=160x288:rate=30:duration=0.4',
                '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.4',
                '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac',
                '-movflags','+frag_keyframe+empty_moov','-shortest',str(a)],check=True)
            proof=m.build(a,m.sha256_file(a),b,pathlib.Path(t)/'proof.json',
                          '/media/original.mp4','/media/cache.mp4')
            self.assertEqual(proof['sourceSha256'],m.sha256_file(a))
            self.assertTrue(proof['videoPacketTimelineExact'])
            self.assertTrue(proof['audioPacketTimelineExact'])
            self.assertTrue(proof['sourcePreserved'])
            self.assertFalse(proof['productionActivation'])
            with self.assertRaises(FileExistsError):
                m.build(a,m.sha256_file(a),b,pathlib.Path(t)/'proof2.json', '/media/original.mp4','/media/cache.mp4')
            a2=pathlib.Path(t)/'tampered.mp4'
            a2.write_bytes(a.read_bytes()[:-7])
            with self.assertRaises(ValueError):
                m.build(a2,m.sha256_file(a),pathlib.Path(t)/'tampered-cache.mp4',pathlib.Path(t)/'tampered-proof.json','/media/tampered.mp4','/media/tampered-cache.mp4')

if __name__=='__main__':unittest.main()
