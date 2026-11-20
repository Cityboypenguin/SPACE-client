// 動画投稿の上限。サーバー（SPACE-server の internal/upload/mp4.go）と同じ値にしてある。
// サーバーが最終的に判定するので、ここは「送ってから断られる」を減らすための事前チェック。

// 圧縮後のファイルの上限。25MB ＝ 25,000,000 バイト（MiB ではない）。
export const VIDEO_MAX_BYTES = 25_000_000;
// 長さの上限（秒）。サーバーは音声の先頭の無音ぶん 0.1 秒の幅を持つが、選ぶ時点では 60 秒で判定する。
export const VIDEO_MAX_DURATION_SEC = 60;
// 出力の解像度の上限。横向きなら 1280×720、縦向きなら 720×1280 に収める。
export const VIDEO_MAX_LONG_SIDE = 1280;
export const VIDEO_MAX_SHORT_SIDE = 720;
export const VIDEO_MAX_FPS = 30;

// 圧縮前のファイルの上限。圧縮はファイルを少しずつ読むのでメモリは大きさにほぼ比例しないが、
// 読み込みとデコードにかかる時間と電池を考えて抑える（60秒の 4K 動画は 300MB 前後）。
export const VIDEO_MAX_SOURCE_BYTES = 300 * 1024 * 1024;
// 元の動画の解像度の上限。4K（4096×2160）を超えるものは端末のデコードが重すぎるので断る。
export const VIDEO_MAX_SOURCE_LONG_SIDE = 4096;
export const VIDEO_MAX_SOURCE_SHORT_SIDE = 2160;

// 映像のビットレートの目安（平均 2.5Mbps）と音声の上限（128kbps）。
export const VIDEO_TARGET_BITRATE = 2_500_000;
export const AUDIO_TARGET_BITRATE = 128_000;
// 圧縮の試行回数の上限（初回を含む）。25MB を超えたらビットレートを下げてやり直す。
export const VIDEO_MAX_ATTEMPTS = 3;
// これより下げても画質が保てないので、ここで諦める。
export const VIDEO_MIN_BITRATE = 300_000;

// サムネイル（JPEG）の長い辺と上限。サーバーは 512KiB まで受け付ける。
export const THUMBNAIL_LONG_SIDE = 640;
export const THUMBNAIL_MAX_BYTES = 500 * 1024;

// 選べる形式。拡張子や MIME だけでは決めず、中身は圧縮の前に読んで確かめる。
// iPhone の録画（.mov）や Android の .mp4、PC の .webm を受け付ける。
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
