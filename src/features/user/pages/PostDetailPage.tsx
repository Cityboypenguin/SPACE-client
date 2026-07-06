import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyThread } from '../components/organisms/ReplyThread';
import { PostCard } from '../components/organisms/PostCard';
import { ReportModal } from '../components/organisms/ReportModal';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { PostMediaGrid } from '../../../components/molecules/PostMediaGrid';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../components/atoms/UserNameLink';
import { LikeButton } from '../../../components/molecules/LikeButton';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import commentIcon from '../../../assets/パーツ_コメント.svg';
import reportIcon from '../../../assets/パーツ_通報.svg';
import redblockIcon from '../../../assets/パーツ_ブロック（赤）.svg';
import editIcon from '../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../assets/パーツ_削除.svg';
import styles from './PostDetailPage.module.css';
import swal from 'sweetalert2';

import {
  getPostByID,
  createPost,
  updatePost,
  deletePost,
  createFavorite,
  deleteFavorite,
  type Post,
} from '../api/post';
import { uploadMediaFiles } from '../api/media';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { createBlocker } from '../api/block';
import { useToast } from '../../../context/ToastContext';
import { removePostAcrossCaches, updatePostAcrossCaches } from '../cache/postListCache';
import { renderTextWithLinks } from '../../../lib/renderTextWithLinks';

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);
  const { addToast } = useToast();

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
  const [reportTarget, setReportTarget] = useState<Post | null>(null);
  const [editingRootPost, setEditingRootPost] = useState<Post | null>(null);
  const [rootEditContent, setRootEditContent] = useState('');
  const [rootEditSelectedFiles, setRootEditSelectedFiles] = useState<File[]>([]);
  const [rootEditDeletedMediaIDs, setRootEditDeletedMediaIDs] = useState<string[]>([]);
  const [isRootUpdating, setIsRootUpdating] = useState(false);
  const [rootUpdateError, setRootUpdateError] = useState('');
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
    const result = await swal.fire({
      text: 'このユーザーをブロックしますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await createBlocker(blockedUserId);
      addToast('ユーザーをブロックしました', 'success');
      navigate(-1);
    } catch (err) {
      console.error(err);
      addToast('ブロックに失敗しました', 'error');
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
      updatePostAcrossCaches(postId, updater);
    }
    void mutate();
  };

  const handleReplyToPost = async (content: string, files: File[]) => {
    if (!replyingTo) return;
    const mediaInputs = await uploadMediaFiles(files);
    await createPost(content.trim(), replyingTo.ID, mediaInputs);
    if (id) {
      const updater = (p: Post): Post => ({ ...p, replyCount: p.replyCount + 1 });
      updatePostAcrossCaches(id, updater);
    }
    void mutate();
  };

  const handleReply = async () => {
    if ((!replyContent.trim() && replyFiles.length === 0) || replying || !id) return;
    setReplying(true);
    setReplyError('');
    try {
      const mediaInputs = await uploadMediaFiles(replyFiles);
      await createPost(replyContent.trim(), id, mediaInputs);
      setReplyContent('');
      setReplyFiles([]);
      if (id) {
        const updater = (p: Post): Post => ({ ...p, replyCount: p.replyCount + 1 });
        updatePostAcrossCaches(id, updater);
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
      const mediaInputs = await uploadMediaFiles(editSelectedFiles);

      const deletedIDs = [...editDeletedMediaIDs];
      await updatePost(id, editContent.trim(), mediaInputs, deletedIDs);

      setIsEditing(false);
      setEditSelectedFiles([]);
      setEditDeletedMediaIDs([]);
      mutate().then(updatedPost => {
        if (updatedPost && id) {
          const filtered = {
            ...updatedPost,
            media: updatedPost.media?.filter(m => !deletedIDs.includes(m.ID)) ?? [],
          };
          updatePostAcrossCaches(id, () => filtered);
        }
      });
    } catch (err) {
      setUpdateError(toUserMessage(err, '投稿の更新に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRootEditOpen = (rootPost: Post) => {
    setEditingRootPost(rootPost);
    setRootEditContent(rootPost.content);
    setRootEditSelectedFiles([]);
    setRootEditDeletedMediaIDs([]);
    setRootUpdateError('');
  };

  const handleRootUpdate = async () => {
    if (!editingRootPost || isRootUpdating) return;
    const remainingExistingMedia = editingRootPost.media?.filter(
      media => !rootEditDeletedMediaIDs.includes(media.ID),
    ) ?? [];
    const hasAnyMedia = remainingExistingMedia.length > 0 || rootEditSelectedFiles.length > 0;
    if (!rootEditContent.trim() && !hasAnyMedia) return;

    setIsRootUpdating(true);
    setRootUpdateError('');
    try {
      const mediaInputs = await uploadMediaFiles(rootEditSelectedFiles);
      const updatedPost = await updatePost(
        editingRootPost.ID,
        rootEditContent.trim(),
        mediaInputs,
        rootEditDeletedMediaIDs,
      );
      const filteredPost = {
        ...updatedPost,
        media: updatedPost.media?.filter(media => !rootEditDeletedMediaIDs.includes(media.ID)) ?? [],
      };
      updatePostAcrossCaches(editingRootPost.ID, () => filteredPost);
      setEditingRootPost(null);
      await mutate();
    } catch (err) {
      setRootUpdateError(toUserMessage(err, '投稿の更新に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setIsRootUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await swal.fire({
      text: '本当にこの投稿を削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deletePost(id);
      removePostAcrossCaches(id);
      navigate(-1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRootDelete = async (postId: string) => {
    const result = await swal.fire({
      text: '本当にこの投稿を削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deletePost(postId);
      removePostAcrossCaches(postId);
      setEditingRootPost(null);
      await mutate();
    } catch (err) {
      console.error(err);
      addToast('削除に失敗しました', 'error');
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
                  <div className={styles.deletedPost}>投稿が見つかりません</div>
                ) : editingRootPost?.ID === post.rootPost.ID ? (
                  <PostComposer
                    value={rootEditContent}
                    onChange={setRootEditContent}
                    onSubmit={handleRootUpdate}
                    submitting={isRootUpdating}
                    error={rootUpdateError}
                    userId={userId}
                    avatarUrl={profile?.avatarUrl}
                    userName={profile?.user.name}
                    selectedFiles={rootEditSelectedFiles}
                    onFileSelect={setRootEditSelectedFiles}
                    existingMedia={editingRootPost.media}
                    deletedMediaIDs={rootEditDeletedMediaIDs}
                    onDeleteExistingMedia={(mediaId) => setRootEditDeletedMediaIDs(prev => [...prev, mediaId])}
                    onCancel={() => setEditingRootPost(null)}
                    submitLabel="保存する"
                    submittingLabel="保存中..."
                    placeholder="投稿を編集..."
                    maxLength={500}
                    rows={3}
                  />
                ) : (
                  <PostCard
                    post={post.rootPost}
                    currentUserId={userId}
                    onLike={handleLike}
                    onClick={() => navigate(`/posts/${post.rootPost!.ID}`)}
                    onBlock={handleBlock}
                    onReport={() => setReportTarget(post.rootPost)}
                    onEdit={handleRootEditOpen}
                    onDelete={handleRootDelete}
                  />
                )}
                <div className={styles.threadConnector} />
              </div>
            )}

            {isDeleted ? (
              <div className={styles.deletedMain}>投稿が見つかりません</div>
            ) : (
              <div className={styles.postBody}>
                <div className={styles.postBodyHeader}>
                  <div className={styles.userInfo}>
                    <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
                    <div className={styles.userNameBlock}>
                      <UserNameLink userId={post.user.ID}>
                        <div className={styles.userName}>{post.user.name}</div>
                      </UserNameLink>
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
                                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                onClick={() => { setMenuOpen(false); handleBlock(post.user.ID); }}
                              >
                                <img src={redblockIcon} alt="" className={styles.dropdownIcon} />
                                ブロック
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={() => { setMenuOpen(false); setReportTarget(post); }}
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
                  post.content && <p className={styles.postContent}>{renderTextWithLinks({ text: post.content })}</p>
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

            {reportTarget && (
              <ReportModal
                isOpen={true}
                onClose={() => setReportTarget(null)}
                targetType="POST"
                targetID={reportTarget.ID}
                postContent={reportTarget.content}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
