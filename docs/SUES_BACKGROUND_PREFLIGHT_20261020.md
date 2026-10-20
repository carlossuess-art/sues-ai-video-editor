# Desbloqueo y diagnóstico en segundo plano · 20/10/2026

Código integrado en oficial: `71399e1c9ac6a7da1b586c50b8dae5d93651050b`.
Árbol comprobado: `29523d4dba89ac4fc113b0fabe1c61ceaebb79a8`.
Base anterior: `70d20c3c2c99ae6af7d9aaf165f4c47230ccd73e`.
No acredita un despliegue ni modifica otras aplicaciones.

## Ramas y decisión de integración

| Rama | Head observado | Resultado |
| --- | --- | --- |
| feat/phase-4-vision-camera | 70d20c3 → 71399e1 | F6 y procedimiento systemd integrados |
| feat/f6-motion-capability-audit-20261020 | 0ea33b82 | Incluida por ascendencia de renderer-text |
| feat/f6-motion-preflight-clean-20261020 | b2689470 | Incluida por ascendencia de renderer-text |
| feat/f6-renderer-text-preflight-20261020 | 3aaf56b3 | Integrada tras suite completa |
| feat/f6-motion-timeline-guard-20261020 | 3aaf56b3 | Mismo commit; no hay guard adicional de timeline |
| feat/reference-editor-ui-20261019 | babc6a54 | Frontend previo integrado en 1178; tres commits posteriores pendientes de Chromium |
| feat/f6-motion-preflight-verified-20261020 | e0ceb6a5 | Rama lateral: no sustituir validación de texto por versión anterior |
| feat/f6-motion-eligibility-diagnostics-20261020 | f55d3947 | Constante aislada, sin uso; no integrar código sin consumidor |

El catálogo real conserva seis IDs renderizables y dos sólo contrato. El preflight
es diagnóstico visual: no programa eventos, no verifica colocación/timeline y no
conecta el audio del catálogo. No sustituye la validación final del renderer.

## Validación efectivamente ejecutada

Checkout completo, `npm ci --ignore-scripts --no-audit --no-fund`, 223 pruebas
Node y `npm run check` PASS. Incluye 12 pruebas nuevas de capacidades/preflight,
con catálogo y módulos reales. Auditoría CLI PASS: 6 implementados / 2 contrato.
20 pruebas Python PASS, compilación Python y `git diff --check` PASS.
Repetidas las suites sobre el commit remoto integrado. Docker, systemd y red VPS
son dobles en esas pruebas: NO son backup, rollback ni servicio remoto reales.

FFmpeg real 6.1.1: MP4 local sintético de24s,1080×1920/30,H264/AAC,26captions,
decodificación completa PASS y original conservado. Fuente y tiempos escritos
de QA, sin voz transcrita ni inferencia. SHA fuente:
`40f7dc9ef755a2ca32def5daa921ef7731cd42cf8f043b397fc59c26cca83853`.
SHA MP4: `ad209ff488665e98629eaaefebc05f11e929eff5a7279ced95f49a5e3499cfd3`.
No es aceptación audiovisual ni F9/V1.

Chromium145 descargado y ejecutado: falla antes de abrir página por
`process_singleton_posix.cc: socket() failed: Operation not permitted`.
Intentos de matriz y player NO aprobados. Descarga Playwright151 incompleta;
la alternativa oficial145 funciona como binario pero no arranca bajo esta
restricción. No se cambiaron permisos del entorno. Las pruebas históricas de
Chromium no se presentan como repetidas hoy. Cambios tardíos de teclado quedan
en su rama; `web/app.js` de oficial no se modifica en esta integración.

## GitHub

Conector lee y escribe: actualización CAS de ref, creación de árbol/commit y
actualización de oficial correctas; no hizo falta reconexión. Git directo clona
y descarga, pero `push --dry-run` falla por ausencia de credenciales:
`could not read Username ... No such device or address`. No se modificaron
permisos, protección de ramas ni secretos. El antiguo error de escritura del
conector no se reproduce; no hay evidencia actual de autorización caducada.

## Procedimiento

Lanzador: `scripts/deploy/background_update.py` SHA256
`40b821de37f4771b89bf3d14565b7d33136a82f7ba217455a90d0e36e4b5d6a3`.
Actualizador: `scripts/deploy/update_service.py` SHA256
`8377398ecd02b654517a475ebed185454f5d4461a204e6375cdd7b04b675720f`.
Ambos descargados nuevamente desde el commit publicado; hashes coinciden.

La entrega a Carlos usa **--diagnose**. Prepara código público temporal, comprueba
versión instalada, cola, montajes, aislamiento, lock de dependencias, doctor
con imagen existente, HTTPS y espacio para backup. No para/renombra/reemplaza
el editor y no crea aún backup. SUCCESS significa diagnóstico correcto,
NO versión instalada. Si está ocupado o la instalación difiere, finaliza con error.

El lanzador crea un servicio transitorio systemd, no una sesión dependiente de
SSH. Copia privada del runner, logs completos del proceso y result.json por
ejecución. Locks de lanzamiento/worker/actualizador; operaciones activas no se
duplican. Checksum antes de ejecutar. Código de salida del updater propagado;
señales convertidas a128+señal. systemctl conserva la evidencia de salida/señal
si no llega a escribirse result.json. El lanzador no instala systemd ni utiliza
nohup. Si systemd no está disponible o rechaza la unidad, no modifica el editor.
Se puede cerrar la terminal cuando aparezca EN SEGUNDO PLANO. Un reinicio del
VPS interrumpe una unidad transitoria; no hay reintentos automáticos de instalación.

El modo --deploy existe, pero NO se entrega como acción aprobada por este
diagnóstico. Antes requiere evaluar resultado VPS y resolver QA pendiente.
El updater existente verifica TAR por archivo+manifiesto+SHA antes de sustituir
contenedor; mantiene imagen/dependencias/montajes y rollback automático ante
fallo. Ahora preserva también el contenedor fallido en vez de borrarlo.
Comprueba recuperación de salud/HTTPS; fallo de rollback queda como ERROR.

Rollback posterior: con cola inactiva, conservar y detener editor nuevo;
renombrarlo a nombre único, restaurar el nombre del contenedor indicado por
editor-container.txt del backup y arrancarlo; comprobar salud/HTTPS y recuperar
marcadores desde previous-commit.txt e inspect privado. No restaurar TAR en
caliente. Procedimiento detallado previo: SUES_WORK_VALIDATION_20261019.md.
Backup/rollback remotos NO ejecutados.

VPS: fd168 reportado por Carlos; 1178 intentado sin log verificado. Versión
actual desconocida. GET público devuelve200; HEAD devuelve404 (no confundirlo
con caída del servicio). Sin acceso administrativo VPS ni sesión privada local.
Siguiente: Carlos ejecuta diagnóstico y consulta registros; revisar resultado
antes de instalar. Sin costes externos ni cambios WhatsApp/WAC/Caddy/DNS.
FASE6/10 abierta; porcentajes no recalculados. No herramienta para enviar a
otro chat: informe entregado en Work.

## Comando A · diagnóstico en segundo plano

```bash
bash -c '
set -euo pipefail
umask 077
test -d /opt/sues-video-setup && test ! -L /opt/sues-video-setup
d=$(mktemp -d /opt/sues-video-setup/background-bootstrap.XXXXXX)
curl --fail --silent --show-error --location --retry 2 --connect-timeout 15 --max-time 60 --proto "=https" --proto-redir "=https" https://raw.githubusercontent.com/carlossuess-art/sues-ai-video-editor/71399e1c9ac6a7da1b586c50b8dae5d93651050b/scripts/deploy/background_update.py -o "$d/runner.py"
printf "%s  %s\n" 40b821de37f4771b89bf3d14565b7d33136a82f7ba217455a90d0e36e4b5d6a3 "$d/runner.py" | sha256sum --check -
python3 "$d/runner.py" --diagnose 71399e1c9ac6a7da1b586c50b8dae5d93651050b 8377398ecd02b654517a475ebed185454f5d4461a204e6375cdd7b04b675720f
'
```

## Comando B · consulta independiente

```bash
python3 - <<'PY'
import json, subprocess
from pathlib import Path
base = Path('/opt/sues-video-setup/background-update')
if not (base / 'latest.json').exists():
    raise SystemExit('Todavía no hay una operación registrada.')
run = json.loads((base / 'latest.json').read_text())
folder = Path(run['directory'])
print('Modo:', run['mode'], '| Commit:', run['commit'], flush=True)
subprocess.run(['systemctl', 'show', run['unit'], '--property=ActiveState,SubState,Result,ExecMainCode,ExecMainStatus'], check=False)
if (folder / 'result.json').exists():
    result = json.loads((folder / 'result.json').read_text())
    print('Estado:', result['state'], '| Código real:', result.get('exitCode', 'pendiente'), flush=True)
    if result['state'] == 'SUCCESS' and run['mode'] == 'diagnose':
        print('DIAGNÓSTICO CORRECTO. NO se ha instalado una versión nueva.', flush=True)
else:
    print('Resultado final aún no escrito; comprobar estado systemd.', flush=True)
if (folder / 'run.log').exists():
    subprocess.run(['tail', '-n', '60', str(folder / 'run.log')], check=False)
print('Registro completo:', folder / 'run.log', flush=True)
PY
```
