#!/usr/bin/env bash
# Background launcher; caller supplies an immutable commit reviewed in GitHub.
set -Eeuo pipefail
umask 077
SUES_SHA=${1:?Commit de release requerido}
[[ "$SUES_SHA" =~ ^[a-f0-9]{40}$ ]]
SUES_DIR=/opt/sues-video-setup
test -d "$SUES_DIR" && test ! -L "$SUES_DIR"
exec 8>"$SUES_DIR/service-bootstrap.lock"
flock -n 8 || { echo 'Preparación de servicio ya en curso.'; exit 0; }
trap 'r=$?; if [ "$r" -ne 0 ]; then echo "ERROR DE PREPARACION ($r): revisar servicio.log" >"$SUES_DIR/estado-servicio.txt"; fi' EXIT
echo 'RECUPERANDO RELEASE FIJA; SE CONSERVAN FUENTE Y DEPENDENCIAS PREPARADAS' >"$SUES_DIR/estado-servicio.txt"
SUES_RELEASE=$(mktemp -d "$SUES_DIR/release.XXXXXX")
git init -q "$SUES_RELEASE"
git -C "$SUES_RELEASE" remote add origin https://github.com/carlossuess-art/sues-ai-video-editor.git
GIT_TERMINAL_PROMPT=0 timeout 180 git -c credential.helper= -C "$SUES_RELEASE" fetch --quiet --depth 1 origin "$SUES_SHA"
git -C "$SUES_RELEASE" -c advice.detachedHead=false checkout --quiet --detach "$SUES_SHA"
test "$(git -C "$SUES_RELEASE" rev-parse HEAD)" = "$SUES_SHA"
bash -n "$SUES_RELEASE/scripts/deploy/prepare-service.sh"
# Mount target exists, but dependencies remain in their previous verified checkout.
mkdir "$SUES_RELEASE/node_modules"
chmod -R a+rX "$SUES_RELEASE"
printf '%s\n' "$SUES_RELEASE" >"$SUES_DIR/servicio-release.txt"
bash "$SUES_RELEASE/scripts/deploy/prepare-service.sh" "$SUES_DIR"
