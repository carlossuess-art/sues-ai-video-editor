#!/usr/bin/env python3
"""Prepare one-time HTTPS password setup and pinned detached editor deployment."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.request
import uuid

ROOT = Path('/opt/sues-video-setup')


def create_setup():
    token = os.urandom(32).hex()
    record = {'version': 1, 'tokenSha256': hashlib.sha256(token.encode()).hexdigest(), 'expiresAt': int(time.time()) + 1800}
    return token, record


def prepare(commit, launcher_sha, updater_sha):
    os.umask(0o077)
    if os.geteuid() != 0 or not ROOT.is_dir() or ROOT.is_symlink():
        raise RuntimeError('Ejecutar como root en la instalación existente.')
    if not re.fullmatch('[a-f0-9]{40}', commit) or any(not re.fullmatch('[a-f0-9]{64}', x) for x in (launcher_sha, updater_sha)):
        raise RuntimeError('Commit o checksum inválido')
    if not Path('/run/systemd/system').is_dir():
        raise RuntimeError('systemd no disponible; editor intacto')
    credentials = ROOT / 'login-credentials'
    if credentials.is_symlink():
        raise RuntimeError('Directorio de credenciales inesperado')
    credentials.mkdir(mode=0o700, exist_ok=True)
    credentials.chmod(0o700)
    # Download and verify before generating an enrollment secret. Never send this secret to GitHub.
    url = f'https://raw.githubusercontent.com/carlossuess-art/sues-ai-video-editor/{commit}/scripts/deploy/background_update.py'
    with urllib.request.urlopen(url, timeout=60) as response:
        data = response.read(1024 * 1024 + 1)
    if len(data) > 1024 * 1024 or hashlib.sha256(data).hexdigest() != launcher_sha:
        raise RuntimeError('Checksum del lanzador incorrecto; editor intacto')
    token, record = create_setup()
    pending = credentials / ('pending-' + uuid.uuid4().hex)
    with pending.open('x') as stream:
        json.dump(record, stream)
        stream.flush()
        os.fsync(stream.fileno())
    private_url = 'https://editor.suesholistics.com/#setup=' + token
    linkfile = pending.with_suffix('.url')
    linkfile.write_text(private_url + '\n')
    launcher = pending.with_suffix('.runner.py')
    launcher.write_bytes(data)
    spec = importlib.util.spec_from_file_location('sues_private_login_launch', launcher)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    started = module.launch(commit, updater_sha, mode='deploy', setup_record=str(pending))
    if started is not True:
        raise RuntimeError('Ya hay una operación activa; este nuevo enlace no se ha activado. Consulta el resultado antes de repetir.')
    # Foreground terminal only: this link is never written to systemd logs.
    print('Cuando el despliegue termine, abre este enlace privado (un uso, 30 minutos). No lo compartas:')
    print(private_url)
    print('Crea y confirma tu contraseña en la página HTTPS. Cada campo tiene botón de mostrar/ocultar.')
    print('Enlace guardado sólo para root en: ' + str(linkfile))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('commit')
    parser.add_argument('launcher_sha')
    parser.add_argument('updater_sha')
    args = parser.parse_args()
    try:
        prepare(args.commit, args.launcher_sha, args.updater_sha)
    except Exception as error:
        print('ERROR: ' + (str(error) if isinstance(error, RuntimeError) else type(error).__name__), file=sys.stderr)
        sys.exit(1)
