#!/usr/bin/env python3
"""Read-only production overview. Never prints tokens, private URLs or environment."""
import json
from pathlib import Path
import subprocess

ROOT=Path('/opt/sues-video-setup')
BASE=ROOT/'background-update'

def run(*args):
    try:
        result=subprocess.run(args, capture_output=True, text=True, timeout=12, check=False)
        return result.returncode, result.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return 1, ''

def main():
    print('SUES AI VIDEO EDITOR · estado operativo (solo lectura)')
    installed=ROOT/'servicio-commit.txt'
    if installed.is_file():
        value=installed.read_text().strip()
        print('Commit instalado:',value if len(value)==40 and all(c in '0123456789abcdef' for c in value) else 'desconocido')
    else:
        print('Commit instalado: desconocido')
    code,output=run('docker','inspect','--format','{{.State.Running}}', 'sues-video-editor')
    print('Contenedor:', 'activo' if code==0 and output=='true' else 'no confirmado')
    code,output=run('curl','--silent','--output','/dev/null','--write-out','%{http_code}','--max-time','8','https://editor.suesholistics.com/')
    print('HTTPS:',output if code==0 and output.isdigit() else 'sin confirmar')
    latest=BASE/'latest.json'
    if not latest.is_file():
        print('Actualización: sin registro')
        return
    try:
        obj=json.loads(latest.read_text())
        unit=obj['unit']
        directory=Path(obj['directory']).resolve()
        if directory.parent!=BASE.resolve() or not unit.startswith('sues-editor-update-'):
            raise ValueError('metadata unexpected')
        print('Última operación:',obj.get('mode','?'))
        print('Commit objetivo:',obj.get('commit','?'))
        code,output=run('systemctl','show',unit,'--property=ActiveState,Result,ExecMainStatus','--no-pager')
        if code==0:
            for line in output.splitlines():
                print(line)
        result=directory/'result.json'
        if result.is_file():
            status=json.loads(result.read_text())
            print('Resultado:',status.get('state','?'),'· exitCode:',status.get('exitCode','?'))
        else:
            print('Resultado: pendiente')
    except (ValueError,OSError,KeyError,json.JSONDecodeError):
        print('Actualización: metadatos inválidos')

if __name__=='__main__':
    main()
