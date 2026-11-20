#!/bin/sh
# e2e/video の圧縮テストに使う動画を作り直す。出力は e2e/fixtures/video/。
# ffmpeg（libx264, libx265）が要る。絵は動きのある模様なので圧縮が実際に効く。
set -eu
cd "$(dirname "$0")/../e2e/fixtures/video"
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }
src() { echo "testsrc2=s=$1:r=$2:d=$3"; }
tone() { echo "sine=f=440:d=$1:sample_rate=44100"; }
X264="-c:v libx264 -preset veryfast -crf 40 -pix_fmt yuv420p"

ff -f lavfi -i "$(src 1920x1080 30 3)" -f lavfi -i "$(tone 3)" $X264 -c:a aac -shortest fhd_landscape.mp4
ff -f lavfi -i "$(src 1080x1920 60 2)" -f lavfi -i "$(tone 2)" $X264 -c:a aac -shortest fhd_portrait_60fps.mp4
ff -f lavfi -i "$(src 3840x2160 30 1)" $X264 uhd_noaudio.mp4
ff -f lavfi -i "$(src 640x360 24 2)" -f lavfi -i "$(tone 2)" $X264 -c:a aac -shortest small_360p.mp4
ff -f lavfi -i "$(src 320x180 10 61)" $X264 too_long_61s.mp4
ff -f lavfi -i "$(src 1280x720 30 2)" -c:v libx265 -crf 40 -tag:v hvc1 -pix_fmt yuv420p hevc_720p.mov
ff -f lavfi -i "$(src 4096x2304 10 1)" $X264 over_4k.mp4
printf 'this is not a video' > broken.mp4
ls -la
