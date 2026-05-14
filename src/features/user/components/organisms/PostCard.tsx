import { useState } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../molecules/LikeButton';
import { UserMeta } from '../molecules/UserMeta';
import { formatTime } from '../../utils/formatTime';
import { type Post, type Media } from '../../api/post';

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

const PostMediaGrid = ({ media }: { media: Media[] }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const images = media.filter((m) => m.contentType.startsWith('image/'));
  const files = media.filter((m) => !m.contentType.startsWith('image/'));
  const count = images.length;

  const gridStyle: React.CSSProperties =
    count === 1
      ? { display: 'block' }
      : count === 2
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }
        : count === 3
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 2 }
          : { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 };

  const imgStyle = (i: number): React.CSSProperties => ({
    width: '100%',
    height: count === 1 ? 'auto' : 110,
    maxHeight: count === 1 ? 300 : 110,
    objectFit: 'cover',
    borderRadius: count === 1 ? 10 : i === 0 && count === 3 ? '10px 0 0 10px' : 6,
    cursor: 'zoom-in',
    display: 'block',
    gridColumn: count === 3 && i === 0 ? '1 / 2' : undefined,
    gridRow: count === 3 && i === 0 ? '1 / 3' : undefined,
  });

  return (
    <>
      {images.length > 0 && (
        <div style={{ ...gridStyle, marginBottom: files.length > 0 ? 4 : 0, maxWidth: 300 }}>
          {images.map((m, i) => (
            <img
              key={m.ID}
              src={m.url}
              alt="添付画像"
              style={imgStyle(i)}
              onClick={(e) => { e.stopPropagation(); setLightboxUrl(m.url); }}
            />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', background: '#f3f4f6',
                border: '1px solid #e5e7eb', borderRadius: 8,
                fontSize: '0.78rem', color: '#374151', textDecoration: 'none',
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

type Props = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onClick: () => void;
};

export const PostCard = ({ post, currentUserId, onLike, onClick }: Props) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', gap: '0.75rem', padding: '1rem',
      borderBottom: '1px solid #e2e8f0', cursor: 'pointer',
      background: '#fff', transition: 'background 0.1s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8faff')}
    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
  >
    <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <UserMeta name={post.user.name} accountID={post.user.accountID} timestamp={formatTime(post.createdAt)} />
      {post.content && (
        <p style={{ margin: '0 0 0.5rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {post.content}
        </p>
      )}
      {post.media && post.media.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <PostMediaGrid media={post.media} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#94a3b8' }}>💬 {post.replies.length}</span>
        <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
      </div>
    </div>
  </div>
);
