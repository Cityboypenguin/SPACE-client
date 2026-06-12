import { useState, useEffect } from 'react';
import { type Post } from '../../api/post';
import { PostComposer } from './PostComposer';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import { formatTime } from '../../utils/formatTime';

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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* ヘッダー */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>返信</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1,
              display: 'flex', alignItems: 'center', padding: '2px',
              borderRadius: '50%', width: 28, height: 28, justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* 親投稿プレビュー */}
        <div style={{
          padding: '1rem',
          borderBottom: '2px solid #e2e8f0',
          overflowY: 'auto',
          maxHeight: '35vh',
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {post.user.avatarUrl ? (
              <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={40} />
            ) : (
              <Avatar name={post.user.name} size={40} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{post.user.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>@{post.user.accountID}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> · {formatTime(post.createdAt)}</span>
              </div>
              {post.content && (
                <p style={{
                  margin: 0, color: '#374151', lineHeight: 1.6,
                  fontSize: '0.95rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                }}>
                  {post.content}
                </p>
              )}
              {post.media && post.media.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {post.media.filter(m => m.contentType.startsWith('image/')).slice(0, 4).map((m) => (
                    <img
                      key={m.ID}
                      src={storageUrl(m.url)}
                      alt=""
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  ))}
                </div>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                返信先: <span style={{ color: '#f97316' }}>@{post.user.accountID}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 返信入力 */}
        <div style={{ overflowY: 'auto' }}>
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
            isEmbedded
          />
        </div>
      </div>
    </div>
  );
};
