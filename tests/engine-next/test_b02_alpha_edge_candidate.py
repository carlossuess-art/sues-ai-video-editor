import unittest,importlib.util
from pathlib import Path
p=Path(__file__).parents[2]/'scripts/engine-next/build-b02-alpha-edge-candidate.py'
spec=importlib.util.spec_from_file_location('b02_alpha',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class TestB02Edge(unittest.TestCase):
 def test_edges_must_fade_without_changing_rgb_or_interiors(self):
  w,h=12,16;raw=bytes([13,24,35,255]*(w*h));new=m.apply_alpha_edges(raw,w,h,5,3)
  for i in range(0,len(raw),4):self.assertEqual(raw[i:i+3],new[i:i+3]);self.assertLessEqual(new[i+3],raw[i+3])
  self.assertEqual(new[(4*(5*w+5))+3],255)
  self.assertLess(new[(4*((h-1)*w+5))+3],10)
  self.assertLess(new[(4*(5*w+w-1))+3],30)
 def test_bad_geometry_rejected(self):
  for bottom,right in [(-1,0),(0,-1),(0,0),(6,0),(0,4),(0,2.3)]:
   with self.assertRaises(ValueError):m.apply_alpha_edges(bytes([1,2,3,255]*12*16),12,16,bottom,right)
 def test_staged_project_preserves_locked_source_and_fails_on_wrong_binding(self):
  ids=['sues_video_source','sues_audio_original','sues_b02_child_review_only','sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa','sues_hyperframes_gold_3d_review_only']
  clips=[{'id':i,'locked':True} for i in ids]
  clips[2]['mediaId']='m_sues_b02_child_refined50_qa';clips[3]['props']={'matteTrack':'V4'};clips[4]['track']='V4';clips[5]['disabled']=True
  d={'width':1080,'height':1920,'fps':30,'revision':10,'clips':clips,'media':[{'id':'m_sues_b02_child_refined50_qa','src':'/media/sues-child-despill50.png'}]}
  new=m.stage_project(d,'sues-b02-alpha-test.png');self.assertEqual(d['revision'],10);self.assertEqual(new['revision'],11)
  self.assertTrue(d['clips'][0]['locked']);self.assertEqual(new['clips'][0],d['clips'][0]);self.assertEqual(new['media'][0]['src'],'/media/sues-b02-alpha-test.png')
  clips[0]['locked']=False
  with self.assertRaises(ValueError):m.stage_project(d,'sues-b02-alpha-test.png')
if __name__=='__main__':unittest.main()
