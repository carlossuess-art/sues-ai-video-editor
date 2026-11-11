#!/usr/bin/env python3
"""Verify a legacy SUES rollback TAR against its per-file signed-off SHA-256
manifest without extracting files, reading/displaying secrets or changing state.
Use only known archive paths. This does NOT activate backup rotation or publish.
"""
import argparse, hashlib, json, os, re, stat, sys, tarfile
from pathlib import Path

MAX_FILES=250_000
MAX_NAME=600
SHA=re.compile(r'^[a-f0-9]{64}$')

def verify(archive: Path, manifest: Path):
    if not archive.is_file() or archive.is_symlink() or not manifest.is_file() or manifest.is_symlink():
        raise ValueError('archive or manifest unavailable')
    meta=json.loads(manifest.read_text())
    expected=meta.get('files')
    if not isinstance(expected,dict) or not expected or len(expected)>MAX_FILES or not SHA.fullmatch(str(meta.get('archiveSha256',''))):
        raise ValueError('invalid manifest')
    for name,sha in expected.items():
        if not isinstance(name,str) or len(name)>MAX_NAME or name.startswith('/') or '..' in name.split('/') or '\\' in name or not SHA.fullmatch(str(sha)):
            raise ValueError('unsafe or malformed manifest entry')
    archive_hash=hashlib.sha256()
    with archive.open('rb') as f:
        while True:
            block=f.read(4*1024*1024)
            if not block:break
            archive_hash.update(block)
    if archive_hash.hexdigest()!=meta['archiveSha256']:raise ValueError('archive SHA mismatch')
    seen=set();count=0;bytes_checked=0
    with tarfile.open(archive,'r:') as tar:
        for member in tar:
            name=member.name.removeprefix('./')
            if not name or name.startswith('/') or '..' in name.split('/') or '\\' in name or len(name)>MAX_NAME:
                raise ValueError('unsafe TAR member name')
            if not (member.isfile() or member.isdir()) or member.issym() or member.islnk():
                raise ValueError('links or special TAR members prohibited')
            if member.isfile():
                if name not in expected or name in seen:raise ValueError('unexpected or duplicate file')
                source=tar.extractfile(member)
                if source is None:raise ValueError('missing TAR payload')
                h=hashlib.sha256()
                with source:
                    while True:
                        block=source.read(4*1024*1024)
                        if not block:break
                        h.update(block)
                        bytes_checked+=len(block)
                if h.hexdigest()!=expected[name]:raise ValueError('member checksum mismatch')
                seen.add(name);count+=1
                if count>MAX_FILES:raise ValueError('too many files')
    if seen!=set(expected):raise ValueError('missing manifest files')
    return {'schema':'sues-editor-rollback-archive-verification/v1','verified':True,'archive':archive.name,
        'files':count,'payloadBytesChecked':bytes_checked,'archiveSha256':meta['archiveSha256'],
        'onlyRead':True,'restored':False}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('archive',type=Path)
    parser.add_argument('manifest',type=Path)
    args=parser.parse_args()
    try:
        print(json.dumps(verify(args.archive,args.manifest)))
    except Exception as error:
        print(json.dumps({'verified':False,'reason':str(error)[:160]}))
        sys.exit(2)
