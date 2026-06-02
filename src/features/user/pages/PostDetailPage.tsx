import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storageUrl } from '../../../lib/storage';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyThread } from '../components/organisms/ReplyThread';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { LikeButton } from '../components/molecules/LikeButton';

import {
  getPostByID,
  createPost,
  updatePost,
  deletePost,
  createFavorite,
  deleteFavorite,
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type Post,
  type Media,
  type MediaInput,
} from '../api/post';
import { createReport } from '../api/report';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';

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

interface ReportModalProps {
  targetId: string;
  postContent?: string;
  onClose: () => void;
}

const ReportModal = ({ targetId, postContent, onClose }: ReportModalProps) => {
  const [reason, setReason] = useState('SPAM');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReport({
        targetID: targetId,
        targetType: 'POST',
        reason,
        customReason: customReason.trim() || null,
      });
      alert('通報を送信しました');
      onClose();
    } catch (err) {
      console.error(err);
      alert('通報の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: '#fff', width: '100%', maxWidth: '440px',
          borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
          投稿を通報する
        </h2>

        {postContent && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#334155',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '100px',
            overflowY: 'auto'
          }}>
            <span style={{ fontWeight: 600, color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>対象の投稿内容:</span>
            {postContent}
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
            通報理由
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
          >
            <option value="SPAM">スパム / 宣伝目的</option>
            <option value="HARASSMENT">嫌がらせ / 誹謗中傷</option>
            <option value="INAPPROPRIATE">不適切なコンテンツ</option>
            <option value="COMMUNITY_VIOLATION">コミュニティガイドライン違反</option>
            <option value="OTHER">その他</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
            詳細説明（任意）
          </label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="詳しい問題の状況を入力してください"
            style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '0.45rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '0.45rem 1.2rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {submitting ? '送信中...' : '通報する'}
          </button>
        </div>
      </form>
    </div>
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
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isMyPost = post?.user.ID === userId;
  const canSubmitEdit = editContent.trim() !== '';

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

  const handleUpdate = async () => {
    if (!id || !editContent.trim() || editContent === post?.content) {
      setIsEditing(false);
      return;
    }
    try {
      await updatePost(id, editContent);
      setIsEditing(false);
      loadPost(id);
    } catch (err) {
      console.error(err);
      alert('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('本当にこの投稿を削除しますか？')) return;
    try {
      await deletePost(id);
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました');
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => navigate('/posts')}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{post.user.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{post.user.accountID}</div>
                  </div>
                </div>

                {isMyPost && !isEditing && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => { setIsEditing(true); setEditContent(post.content); }}
                      style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#f1f5f9', border: 'none', borderRadius: '4px' }}
                    >編集</button>
                    <button
                      onClick={handleDelete}
                      style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}
                    >削除</button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.5rem',
                      margin: '0 0 0.75rem',
                      fontFamily: 'inherit',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#1e293b',
                      fontSize: '1.1rem',
                      lineHeight: 1.7,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                      style={{
                        padding: '0.25rem 0.75rem',
                        cursor: 'pointer',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '20px',
                      }}
                    >キャンセル</button>
                    <button
                      onClick={handleUpdate}
                      disabled={!canSubmitEdit}
                      style={{
                        padding: '0.45rem 1.2rem',
                        borderRadius: '20px',
                        background: canSubmitEdit ? '#646cff' : '#c7d2fe',
                        color: '#fff', border: 'none', fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: canSubmitEdit ? 'pointer' : 'default',
                        transition: 'background 0.1s',
                      }}
                    >保存</button>
                  </div>
                </div>
              ) : (
                post.content && (
                  <p style={{
                    margin: '0 0 0.75rem',
                    color: '#1e293b',
                    fontSize: '1.1rem',
                    lineHeight: 1.7,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {post.content}
                  </p>
                )
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
                <LikeButton post={post} currentUserId={userId} onLike={handleLike} large />
                
                {!isMyPost && (
                  <button
                    onClick={() => setIsReportOpen(true)}
                    style={{
                      background: 'none', border: 'none', color: '#64748b',
                      fontSize: '1.1rem', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: '4px', padding: '0.25rem 0.5rem',
                      borderRadius: '6px', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    🚩 <span style={{ fontSize: '0.9rem' }}>通報</span>
                  </button>
                )}
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
                {post.replies
                  .map((reply) => (
                    <ReplyThread key={reply.ID} post={reply} currentUserId={userId} onLike={handleLike} />
                  ))}
              </div>
            )}

            {isReportOpen && id && (
              <ReportModal 
                targetId={id} 
                postContent={post.content} 
                onClose={() => setIsReportOpen(false)} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};