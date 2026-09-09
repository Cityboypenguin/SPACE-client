import styles from '../../styles/AdminShared.module.css';

type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  hidden?: boolean;
};

export const AdminPagination = ({ page, totalPages, onPrev, onNext, hidden = false }: Props) => {
  if (hidden || totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 0}
        className={styles.paginationButton}
      >
        前へ
      </button>
      <span className={styles.cellText}>{page + 1} / {totalPages}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages - 1}
        className={styles.paginationButton}
      >
        次へ
      </button>
    </div>
  );
};
