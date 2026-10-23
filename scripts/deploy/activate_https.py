#!/usr/bin/env python3
"""One-host HTTPS migration for the inspected SUES deployment. No installs/pulls."""
import copy
import fcntl
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.request

ROOT = Path('/opt/sues-video-setup')
COMPOSE = Path('/opt/sues-whatsapp/compose.yml')
EDITOR = 'sues-video-editor'
CADDY = 'sues-whatsapp-caddy-1'
HOST = 'editor.suesholistics.com'
ORIGIN = 'https://' + HOST
CONFIG = ('wa.suesholistics.com {\n    reverse_proxy 127.0.0.1:3001\n}\n\n'
          'editor.suesholistics.com {\n    reverse_proxy 127.0.0.1:3010\n}\n')


def run(*args, check=True, timeout=60):
    p = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if check and p.returncode:
        # Do not emit command arguments, environment, inspect output or logs.
        raise RuntimeError('Falló: ' + ' '.join(args[:2]) + ' (código ' + str(p.returncode) + ')')
    return p


def inspect(name):
    return json.loads(run('docker', 'inspect', name).stdout)[0]


def compose(path=COMPOSE, *args):
    return run('docker', 'compose', '--project-name', 'sues-whatsapp',
               '--project-directory', str(COMPOSE.parent), '-f', str(path), *args)


def status(url, host=None, resolve=None):
    args = ['curl', '--noproxy', '*', '--silent', '--output', '/dev/null',
            '--write-out', '%{http_code}', '--max-time', '5']
    if host:
        args += ['--header', 'Host: ' + host]
    if resolve:
        args += ['--resolve', resolve]
    p = run(*args, url, check=False, timeout=8)
    return p.stdout.strip() if p.returncode == 0 else '000'


def replace_caddy(text, service):
    # Keep all other services, comments and environment references byte-for-byte.
    matches = list(re.finditer(r'^( +)caddy:\s*(?:#.*)?\n', text, re.M))
    if len(matches) != 1:
        raise RuntimeError('Bloque caddy no inequívoco; configuración intacta')
    m = matches[0]
    indent = m.group(1)
    following = re.search(r'^\S|^' + indent + r'\S', text[m.end():], re.M)
    end = m.end() + following.start() if following else len(text)
    return text[:m.start()] + indent + 'caddy: ' + json.dumps(service) + '\n' + text[end:]


def editor_args(old):
    c, h = old['Config'], old['HostConfig']
    expected = ['node', 'scripts/app/start.mjs', '/state/project.json', '/state/jobs', '3010']
    if c['Cmd'] != expected or h['NetworkMode'] != 'host' or c['User'] != '1000:1000':
        raise RuntimeError('Editor distinto al despliegue observado')
    if not h['ReadonlyRootfs'] or h.get('Privileged'):
        raise RuntimeError('Aislamiento inesperado del editor')
    mounts = old['Mounts']
    if {m['Destination'] for m in mounts} != {'/app', '/app/node_modules', '/state'}:
        raise RuntimeError('Montajes inesperados; no se modifica editor')
    memory = h.get('Memory') or 1024**3
    if memory not in (1024**3, 1280 * 1024**2):
        raise RuntimeError('Límite de memoria del editor no revisado')
    args = ['docker', 'create', '--name', EDITOR, '--restart', 'unless-stopped',
            '--network', 'host', '--read-only', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges', '--cpus', '0.5', '--memory', str(memory),
            '--pids-limit', '256', '--user', '1000:1000', '--workdir', '/app',
            '--tmpfs', '/tmp:rw,nosuid,size=256m', '--log-opt', 'max-size=5m',
            '--log-opt', 'max-file=2', '--stop-timeout', '45']
    for m in mounts:
        if m['Type'] != 'bind' or ',' in m['Source'] or not m['Source'].startswith(str(ROOT) + '/'):
            raise RuntimeError('Origen de montaje inesperado')
        if m['RW'] != (m['Destination'] == '/state'):
            raise RuntimeError('Permisos de montaje inesperados')
        value = 'type=bind,src=' + m['Source'] + ',dst=' + m['Destination']
        args += ['--mount', value + (',readonly' if not m['RW'] else '')]
    for env in c['Env']:
        if not env.startswith('SUES_PUBLIC_ORIGIN='):
            args += ['--env', env]
    args += ['--env', 'SUES_PUBLIC_ORIGIN=' + ORIGIN, old['Image'], *expected]
    return args


def migrate():
    if os.geteuid() != 0:
        raise RuntimeError('Ejecutar como root en el VPS observado')
    os.umask(0o077)
    if not ROOT.is_dir() or ROOT.is_symlink() or COMPOSE.is_symlink():
        raise RuntimeError('Rutas de despliegue inesperadas')
    old = inspect(EDITOR)
    caddy = inspect(CADDY)
    if not old['State']['Running'] or not caddy['State']['Running']:
        raise RuntimeError('Los servicios deben estar arrancados antes de migrar')
    if status('http://127.0.0.1:3001/') != '401':
        raise RuntimeError('WhatsApp interno ya no devuelve 401; sin cambios')
    token = (ROOT / 'editor/access/token').read_text().strip()
    if not re.fullmatch('[a-f0-9]{64}', token):
        raise RuntimeError('Token local inválido')
    request = urllib.request.Request('http://127.0.0.1:3010/api/health',
        headers={'Cookie': 'sues_session=' + token})
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request, timeout=5) as response:
        queue = json.load(response)['queue']
    if any(queue[key] for key in ('rendering', 'waiting', 'saving')):
        raise RuntimeError('Hay trabajos activos: esperar a que terminen; sin cambios')
    original = COMPOSE.read_text()
    before = json.loads(compose(COMPOSE, 'config', '--format', 'json').stdout)
    service = copy.deepcopy(before['services']['caddy'])
    expected = ['caddy', 'reverse-proxy', '--from', 'wa.suesholistics.com',
                '--to', 'whatsapp-connector:3001']
    if service.get('command') != expected or caddy['Args'] != expected[1:]:
        raise RuntimeError('Caddy ya cambió o la migración ya fue aplicada; sin cambios')
    labels = caddy['Config'].get('Labels') or {}
    if labels.get('com.docker.compose.project') != 'sues-whatsapp':
        raise RuntimeError('Proyecto Caddy inesperado')
    args = editor_args(old)
    stamp = time.strftime('%Y%m%d-%H%M%S')
    backup = ROOT / ('https-backup-' + stamp)
    backup.mkdir(mode=0o700)
    (backup / 'compose.yml').write_text(original)
    (backup / 'editor-inspect.json').write_text(json.dumps(old))
    (backup / 'caddy-inspect.json').write_text(json.dumps(caddy))
    proxy = ROOT / 'proxy'
    proxy.mkdir(mode=0o700, exist_ok=True)
    config = proxy / 'Caddyfile'
    if config.is_symlink():
        raise RuntimeError('Caddyfile no debe ser un enlace')
    config.write_text(CONFIG)
    run('docker', 'cp', str(config), CADDY + ':/tmp/sues-https-check.Caddyfile')
    run('docker', 'exec', CADDY, 'caddy', 'validate', '--config',
        '/tmp/sues-https-check.Caddyfile', '--adapter', 'caddyfile')
    service.pop('ports', None)
    service.pop('networks', None)
    service['network_mode'] = 'host'
    service['command'] = ['caddy', 'run', '--config', '/etc/caddy/sues-video.Caddyfile',
                          '--adapter', 'caddyfile']
    service.setdefault('volumes', []).append({'type': 'bind', 'source': str(config),
        'target': '/etc/caddy/sues-video.Caddyfile', 'read_only': True})
    candidate = COMPOSE.parent / ('.sues-https-' + stamp + '.yml')
    candidate.write_text(replace_caddy(original, service))
    after = json.loads(compose(candidate, 'config', '--format', 'json').stdout)
    left, right = copy.deepcopy(before), copy.deepcopy(after)
    left['services'].pop('caddy'); right['services'].pop('caddy')
    if left != right or after['services']['caddy'].get('network_mode') != 'host':
        raise RuntimeError('La propuesta altera otros servicios; no se aplica')
    saved_editor = EDITOR + '-before-https-' + stamp
    renamed = False
    compose_changed = False
    try:
        print('Configuración validada. Adaptando editor; copia: ' + str(backup), flush=True)
        run('docker', 'stop', '--time', '45', EDITOR, timeout=55)
        run('docker', 'rename', EDITOR, saved_editor)
        renamed = True
        (backup / 'editor-container.txt').write_text(saved_editor + '\n')
        run(*args)
        run('docker', 'start', EDITOR)
        for _ in range(20):
            if status('http://127.0.0.1:3010/', host=HOST) == '200':
                break
            time.sleep(1)
        else:
            raise RuntimeError('No arranca editor con origen HTTPS')
        if status('http://127.0.0.1:3010/api/health', host=HOST) != '401':
            raise RuntimeError('La API no conserva la protección de sesión')
        if COMPOSE.read_text() != original:
            raise RuntimeError('Compose cambió durante la preparación')
        compose_changed = True
        os.replace(candidate, COMPOSE)
        print('Activando Caddy; comprobando certificados y rutas...', flush=True)
        compose(COMPOSE, 'up', '-d', '--no-deps', '--pull', 'never', 'caddy')
        wa_resolve = 'wa.suesholistics.com:443:127.0.0.1'
        ed_resolve = HOST + ':443:127.0.0.1'
        # --resolve keeps certificate validation and SNI; never use --insecure.
        for attempt in range(30):
            wa = status('https://wa.suesholistics.com/', resolve=wa_resolve)
            ed = status(ORIGIN + '/', resolve=ed_resolve)
            if wa == '401' and ed == '200':
                break
            if attempt % 5 == 0:
                print('Esperando HTTPS: WhatsApp=' + wa + ', editor=' + ed, flush=True)
            time.sleep(2)
        else:
            raise RuntimeError('No se verifican ambos dominios con TLS válido')
        if status(ORIGIN + '/api/health', resolve=ed_resolve) != '401':
            raise RuntimeError('La API pública no conserva autenticación')
        (ROOT / 'estado-servicio.txt').write_text(
            'HTTPS VERIFICADO EN VPS: editor shell 200/API sin sesión 401; '
            'WhatsApp 401 conservado. Preview/exportación y QA navegador pendientes.\n')
        (ROOT / 'https-backup-current.txt').write_text(str(backup) + '\n')
        print('HTTPS OK: editor 200; API privada 401; WhatsApp 401.', flush=True)
        print('Enlace privado actualizado en /opt/sues-video-setup/editor/access/url.txt')
        print('No se ha probado todavía subida/render/exportación en el VPS.')
    except BaseException:
        print('Fallo durante activación: restaurando configuración previa...', flush=True)
        try:
            if compose_changed:
                restore = COMPOSE.parent / '.sues-compose-restore.yml'
                restore.write_text(original)
                os.replace(restore, COMPOSE)
                compose(COMPOSE, 'up', '-d', '--no-deps', '--pull', 'never', 'caddy')
        finally:
            if renamed:
                # Only remove the new container; persistent bind mounts are retained.
                run('docker', 'rm', '-f', EDITOR, check=False)
                run('docker', 'rename', saved_editor, EDITOR)
            run('docker', 'start', EDITOR)
        print('Configuración anterior restaurada; copia conservada en ' + str(backup), flush=True)
        raise


def main():
    if not ROOT.is_dir() or ROOT.is_symlink():
        raise RuntimeError('Directorio de instalación inesperado')
    with (ROOT / 'https-activation.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        migrate()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
