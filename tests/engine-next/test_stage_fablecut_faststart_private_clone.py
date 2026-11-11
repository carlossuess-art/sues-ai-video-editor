import importlib.util
from pathlib import Path
import tempfile
import unittest
root=Path(__file__).parents[2]
spec=importlib.util.spec_from_file_location('stage_fablecut',root/'scripts/engine-next/stage-fablecut-faststart-private-clone.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class TestPrivateFableCutClone(unittest.TestCase):
    def build_fixture(self, base):
        source=base/'original-app';source.mkdir()
        app='let prefix=1;\n'+m.BEGIN_NEEDLE+'\n'+m.APP_NEEDLE+'\nasync function exportDecodeFrame(c, t) {}\n'
        server=m.SERVER_ANCHOR+'\n'+m.SERVER_API_ANCHOR+'\nconst rest=1;\n'
        (source/'app.js').write_text(app)
        (source/'server.js').write_text(server)
        (source/'index.html').write_text('ORIGINAL_APP_UNCHANGED')
        return source,app,server

    def test_clone_only_and_copy_builder(self):
        with tempfile.TemporaryDirectory() as t:
            root2=Path(t);original,app,server=self.build_fixture(root2)
            clone=root2/'isolated-app'
            self.assertEqual(m.stage(original,clone,root/'ops/fablecut-faststart-qa-gateway.cjs',
                                     root/'scripts/engine-next/build-native-faststart-cache.py'),clone)
            self.assertEqual((original/'app.js').read_text(),app)
            self.assertEqual((original/'server.js').read_text(),server)
            self.assertTrue((clone/'sues-faststart-qa-gateway.cjs').is_file())
            self.assertTrue((clone/'sues-build-native-faststart-cache.py').is_file())
            self.assertIn('suesPrivateVerifiedDecodeUrl', (clone/'app.js').read_text())
            self.assertIn('/api/sues-faststart/verified', (clone/'server.js').read_text())
            self.assertIn('SUES_FASTSTART_PRIVATE_QA', (clone/'server.js').read_text())
            with self.assertRaises(FileExistsError):
                m.stage(original,clone,root/'ops/fablecut-faststart-qa-gateway.cjs',
                        root/'scripts/engine-next/build-native-faststart-cache.py')

    def test_wrong_upstream_anchor_rejected_without_creating_new_clone(self):
        with tempfile.TemporaryDirectory() as t:
            directory=Path(t);original,app,server=self.build_fixture(directory)
            (original/'app.js').write_text(app.replace(m.APP_NEEDLE,'// deleted upstream export anchor'))
            clone=directory/'isolated-app'
            with self.assertRaisesRegex(ValueError,'Unexpected FableCut upstream version'):
                m.stage(original,clone,root/'ops/fablecut-faststart-qa-gateway.cjs',
                        root/'scripts/engine-next/build-native-faststart-cache.py')
            self.assertFalse(clone.exists())

    def test_refuse_clone_inside_live_upstream(self):
        with tempfile.TemporaryDirectory() as t:
            directory=Path(t);original,app,server=self.build_fixture(directory)
            with self.assertRaisesRegex(ValueError,'outside upstream production tree'):
                m.stage(original,original/'subdir',root/'ops/fablecut-faststart-qa-gateway.cjs',
                        root/'scripts/engine-next/build-native-faststart-cache.py')

if __name__=='__main__':unittest.main()
