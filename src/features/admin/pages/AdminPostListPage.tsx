import { useCallback, useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getPosts, getPostByID, adminDeletePost, type Post, type PostStatusFilter } from '../api/posts';
import { useToast } from '../../../context/useToast';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../components/atoms/UserNameLink';
import { PostMediaGrid } from '../../../components/molecules/PostMediaGrid';
import styles from '../styles/AdminShared.module.css';

import favoriteIcon from '../../../assets/パーツ_いいね.svg';
import replyIcon from '../../../assets/パーツ_コメント.svg';
import pictureIcon from '../../../assets/パーツ_クリップ.svg';

const ReplyItem = ({
  reply,
  onDelete,
  onSelectPost,
}: {
  reply: Post;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onSelectPost: (id: string) => void;
}) => {
  const isDeleted = reply.deletedAt != null;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelectPost(reply.ID);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isDeleted ? '#fff1f2' : isHovered ? '#f1f5f9' : '#f8fafc',
        padding: '10px 12px',
        borderRadius: '6px',
        border: isHovered
          ? '1px solid #0284c7'
          : isDeleted
          ? '1px solid #fecdd3'
          : '1px solid #e2e8f0',
        opacity: isDeleted ? 0.7 : 1,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      {/* 削除済みバッジ */}
      {isDeleted && (
        <div
          style={{
            backgroundColor: '#ffe4e6',
            color: '#9f1239',
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '0.7rem',
            fontWeight: 600,
            marginBottom: '4px',
            width: 'fit-content',
          }}
        >
          削除済み ({new Date(reply.deletedAt!).toLocaleString('ja-JP')})
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: isDeleted ? '#881337' : '#0f172a' }}>
            {reply.user.name}
          </span>
          <span className={styles.cellMuted} style={{ fontSize: '0.75rem' }}>
            @{reply.user.accountID}
          </span>
        </div>

        {!isDeleted && (
          <button
            type="button"
            onClick={(e) => onDelete(e, reply.ID)}
            className={styles.primaryButton}
            style={{ backgroundColor: '#ef4444', padding: '2px 6px', fontSize: '0.7rem' }}
          >
            削除
          </button>
        )}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '0.85rem',
          color: isDeleted ? '#881337' : '#334155',
          whiteSpace: 'pre-wrap',
          textDecoration: isDeleted ? 'line-through' : 'none',
        }}
      >
        {reply.content}
      </p>

      {/* メディア */}
      {reply.media && reply.media.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <PostMediaGrid media={reply.media} />
        </div>
      )}

      {/* 孫投稿ツリー（ネスト表示） */}
      {reply.replies && reply.replies.length > 0 && (
        <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reply.replies.map((childReply) => (
            <ReplyItem
              key={childReply.ID}
              reply={childReply}
              onDelete={onDelete}
              onSelectPost={onSelectPost}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminPostListPage = () => {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('posts');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  // 入力のたびにリクエストしないよう、少し待ってからサーバーへ渡す。
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Post | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const handleSelectPost = useCallback(
    async (postId: string) => {
      setSelectedPostId(postId);
      setLoadingDetail(true);
      try {
        const fullPost = await getPostByID(postId);
        setDetailData(fullPost);
      } catch {
        addToast('詳細データの取得に失敗しました', 'error');
      } finally {
        setLoadingDetail(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 絞り込みは全件に対してサーバーで行い、1ページ分だけを受け取る。
  const loadPage = useCallback(
    (p: number, size = pageSize) => {
      setError('');
      getPosts(size, p * size, { keyword: debouncedQuery, status: statusFilter })
        .then((data) => {
          setPosts(data.items);
          setTotal(data.total);
          setPage(p);

          setSelectedPostId((prev) => {
            if (!prev && data.items.length > 0) {
              void handleSelectPost(data.items[0].ID);
              return data.items[0].ID;
            }
            return prev;
          });
        })
        .catch(() => setError('投稿の読み込みに失敗しました'));
    },
    [pageSize, debouncedQuery, statusFilter, handleSelectPost]
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  // ツリー全階層対応の再帰削除更新
  const updateRepliesRecursively = (replies: Post[] | undefined, targetId: string, deletedAt: string): Post[] | undefined => {
    if (!replies) return replies;
    return replies.map((r) => {
      if (r.ID === targetId) {
        return { ...r, deletedAt };
      }
      if (r.replies && r.replies.length > 0) {
        return { ...r, replies: updateRepliesRecursively(r.replies, targetId, deletedAt) };
      }
      return r;
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('この投稿を削除しますか？')) return;
    try {
      await adminDeletePost(id);
      const deletedAt = new Date().toISOString();

      setPosts((prev) => prev.map((p) => (p.ID === id ? { ...p, deletedAt } : p)));

      setDetailData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          deletedAt: prev.ID === id ? deletedAt : prev.deletedAt,
          rootPost:
            prev.rootPost && prev.rootPost.ID === id
              ? { ...prev.rootPost, deletedAt }
              : prev.rootPost,
          replies: updateRepliesRecursively(prev.replies, id, deletedAt),
        };
      });

      addToast('投稿を削除しました', 'success');
    } catch {
      addToast('削除に失敗しました', 'error');
    }
  };

  // 絞り込み自体はサーバー側。ここでは「公開中のみ」の表示中にこの画面で削除した投稿を消すだけ。
  const filteredPosts = statusFilter === 'active' ? posts.filter((post) => post.deletedAt == null) : posts;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered} style={{ maxWidth: '1280px' }}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>投稿管理</h1>
        </div>

        {/* 検索・絞り込みツールバー */}
        <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className={styles.toolbarGroup}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="本文・投稿者名で検索"
              className={styles.select}
              style={{ width: '240px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PostStatusFilter)}
              className={styles.select}
            >
              <option value="all">すべてのステータス</option>
              <option value="active">公開中のみ</option>
              <option value="deleted">削除済みのみ</option>
            </select>
          </div>

          <div className={styles.toolbarGroup}>
            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} muted />
          </div>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        {/* 2カラムレイアウト */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '20px', alignItems: 'start' }}>
          
          {/* 左カラム：投稿一覧 */}
          <div>
            <div className={styles.tablePanelPlain} style={{ padding: 0 }}>
              {filteredPosts.map((post, index) => {
                const isDeleted = post.deletedAt != null;
                const isSelected = selectedPostId === post.ID;
                const p = post as any;
                const likesCount = p.favoriteCount ?? p.likeCount ?? p.likesCount ?? 0;
                const repliesCount = post.replyCount ?? post.replies?.length ?? 0;

                return (
                  <div
                    key={post.ID}
                    onClick={() => void handleSelectPost(post.ID)}
                    style={{
                      padding: '14px 18px',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      opacity: isDeleted ? 0.6 : 1,
                      backgroundColor: isSelected ? '#f0f9ff' : isDeleted ? '#fafafa' : '#ffffff',
                      borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent',
                      borderBottom: index < filteredPosts.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {/* 削除済みバッジ */}
                    {isDeleted && (
                      <div
                        style={{
                          backgroundColor: '#fff1f2',
                          color: '#9f1239',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          marginBottom: '6px',
                          width: 'fit-content',
                          border: '1px solid #fecdd3',
                        }}
                      >
                        削除済み ({new Date(post.deletedAt!).toLocaleString('ja-JP')})
                      </div>
                    )}

                    {/* 投稿者情報 ＆ 削除ボタン */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <UserAvatar
                          userId={post.user.ID}
                          name={post.user.name}
                          avatarUrl={post.user.avatarUrl}
                          size={32}
                          basePath="/admin/users"
                          useMyPageForCurrentUser={false}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <UserNameLink userId={post.user.ID} basePath="/admin/users" useMyPageForCurrentUser={false}>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{post.user.name}</span>
                          </UserNameLink>
                          <span className={styles.cellMuted} style={{ fontSize: '0.8rem' }}>
                            @{post.user.accountID}
                          </span>
                        </div>
                      </div>

                      {!isDeleted && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, post.ID)}
                          className={styles.primaryButton}
                          style={{ backgroundColor: '#ef4444', padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          削除
                        </button>
                      )}
                    </div>

                    {/* 本文 */}
                    {post.content && (
                      <p
                        style={{
                          fontSize: '0.9rem',
                          lineHeight: 1.45,
                          color: '#334155',
                          margin: '0 0 6px 0',
                          whiteSpace: 'pre-wrap',
                          paddingLeft: '40px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {post.content}
                      </p>
                    )}

                    {/* メディア存在バッジ */}
                    {post.media && post.media.length > 0 && (
                      <div style={{ paddingLeft: '40px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#e2e8f0',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <img src={pictureIcon} alt="メディア" width={14} height={14} /> 添付メディア {post.media.length}件
                        </span>
                      </div>
                    )}

                    {/* リアクション数・日時 */}
                    <div
                      style={{
                        paddingLeft: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '0.8rem',
                        color: '#64748b',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src={replyIcon} alt="返信" width={14} height={14} /> <strong>{repliesCount}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src={favoriteIcon} alt="いいね" width={14} height={14} /> <strong>{likesCount}</strong>
                      </span>
                      <span>· {new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPosts.length === 0 && !error && <p className={styles.emptyState}>該当する投稿が見つかりませんでした</p>}

            {totalPages > 1 && (
              <div style={{ marginTop: '16px' }}>
                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  onPrev={() => loadPage(page - 1)}
                  onNext={() => loadPage(page + 1)}
                />
              </div>
            )}
          </div>

          {/* 右カラム：スレッド・詳細プレビュー */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <div className={styles.tablePanelPlain} style={{ padding: '18px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>スレッド・詳細</h2>
                {detailData && (
                  <span className={styles.cellMuted} style={{ fontSize: '0.75rem' }}>
                    ID: {detailData.ID.slice(0, 8)}...
                  </span>
                )}
              </div>

              {!selectedPostId ? (
                <p className={styles.emptyState} style={{ padding: '40px 0' }}>
                  左一覧から投稿をクリックすると
                  <br />
                  親投稿や返信の会話ツリーが表示されます
                </p>
              ) : loadingDetail ? (
                <p className={styles.cellMuted} style={{ padding: '30px 0', textAlign: 'center' }}>
                  詳細を読み込み中...
                </p>
              ) : detailData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* ① 親投稿（クリックでその親投稿に移動） */}
                  {detailData.rootPost && (() => {
                    const isRootDeleted = detailData.rootPost.deletedAt != null;
                    return (
                      <div
                        onClick={() => void handleSelectPost(detailData.rootPost!.ID)}
                        style={{
                          backgroundColor: isRootDeleted ? '#fff1f2' : '#f8fafc',
                          padding: '12px',
                          borderRadius: '6px',
                          borderLeft: isRootDeleted ? '3px solid #f43f5e' : '3px solid #94a3b8',
                          border: isRootDeleted ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                          opacity: isRootDeleted ? 0.7 : 1,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isRootDeleted ? '#9f1239' : '#64748b' }}>
                            親投稿 (返信元)
                          </div>
                          {isRootDeleted && (
                            <span
                              style={{
                                backgroundColor: '#ffe4e6',
                                color: '#9f1239',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                              }}
                            >
                              削除済み ({new Date(detailData.rootPost.deletedAt!).toLocaleString('ja-JP')})
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isRootDeleted ? '#881337' : '#0f172a' }}>
                          {detailData.rootPost.user.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: isRootDeleted ? '#881337' : '#334155',
                            marginTop: '4px',
                            whiteSpace: 'pre-wrap',
                            textDecoration: isRootDeleted ? 'line-through' : 'none',
                          }}
                        >
                          {detailData.rootPost.content}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ② 選択中のメイン投稿 */}
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    {detailData.deletedAt && (
                      <div
                        style={{
                          backgroundColor: '#fff1f2',
                          color: '#9f1239',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          marginBottom: '8px',
                          width: 'fit-content',
                          border: '1px solid #fecdd3',
                        }}
                      >
                        削除済み ({new Date(detailData.deletedAt).toLocaleString('ja-JP')})
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <UserAvatar
                          userId={detailData.user.ID}
                          name={detailData.user.name}
                          avatarUrl={detailData.user.avatarUrl}
                          size={36}
                          basePath="/admin/users"
                          useMyPageForCurrentUser={false}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailData.user.name}</div>
                          <div className={styles.cellMuted} style={{ fontSize: '0.75rem' }}>
                            @{detailData.user.accountID}
                          </div>
                        </div>
                      </div>

                      {!detailData.deletedAt && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, detailData.ID)}
                          className={styles.primaryButton}
                          style={{ backgroundColor: '#ef4444', padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          削除
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '0.95rem', color: '#1e293b', margin: '0 0 10px 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {detailData.content}
                    </p>

                    {detailData.media && detailData.media.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <PostMediaGrid media={detailData.media} />
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        paddingTop: '8px',
                        borderTop: '1px solid #f1f5f9',
                      }}
                    >
                      <span>{new Date(detailData.createdAt).toLocaleString('ja-JP')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <img src={replyIcon} alt="返信" width={14} height={14} /> {(detailData.replies?.length ?? detailData.replyCount ?? 0)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <img src={favoriteIcon} alt="いいね" width={14} height={14} />{' '}
                          {(() => {
                            const dp = detailData as any;
                            return dp.favoriteCount ?? dp.likeCount ?? dp.likesCount ?? 0;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ③ 返信・孫投稿ツリー（クリックで直接スレッド移動） */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img src={replyIcon} alt="返信ツリー" width={15} height={15} /> 返信ツリー ({detailData.replies?.length ?? 0} 件)
                    </div>

                    {!detailData.replies || detailData.replies.length === 0 ? (
                      <p className={styles.cellMuted} style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                        この投稿への返信はありません
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {detailData.replies.map((reply) => (
                          <ReplyItem
                            key={reply.ID}
                            reply={reply}
                            onDelete={handleDelete}
                            onSelectPost={(id) => void handleSelectPost(id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
