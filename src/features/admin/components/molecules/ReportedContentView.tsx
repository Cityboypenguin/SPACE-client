import { Link } from 'react-router-dom';
import type { ReportedContent } from '../../api/report';
import { storageUrl } from '../../../../lib/storage';
import { reactionLabel } from '../../../user/constants/reactionStamps';
import styles from '../../styles/AdminShared.module.css';
import viewStyles from './ReportedContentView.module.css';

const roomTypeJa: Record<string, string> = {
  dm: 'DM',
  community: 'コミュニティ',
  course: '授業内チャット',
};

// 通報を受けた時点の内容。元の投稿が編集・削除されていてもこの内容のまま。
export const ReportedContentView = ({ content }: { content: ReportedContent }) => (
  <div>
    <div className={styles.cellMuted}>
      {roomTypeJa[content.roomType] ?? content.roomType}
      {content.roomType !== 'dm' && content.roomName && `「${content.roomName}」`}
    </div>
    <div className={styles.cellMuted}>
      投稿者:{' '}
      {/* 退会済みの投稿者は利用者ページが無いのでリンクにしない */}
      {content.authorID && content.authorAccountID ? (
        <Link to={`/admin/users/${content.authorID}`} className={viewStyles.link}>
          {content.authorName}
        </Link>
      ) : (
        content.authorName
      )}
      {content.authorAccountID && ` (@${content.authorAccountID})`}
    </div>
    <div className={styles.cellMuted}>
      投稿日時: {new Date(content.createdAt).toLocaleString('ja-JP')}
      {content.updatedAt !== content.createdAt && `（編集: ${new Date(content.updatedAt).toLocaleString('ja-JP')}）`}
    </div>
    {content.parentBody && (
      <div className={viewStyles.block}>
        <div className={styles.cellMuted}>回答先の質問</div>
        <div className={`${styles.preWrapContent} ${viewStyles.text}`}>{content.parentBody}</div>
      </div>
    )}
    {content.content && (
      <div className={`${styles.preWrapContent} ${viewStyles.block} ${viewStyles.text}`}>
        {content.content}
      </div>
    )}
    {content.stampID && (
      <div className={viewStyles.block}>スタンプ（{reactionLabel(content.stampID)}）</div>
    )}
    {content.addenda.map((addendum, i) => (
      <div key={i} className={viewStyles.block}>
        <div className={styles.cellMuted}>追記</div>
        <div className={`${styles.preWrapContent} ${viewStyles.text}`}>{addendum}</div>
      </div>
    ))}
    {content.pollOptions.length > 0 && (
      <ul className={viewStyles.options}>
        {content.pollOptions.map((option, i) => (
          <li key={i} className={viewStyles.text}>{option}</li>
        ))}
      </ul>
    )}
    {content.media.map((m) => (
      <div key={m.ID} className={viewStyles.block}>
        <a href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer" className={viewStyles.link}>
          {m.contentType.startsWith('image/') ? (
            <img src={storageUrl(m.url)} alt="添付画像" className={viewStyles.image} />
          ) : (
            `添付ファイル (${m.contentType})`
          )}
        </a>
      </div>
    ))}
  </div>
);
