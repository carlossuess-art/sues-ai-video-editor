import importlib.util
from pathlib import Path
import unittest
p=Path(__file__).parents[2]/'scripts/engine-next/audit-b02-temporal-matte.py'
spec=importlib.util.spec_from_file_location('sues_b02_matte',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class TestB02TemporalMatte(unittest.TestCase):
 def test_constant_silhouette_does_not_trigger_churn(self):
  w,h=8,8;f=bytes([255 if (x in (2,3,4,5) and 2<=y<=6) else 0 for y in range(h) for x in range(w)])
  a,mask=m.frame_metrics(f,w,h)
  b,_=m.frame_metrics(f,w,h,mask)
  self.assertEqual(b['changedPixelsFraction'],0)
  self.assertEqual(a['centroidX'],3.5)
  self.assertEqual(a['centroidY'],4)
  self.assertAlmostEqual(a['coverage'],20/64)
 def test_silhouette_motion_is_measured(self):
  w,h=8,8;a=bytes([255 if x<4 else 0 for y in range(h) for x in range(w)])
  b=bytes([255 if x>=4 else 0 for y in range(h) for x in range(w)])
  metric,mask=m.frame_metrics(a,w,h)
  moved,_=m.frame_metrics(b,w,h,mask)
  self.assertEqual(moved['changedPixelsFraction'],1)
  self.assertGreater(moved['centroidX']-metric['centroidX'],3)
 def test_empty_and_invalid_inputs_rejected(self):
  for a,w,h in [(bytes(63),8,8),(bytes(64),6,8),(bytes(64),8,8)]:
   with self.assertRaises(ValueError):m.frame_metrics(a,w,h)
if __name__=='__main__':unittest.main()
