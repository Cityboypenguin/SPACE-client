import {
  refreshChatStamps,
  useChatStampCatalog,
} from '../../hooks/useChatStamps';
import styles from './StampCatalogNotice.module.css';

export const StampCatalogNotice = ({
  reaction = false,
}: {
  reaction?: boolean;
}) => {
  const { error, isLoading } = useChatStampCatalog();
  return (
    <div className={styles.notice}>
      {isLoading ? (
        <p role="status">読み込み中…</p>
      ) : (
        <>
          <p role={error ? 'alert' : 'status'}>
            {error
              ? 'スタンプの一覧を取得できませんでした。'
              : reaction
                ? '現在使えるリアクションはありません。'
                : '現在使えるスタンプはありません。'}
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshChatStamps().catch(() => undefined);
            }}
          >
            再読み込み
          </button>
        </>
      )}
    </div>
  );
};
