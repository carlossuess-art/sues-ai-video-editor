import importlib.util,unittest,copy
from pathlib import Path
P=Path(__file__).parents[2]/'scripts/engine-next/reel-158404-milestone-audit.py'
spec=importlib.util.spec_from_file_location('reel_audit',P);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
H='a'*64;C='b'*64;E='c'*64
class TestReelAudit(unittest.TestCase):
 def fixture(self):
  ops=[{'id':'op'+str(i),'track':'broll' if i==2 else 'camera','sceneId':'scene-02' if i==2 else 'scene-01','start':9.5 if i==2 else 0,'end':13.5 if i==2 else 1,'resourceRef':'B02' if i==2 else None} for i in range(49)]
  ops[2]['id']='shot-2-2';scenes=[{'id':'scene-0'+str(i)} for i in range(1,8)]
  for i in range(1,7):ops[i+10]['sceneId']='scene-0'+str(i+1)
  story={'schema':'sues-master-story/v1','sourceSha256':H,'timeline':{'duration':73.7},'narrative':{'scenes':scenes},'operations':ops,'resources':[{'id':'B02','expectedSha256':C}]}
  clips=[{'id':'sues_video_source','locked':True},{'id':'sues_audio_original','locked':True}]
  clips += [{'id':name,'start':9.5,'duration':4,'track':tr,'props':{'matteTrack':'V4'} if tr=='V3' else {}} for name,tr in [('sues_b02_child_review_only','V2'),('sues_b02_carlos_foreground_luma_qa','V3'),('sues_b02_temporal_luma_qa','V4')]]
  proj={'width':1080,'height':1920,'fps':30,'clips':clips}
  packet={'sourceSha256':H,'automaticallyApproved':False,'status':'REQUIRES_HUMAN_REVIEW','candidateWordCount':1,'candidates':[{'text':'candidate'}],'issues':[]}
  man={'frameCount':120,'fps':30,'timelineWindow':[9.5,13.5],'artifacts':{'B02-4s-FABLECUT-NATIVE-120f-DESPILL50-V5-UNAPPROVED.mp4':E}}
  return story,proj,packet,man
 def test_staged_clip_never_promotes_to_creative_approval(self):
  story,proj,packet,man=self.fixture();r=mod.audit(story,proj,packet,man,H,C,E)
  self.assertEqual(r['coverage']['nativeSceneCandidateCount'],1);self.assertEqual(r['coverage']['executedOperationsWithCertifiedManifest'],0)
  self.assertEqual(r['coverage']['operationCount'],49);self.assertFalse(r['creativeApprovalOfThisRender'])
 def test_source_asset_and_export_sha_must_match(self):
  story,proj,packet,man=self.fixture()
  for hashes in [('0'*64,C,E),(H,'0'*64,E),(H,C,'0'*64)]:
   with self.assertRaises(ValueError):mod.audit(story,proj,packet,man,*hashes)
 def test_child_matte_and_original_locked_are_required(self):
  story,proj,packet,man=self.fixture();proj['clips'][0]['locked']=False
  with self.assertRaises(ValueError):mod.audit(story,proj,packet,man,H,C,E)
  proj['clips'][0]['locked']=True;proj['clips'][3]['props']['matteTrack']='V1'
  with self.assertRaises(ValueError):mod.audit(story,proj,packet,man,H,C,E)
 def test_no_forged_human_review_or_truncated_story(self):
  story,proj,packet,man=self.fixture();packet['automaticallyApproved']=True
  with self.assertRaises(ValueError):mod.audit(story,proj,packet,man,H,C,E)
  packet['automaticallyApproved']=False;story['operations'].pop()
  with self.assertRaises(ValueError):mod.audit(story,proj,packet,man,H,C,E)
if __name__=='__main__':unittest.main()
