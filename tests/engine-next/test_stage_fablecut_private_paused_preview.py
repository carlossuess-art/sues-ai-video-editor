import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).parents[2]
SPEC=importlib.util.spec_from_file_location('precise_pause_stage',ROOT/'scripts/engine-next/stage-fablecut-private-paused-preview.py')
mod=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(mod)

class TestStagePrecisePausedPreview(unittest.TestCase):
 def create(self, root):
  app=root/'private-faststart-original';app.mkdir();
  original=('// authenticated QA copy\n'+'function setTime(t) {\n'+mod.SET_ANCHOR+'\n}\n'+mod.PLAY_ANCHOR+'}\n'+mod.PAUSE_ANCHOR+'}\n'+mod.FAST_ANCHOR+'\n}\n'+mod.WEBCODECS_ANCHOR+'\n}\n// suesPrivateVerifiedDecodeUrl suesPrivateVerifiedDecodeUrl\n')
  (app/'app.js').write_text(original)
  (app/'sues-faststart-qa-gateway.cjs').write_text('module.exports={};\n')
  (app/'server.js').write_text('const x = 1;\n')
  return app,original
 def test_clone_separate_from_upstream_and_session_intents_are_cancelled(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);app,original=self.create(root);dst=root/'private-pause-clone'
   self.assertEqual(mod.stage(app,dst),dst)
   self.assertEqual((app/'app.js').read_text(),original)
   transformed=(dst/'app.js').read_text()
   self.assertIn('suesPrivatePausedPreview.playIntent++',transformed)
   self.assertIn('intent === activeScrub.playIntent',transformed)
   self.assertIn('await suesPrivateStopPausedPreview()',transformed)
   self.assertIn('state.rendering = true',transformed)
   self.assertIn('runtime.exportFrames?.has',transformed)
   self.assertEqual(transformed.count('SUES PRIVATE QA: precise paused scrub'),1)
   subprocess.run(['node','--check',str(dst/'app.js')],check=True,capture_output=True)
   with self.assertRaisesRegex(ValueError,'New separate private app clone'):
    mod.stage(app,dst)
 def test_reject_changed_upstream_before_copying(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);app,original=self.create(root)
   (app/'app.js').write_text(original.replace(mod.SET_ANCHOR,'// corrupted upstream'))
   dst=root/'private-pause-clone'
   with self.assertRaisesRegex(ValueError,'FableCut source changed'):
    mod.stage(app,dst)
   self.assertFalse(dst.exists())
 def test_refuses_nested_or_wrong_upstream(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);app,original=self.create(root)
   with self.assertRaisesRegex(ValueError,'New separate private app clone'):
    mod.stage(app,app/'patch-in-production')
   (app/'app.js').write_text(original.replace('suesPrivateVerifiedDecodeUrl suesPrivateVerifiedDecodeUrl','removed'))
   with self.assertRaisesRegex(ValueError,'Requires existing verified faststart'):
    mod.stage(app,root/'private-pause-clone')

if __name__=='__main__':unittest.main()
