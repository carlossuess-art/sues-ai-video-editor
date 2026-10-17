#!/usr/bin/env bash
# Prepare dependencies only. Launch with nohup; never changes an existing service.
set -Eeuo pipefail
umask 077
SUES_SETUP_DIR=${1:-/opt/sues-video-setup}
SUES_IMAGE=sues-video-runtime:20261017
test "${SUES_SETUP_DIR:0:1}" = /
test ! -L "$SUES_SETUP_DIR"
install -d -m 700 "$SUES_SETUP_DIR"
exec 9>"$SUES_SETUP_DIR/runtime.lock"
if ! flock -n 9; then
  echo 'Ya hay una preparación en marcha.'
  exit 0
fi
finish() {
  local result=$?
  if [ "$result" -eq 0 ]; then
    printf 'DEPENDENCIAS PREPARADAS; editor todavía no desplegado.\n' >"$SUES_SETUP_DIR/estado.txt"
  else
    printf 'ERROR (%s). Revisar instalacion.log.\n' "$result" >"$SUES_SETUP_DIR/estado.txt"
  fi
}
trap finish EXIT
printf 'PREPARANDO DEPENDENCIAS\n' >"$SUES_SETUP_DIR/estado.txt"
docker info >/dev/null
SUES_FREE_KB=$(df -Pk "$SUES_SETUP_DIR" | awk 'NR==2 {print $4}')
if [ "$SUES_FREE_KB" -lt 5242880 ]; then
  echo 'Se requieren al menos 5 GiB libres para preparar las dependencias.'
  exit 1
fi
install -d -m 700 "$SUES_SETUP_DIR/runtime-context"
cat >"$SUES_SETUP_DIR/runtime-context/Dockerfile" <<'DOCKERFILE'
FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 ffmpeg fontconfig ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
USER node
DOCKERFILE
docker build --pull --progress=plain -t "$SUES_IMAGE" "$SUES_SETUP_DIR/runtime-context"
printf 'COMPROBANDO DEPENDENCIAS\n' >"$SUES_SETUP_DIR/estado.txt"
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --cpus 0.5 --memory 768m --pids-limit 128 \
  --tmpfs /tmp:rw,noexec,nosuid,size=32m "$SUES_IMAGE" bash -ec '
  node -e "if(Number(process.versions.node.split(\".\")[0])<22)process.exit(1)"
  node --version
  npm --version
  python3 -c "import hashlib; assert hasattr(hashlib, \"file_digest\")"
  python3 --version
  ffmpeg -version | head -n 1
  ffprobe -version | head -n 1
  command -v fc-scan
  ffmpeg -hide_banner -filters > /tmp/filters.txt 2>&1
  for f in ass crop scale fps concat perspective sidechaincompress alimiter; do
    grep -Eq "[[:space:]]${f}[[:space:]]" /tmp/filters.txt
  done
  ffmpeg -v error -threads 1 -f lavfi -i color=s=160x160:r=10 \
    -f lavfi -i anullsrc=r=48000:cl=stereo -t 0.5 \
    -c:v libx264 -threads 1 -pix_fmt yuv420p -c:a aac -y /tmp/check.mp4
  ffmpeg -v error -threads 1 -i /tmp/check.mp4 -f null -
  echo "Filtros y prueba corta H264/AAC: OK"
'
docker image inspect "$SUES_IMAGE" --format '{{.Id}}' >"$SUES_SETUP_DIR/imagen-id.txt"
if docker image inspect node:22-bookworm-slim --format '{{json .RepoDigests}}' >"$SUES_SETUP_DIR/base-digests.tmp" 2>/dev/null; then
  mv "$SUES_SETUP_DIR/base-digests.tmp" "$SUES_SETUP_DIR/base-digests.json"
  printf 'available\n' >"$SUES_SETUP_DIR/base-provenance-status.txt"
else
  rm -f "$SUES_SETUP_DIR/base-digests.tmp"
  printf '[]\n' >"$SUES_SETUP_DIR/base-digests.json"
  printf 'unavailable: base tag absent from local image store\n' >"$SUES_SETUP_DIR/base-provenance-status.txt"
  echo 'Aviso: etiqueta base ausente del almacén local; huella base no recuperada.'
fi
printf '\nDEPENDENCIAS PREPARADAS. El editor todavía no está desplegado.\n'
