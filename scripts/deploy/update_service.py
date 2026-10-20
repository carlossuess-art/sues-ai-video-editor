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
import uuid
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
    # Only public build/preflight output is logged. Docker inspect/env remain private.
    if args[0] == 'git' or args[:2] == ('docker', 'run'):
        for output in (result.stdout, result.stderr):
            if output:
                print(output, end='' if output.endswith('\n') else '\n', flush=True)
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
    return state


def setup_candidate(path):
    path = Path(path)
    expected = ROOT / 'login-credentials'
    if path.parent != expected or expected.is_symlink() or path.is_symlink():
        raise RuntimeError('Ruta de credencial preparada inesperada')
    info = path.stat()
    if info.st_uid != 0 or info.st_mode & 0o077 or not path.is_file():
        raise RuntimeError('Permisos de credencial preparada inseguros')
    value = path.read_bytes()
    record = json.loads(value)
    if record.get('version') != 1 or not re.fullmatch('[a-f0-9]{64}', record.get('tokenSha256', '')) or not isinstance(record.get('expiresAt'), int) or not time.time() < record['expiresAt'] <= time.time() + 3600:
        raise RuntimeError('Enlace de configuración inválido o caducado')
    return value


def install_credential(value, name):
    access = ROOT / 'editor/access'
    if access.is_symlink() or not access.is_dir():
        raise RuntimeError('Directorio de acceso inesperado')
    target = access / name
    if target.is_symlink():
        raise RuntimeError('Archivo de acceso inesperado')
    temporary = access / ('setup-install-' + uuid.uuid4().hex)
    with temporary.open('xb') as stream:
        stream.write(value)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.chmod(0o600)
    os.chown(temporary, 1000, 1000)
    temporary.replace(target)


def helper(release):
    path = release / 'scripts/deploy/activate_https.py'
    spec = importlib.util.spec_from_file_location('sues_verified_deploy', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def main(sha, diagnostic=False, setup_record=None):
    os.umask(0o077)
    if os.geteuid() != 0 or not re.fullmatch('[a-f0-9]{40}', sha):
        raise RuntimeError('Se requiere root y un commit de 40 caracteres')
    if not ROOT.is_dir() or ROOT.is_symlink():
        raise RuntimeError('Directorio de instalación inesperado')
    with (ROOT / 'service.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        prepared_setup = setup_candidate(setup_record) if setup_record else None
        setup_target = ROOT / 'editor/access/admin-setup.json'
        if setup_target.is_symlink():
            raise RuntimeError('Archivo de contraseña inesperado')
        previous_setup = setup_target.read_bytes() if setup_target.exists() else None
        password_target = ROOT / 'editor/access/admin-password-hash'
        if password_target.is_symlink():
            raise RuntimeError('Archivo de contraseña inesperado')
        previous_password = password_target.read_bytes() if password_target.exists() else None
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
        print('Versión instalada: ' + old_sha + '\nVersión aprobada: ' + sha, flush=True)
        if old_sha == sha and not diagnostic and prepared_setup is None:
            health()
            if helper(old_release).status('https://' + HOST + '/', resolve=HOST + ':443:127.0.0.1') != '200':
                raise RuntimeError('HTTPS no disponible')
            print('El editor ya usa esta versión; sin reinicio.')
            return
        health()
        print('Cola inactiva. Descargando exclusivamente el commit aprobado.', flush=True)
        release = Path(tempfile.mkdtemp(prefix='release-update.', dir=ROOT))
        run('git', 'init', str(release))
        run('git', '-C', str(release), 'fetch', '--depth', '1', REPO, sha, timeout=180)
        run('git', '-C', str(release), 'checkout', '--detach', 'FETCH_HEAD')
        if run('git', '-C', str(release), 'rev-parse', 'HEAD').stdout.strip() != sha:
            raise RuntimeError('El commit descargado no coincide')
        if (release / 'package-lock.json').read_bytes() != (old_release / 'package-lock.json').read_bytes():
            raise RuntimeError('Cambian dependencias; no se actualiza el runtime automáticamente')
        print('Dependencias sin cambios; comprobando runtime existente.', flush=True)
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
        if diagnostic:
            state = ROOT / 'editor'
            entries = [state, *state.rglob('*')]
            if any(p.is_symlink() or not (p.is_file() or p.is_dir()) for p in entries):
                raise RuntimeError('Estado con enlaces o archivos especiales; backup requiere revisión')
            total = sum(p.stat().st_size for p in entries if p.is_file())
            free = shutil.disk_usage(ROOT).free
            if free < total * 1.1 + 16 * 1024 * 1024:
                raise RuntimeError('Espacio insuficiente para copia verificada')
            print('Backup previo: ' + str(total) + ' bytes de estado; ' + str(free) + ' bytes libres. Copia aún NO creada.', flush=True)
            if module.status('https://' + HOST + '/', resolve=HOST + ':443:127.0.0.1') != '200':
                raise RuntimeError('HTTPS no disponible')
            print('DIAGNÓSTICO OK: commit/dependencias/runtime/cola/HTTPS comprobados. NO instalado.', flush=True)
            return
        stamp = time.strftime('%Y%m%d-%H%M%S') + '-' + str(os.getpid())
        backup = ROOT / ('update-backup-' + stamp)
        backup.mkdir(mode=0o700)
        (backup / 'editor-inspect.json').write_text(json.dumps(old))
        (backup / 'previous-commit.txt').write_text(old_sha + '\n')
        previous = EDITOR + '-before-update-' + stamp
        renamed = False
        setup_changed = False
        try:
            print('Preparación verificada. Actualizando editor...', flush=True)
            run('docker', 'stop', '--time', '45', EDITOR)
            state_sha = backup_state(backup)
            print('Copia privada verificada SHA256: ' + state_sha, flush=True)
            if prepared_setup is not None:
                install_credential(prepared_setup, 'admin-setup.json')
                setup_changed = True
                print('Configuración de un solo uso instalada; no contiene contraseña.', flush=True)
            run('docker', 'rename', EDITOR, previous)
            renamed = True
            (backup / 'editor-container.txt').write_text(previous + '\n')
            run(*args)
            run('docker', 'start', EDITOR)
            for _ in range(20):
                try:
                    ready = health()
                    if prepared_setup is not None and not (ready.get('passwordSetupConfigured') or ready.get('passwordLoginConfigured')):
                        raise RuntimeError('La configuración privada del login no está disponible')
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
            if setup_changed:
                if previous_setup is None:
                    if setup_target.exists():
                        setup_target.rename(backup / 'new-setup.failed')
                else:
                    install_credential(previous_setup, 'admin-setup.json')
                if password_target.exists() and password_target.read_bytes() != previous_password:
                    password_target.rename(backup / 'new-password.failed')
                if previous_password is not None:
                    install_credential(previous_password, 'admin-password-hash')
            if renamed:
                # Preserve a failed container for diagnosis; never delete its data.
                exists = run('docker', 'inspect', EDITOR, check=False)
                if exists.returncode == 0:
                    run('docker', 'stop', '--time', '45', EDITOR, check=False)
                    run('docker', 'rename', EDITOR, EDITOR + '-failed-update-' + stamp)
                run('docker', 'rename', previous, EDITOR)
            run('docker', 'start', EDITOR)
            for _ in range(20):
                try:
                    health()
                    if module.status('https://' + HOST + '/', resolve=HOST + ':443:127.0.0.1') != '200':
                        raise RuntimeError('HTTPS no recuperado')
                    print('Contenedor anterior recuperado; salud y HTTPS comprobados.', flush=True)
                    break
                except Exception:
                    time.sleep(1)
            else:
                raise RuntimeError('ERROR DE RECUPERACIÓN: revisar contenedor anterior y backup privado')
            raise


if __name__ == '__main__':
    try:
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument('--diagnose', action='store_true')
        parser.add_argument('--setup-record')
        parser.add_argument('commit')
        args = parser.parse_args()
        main(args.commit, diagnostic=args.diagnose, setup_record=args.setup_record)
    except Exception as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
