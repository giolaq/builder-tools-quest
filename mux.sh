#!/usr/bin/env bash
# Combine rendered frames with the synthesized soundtrack.
#   ./mux.sh vertical   -> out/builder_tools_quest.mp4       (1080x1920)
#   ./mux.sh wide       -> out/builder_tools_quest_16x9.mp4  (1920x1080)
set -euo pipefail
cd "$(dirname "$0")/out"
case "${1:-vertical}" in
  vertical) in=video_only.mp4; out=builder_tools_quest.mp4 ;;
  wide)     in=wide_video.mp4; out=builder_tools_quest_16x9.mp4 ;;
  *) echo "usage: $0 vertical|wide"; exit 1 ;;
esac
ffmpeg -y -loglevel error -i "$in" -i audio.wav \
  -af loudnorm=I=-15:TP=-1.5:LRA=11 \
  -c:v libx264 -preset slow -crf 20 -tune animation -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "$out"
echo "out/$out"
