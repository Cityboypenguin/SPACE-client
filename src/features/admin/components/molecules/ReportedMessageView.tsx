import { Link } from 'react-router-dom';
import type { ReportedMessage } from '../../api/report';
import { storageUrl } from '../../../../lib/storage';
import styles from '../../styles/AdminShared.module.css';

const roomTypeJa: Record<string, string> = {
  dm: 'DM',
  community: 'コミュニティ',
  course: '授業内チャット',
};

const linkStyle = { color: '#2563eb', textDecoration: 'underline' };

// 通報を受けた時点のメッセージ。元のメッセージが編集・削除されていてもこの内容のまま。
export const ReportedMessageView = ({ message }: { message: ReportedMessage }) => (
  <div>
    <div className={styles.cellMuted}>
      {roomTypeJa[message.roomType] ?? message.roomType}
      {message.roomType !== 'dm' && message.roomName && `「${message.roomName}」`}
    </div>
    <div className={styles.cellMuted}>
      送信者:{' '}
      {/* 退会済みの投稿者は利用者ページが無いのでリンクにしない */}
      {message.authorID && message.authorAccountID ? (
        <Link to={`/admin/users/${message.authorID}`} style={linkStyle}>
          {message.authorName}
        </Link>
      ) : (
        message.authorName
      )}
      {message.authorAccountID && ` (@${message.authorAccountID})`}
    </div>
    <div className={styles.cellMuted}>
      送信日時: {new Date(message.createdAt).toLocaleString('ja-JP')}
      {message.updatedAt !== message.createdAt && `（編集: ${new Date(message.updatedAt).toLocaleString('ja-JP')}）`}
    </div>
    {message.content && (
      <div className={styles.preWrapContent} style={{ marginTop: '8px', overflowWrap: 'anywhere' }}>
        {message.content}
      </div>
    )}
    {message.media.map((m) => (
      <div key={m.ID} style={{ marginTop: '8px' }}>
        <a href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {m.contentType.startsWith('image/') ? (
            <img src={storageUrl(m.url)} alt="添付画像" style={{ maxWidth: '100%', maxHeight: '400px', display: 'block' }} />
          ) : (
            `添付ファイル (${m.contentType})`
          )}
        </a>
      </div>
    ))}
  </div>
);
