import copy,unittest
from refresh_creator_inventory import refresh

class RefreshTests(unittest.TestCase):
    def test_repeated_inventory_does_not_approve_resources_or_erase_owner_decisions(self):
        old={'schema':'sues-resource-audit/v1','cards':[{'driveId':'existing-excluded-id','kind':'video-candidate','selectionExcluded':True,'bytesVerified':True,'sha256':'a'*64,'visibleContentEs':'Revisión previa'}]}
        snapshot={'items':[{'id':'existing-excluded-id','mime_type':'video/mp4','title':'Changed name','size':'123'},{'id':'new-audio-drive-id','mime_type':'audio/wav','title':'Whoosh.wav','size':'321','category':'Whooshes'},{'id':'folder-id-12345','mime_type':'application/vnd.google-apps.folder','title':'Folder'}]}
        previous=copy.deepcopy(old['cards'][0]);result=refresh(snapshot,old)
        self.assertEqual(result['cards'][0],previous)
        self.assertEqual(len(result['cards']),2)
        added=result['cards'][1];self.assertEqual(added['kind'],'audio-source');self.assertFalse(added['bytesVerified']);self.assertFalse(added['lifecycleEvidence']['renderTested']);self.assertFalse(added['eligibleForNewGeminiRequest'])
        again=refresh(snapshot,result);self.assertEqual(len(again['cards']),2);self.assertEqual(again['creatorClubRefresh']['newCards'],0)
    def test_invalid_ids_and_wrong_schema_are_rejected(self):
        with self.assertRaises(ValueError):refresh({'items':[]},{'schema':'invalid'})
        with self.assertRaises(ValueError):refresh({'items':[{'id':'../bad','mime_type':'audio/wav'}]},{'schema':'sues-resource-audit/v1','cards':[]})
