import { useCallback, useEffect, useRef, useState } from 'react';
import { storageUrl } from '../../lib/storage';
import { expiredMessage, type Video } from '../../lib/video/fields';
import { requestVideoPlayback } from '../../features/user/api/video';
import styles from './VideoPlayer.module.css';

// 同時に再生（取得）する動画は1本だけにする。別の動画を再生したら、前の動画は
// 止めて src を外し、取得そのものをやめる（一覧で複数の動画を同時に落とさないため）。
let activeStop: (() => void) | null = null;

const claimPlayback = (stop: () => void) => {
  if (activeStop && activeStop !== stop) activeStop();
  activeStop = stop;
};

const releasePlayback = (stop: () => void) => {
  if (activeStop === stop) activeStop = null;
};

type Phase = 'poster' | 'loading' | 'playing' | 'error';

const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

type Props = {
  video: Video;
  className?: string;
  // requestPlayback は再生用URLの取り方。既定は利用者のトークンで取る。管理画面は管理者の
  // トークンで取る関数を渡す。
  requestPlayback?: (videoID: string) => Promise<{ url: string }>;
  // adminView は管理画面の表示。期限切れ・外された動画も、ファイルが残っている限り
  // 再生できる（通報の確認のため）。状態は上に添えて出す。
  adminView?: boolean;
};

// VideoPlayer は投稿・メッセージに付いた動画を出す。
//
// 再生ボタンを押すまで動画本体は取らない（preload="none"、src も入れない）。押したら
// 期限付きの再生用URLをサーバーから受け取り、そのURLを src に入れて再生する。
// URL の期限が切れた（長く止めていた）ときは、同じ位置からもう一度取り直せる。
export const VideoPlayer = ({ video, className, requestPlayback = requestVideoPlayback, adminView = false }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('poster');
  const [src, setSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  // 一覧を開いた後に期限が来た（再生しようとして分かった）とき true にする。
  const [expiredSinceLoad, setExpiredSinceLoad] = useState(false);
  const expired = video.status === 'EXPIRED' || expiredSinceLoad;
  const resumeAtRef = useRef(0);

  // stop は再生をやめ、src を外して取得を止める（別の動画が再生されたとき）。
  const stop = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      resumeAtRef.current = el.currentTime;
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    setSrc(null);
    setPhase('poster');
  }, []);

  useEffect(() => () => releasePlayback(stop), [stop]);

  // 画面外へ出たら一時停止する（音が鳴り続けないように）。
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) videoRef.current?.pause();
    }, { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const start = useCallback(async () => {
    claimPlayback(stop);
    setPhase('loading');
    setErrorMessage('');
    try {
      const { url } = await requestPlayback(video.ID);
      setSrc(storageUrl(url));
      setPhase('playing');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('保存期間')) {
        // 一覧を開いた後に期限が来た。
        setExpiredSinceLoad(true);
        releasePlayback(stop);
        return;
      }
      setErrorMessage(message.includes('削除されました') ? 'この動画は削除されました。' : '動画を読み込めませんでした。通信環境を確認してもう一度お試しください。');
      setPhase('error');
    }
  }, [video.ID, stop, requestPlayback]);

  // src が入ったら再生を始める。preload="none" なので、play() を呼ぶまで何も取りに行かない
  // （loadedmetadata を待ってから play() すると永遠に始まらない）。位置を戻すのは
  // URL を取り直したときだけで、それはメタデータが届いてからでないとできない。
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src || phase !== 'playing') return;
    const resumeAt = resumeAtRef.current;
    const onLoaded = () => {
      if (resumeAt > 0) el.currentTime = resumeAt;
    };
    if (resumeAt > 0) el.addEventListener('loadedmetadata', onLoaded, { once: true });
    void el.play().catch(() => {
      // 自動再生の制限などで始まらなければ、コントロールから再生してもらう。
    });
    return () => el.removeEventListener('loadedmetadata', onLoaded);
  }, [src, phase]);

  const aspect = video.width > 0 && video.height > 0 ? `${video.width} / ${video.height}` : '16 / 9';

  const adminLabel = adminView && video.status !== 'AVAILABLE'
    ? (video.status === 'EXPIRED' ? `保存期間（${video.retentionDays}日間）が終了した動画です（管理者のみ再生できます）` : '外された動画です（管理者のみ再生できます）')
    : null;

  if (expired && !adminView) {
    return (
      <div className={`${styles.notice} ${className ?? ''}`} role="status">
        {expiredMessage(video.retentionDays)}
      </div>
    );
  }
  if (video.status === 'REMOVED' && !adminView) {
    return (
      <div className={`${styles.notice} ${className ?? ''}`} role="status">
        この動画は削除されました。
      </div>
    );
  }

  return (
    // 投稿カードは全体がクリックで詳細へ移るので、再生の操作をカードへ伝えない。
    <>
    {adminLabel && <div className={styles.adminLabel}>{adminLabel}</div>}
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ''}`}
      style={{ aspectRatio: aspect }}
      onClick={(e) => e.stopPropagation()}
    >
      {phase === 'playing' ? (
        <video
          ref={videoRef}
          className={styles.video}
          src={src ?? undefined}
          poster={video.thumbnailUrl ? storageUrl(video.thumbnailUrl) : undefined}
          controls
          playsInline
          preload="none"
          onPlay={() => claimPlayback(stop)}
          onError={() => {
            // URL の期限切れ・通信の途切れ。位置を覚えておいて、取り直せるようにする。
            resumeAtRef.current = videoRef.current?.currentTime ?? 0;
            setSrc(null);
            setErrorMessage('動画を読み込めませんでした。通信環境を確認してもう一度お試しください。');
            setPhase('error');
          }}
        />
      ) : (
        <button
          type="button"
          className={styles.poster}
          onClick={start}
          disabled={phase === 'loading'}
          aria-label={phase === 'error' ? '動画をもう一度読み込む' : '動画を再生'}
        >
          {video.thumbnailUrl && (
            <img src={storageUrl(video.thumbnailUrl)} alt="" className={styles.posterImage} loading="lazy" decoding="async" />
          )}
          <span className={styles.playIcon} aria-hidden="true">{phase === 'loading' ? '…' : phase === 'error' ? '↻' : '▶'}</span>
          <span className={styles.duration}>{formatDuration(video.durationMs)}</span>
          {phase === 'error' && <span className={styles.errorText}>{errorMessage}</span>}
        </button>
      )}
    </div>
    </>
  );
};
