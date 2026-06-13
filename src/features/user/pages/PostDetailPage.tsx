import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyThread } from '../components/organisms/ReplyThread';
import { PostCard } from '../components/organisms/PostCard';
import { ReportModal } from '../components/organisms/ReportMadal';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { PostMediaGrid } from '../components/molecules/PostMediaGrid';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { LikeButton } from '../components/molecules/LikeButton';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import commentIcon from '../../../assets/パーツ_コメント.svg';

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
  type MediaInput,
} from '../api/post';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { updatePostInCache, removePostFromCache, removePostFromUserPostListCache, updatePostInUserPostListCache } from '../cache/postListCache';


export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);

  const { data: post, isLoading, error, mutate } = useSWR<Post | null>(
    id ? ['post', id] : null,
    ([, postId]: [string, string]) => getPostByID(postId),
  );

  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [editDeletedMediaIDs, setEditDeletedMediaIDs] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);

  const isMyPost = post?.user.ID === userId;
  // ⭕️ 追加: メイン投稿が削除されているかどうかのフラグ
  const isDeleted = post?.deletedAt != null;

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await deleteFavorite(postId);
    } else {
      await createFavorite(postId);
    }
    if (postId === id) {
      const updater = (p: Post): Post => isLiked
        ? { ...p, favorites: p.favorites.filter(f => f.user.ID !== userId) }
        : { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
      updatePostInCache(postId, updater);
      if (userId) updatePostInUserPostListCache(userId, postId, updater);
    }
    void mutate();
  };

  const handleReplyToPost = async (content: string, files: File[]) => {
    if (!replyingTo) return;
    let mediaInputs: MediaInput[] | undefined;
    if (files.length > 0) {
      mediaInputs = await Promise.all(
        files.map(async (file) => {
          const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
          await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
          return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
        }),
      );
    }
    await createPost(content.trim(), replyingTo.ID, mediaInputs);
    if (id) {
      const updater = (p: Post): Post => ({ ...p, replyCount: p.replyCount + 1 });
      updatePostInCache(id, updater);
      if (userId) updatePostInUserPostListCache(userId, id, updater);
    }
    void mutate();
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
      if (id) {
        const updater = (p: Post): Post => ({ ...p, replyCount: p.replyCount + 1 });
        updatePostInCache(id, updater);
        if (userId) updatePostInUserPostListCache(userId, id, updater);
      }
      void mutate();
    } catch (err) {
      setReplyError(toUserMessage(err, '返信の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setReplying(false);
    }
  };

  const handleUpdate = async () => {
    const remainingExistingMedia = post?.media?.filter(m => !editDeletedMediaIDs.includes(m.ID)) || [];
    const hasAnyMedia = remainingExistingMedia.length > 0 || editSelectedFiles.length > 0;
    if (!id || (!editContent.trim() && !hasAnyMedia) || isUpdating) return;
    const isContentChanged = editContent !== post?.content;
    const hasNewMedia = editSelectedFiles.length > 0;
    const hasDeletedMedia = editDeletedMediaIDs.length > 0;
    if (!isContentChanged && !hasNewMedia && !hasDeletedMedia) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    setUpdateError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (editSelectedFiles.length > 0) {
        mediaInputs = await Promise.all(
          editSelectedFiles.map(async (file) => {
            const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
            await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
            return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
          })
        );
      }

      await updatePost(id, editContent.trim(), mediaInputs, editDeletedMediaIDs);

      setIsEditing(false);
      setEditSelectedFiles([]);
      setEditDeletedMediaIDs([]);
      mutate().then(updatedPost => {
        if (updatedPost && id) updatePostInCache(id, () => updatedPost);
      });
    } catch (err) {
      setUpdateError(toUserMessage(err, '投稿の更新に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('本当にこの投稿を削除しますか？')) return;
    try {
      await deletePost(id);
      removePostFromCache(id);
      if (userId) removePostFromUserPostListCache(userId, id);
      navigate(-1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <UserSidebar />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', padding: '0.25rem 0.5rem', borderRadius: '50%' }}
          ><ChevronLeft /></button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>投稿</h1>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>投稿の読み込みに失敗しました</p>}

        {isLoading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : !post ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿が見つかりません</p>
        ) : (
          <>
            {post.rootPost && (
              <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>

                {post.rootPost.deletedAt != null ? (
                  /* 🛡 大元が削除されている場合 */
                  <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    この投稿は削除されました
                  </div>
                ) : (
                  /* 🛡 大元が正常な場合 */
                  <PostCard
                    post={post.rootPost}
                    currentUserId={userId}
                    onLike={handleLike}
                    onClick={() => navigate(`/posts/${post.rootPost!.ID}`)}
                  />
                )}

                {/* 繋がりの縦線（削除されていようがいまいが、下に繋げる） */}
                <div style={{
                  width: '2px',
                  height: '24px',
                  background: '#cbd5e1',
                  marginLeft: '37px',
                  marginTop: '-1px',
                  marginBottom: '-1px',
                  zIndex: 1,
                  position: 'relative'
                }} />
              </div>
            )}

            {isDeleted ? (
              // 削除済みプレースホルダー
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                この投稿は削除されました
              </div>
            ) : (
              // 正常な投稿の表示
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
                        onClick={() => {
                          setIsEditing(true);
                          setEditContent(post.content);
                          setEditSelectedFiles([]);
                          setEditDeletedMediaIDs([]);
                          setUpdateError('');
                        }}
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
                  <div style={{ marginBottom: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {updateError && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{updateError}</p>}

                    <PostComposer
                      value={editContent}
                      onChange={setEditContent}
                      onSubmit={handleUpdate}
                      submitting={isUpdating}
                      userId={userId}
                      avatarUrl={profile?.avatarUrl}
                      userName={profile?.user.name}
                      selectedFiles={editSelectedFiles}
                      onFileSelect={setEditSelectedFiles}
                      existingMedia={post.media}
                      deletedMediaIDs={editDeletedMediaIDs}
                      onDeleteExistingMedia={(mediaId) => setEditDeletedMediaIDs(prev => [...prev, mediaId])}
                      submitLabel="保存する"
                      submittingLabel="保存中..."
                      placeholder="投稿を編集..."
                      onCancel={() => {
                        setIsEditing(false);
                        setEditContent(post.content);
                        setEditSelectedFiles([]);
                        setEditDeletedMediaIDs([]);
                      }}
                      isEmbedded={true}
                    />
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

                {!isEditing && post.media && post.media.length > 0 && (
                  <PostMediaGrid media={post.media} large />
                )}

                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {new Date(post.createdAt).toLocaleString('ja-JP')}
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <img src={commentIcon} alt="返信" style={{ width: 22, height: 22, filter: 'opacity(0.45)' }} />
                    <strong>{post.replyCount}</strong> 件の返信
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
            )}

            {/* 🛡 ⭕️ 返信入力フォーム（メインが削除されていない場合のみ） */}
            {!isDeleted && (
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
            )}

            {/* 🛡 ⭕️ 返信一覧（削除済みのリプライを除外して表示） */}
            {post.replies && post.replies.length > 0 && (
              <div>
                {post.replies
                  .filter(reply => reply.deletedAt == null) // ここで削除済みを除外
                  .map((reply) => (
                    <ReplyThread key={reply.ID} post={reply} currentUserId={userId} onLike={handleLike} onReply={setReplyingTo} />
                  ))}
              </div>
            )}

            {replyingTo && (
              <ReplyModal
                post={replyingTo}
                onClose={() => setReplyingTo(null)}
                onSubmit={handleReplyToPost}
                userId={userId}
                avatarUrl={profile?.avatarUrl}
                userName={profile?.user.name}
              />
            )}

            {id && (
              <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                targetType="POST"
                targetID={id}
                postContent={post.content}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
