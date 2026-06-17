import { useState, useEffect } from 'react';
import { type Post } from '../../api/post';
import { PostComposer } from './PostComposer';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import { formatTime } from '../../../../lib/formatTime';
import styles from './ReplyModal.module.css';

type Props = {
  post: Post;
  onClose: () => void;
  onSubmit: (content: string, files: File[]) => Promise<void>;
  userId?: string | null;
  avatarUrl?: string | null;
  userName?: string;
};

export const ReplyModal = ({ post, onClose, onSubmit, userId, avatarUrl, userName }: Props) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async () => {
    if ((!content.trim() && files.length === 0) || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(content, files);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '返信の送信に失敗しました');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>返信</span>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewInner}>
            {post.user.avatarUrl ? (
              <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={40} />
            ) : (
              <Avatar name={post.user.name} size={40} />
            )}
            <div className={styles.previewBody}>
              <div className={styles.previewMeta}>
                <span className={styles.previewName}>{post.user.name}</span>
                <span className={styles.previewAccount}>@{post.user.accountID}</span>
                <span className={styles.previewAccount}> · {formatTime(post.createdAt)}</span>
              </div>
              {post.content && <p className={styles.previewContent}>{post.content}</p>}
              {post.media && post.media.length > 0 && (
                <div className={styles.previewImages}>
                  {post.media.filter(m => m.contentType.startsWith('image/')).slice(0, 4).map((m) => (
                    <img key={m.ID} src={storageUrl(m.url)} alt="" className={styles.previewImage} />
                  ))}
                </div>
              )}
              <div className={styles.replyTo}>
                返信先: <span className={styles.replyToName}>@{post.user.accountID}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.composerWrapper}>
          <PostComposer
            value={content}
            onChange={setContent}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
            placeholder={`@${post.user.accountID} に返信...`}
            rows={3}
            submitLabel="返信する"
            submittingLabel="送信中..."
            iconSize={36}
            userId={userId}
            avatarUrl={avatarUrl}
            userName={userName}
            selectedFiles={files}
            onFileSelect={setFiles}
            maxLength={500}
            isEmbedded
          />
        </div>
      </div>
    </div>
  );
};
