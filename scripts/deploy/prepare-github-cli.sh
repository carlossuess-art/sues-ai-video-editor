#!/usr/bin/env bash
# Download official standalone CLI; no OS package changes or automatic login.
set -Eeuo pipefail
umask 077
SUES_DIR=${1:-/opt/sues-video-setup}
test -d "$SUES_DIR"
test ! -L "$SUES_DIR"
exec 9>"$SUES_DIR/github-cli.lock"
if ! flock -n 9; then echo 'Preparación GitHub CLI ya en marcha.'; exit 0; fi
finish() {
  local result=$?
  if [ "$result" -ne 0 ]; then echo "ERROR ($result). Revisar github.log." >"$SUES_DIR/estado-github.txt"; fi
}
trap finish EXIT
echo 'DESCARGANDO GITHUB CLI' >"$SUES_DIR/estado-github.txt"
install -d -m 700 "$SUES_DIR/tools" "$SUES_DIR/github-auth"
SUES_RUN=$(mktemp -d "$SUES_DIR/gh-download.XXXXXX")
curl --fail --location --retry 3 --connect-timeout 15 --max-time 300 \
  --proto '=https' --proto-redir '=https' \
  https://github.com/cli/cli/releases/download/v2.102.0/gh_2.102.0_linux_amd64.tar.gz \
  --output "$SUES_RUN/gh.tar.gz"
printf '%s  %s\n' bb766f710eef8ede859c18578c72c327597cd4c8a85b06001b1f3843c6019386 "$SUES_RUN/gh.tar.gz" | sha256sum --check -
tar -xzf "$SUES_RUN/gh.tar.gz" -C "$SUES_RUN" gh_2.102.0_linux_amd64/bin/gh
install -m 700 "$SUES_RUN/gh_2.102.0_linux_amd64/bin/gh" "$SUES_DIR/tools/gh"
"$SUES_DIR/tools/gh" --version
echo 'GITHUB CLI LISTO; pendiente autorización web.' >"$SUES_DIR/estado-github.txt"
echo 'GITHUB CLI LISTO'
