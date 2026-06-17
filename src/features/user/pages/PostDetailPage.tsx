import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyThread } from '../components/organisms/ReplyThread';
import { PostCard } from '../components/organisms/PostCard';
import { ReportModal } from '../components/organisms/ReportMadal';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { PostMediaGrid } from '../../../components/molecules/PostMediaGrid';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { LikeButton } from '../../../components/molecules/LikeButton';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import commentIcon from '../../../assets/パーツ_コメント.svg';
import reportIcon from '../../../assets/パーツ_通報.svg';
import blockIcon from '../../../assets/パーツ_ブロック.svg';
import editIcon from '../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../assets/パーツ_削除.svg';
import styles from './PostDetailPage.module.css';

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
import { createBlocker } from '../api/block';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleBlock = async (blockedUserId: string) => {
    if (!window.confirm('このユーザーをブロックしますか？')) return;
    try {
      await createBlocker(blockedUserId);
      navigate(-1);
    } catch (err) {
      console.error(err);
    }
  };

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
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <button className={styles.backButton} onClick={() => navigate(-1)}><ChevronLeft /></button>
          <h1 className={styles.pageTitle}>投稿</h1>
        </div>

        {error && <p className={styles.loadError}>投稿の読み込みに失敗しました</p>}

        {isLoading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : !post ? (
          <p className={styles.loadingText}>投稿が見つかりません</p>
        ) : (
          <>
            {post.rootPost && (
              <div className={styles.rootPostContainer}>
                {post.rootPost.deletedAt != null ? (
                  <div className={styles.deletedPost}>この投稿は削除されました</div>
                ) : (
                  <PostCard
                    post={post.rootPost}
                    currentUserId={userId}
                    onLike={handleLike}
                    onClick={() => navigate(`/posts/${post.rootPost!.ID}`)}
                  />
                )}
                <div className={styles.threadConnector} />
              </div>
            )}

            {isDeleted ? (
              <div className={styles.deletedMain}>この投稿は削除されました</div>
            ) : (
              <div className={styles.postBody}>
                <div className={styles.postBodyHeader}>
                  <div className={styles.userInfo}>
                    <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
                    <div>
                      <div className={styles.userName}>{post.user.name}</div>
                      <div className={styles.userAccount}>@{post.user.accountID}</div>
                    </div>
                  </div>

                  {!isEditing && (
                    <div className={styles.menuWrap} ref={menuRef}>
                      <button
                        className={styles.menuButton}
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="メニュー"
                      >···</button>
                      {menuOpen && (
                        <div className={styles.dropdown}>
                          {isMyPost ? (
                            <>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                  setMenuOpen(false);
                                  setIsEditing(true);
                                  setEditContent(post.content);
                                  setEditSelectedFiles([]);
                                  setEditDeletedMediaIDs([]);
                                  setUpdateError('');
                                }}
                              >
                                <img src={editIcon} alt="" className={styles.dropdownIcon} />
                                編集
                              </button>
                              <button
                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                onClick={() => { setMenuOpen(false); handleDelete(); }}
                              >
                                <img src={deleteIcon} alt="" className={styles.dropdownIconDelete} />
                                削除
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => { setMenuOpen(false); handleBlock(post.user.ID); }}
                              >
                                <img src={blockIcon} alt="" className={styles.dropdownIcon} />
                                ブロック
                              </button>
                              <button
                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                onClick={() => { setMenuOpen(false); setIsReportOpen(true); }}
                              >
                                <img src={reportIcon} alt="" className={styles.dropdownIcon} />
                                通報
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className={styles.editForm}>
                    {updateError && <p className={styles.editError}>{updateError}</p>}
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
                      isEmbedded
                    />
                  </div>
                ) : (
                  post.content && <p className={styles.postContent}>{post.content}</p>
                )}

                {!isEditing && post.media && post.media.length > 0 && (
                  <PostMediaGrid media={post.media} large />
                )}

                <div className={styles.timestamp}>
                  {new Date(post.createdAt).toLocaleString('ja-JP')}
                </div>

                <div className={styles.postStats}>
                  <span className={styles.replyCount}>
                    <img src={commentIcon} alt="返信" className={styles.commentIcon} />
                    <strong>{post.replyCount}</strong> 件の返信
                  </span>
                  <LikeButton post={post} currentUserId={userId} onLike={handleLike} large />
                </div>
              </div>
            )}

            {/* 🛡 ⭕️ 返信入力フォーム（メインが削除されていない場合のみ） */}
            {!isDeleted && (
              <div className={styles.replyComposer}>
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
              </div>
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
