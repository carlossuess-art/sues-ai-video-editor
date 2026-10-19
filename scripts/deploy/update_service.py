#!/usr/bin/env python3
"""Pinned editor-only update for the already verified single-owner HTTPS VPS."""
import copy
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import tarfile
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path('/opt/sues-video-setup')
EDITOR = 'sues-video-editor'
HOST = 'editor.suesholistics.com'
REPO = 'https://github.com/carlossuess-art/sues-ai-video-editor.git'


def digest(stream):
    value = hashlib.sha256()
    while chunk := stream.read(1024 * 1024):
        value.update(chunk)
    return value.hexdigest()


def backup_state(destination):
    """Called with the sole editor stopped. Never extract or follow symlinks."""
    state = ROOT / 'editor'
    if not state.is_dir() or state.is_symlink():
        raise RuntimeError('Estado privado inesperado; no se actualiza')
    entries = [state, *state.rglob('*')]
    for path in entries:
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise RuntimeError('Estado con enlaces o archivos especiales; revisar antes de actualizar')
    total = sum(path.stat().st_size for path in entries if path.is_file())
    if shutil.disk_usage(ROOT).free < total * 1.1 + 16 * 1024 * 1024:
        raise RuntimeError('Espacio insuficiente para copia verificada')
    archive = destination / 'editor-state.tar'
    with tarfile.open(archive, 'x') as tar:
        tar.add(state, arcname='editor', recursive=True)
    verified = {}
    with tarfile.open(archive, 'r:') as tar:
        members = tar.getmembers()
        if len(members) != len(entries):
            raise RuntimeError('Inventario de copia incompleto')
        for member in members:
            path = ROOT / member.name
            if member.isfile():
                with path.open('rb') as original, tar.extractfile(member) as saved:
                    expected = digest(original)
                    if expected != digest(saved) or path.stat().st_size != member.size:
                        raise RuntimeError('Copia de estado no coincide')
                verified[member.name] = expected
            elif not member.isdir():
                raise RuntimeError('Tipo inesperado en copia')
    with archive.open('rb') as stream:
        sha = digest(stream)
    (destination / 'editor-state.manifest.json').write_text(json.dumps({'archiveSha256': sha, 'files': verified}, indent=2))
    return sha


def run(*args, check=True, timeout=90):
    result = subprocess.run(args, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError('Falló: ' + ' '.join(args[:2]) + ' (código ' + str(result.returncode) + ')')
    return result


def inspect():
    return json.loads(run('docker', 'inspect', EDITOR).stdout)[0]


def health():
    token = (ROOT / 'editor/access/token').read_text().strip()
    if not re.fullmatch('[a-f0-9]{64}', token):
        raise RuntimeError('Token privado inválido')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    headers = {'Host': HOST, 'Cookie': 'sues_session=' + token}
    request = urllib.request.Request('http://127.0.0.1:3010/api/health', headers=headers)
    with opener.open(request, timeout=5) as response:
        state = json.load(response)
    request = urllib.request.Request('http://127.0.0.1:3010/api/jobs', headers=headers)
    with opener.open(request, timeout=5) as response:
        jobs = json.load(response)
    if state.get('status') != 'available':
        raise RuntimeError('El editor no está disponible')
    if any(state['queue'][key] for key in ('rendering', 'waiting', 'saving')) or any(j.get('backupBusy') for j in jobs):
        raise RuntimeError('Hay trabajos activos; esperar antes de actualizar')


def helper(release):
    path = release / 'scripts/deploy/activate_https.py'
    spec = importlib.util.spec_from_file_location('sues_verified_deploy', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def main(sha):
    os.umask(0o077)
    if os.geteuid() != 0 or not re.fullmatch('[a-f0-9]{40}', sha):
        raise RuntimeError('Se requiere root y un commit de 40 caracteres')
    if not ROOT.is_dir() or ROOT.is_symlink():
        raise RuntimeError('Directorio de instalación inesperado')
    with (ROOT / 'service.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        old = inspect()
        if not old['State']['Running']:
            raise RuntimeError('El editor debe estar arrancado')
        if 'SUES_PUBLIC_ORIGIN=https://' + HOST not in old['Config']['Env']:
            raise RuntimeError('Primero debe estar activado el origen HTTPS verificado')
        mounts = {m['Destination']: m for m in old['Mounts']}
        if mounts.get('/state', {}).get('Source') != str(ROOT / 'editor'):
            raise RuntimeError('Montaje privado inesperado')
        old_release = Path(mounts['/app']['Source'])
        old_sha = run('git', '-c', 'safe.directory=' + str(old_release), '-C', str(old_release), 'rev-parse', 'HEAD').stdout.strip()
        if old_sha == sha:
            health()
            print('El editor ya usa esta versión; sin reinicio.')
            return
        health()
        release = Path(tempfile.mkdtemp(prefix='release-update.', dir=ROOT))
        run('git', 'init', str(release))
        run('git', '-C', str(release), 'fetch', '--depth', '1', REPO, sha, timeout=180)
        run('git', '-C', str(release), 'checkout', '--detach', 'FETCH_HEAD')
        if run('git', '-C', str(release), 'rev-parse', 'HEAD').stdout.strip() != sha:
            raise RuntimeError('El commit descargado no coincide')
        if (release / 'package-lock.json').read_bytes() != (old_release / 'package-lock.json').read_bytes():
            raise RuntimeError('Cambian dependencias; no se actualiza el runtime automáticamente')
        (release / 'node_modules').mkdir(exist_ok=True)
        # Public code only; never chmod private state or dependency directories.
        for path in [release, *release.rglob('*')]:
            if not path.is_symlink():
                mode = path.stat().st_mode
                path.chmod(mode | (0o555 if path.is_dir() or mode & 0o111 else 0o444))
        module = helper(release)
        updated = copy.deepcopy(old)
        for mount in updated['Mounts']:
            if mount['Destination'] == '/app':
                mount['Source'] = str(release)
        args = module.editor_args(updated)
        # Verify Python/FFmpeg/fonts/config using the same isolated runtime/mounts.
        doctor = ['docker', 'run', '--rm', '--network', 'none', '--read-only', '--cap-drop', 'ALL',
                  '--security-opt', 'no-new-privileges', '--user', '1000:1000', '--workdir', '/app',
                  '--memory', '1g', '--cpus', '0.5', '--pids-limit', '256', '--tmpfs', '/tmp:rw,nosuid,size=256m']
        for mount in updated['Mounts']:
            value = 'type=bind,src=' + mount['Source'] + ',dst=' + mount['Destination']
            doctor += ['--mount', value + (',readonly' if not mount['RW'] else '')]
        run(*doctor, old['Image'], 'node', 'scripts/app/doctor.mjs', '--shell', '/state/project.json')
        health()
        stamp = time.strftime('%Y%m%d-%H%M%S')
        backup = ROOT / ('update-backup-' + stamp)
        backup.mkdir(mode=0o700)
        (backup / 'editor-inspect.json').write_text(json.dumps(old))
        (backup / 'previous-commit.txt').write_text(old_sha + '\n')
        previous = EDITOR + '-before-update-' + stamp
        renamed = False
        try:
            print('Preparación verificada. Actualizando editor...', flush=True)
            run('docker', 'stop', '--time', '45', EDITOR)
            state_sha = backup_state(backup)
            print('Copia privada verificada SHA256: ' + state_sha, flush=True)
            run('docker', 'rename', EDITOR, previous)
            renamed = True
            (backup / 'editor-container.txt').write_text(previous + '\n')
            run(*args)
            run('docker', 'start', EDITOR)
            for _ in range(20):
                try:
                    health()
                    if module.status('http://127.0.0.1:3010/api/health', host=HOST) != '401':
                        raise RuntimeError('La API ha perdido autenticación')
                    if module.status('https://' + HOST + '/', resolve=HOST + ':443:127.0.0.1') != '200':
                        raise RuntimeError('Fallo de HTTPS')
                    break
                except Exception:
                    time.sleep(1)
            else:
                raise RuntimeError('La nueva versión no supera la comprobación de arranque')
            (ROOT / 'servicio-commit.txt').write_text(sha + '\n')
            (ROOT / 'servicio-release.txt').write_text(str(release) + '\n')
            (ROOT / 'estado-servicio.txt').write_text('ACTUALIZADO HTTPS: shell/API privada comprobados; recuperación de proyectos disponible; exportación real en VPS pendiente.\n')
            print('ACTUALIZACIÓN OK: ' + sha, flush=True)
            print('Recarga la web. Copia anterior conservada en ' + str(backup))
        except BaseException:
            print('Fallo: recuperando contenedor anterior...', flush=True)
            if renamed:
                run('docker', 'rm', '-f', EDITOR, check=False)
                run('docker', 'rename', previous, EDITOR)
            run('docker', 'start', EDITOR)
            raise


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise RuntimeError('Uso: python3 update_service.py COMMIT40')
        main(sys.argv[1])
    except Exception as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
