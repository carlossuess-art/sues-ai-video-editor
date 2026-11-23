import unittest,importlib.util,io,tarfile,tempfile,json,hashlib,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('safe_backup_rotation',Path(__file__).with_name('backup_rotation_safe_20261108.py'))
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

def archive(folder):
 folder.mkdir(parents=True,exist_ok=True)
 data=b'verified backup fixture';name='editor/jobs/test.json'
 dest=folder/'editor-state.tar'
 with tarfile.open(dest,'w') as tar:
  info=tarfile.TarInfo(name);info.size=len(data);tar.addfile(info,io.BytesIO(data))
 sha=hashlib.sha256(dest.read_bytes()).hexdigest()
 (folder/'editor-state.manifest.json').write_text(json.dumps({'archiveSha256':sha,'files':{name:hashlib.sha256(data).hexdigest()}}))
 # Clock only for test-fixture mtime, not production history.
 import os
 then=time.time()-3600
 os.utime(dest,(then,then));os.utime(folder/'editor-state.manifest.json',(then,then))
 return dest
class SafePolicy(unittest.TestCase):
 def test_incomplete_backups_remain_and_no_files_deleted(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);pin=archive(root/'new-real-date-baseline')
   first=archive(root/'update-backup-20261025-074747')
   second=archive(root/'update-backup-20261029-182329')
   incomplete=root/'update-backup-20261029-182123';incomplete.mkdir();(incomplete/'editor-inspect.json').write_text('{}')
   result=mod.rotate(root=root,pin=pin)
   self.assertEqual(result['status'],'verified-no-prune')
   self.assertFalse(result['automaticPruningEnabled'])
   self.assertEqual(result['incompleteHistoricalDirectoriesRetained'],[incomplete.name])
   self.assertEqual(result['removed'],[])
   self.assertTrue(incomplete.exists() and first.exists() and second.exists() and pin.exists())
 def test_no_pin_is_hard_failure(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);archive(root/'update-backup-20261025-074747');archive(root/'update-backup-20261029-182329')
   with self.assertRaisesRegex(AssertionError,'pinned baseline missing'):
    mod.rotate(root=root,pin=root/'missing.tar')
 def test_incomplete_when_only_one_complete_is_hard_failure(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);pin=archive(root/'new-real-date-baseline');archive(root/'update-backup-20261029-182329')
   with self.assertRaisesRegex(AssertionError,'fewer than two complete backups'):
    mod.rotate(root=root,pin=pin)
if __name__=='__main__':unittest.main()
