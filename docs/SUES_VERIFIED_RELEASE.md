# Release verificada · 19/10/2026

Versión de código para instalar: `7cbccb9bcd8c394106e22027ebfe284782e8989a`.
Árbol: `95561a9f5ee103c1c9a5d4e80369cf77d2e4807f`.
PR3 y PR4 fusionados en `feat/phase-4-vision-camera`.

209 pruebas Node, comprobación de sintaxis y 10 simulaciones de despliegue.
Chromium 145: 24 combinaciones de dispositivo/estilo/estructura; guardado,
recarga, deshacer, duplicar y bloqueo de controles al completar. Copia descargada
y recuperada desde la interfaz; exportación real de 38,31 segundos con original
intacto, decodificación completa y Range206. Sin dependencias nuevas de producción.
Evidencia: `examples/preview/browser-integration.real-result.json`.

La aprobación visual de Carlos corresponde a la muestra de profundidad de 12s;
las etiquetas de esta QA son técnicas. Segmentación corporal automática, Director
semántico, catálogo completo y V1 siguen pendientes. No se ha desplegado en VPS.

## Ejecutar en la terminal del VPS existente

El siguiente comando descarga exclusivamente el actualizador del commit fijado,
comprueba su SHA256 y lo ejecuta. Requiere la instalación existente y root.
No muestra tokens ni descarga medios privados. Ante trabajos activos o cambios
de dependencias, el actualizador se detiene. Conserva el contenedor anterior y
recupera su arranque si falla la nueva instancia. No administra WhatsApp/Caddy/DNS.

```sh
python3 - <<'PY'
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

release = '7cbccb9bcd8c394106e22027ebfe284782e8989a'
expected = '9038817182a7ada24c4c26c218154341f05ff20587d758775579eb014161a99e'
if os.geteuid() != 0:
    raise SystemExit('Ejecuta este comando como root en el VPS existente.')
url = 'https://raw.githubusercontent.com/carlossuess-art/sues-ai-video-editor/' + release + '/scripts/deploy/update_service.py'
with urllib.request.urlopen(url, timeout=30) as response:
    code = response.read(1000000)
if hashlib.sha256(code).hexdigest() != expected:
    raise SystemExit('Checksum incorrecto. No se ejecuta la actualización.')
with tempfile.TemporaryDirectory(prefix='sues-update-') as folder:
    updater = Path(folder) / 'update_service.py'
    updater.write_bytes(code)
    subprocess.run(['python3', str(updater), release], check=True)
PY
```

Salida esperada: `ACTUALIZACIÓN OK: 7cbccb9bcd8c394106e22027ebfe284782e8989a`.
Después recargar la app móvil; comprobar sesión, trabajos previos y una exportación.
Esa comprobación remota todavía no se ha realizado. No interpretar una simulación
local como actualización del servidor. Desktop Commander no tiene dispositivos
conectados en esta sesión y no hay herramientas VPS/SSH disponibles.
