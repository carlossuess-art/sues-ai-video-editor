#!/usr/bin/env python3
"""Restricted full extraction smoke-test for a verified rollback archive.
Never writes to live /state or /app paths and cleans its own QA directory.
No application startup, no Docker changes, no backup deletion.
"""
import json,os,shutil,sys,tarfile,tempfile
from pathlib import Path
from verify_editor_rollback_archive import verify

ROOT=Path('/opt/sues-video-setup')
QA=ROOT/'qa-restore-drills'
BACKUP=ROOT/'update-backup-20261029-182329-365998'

def run():
    proof=verify(BACKUP/'editor-state.tar',BACKUP/'editor-state.manifest.json')
    QA.mkdir(mode=0o700,exist_ok=True)
    if QA.is_symlink() or (QA.stat().st_mode&0o077):raise ValueError('unsafe QA root')
    with tempfile.TemporaryDirectory(prefix='editor-rollback-',dir=QA) as name:
        out=Path(name)
        copied=0;files=0
        with tarfile.open(BACKUP/'editor-state.tar','r:') as t:
            for m in t:
                rel=m.name.removeprefix('./')
                if not rel or rel.startswith('/') or '..' in rel.split('/') or '\\' in rel or not (m.isdir() or m.isfile()) or m.issym() or m.islnk():
                    raise ValueError('unsafe tar member')
                dest=out/rel
                if m.isdir():dest.mkdir(parents=True,exist_ok=True,mode=0o700);continue
                dest.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
                source=t.extractfile(m)
                if source is None:raise ValueError('unreadable tar file')
                with source,dest.open('xb') as sink:
                    copied+=shutil.copyfileobj(source,sink,4*1024*1024) or 0
                dest.chmod(0o600);files+=1
        # The editor snapshot must have recognizable private job and auth structure.
        assert (out/'editor/access/admin-password-hash').is_file()
        assert (out/'editor/jobs').is_dir()
        assert files==proof['files']
        print(json.dumps({'status':'PASS','restoreDirectoryWasTemporary':True,
          'filesExtracted':files,'expectedFiles':proof['files'],
          'editorAccessRestored':True,'editorJobsRestored':True,
          'restoredIntoProduction':False,'launchedOldEditor':False}))

if __name__=='__main__':
    try:run()
    except Exception as e:print(json.dumps({'status':'FAILED','reason':str(e)[:200]}));sys.exit(2)
