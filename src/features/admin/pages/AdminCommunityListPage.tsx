import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, type Community, type CommunitySortField, type SortOrder } from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminCommunityListPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('communities');
  const [query, setQuery] = useState('');
  // 検索ボタンで確定したキーワード。入力中の query で毎回検索し直さないよう分けて持つ。
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<CommunitySortField>('CREATED_AT');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  // 検索・並び替えは全件に対してサーバーで行い、1ページ分だけを受け取る。
  const loadPage = useCallback((p: number) => {
    setError('');
    getCommunities({ keyword: searchKeyword, sortBy, sortOrder, limit: pageSize, offset: p * pageSize })
      .then((data) => {
        setCommunities(data.communities.items);
        setTotal(data.communities.total);
        setPage(p);
      })
      .catch(() => setError(searchKeyword ? '検索に失敗しました' : 'コミュニティ一覧の取得に失敗しました'));
  }, [searchKeyword, sortBy, sortOrder, pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  // 検索実行
  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSearchKeyword(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    setSearchKeyword('');
  };

  // 同じ列をもう一度押すと昇順・降順を切り替える。名前は昇順、それ以外は降順から始める。
  const handleSort = (field: CommunitySortField) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      return;
    }
    setSortBy(field);
    setSortOrder(field === 'NAME' ? 'ASC' : 'DESC');
  };

  const sortableHeader = (field: CommunitySortField, label: string) => (
    <th
      className={styles.tableCellLarge}
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      aria-sort={sortBy === field ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {sortBy === field && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
    </th>
  );

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>コミュニティ管理</h1>
        </div>

        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.searchForm} style={{ marginBottom: 0 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="コミュニティ名・説明で検索"
              className={styles.select}
              style={{ width: '240px' }}
            />
            <button type="submit" className={styles.primaryButton}>検索</button>
            {query && (
              <button type="button" onClick={handleClear} className={styles.paginationButton}>
                クリア
              </button>
            )}
          </form>

          <div className={styles.toolbarGroup}>
            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        <div className={styles.tablePanelPlain}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                {sortableHeader('NAME', '名前')}
                <th className={styles.tableCellLarge}>説明</th>
                {sortableHeader('MEMBER_COUNT', 'メンバー数')}
                <th className={styles.tableCellLarge}>オーナー</th>
                {sortableHeader('CREATED_AT', '作成日時')}
              </tr>
            </thead>
            <tbody>
              {communities.map((community, index) => {
                const communityId = community.ID || (community as any).id;
                const formattedDate = community.createdAt
                  ? new Date(community.createdAt).toLocaleDateString('ja-JP')
                  : '-';

                return (
                  <tr
                    key={communityId || index}
                    onClick={() => {
                      if (!communityId) return;
                      navigate(`/admin/communities/${communityId}`, {
                        state: {
                          community: {
                            ...community,
                            ID: communityId,
                            id: communityId,
                          },
                        },
                      });
                    }}
                    className={styles.tableRow}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={styles.tableCellLarge}>{community.name}</td>
                    <td className={styles.tableCellLarge}>{community.description || '-'}</td>
                    <td className={styles.tableCellLarge}>{community.memberCount ?? 0} 人</td>
                    <td className={styles.tableCellLarge}>{community.owner?.name ?? '-'}</td>
                    <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>{formattedDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {communities.length === 0 && !error && (
          <p className={styles.emptyState}>コミュニティが見つかりませんでした</p>
        )}

        {totalPages > 1 && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => loadPage(page - 1)}
            onNext={() => loadPage(page + 1)}
          />
        )}
      </main>
    </div>
  );
};
