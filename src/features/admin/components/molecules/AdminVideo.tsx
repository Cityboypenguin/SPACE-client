import { useState } from 'react';
import { VideoPlayer } from '../../../../components/molecules/VideoPlayer';
import { requestDoc } from '../../../../lib/graphql';
import { graphql } from '../../../../generated';
import { ADMIN_TOKEN_KEY } from '../../api/auth';
import { removeVideo } from '../../api/videos';
import { AppSwal } from '../../../../lib/swal';
import type { Video } from '../../../../lib/video/fields';
import styles from '../../styles/AdminShared.module.css';

const AdminRequestVideoPlaybackDocument = graphql(`
  mutation AdminRequestVideoPlayback($videoID: ID!) {
    requestVideoPlayback(videoID: $videoID) {
      url
      expiresAt
    }
  }
`);

const adminPlayback = async (videoID: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
  const data = await requestDoc(AdminRequestVideoPlaybackDocument, { videoID }, token);
  return data.requestVideoPlayback;
};

// AdminVideo は管理画面で投稿の動画を出し、外す操作を添える。
export const AdminVideo = ({ video }: { video: Video }) => {
  const [removed, setRemoved] = useState(video.status === 'REMOVED');
  const handleRemove = async () => {
    const res = await AppSwal.fire({
      text: 'この動画を外しますか？利用者からはすぐに見えなくなり、猶予の後にファイルが削除されます。',
      confirmButtonText: '外す',
      cancelButtonText: 'やめる',
      showCancelButton: true,
    });
    if (!res.isConfirmed) return;
    try {
      await removeVideo(video.ID, localStorage.getItem(ADMIN_TOKEN_KEY) ?? '');
      setRemoved(true);
    } catch {
      await AppSwal.fire({ text: '動画を外せませんでした。' });
    }
  };
  return (
    <div>
      <VideoPlayer video={removed ? { ...video, status: 'REMOVED' } : video} requestPlayback={adminPlayback} adminView />
      {!removed && (
        <div className={styles.buttonRowCompact}>
          <button type="button" className={styles.dangerButtonSmall} onClick={handleRemove}>動画を外す</button>
        </div>
      )}
    </div>
  );
};
