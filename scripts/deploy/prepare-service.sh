#!/usr/bin/env bash
# Run from a verified release checkout. No dependency installation or proxy changes.
set -Eeuo pipefail
umask 077
SUES_DIR=${1:-/opt/sues-video-setup}
SUES_RELEASE=$(cd "$(dirname "$0")/../.." && pwd -P)
test "$SUES_DIR" = /opt/sues-video-setup
test -d "$SUES_DIR" && test ! -L "$SUES_DIR"
exec 9>"$SUES_DIR/service.lock"
flock -n 9 || { echo 'Ya existe una preparación del servicio.'; exit 0; }
trap 'r=$?; if [ "$r" -ne 0 ]; then echo "ERROR ($r): revisar servicio.log; no se cambia WhatsApp/Caddy." >"$SUES_DIR/estado-servicio.txt"; fi' EXIT
echo 'COMPROBANDO FUENTE PREPARADA' >"$SUES_DIR/estado-servicio.txt"
SUES_SOURCE=$(cat "$SUES_DIR/fuente-directorio.txt")
SUES_SOURCE_SHA=$(cat "$SUES_DIR/fuente-commit.txt")
case "$SUES_SOURCE" in "$SUES_DIR"/fuente.*/source) ;; *) echo 'Ruta de fuente inesperada'; exit 1;; esac
test ! -L "$SUES_SOURCE"
test "$(git -c safe.directory="$SUES_SOURCE" -C "$SUES_SOURCE" rev-parse HEAD)" = "$SUES_SOURCE_SHA"
test -f "$SUES_SOURCE/node_modules/ajv/package.json"
cmp "$SUES_SOURCE/package-lock.json" "$SUES_RELEASE/package-lock.json"
docker image inspect sues-video-runtime:20261017 >/dev/null
# Do not replace or interrupt an existing container, even from this project.
if docker container inspect sues-video-editor >/dev/null 2>&1; then
 echo 'SERVICIO EXISTENTE: sin cambios; consultar estado Docker antes de actualizar.' >"$SUES_DIR/estado-servicio.txt"
 exit 0
fi
for sues_path in editor editor/media editor/media/fonts editor/jobs editor/access editor/project.json editor/access/token; do
 test ! -L "$SUES_DIR/$sues_path"
done
mkdir -p "$SUES_DIR/editor/media/fonts" "$SUES_DIR/editor/jobs" "$SUES_DIR/editor/access"
chown -R 1000:1000 "$SUES_DIR/editor"
chmod 700 "$SUES_DIR/editor" "$SUES_DIR/editor/media" "$SUES_DIR/editor/media/fonts" "$SUES_DIR/editor/jobs" "$SUES_DIR/editor/access"
# Default profile uses existing private assets, never public Drive download URLs.
python3 - "$SUES_SOURCE" "$SUES_RELEASE" "$SUES_DIR" <<'PY'
import json,pathlib,sys
old,release,setup=map(pathlib.Path,sys.argv[1:]); media=setup/'editor/media'
for name,legacy in [('original.mp4','runtime/poc/original.mp4'),('transcript.json','runtime/poc/transcript.json'),('camera.json','runtime/calma/camera.json')]:
    # Report presence only. No implicit copies/deletion of previous media.
    if not (media/name).is_file(): print('PENDIENTE:',name, '(posible copia previa presente)' if (old/legacy).is_file() else '')
config=setup/'editor/project.json'
if not config.exists():
    data=json.loads((release/'examples/projects/calma-local.example.json').read_text())
    for key in ('templatePath','brandKitPath','visionPath','catalogPath'):
        data[key]='/app/'+str((release/'examples/projects'/data[key]).resolve().relative_to(release))
    data.update(sourcePath='/state/media/original.mp4',transcriptPath='/state/media/transcript.json',cameraPath='/state/media/camera.json',fontDirectory='/app/assets/fonts/inter')
    config.write_text(json.dumps(data,indent=2)+'\n');config.chmod(0o600)
PY
chown 1000:1000 "$SUES_DIR/editor/project.json"
SUES_MISSING=0
for sues_file in original.mp4 transcript.json; do
 if [ ! -s "$SUES_DIR/editor/media/$sues_file" ] || [ -L "$SUES_DIR/editor/media/$sues_file" ]; then SUES_MISSING=1; fi
done
# Only application checkout/dependencies and private editor state enter the container.
SUES_DOCKER=(--read-only --cap-drop ALL --security-opt no-new-privileges --cpus 0.5 --memory 1g --pids-limit 256 --user 1000:1000 --tmpfs /tmp:rw,nosuid,size=256m --mount "type=bind,src=$SUES_RELEASE,dst=/app,readonly" --mount "type=bind,src=$SUES_SOURCE/node_modules,dst=/app/node_modules,readonly" --mount "type=bind,src=$SUES_DIR/editor,dst=/state" --workdir /app)
if [ ! -s "$SUES_DIR/editor/media/camera.json" ]; then
 docker run --rm --network none "${SUES_DOCKER[@]}" sues-video-runtime:20261017 node scripts/vision/build_reframe.mjs examples/vision/poc001.mediapipe.json /state/media/camera.json
fi
if [ "$SUES_MISSING" -eq 0 ]; then
 echo 'VALIDANDO CONFIGURACION Y MEDIOS' >"$SUES_DIR/estado-servicio.txt"
 docker run --rm --network none "${SUES_DOCKER[@]}" sues-video-runtime:20261017 node scripts/app/doctor.mjs /state/project.json >"$SUES_DIR/doctor-servicio.json"
else
 echo 'VALIDANDO SHELL, FUENTES Y HERRAMIENTAS: medios pendientes' >"$SUES_DIR/estado-servicio.txt"
 docker run --rm --network none "${SUES_DOCKER[@]}" sues-video-runtime:20261017 node scripts/app/doctor.mjs --shell /state/project.json >"$SUES_DIR/doctor-servicio.json"
fi
# Generate secret locally once; never send it to stdout or Docker's environment.
if [ ! -s "$SUES_DIR/editor/access/token" ]; then
 python3 - "$SUES_DIR/editor/access/token" <<'PY'
import secrets,os,sys
fd=os.open(sys.argv[1],os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as f:f.write(secrets.token_hex(32)+'\n')
PY
 chown 1000:1000 "$SUES_DIR/editor/access/token"
fi
# Check port immediately before create; application also rejects a bind conflict.
if test -n "$(ss -H -ltn 'sport = :3010')"; then
 echo 'Puerto 3010 ocupado; no se toca el servicio existente.'; exit 1
fi
docker run -d --name sues-video-editor --restart unless-stopped --network host \
 "${SUES_DOCKER[@]}" --log-opt max-size=5m --log-opt max-file=2 --stop-timeout 45 \
 --env SUES_TOKEN_FILE=/state/access/token --env SUES_ACCESS_FILE=/state/access/url.txt \
 sues-video-runtime:20261017 node scripts/app/start.mjs /state/project.json /state/jobs 3010 >/dev/null
for sues_attempt in {1..20}; do
 if curl --silent --fail --max-time 2 http://127.0.0.1:3010/ >/dev/null; then
  printf '%s\n' "$(git -C "$SUES_RELEASE" rev-parse HEAD)" >"$SUES_DIR/servicio-commit.txt"
  echo 'ARRANCADO LOOPBACK: subida disponible; material pendiente si no restaurado. HTTPS/preview/exportacion VPS pendientes. WhatsApp/Caddy sin cambios.' >"$SUES_DIR/estado-servicio.txt"
  exit 0
 fi
 sleep 1
done
exit 1
