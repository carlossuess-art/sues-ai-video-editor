#!/usr/bin/env python3
"""Authorized, isolated Whisper installation. No changes to editor/Docker/Caddy."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

ROOT = Path('/opt/sues-video-setup')
TARGET = ROOT / 'whisper-local'
SCRIPTS = Path(__file__).resolve().parent
UNIT = Path('/etc/systemd/system/sues-editor-whisper.service')


def run(*args):
    subprocess.run([str(a) for a in args], check=True)


def install():
    if os.geteuid() != 0 or ROOT.is_symlink() or not (ROOT/'editor/jobs/uploads').is_dir():
        raise RuntimeError('Expected existing SUES editor VPS and administrator')
    mailbox = ROOT / 'editor/jobs/uploads/asr'
    if mailbox.exists():
        for status in mailbox.glob('*.status.json'):
            if json.loads(status.read_text()).get('state') in ('RUNNING', 'QUEUED'):
                raise RuntimeError('Wait for active transcription before installing')
    TARGET.mkdir(mode=0o700, exist_ok=True)
    if TARGET.is_symlink():
        raise RuntimeError('Unexpected runtime directory')
    with (TARGET/'install.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        backup = TARGET/('code-backup-'+time.strftime('%Y%m%d-%H%M%S', time.gmtime()))
        backup.mkdir(mode=0o700)
        for name, path in [('worker.py', TARGET/'worker.py'), ('service.unit', UNIT),
                           ('requirements.lock', TARGET/'requirements.lock')]:
            if path.exists():
                shutil.copy2(path, backup/name)
        manifest = {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in backup.iterdir()}
        (backup/'SHA256.json').write_text(json.dumps(manifest))
        python = TARGET/'venv/bin/python'
        if not python.exists():
            run('python3', '-m', 'venv', TARGET/'venv')
        desired = (SCRIPTS/'requirements.lock').read_text().splitlines()
        current = subprocess.check_output([str(python), '-m', 'pip', 'freeze'], text=True).splitlines()
        if set(desired) != set(current):
            run(python, '-m', 'pip', 'install', '--only-binary=:all:', '-r', SCRIPTS/'requirements.lock')
        model = json.loads((SCRIPTS/'model-manifest.json').read_text())
        missing = any(not (TARGET/'model'/f).is_file() for f in model['files'])
        if missing:
            code = ("from huggingface_hub import snapshot_download; snapshot_download(" +
                    repr(model['repository']) + ',revision=' + repr(model['revision']) +
                    ',local_dir=' + repr(str(TARGET/'model')) + ',allow_patterns=' +
                    repr(list(model['files'])) + ')')
            run(python, '-c', code)
        for name, expected in model['files'].items():
            with (TARGET/'model'/name).open('rb') as f:
                if hashlib.file_digest(f, 'sha256').hexdigest() != expected:
                    raise RuntimeError('Model checksum mismatch')
        run('systemctl', 'stop', 'sues-editor-whisper.service') if UNIT.exists() else None
        for name in ['worker.py', 'requirements.lock', 'model-manifest.json']:
            shutil.copy2(SCRIPTS/name, TARGET/name)
        mailbox.mkdir(mode=0o700, exist_ok=True)
        # Only this isolated runtime/mailbox: never change existing project permissions.
        for path in [TARGET, *TARGET.rglob('*'), mailbox, *mailbox.rglob('*')]:
            os.chown(path, 1000, 1000, follow_symlinks=False)
        shutil.copy2(SCRIPTS/'sues-editor-whisper.service', UNIT)
        run('systemd-analyze', 'verify', UNIT)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'enable', '--now', 'sues-editor-whisper.service')
        print('Whisper installed; pinned model checksums verified. Code backup:', backup)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--authorized-local-whisper', action='store_true', required=True)
    parser.parse_args()
    os.umask(0o077)
    install()
