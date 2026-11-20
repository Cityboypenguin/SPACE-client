import { Link } from 'react-router-dom';
import { requestReportedVideoPlayback, type ReportedContent, type ReportedVideo } from '../../api/report';
import { VideoPlayer } from '../../../../components/molecules/VideoPlayer';
import { storageUrl } from '../../../../lib/storage';
import { reactionLabel } from '../../../user/constants/reactionStamps';
import styles from '../../styles/AdminShared.module.css';
import viewStyles from './ReportedContentView.module.css';

const roomTypeJa: Record<string, string> = {
  dm: 'DM',
  community: 'コミュニティ',
  course: '授業内チャット',
};

// 通報の写しの動画。ファイルは写し取っておらず、通報への対応が終わると消える。
// 再生は通報のIDで取る（投稿者が退会して元の動画の行が無くても再生できる）。
const ReportedVideoView = ({ video, reportID }: { video: ReportedVideo; reportID: string }) => {
  if (!video.available) {
    return <div className={styles.cellMuted}>動画（ファイルは削除済み）</div>;
  }
  return (
    <VideoPlayer
      video={{
        ID: video.ID,
        status: 'AVAILABLE',
        thumbnailUrl: video.thumbnailURL,
        durationMs: video.durationMs,
        width: video.width,
        height: video.height,
        sizeBytes: video.sizeBytes,
        hasAudio: video.hasAudio,
        expiresAt: '',
        retentionDays: 0,
      }}
      requestPlayback={() => requestReportedVideoPlayback(reportID)}
      adminView
    />
  );
};

// 通報を受けた時点の内容。元の投稿が編集・削除されていてもこの内容のまま。
// isThread はスレッドそのものの通報（content はスレッドの題名、投稿者は作成者）。
// reportID は動画の再生に使う（動画が無ければ要らない）。
export const ReportedContentView = ({ content, isThread = false, reportID }: { content: ReportedContent; isThread?: boolean; reportID?: string }) => (
  <div>
    <div className={styles.cellMuted}>
      {roomTypeJa[content.roomType] ?? content.roomType}
      {content.roomType !== 'dm' && content.roomName && `「${content.roomName}」`}
      {content.threadTitle !== null && `のスレッド「${content.threadTitle}」`}
    </div>
    <div className={styles.cellMuted}>
      {isThread ? '作成者' : '投稿者'}:{' '}
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
      {isThread ? '作成日時' : '投稿日時'}: {new Date(content.createdAt).toLocaleString('ja-JP')}
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
    {content.video && reportID && (
      <div className={`${viewStyles.block} ${viewStyles.video}`}>
        <ReportedVideoView video={content.video} reportID={reportID} />
        <div className={styles.cellMuted}>通報への対応が終わると、この動画は保存期間などの通常の決まりで削除されます（投稿者が退会済みなら次の自動削除〈毎日4時〉で削除）。</div>
      </div>
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
