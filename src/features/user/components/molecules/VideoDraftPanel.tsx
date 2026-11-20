import type { VideoDraftController } from '../../hooks/useVideoDraft';
import { useRetentionDays } from '../../hooks/useRetentionDays';
import styles from './VideoDraftPanel.module.css';

const PHASE_LABEL = {
  analyzing: '動画を確認しています',
  compressing: '動画を圧縮しています',
  thumbnail: 'サムネイルを作っています',
} as const;

const percent = (v: number) => `${Math.round(v * 100)}%`;

const formatSize = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)}MB`;

type Props = {
  draft: VideoDraftController;
};

// VideoDraftPanel は入力欄に付けた動画の状態（圧縮・アップロードの進み具合、プレビュー）を出す。
export const VideoDraftPanel = ({ draft }: Props) => {
  const { state } = draft;
  const retentionDays = useRetentionDays();
  if (state.status === 'idle') return null;

  if (state.status === 'error') {
    return (
      <div className={styles.panel} role="alert">
        <p className={styles.error}>{state.message}</p>
        <button type="button" className={styles.textButton} onClick={draft.clear}>閉じる</button>
      </div>
    );
  }

  if (state.status === 'compressing') {
    const label = PHASE_LABEL[state.phase];
    const retry = state.phase === 'compressing' && state.attempt > 1 ? `（容量を抑えて${state.attempt}回目）` : '';
    return (
      <div className={styles.panel} aria-live="polite">
        <div className={styles.progressRow}>
          <span>{label}{retry}… {state.phase === 'compressing' ? percent(state.progress) : ''}</span>
          <button type="button" className={styles.textButton} onClick={draft.cancel}>キャンセル</button>
        </div>
        <progress className={styles.progress} value={state.phase === 'compressing' ? state.progress : undefined} max={1} />
        <p className={styles.hint}>圧縮は端末の中で行います。終わるまでこの画面を開いたままにしてください。</p>
      </div>
    );
  }

  const uploading = state.status === 'uploading';
  return (
    <div className={styles.panel}>
      <video
        className={styles.preview}
        src={state.previewUrl}
        poster={state.thumbnailUrl}
        controls
        playsInline
        preload="metadata"
      />
      <div className={styles.meta}>
        <span>
          {state.result.width}×{state.result.height}・{Math.round(state.result.durationSec)}秒・{formatSize(state.result.video.size)}
          {!state.result.hasAudio && '・音声なし'}
        </span>
        {!uploading && (
          <button type="button" className={styles.textButton} onClick={draft.clear}>動画を外す</button>
        )}
      </div>
      {uploading && (
        <div aria-live="polite">
          <div className={styles.progressRow}>
            <span>アップロードしています… {percent(state.progress)}</span>
            <button type="button" className={styles.textButton} onClick={draft.cancel}>中止</button>
          </div>
          <progress className={styles.progress} value={state.progress} max={1} />
        </div>
      )}
      <p className={styles.notice}>
        {retentionDays !== null
          ? `動画は投稿から${retentionDays}日後に削除されます（本文やコメントは残ります）。`
          : '動画は一定期間が過ぎると削除されます（本文やコメントは残ります）。'}
      </p>
    </div>
  );
};
