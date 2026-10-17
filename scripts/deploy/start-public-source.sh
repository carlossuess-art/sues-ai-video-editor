#!/usr/bin/env bash
# Run under nohup. Downloads a verified bootstrap without any GitHub login.
set -Eeuo pipefail
umask 077
SUES_DIR=${1:-/opt/sues-video-setup}
test -d "$SUES_DIR"
test ! -L "$SUES_DIR"
exec 8>"$SUES_DIR/public-download.lock"
if ! flock -n 8; then echo 'La descarga pública ya está en marcha.'; exit 0; fi
trap 'echo "ERROR. Revisar codigo.log." >"$SUES_DIR/estado-codigo.txt"' ERR
echo 'DESCARGANDO PREPARADOR PUBLICO' >"$SUES_DIR/estado-codigo.txt"
SUES_TMP=$(mktemp "$SUES_DIR/preparar-publico.XXXXXX")
curl --fail --location --retry 3 --connect-timeout 15 --max-time 120 \
  --proto '=https' --proto-redir '=https' \
  https://raw.githubusercontent.com/carlossuess-art/sues-ai-video-editor/f603380ac917cc85e2eb34ae7f595774f4e1eb57/scripts/deploy/prepare-source.sh \
  --output "$SUES_TMP"
printf '%s  %s\n' e486f754fe0321239ef7da40dc09a6b5a32f778d33e2650701d7e434322916c5 "$SUES_TMP" | sha256sum --check -
bash -n "$SUES_TMP"
bash "$SUES_TMP" "$SUES_DIR" </dev/null
