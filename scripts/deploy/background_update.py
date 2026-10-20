#!/usr/bin/env python3
"""Launch only the pinned editor updater under systemd; never hold a web terminal."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.request
import uuid

ROOT = Path('/opt/sues-video-setup')
BASE = ROOT / 'background-update'


def atomic_json(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def validate(commit, checksum):
    if not re.fullmatch('[0-9a-f]{40}', commit) or not re.fullmatch('[0-9a-f]{64}', checksum):
        raise RuntimeError('Commit o SHA256 inválido')


def worker(commit, checksum, directory, mode='diagnose'):
    """Exit status mirrors the real updater, including signals and download failure."""
    validate(commit, checksum)
    directory = Path(directory)
    code = 1
    result = {'commit': commit, 'mode': mode, 'state': 'RUNNING', 'started': time.time()}
    atomic_json(directory / 'result.json', result)
    try:
        with (BASE / 'worker.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            print('Descargando actualizador fijado a ' + commit, flush=True)
            url = f'https://raw.githubusercontent.com/carlossuess-art/sues-ai-video-editor/{commit}/scripts/deploy/update_service.py'
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read(1024 * 1024 + 1)
            if len(data) > 1024 * 1024 or hashlib.sha256(data).hexdigest() != checksum:
                raise RuntimeError('Checksum del actualizador incorrecto; editor intacto')
            updater = directory / 'update_service.py'
            updater.write_bytes(data)
            print('Checksum comprobado. Modo: ' + mode, flush=True)
            args = [sys.executable, '-u', str(updater)]
            if mode == 'diagnose':
                args.append('--diagnose')
            code = subprocess.run([*args, commit], check=False).returncode
            if code < 0:
                code = 128 - code
    except BlockingIOError:
        code = 75
        print('Otro despliegue está en curso; sin cambios.', flush=True)
    except Exception as error:
        code = 1
        # URL/library exceptions can contain network configuration; do not print credentials.
        print('ERROR: ' + (str(error) if isinstance(error, RuntimeError) else type(error).__name__), flush=True)
    finally:
        result.update(state='SUCCESS' if code == 0 else 'ERROR', exitCode=code, finished=time.time())
        atomic_json(directory / 'result.json', result)
        print('FINAL ' + result['state'] + ' · código real ' + str(code), flush=True)
    return code


def launch(commit, checksum, mode='diagnose'):
    validate(commit, checksum)
    if os.geteuid() != 0 or ROOT.is_symlink() or not ROOT.is_dir():
        raise RuntimeError('Se requiere root y la instalación existente')
    if not Path('/run/systemd/system').is_dir():
        raise RuntimeError('systemd no está disponible; no se inicia actualización')
    for name in ('systemd-run', 'systemctl', 'python3', 'git', 'docker', 'curl'):
        if not shutil.which(name):
            raise RuntimeError('Dependencia ausente: ' + name)
    if BASE.is_symlink():
        raise RuntimeError('Directorio de registros inesperado')
    BASE.mkdir(mode=0o700, exist_ok=True)
    with (BASE / 'launch.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        latest = BASE / 'latest.json'
        if latest.exists():
            previous = json.loads(latest.read_text())
            state = subprocess.run(['systemctl', 'show', previous['unit'], '--property=ActiveState', '--value'], capture_output=True, text=True, check=False)
            if state.stdout.strip() in ('active', 'activating', 'deactivating', 'reloading'):
                print('Ya hay una operación en segundo plano: ' + previous['unit'])
                return
            result = Path(previous['directory']) / 'result.json'
            if previous['commit'] == commit and previous.get('mode') == mode and result.exists() and json.loads(result.read_text()).get('state') == 'SUCCESS':
                print('Esta operación ya terminó correctamente. Consulta el resultado.')
                return
        identity = time.strftime('%Y%m%d-%H%M%S') + '-' + uuid.uuid4().hex[:8]
        directory = BASE / identity
        directory.mkdir(mode=0o700)
        runner = directory / 'background_update.py'
        shutil.copyfile(Path(__file__).resolve(), runner)
        unit = 'sues-editor-update-' + identity
        record = {'unit': unit, 'directory': str(directory), 'commit': commit, 'mode': mode}
        atomic_json(latest, record)
        (BASE / 'unit.txt').write_text(unit + '\n')
        # Both paths are generated locally, without user-controlled shell expansion.
        args = ['systemd-run', '--unit=' + unit, '--service-type=exec',
                '--property=UMask=0077', '--property=Restart=no',
                '--property=StandardOutput=append:' + str(directory / 'run.log'),
                '--property=StandardError=append:' + str(directory / 'run.log'),
                sys.executable, '-u', str(runner), '--worker', '--' + mode, commit, checksum, str(directory)]
        completed = subprocess.run(args, capture_output=True, text=True, check=False)
        if completed.returncode:
            atomic_json(directory / 'result.json', {'commit': commit, 'state': 'ERROR', 'exitCode': completed.returncode, 'stage': 'systemd-launch'})
            raise RuntimeError('systemd rechazó el lanzamiento; editor intacto. Código ' + str(completed.returncode))
        print('EN SEGUNDO PLANO: ' + unit + '\nPuedes cerrar la terminal. Registros: ' + str(directory))


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--worker', action='store_true')
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--diagnose', action='store_true')
    action.add_argument('--deploy', action='store_true')
    parser.add_argument('commit')
    parser.add_argument('checksum')
    parser.add_argument('directory', nargs='?')
    args = parser.parse_args()
    if args.worker:
        if not args.directory:
            parser.error('directory required')
        return worker(args.commit, args.checksum, args.directory, 'diagnose' if args.diagnose else 'deploy')
    launch(args.commit, args.checksum, 'diagnose' if args.diagnose else 'deploy')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
