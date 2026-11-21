import importlib.util
from pathlib import Path
import unittest
p=Path(__file__).parents[2]/'scripts/engine-next/audit-fablecut-source-roi-vfr.py'
spec=importlib.util.spec_from_file_location('vfr_qc',p);q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
class TestVFRQC(unittest.TestCase):
    def test_source_pts_mapping_is_exact_and_can_repeat_when_vfr_source_has_gaps(self):
        source=[0,.040,.070,.133]
        self.assertEqual(q.source_indices(source,0,5,30),[0,0,1,2,3])
    def test_near_boundary_is_not_automatically_moved_to_next_frame(self):
        self.assertEqual(q.source_indices([11,11.131233,11.166767],11.1666666667,1,30),[1])
    def test_ffmpeg_raw_source_decode_never_implicitly_resamples_vfr(self):
        args=q.raw_crop_command('/tmp/a.mp4',(10,60,230,300),121)
        self.assertEqual(args[args.index('-vsync')+1],'0')
        self.assertIn('crop=230:300:10:60',args)
        with self.assertRaises(ValueError):q.raw_crop_command('/tmp/a.mp4',(1070,0,30,100),1)
    def test_invalid_source_times_fail_closed(self):
        for pts in ([],[0.2,0.1]):
            with self.assertRaises(ValueError):q.source_indices(pts,0,3,30)
        with self.assertRaises(ValueError):q.source_indices([1,2],0,3,30)
if __name__=='__main__': unittest.main()
