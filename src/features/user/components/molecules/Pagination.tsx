import styles from './Pagination.module.css';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export const Pagination = ({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: Props) => (
  <div className={styles.wrapper}>
    {totalPages > 1 && (
      <>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className={styles.pageBtn}
          style={{ cursor: page === 0 ? 'not-allowed' : 'pointer' }}
        >
          前へ
        </button>
        <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className={styles.pageBtn}
          style={{ cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
        >
          次へ
        </button>
        <span className={styles.divider} />
      </>
    )}
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      className={styles.pageSizeSelect}
    >
      {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}件</option>)}
    </select>
  </div>
);
