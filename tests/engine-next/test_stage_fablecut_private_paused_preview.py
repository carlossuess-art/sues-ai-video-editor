import importlib.util
from pathlib import Path
import tempfile
import unittest
root=Path(__file__).parents[2]
spec=importlib.util.spec_from_file_location('paused_preview',root/'scripts/engine-next/stage-fablecut-private-paused-preview.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class TestPrivatePausedPreview(unittest.TestCase):
 def make(self,p):
  upstream=p/'upstream';upstream.mkdir()
  app='\n'.join([m.SET_ANCHOR,m.PLAY_ANCHOR,m.PAUSE_ANCHOR,m.FAST_ANCHOR,m.WEBCODECS_ANCHOR,'function setTime(t) {','suesPrivateVerifiedDecodeUrl','suesPrivateVerifiedDecodeUrl'])
  (upstream/'app.js').write_text(app);(upstream/'sues-faststart-qa-gateway.cjs').write_text('gateway')
  return upstream,app
 def test_clone_is_reversible_and_does_not_change_upstream(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);source,app=self.make(p);dest=p/'private'
   self.assertEqual(m.stage(source,dest),dest)
   self.assertEqual((source/'app.js').read_text(),app)
   s=(dest/'app.js').read_text()
   self.assertIn('await suesPrivateStopPausedPreview(); // await in-flight decode before playback takes ownership',s)
   self.assertIn('suesPrivatePausedPreview.playIntent++; // never start a deferred Play after Pause',s)
   self.assertIn('async function suesPrivatePausedPreviewIdle()',s)
   self.assertIn('suesPrivateQueuePausedFrame(state.time)',s)
   self.assertIn('if (job.seq !== a.seq',s)
   with self.assertRaises(ValueError):m.stage(source,dest)
 def test_refuses_missing_anchors_and_nested_production(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);source,app=self.make(p)
   with self.assertRaises(ValueError):m.stage(source,source/'qa')
   (source/'app.js').write_text(app.replace(m.FAST_ANCHOR,'changed'))
   with self.assertRaisesRegex(ValueError,'source changed'):m.stage(source,p/'qa')
   self.assertFalse((p/'qa').exists())
if __name__=='__main__':unittest.main()
