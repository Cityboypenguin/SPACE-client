import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storageUrl } from '../../../lib/storage';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { AdminUserAvatar } from '../../../components/atoms/AdminUserAvatar';
import { LikeButton } from '../../user/components/molecules/LikeButton';
import { getPostByID, adminDeletePost, type Post, type Media } from '../api/posts';
import { useToast } from '../../../context/ToastContext';

const ImageLightbox = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onClose(); }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, cursor: 'zoom-out',
    }}
  >
    <button
      onClick={(e) => { e.stopPropagation(); onClose(); }}
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
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                onClick={() => setLightboxUrl(url)}
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
            );
          })}
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
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

export const AdminPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const loadPost = (postId: string) => {
    setLoading(true);
    setError('');
    getPostByID(postId)
      .then(setPost)
      .catch(() => setError('投稿の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) loadPost(id);
  }, [id]);

  const handleMainDelete = async () => {
    if (!id || !window.confirm('この親投稿を削除しますか？')) return;
    try {
      await adminDeletePost(id);
      setPost(prev => prev ? { ...prev, deletedAt: new Date().toISOString() } : null);
      addToast('削除しました', 'success');
    } catch (err) {
      console.error(err);
      addToast('削除に失敗しました', 'error');
    }
  };

  const handleReplyDelete = async (replyId: string) => {
    if (!window.confirm('この返信を削除しますか？')) return;
    try {
      await adminDeletePost(replyId);
      setPost(prev => prev ? {
        ...prev,
        replies: prev.replies.map(r => r.ID === replyId ? { ...r, deletedAt: new Date().toISOString() } : r)
      } : null);
      addToast('削除しました', 'success');
    } catch (err) {
      console.error(err);
      addToast('削除に失敗しました', 'error');
    }
  };

  const isDeleted = post?.deletedAt != null;

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', padding: '0.25rem 0.5rem', borderRadius: '50%' }}
          >←</button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>投稿詳細 (管理者)</h1>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : !post ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿が見つかりません</p>
        ) : (
          <>
            {post.rootPost && (
              <div style={{ paddingBottom: '0.5rem' }}>
                <AdminPostCard
                  post={post.rootPost}
                  isDetail={false}
                  onDelete={async () => { }}
                />
              </div>
            )}

            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e2e8f0',
              background: isDeleted ? '#fef2f2' : '#ffffff'
            }}>

              {isDeleted && (
                <div style={{
                  display: 'inline-block',
                  background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
                  padding: '0.25rem 0.5rem', borderRadius: '4px', marginBottom: '0.75rem'
                }}>
                  削除済み ({new Date(post.deletedAt!).toLocaleString('ja-JP')})
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <AdminUserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{post.user.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{post.user.accountID}</div>
                  </div>
                </div>

                {!isDeleted && (
                  <button
                    onClick={handleMainDelete}
                    style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}
                  >削除</button>
                )}
              </div>

              {post.content && (
                <p style={{ margin: '0 0 0.75rem', color: isDeleted ? '#64748b' : '#1e293b', fontSize: '1.1rem', lineHeight: 1.7, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
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
                <span style={{ color: '#64748b', fontSize: '1.2rem' }}>
                  💬 <strong>{post.replyCount}</strong> 件の返信
                </span>
                <div style={{ pointerEvents: 'none' }}>
                  <LikeButton post={post} currentUserId={null} onLike={async () => { }} large />
                </div>
              </div>
            </div>

            {/* 🛡 返信一覧 */}
            {post.replies.length > 0 && (
              <div>
                {post.replies.map((reply) => (
                  <AdminPostCard
                    key={reply.ID}
                    post={reply}
                    onDelete={handleReplyDelete}
                    isDetail={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};