import importlib.util
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path

try:
    import cv2
    import mediapipe
    import numpy as np
except ImportError:
    cv2 = mediapipe = np = None

MODULE = Path(__file__).resolve().parents[1] / "scripts/master-director/generate-mask-candidates.py"


@unittest.skipUnless(mediapipe is not None, "isolated mask dependencies are not installed")
class MaskCandidatesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("mask_candidates", MODULE)
        cls.worker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.worker)

    def args(self, source, output):
        return Namespace(input_dir=str(source), output_dir=str(output), source_sha256="a" * 64,
                         timeline_fingerprint="test-01", start_frame=10,
                         rect=[0, 0, 64, 64], mode="keep-background")

    def test_candidate_is_unverified_and_has_one_alpha_image_per_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            source.mkdir()
            for index in range(2):
                self.assertTrue(cv2.imwrite(str(source / f"frame-{index:06d}.png"),
                                           np.full((64, 64, 3), index * 80, dtype=np.uint8)))
            result = self.worker.generate(self.args(source, root / "masks"))
            self.assertEqual(result["status"], "CANDIDATE_NOT_VERIFIED")
            self.assertEqual([f["editFrame"] for f in result["frames"]], [10, 11])
            self.assertIn("not-policy-evidence", result["limitations"])
            self.assertEqual(cv2.imread(str(root / "masks/mask-000000.png"), cv2.IMREAD_UNCHANGED).shape, (64, 64, 4))

    def test_invalid_frame_cleans_only_new_output_and_never_overwrites_existing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            source.mkdir()
            (source / "frame-000000.png").write_bytes(b"not an image")
            output = root / "masks"
            with self.assertRaises(ValueError):
                self.worker.generate(self.args(source, output))
            self.assertFalse(output.exists())
            output.mkdir()
            (output / "preserve.txt").write_text("keep", encoding="utf-8")
            with self.assertRaises(ValueError):
                self.worker.generate(self.args(source, output))
            self.assertEqual((output / "preserve.txt").read_text(encoding="utf-8"), "keep")


if __name__ == "__main__":
    unittest.main()
