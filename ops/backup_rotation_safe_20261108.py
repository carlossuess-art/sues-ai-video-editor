#!/usr/bin/env python3
"""Keep one pinned stable rollback plus the two newest verified update archives."""
import argparse,fcntl,hashlib,json,os,re,shutil,subprocess,tarfile,time
from pathlib import Path
ROOT=Path('/opt/sues-video-setup')
PIN=ROOT/'retention-baselines/baseline-created-20261108-from-update-20261029-182329-365998/editor-state.tar'
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def verify(path,expected=None):
 before=path.stat()
 assert path.is_file() and not path.is_symlink()
 actual=digest(path)
 if expected:assert actual==expected,'archive checksum mismatch'
 count=0
 with tarfile.open(path,'r:') as t:
  for m in t:
   if m.isfile():
    f=t.extractfile(m)
    for b in iter(lambda:f.read(4194304),b''):pass
    count+=1
 assert count>0
 after=path.stat()
 assert (before.st_size,before.st_mtime_ns)==(after.st_size,after.st_mtime_ns)
 return {'sha256':actual,'size':after.st_size,'mtime_ns':after.st_mtime_ns,'files':count}
def plan(paths,keep=2):return sorted(paths)[:-keep] if len(paths)>keep else []
def rotate(root=ROOT,pin=PIN,dry=False):
 """Non-destructive verified retention. Never prune with uncertain history.

 An incomplete historical directory is kept as evidence. Two newest complete
 backups plus the pinned, independently copied baseline are SHA verified.
 Deletion remains disabled even after all checks pass; any future prune
 requires a separate reviewed and explicitly enabled policy.
 """
 assert root.is_dir() and not root.is_symlink()
 backups=sorted(p for p in root.glob('update-backup-*') if re.fullmatch(r'update-backup-\d{8}-\d{6}(?:-\d+)?',p.name) and p.is_dir() and not p.is_symlink())
 complete=[];incomplete=[]
 for p in backups:
  f=p/'editor-state.tar';m=p/'editor-state.manifest.json'
  if f.exists() and m.exists():complete.append(p)
  else:incomplete.append(p.name)
 assert len(complete)>=2,'fewer than two complete backups'
 assert pin.exists() and pin.parent.joinpath('editor-state.manifest.json').exists(),'pinned baseline missing'
 pin_manifest=json.loads(pin.parent.joinpath('editor-state.manifest.json').read_text())
 baseline=verify(pin,pin_manifest['archiveSha256'])
 checks={str(pin):baseline}
 for p in complete[-2:]:
  f=p/'editor-state.tar';m=p/'editor-state.manifest.json'
  assert time.time()-max(f.stat().st_mtime,m.stat().st_mtime)>120,'new backup still settling'
  checks[str(f)]=verify(f,json.loads(m.read_text())['archiveSha256'])
 # A verified baseline is not equivalent to a fresh live-editor snapshot.
 report={'status':'verified-no-prune','healthyRestoreArchives':len(checks),
         'allHistoricalBackupsPreserved':True,'automaticPruningEnabled':False,
         'incompleteHistoricalDirectoriesRetained':incomplete,
         'completeUpdateBackups':len(complete),'checked':checks,'removed':[],
         'requiresRetentionReview':bool(incomplete),'dryRun':dry}
 return report
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--dry-run',action='store_true');args=parser.parse_args()
 with (ROOT/'backup-rotation.lock').open('a') as own:
  try:fcntl.flock(own,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:return
  locks=[]
  try:
   for p in [ROOT/'service.lock',ROOT/'background-update/worker.lock']:
    f=p.open('a');locks.append(f);fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)
   print(json.dumps(rotate(dry=args.dry_run)))
  except BlockingIOError:print('Update active: rotation deferred')
  finally:
   for f in locks:f.close()
if __name__=='__main__':main()
