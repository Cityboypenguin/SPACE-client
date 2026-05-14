import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyThread } from '../components/organisms/ReplyThread';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { LikeButton } from '../components/molecules/LikeButton';
import {
  getPostByID,
  createPost,
  createFavorite,
  deleteFavorite,
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type Post,
  type Media,
  type MediaInput,
} from '../api/post';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
const ImageLightbox = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, cursor: 'zoom-out',
    }}
  >
    <button
      onClick={onClose}
      style={{
        position: 'absolute', top: 16, right: 20,
        background: 'none', border: 'none', color: '#fff',
        fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
      }}
    >✕</button>
    <img
      src={url} alt="拡大表示"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
    />
  </div>
);

const PostMediaDetail = ({ media }: { media: Media[] }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const images = media.filter((m) => m.contentType.startsWith('image/'));
  const files = media.filter((m) => !m.contentType.startsWith('image/'));
  const count = images.length;

  const gridStyle: React.CSSProperties =
    count <= 1
      ? { display: 'block' }
      : count === 2
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }
        : count === 3
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 3 }
          : { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 3 };

  return (
    <>
      {images.length > 0 && (
        <div style={{ ...gridStyle, marginBottom: 8, maxWidth: 420 }}>
          {images.map((m, i) => (
            <img
              key={m.ID}
              src={m.url}
              alt="添付画像"
              onClick={() => setLightboxUrl(m.url)}
              style={{
                width: '100%',
                height: count === 1 ? 'auto' : 160,
                maxHeight: count === 1 ? 400 : 160,
                objectFit: 'cover',
                borderRadius: count === 1 ? 10 : (i === 0 && count === 3 ? '10px 0 0 10px' : 8),
                cursor: 'zoom-in', display: 'block',
                gridColumn: count === 3 && i === 0 ? '1 / 2' : undefined,
                gridRow: count === 3 && i === 0 ? '1 / 3' : undefined,
              }}
            />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', background: '#f3f4f6',
                border: '1px solid #e5e7eb', borderRadius: 8,
                fontSize: '0.85rem', color: '#374151', textDecoration: 'none',
              }}
            >
              📎 {m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
            </a>
          ))}
        </div>
      )}
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
};

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

  const loadPost = (postId: string) => {
    setLoading(true);
    getPostByID(postId)
      .then(setPost)
      .catch(() => setError('投稿の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) loadPost(id);
  }, [id]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await deleteFavorite(postId);
    } else {
      await createFavorite(postId);
    }
    if (id) loadPost(id);
  };

  const handleReply = async () => {
    if ((!replyContent.trim() && replyFiles.length === 0) || replying || !id) return;
    setReplying(true);
    setReplyError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (replyFiles.length > 0) {
        mediaInputs = await Promise.all(
          replyFiles.map(async (file) => {
            const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
            await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
            return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
          }),
        );
      }
      await createPost(replyContent.trim(), id, mediaInputs);
      setReplyContent('');
      setReplyFiles([]);
      loadPost(id);
    } catch {
      setReplyError('返信に失敗しました');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', padding: '0.25rem 0.5rem', borderRadius: '50%' }}
          >←</button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>投稿</h1>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : !post ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿が見つかりません</p>
        ) : (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{post.user.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{post.user.accountID}</div>
                </div>
              </div>
              {post.content && (
                <p style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '1.1rem', lineHeight: 1.7, wordBreak: 'break-word' }}>
                  {post.content}
                </p>
              )}
              {post.media && post.media.length > 0 && (
                <PostMediaDetail media={post.media} />
              )}
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {new Date(post.createdAt).toLocaleString('ja-JP')}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  💬 <strong>{post.replies.length}</strong> 件の返信
                </span>
                <LikeButton post={post} currentUserId={userId} onLike={handleLike} large />
              </div>
            </div>

            <PostComposer
              value={replyContent}
              onChange={setReplyContent}
              onSubmit={handleReply}
              submitting={replying}
              error={replyError}
              placeholder="返信する..."
              rows={2}
              submitLabel="返信する"
              submittingLabel="送信中..."
              iconSize={36}
              userId={userId}
              avatarUrl={profile?.avatarUrl}
              userName={profile?.user.name}
              selectedFiles={replyFiles}
              onFileSelect={setReplyFiles}
            />

            {post.replies.length > 0 && (
              <div>
                {post.replies.map((reply) => (
                  <ReplyThread key={reply.ID} post={reply} currentUserId={userId} onLike={handleLike} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
