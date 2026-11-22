#!/bin/bash
set -euo pipefail
s=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
ffmpeg -nostdin -hide_banner -v info -i "$s/data/exports/SUES_export_xs_33a6a5c1aaa3.mp4" -i "$s/data/exports/SUES_export_xs_c98010508888.mp4" -filter_complex '[0:a]aresample=48000,asetpts=PTS-STARTPTS[a];[1:a]aresample=48000,asetpts=PTS-STARTPTS[b];[a][b]apsnr[out]' -map '[out]' -f null - >"$s/pixel-service-audio-psnr.log" 2>&1
grep -E 'PSNR ch[01]:' "$s/pixel-service-audio-psnr.log" | tail -2
