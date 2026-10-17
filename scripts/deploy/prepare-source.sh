#!/usr/bin/env bash
# Fetch a pinned source snapshot using existing VPS credentials only.
set -Eeuo pipefail
umask 077
SUES_DIR=${1:-/opt/sues-video-setup}
SUES_SHA=eb441c712c9a6edd07c0d41b344adfdf0275c95d
test "${SUES_DIR:0:1}" = /
test ! -L "$SUES_DIR"
test -d "$SUES_DIR"
exec 9>"$SUES_DIR/source.lock"
if ! flock -n 9; then echo 'Ya hay una preparación de código en marcha.'; exit 0; fi
finish() {
  local result=$?
  if [ "$result" -eq 20 ]; then
    echo 'PENDIENTE: acceso GitHub no comprobado con las credenciales actuales. No enviar claves al chat.' >"$SUES_DIR/estado-codigo.txt"
  elif [ "$result" -ne 0 ]; then
    echo "ERROR ($result). Revisar codigo.log." >"$SUES_DIR/estado-codigo.txt"
  fi
}
trap finish EXIT
echo 'COMPROBANDO ACCESO AL REPOSITORIO PRIVADO' >"$SUES_DIR/estado-codigo.txt"
docker image inspect sues-video-runtime:20261017 >/dev/null
export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=5'
SUES_URL=''
for sues_url in https://github.com/carlossuess-art/sues-ai-video-editor.git git@github.com:carlossuess-art/sues-ai-video-editor.git; do
  if timeout 20 git -c credential.interactive=false ls-remote --exit-code "$sues_url" refs/heads/feat/phase-4-vision-camera >/dev/null 2>&1; then
    SUES_URL=$sues_url
    break
  fi
done
if [ -z "$SUES_URL" ]; then exit 20; fi
echo 'DESCARGANDO CODIGO' >"$SUES_DIR/estado-codigo.txt"
SUES_RUN=$(mktemp -d "$SUES_DIR/fuente.XXXXXX")
git init -q "$SUES_RUN/source"
git -C "$SUES_RUN/source" remote add origin "$SUES_URL"
timeout 180 git -C "$SUES_RUN/source" -c credential.interactive=false fetch --quiet --depth 1 origin "$SUES_SHA"
git -C "$SUES_RUN/source" -c advice.detachedHead=false checkout --quiet --detach "$SUES_SHA"
test "$(git -C "$SUES_RUN/source" rev-parse HEAD)" = "$SUES_SHA"
chown -R 1000:1000 "$SUES_RUN/source"
echo 'INSTALANDO PAQUETES Y COMPROBANDO CODIGO' >"$SUES_DIR/estado-codigo.txt"
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges \
  --cpus 0.5 --memory 1g --pids-limit 256 --user 1000:1000 \
  --tmpfs /tmp:rw,nosuid,size=256m \
  --mount "type=bind,src=$SUES_RUN/source,dst=/app" \
  --env npm_config_cache=/tmp/npm-cache sues-video-runtime:20261017 \
  bash -ec 'npm ci --ignore-scripts --no-audit --no-fund; npm run check; npm test -- --test-concurrency=1'
printf '%s\n' "$SUES_RUN/source" >"$SUES_DIR/fuente-directorio.txt"
printf '%s\n' "$SUES_SHA" >"$SUES_DIR/fuente-commit.txt"
echo 'CODIGO PREPARADO Y COMPROBADO; editor todavía no arrancado.' >"$SUES_DIR/estado-codigo.txt"
echo 'PREPARACION DE CODIGO TERMINADA'
