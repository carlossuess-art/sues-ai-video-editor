#!/usr/bin/env bash
# Read-only, safe to paste/run in the Hostinger web console. No secrets/config dumps.
set -u
printf '\n=== SUES VPS: current inventory ===\n'
date -u +'%Y-%m-%dT%H:%M:%SZ'
uname -m
if [ -r /etc/os-release ]; then
  sed -n 's/^PRETTY_NAME=//p' /etc/os-release
fi
printf '\n=== CPU / RAM / disk ===\n'
command -v nproc >/dev/null && nproc
command -v free >/dev/null && free -h
df -h / /opt
printf '\n=== Host tools (not tools inside containers) ===\n'
for sues_tool in git curl rsync node npm python3 ffmpeg ffprobe docker; do
  if command -v "$sues_tool" >/dev/null 2>&1; then
    case "$sues_tool" in
      ffmpeg|ffprobe) "$sues_tool" -version 2>/dev/null | sed -n '1p' ;;
      *) "$sues_tool" --version 2>/dev/null | sed -n '1p' ;;
    esac
  else
    printf '%s: absent\n' "$sues_tool"
  fi
done
if command -v docker >/dev/null 2>&1; then
  printf '\n=== Compose / running containers / networks ===\n'
  docker compose version 2>/dev/null || true
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
  docker network ls --format '{{.Name}}'
fi
printf '\n=== Listening TCP sockets (no process arguments) ===\n'
command -v ss >/dev/null && ss -H -ltn
printf '\n=== Existing WhatsApp compose: presence only ===\n'
if [ -f /opt/sues-whatsapp/compose.yml ]; then
  printf '/opt/sues-whatsapp/compose.yml: present\n'
else
  printf '/opt/sues-whatsapp/compose.yml: absent or inaccessible\n'
fi
printf '\n=== GitHub CLI authentication: boolean only ===\n'
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    printf 'gh: authenticated (repository permission not checked)\n'
  else
    printf 'gh: not authenticated\n'
  fi
else
  printf 'gh: absent (Git SSH/HTTPS access not checked)\n'
fi
printf '\n=== End of read-only inventory ===\n'
