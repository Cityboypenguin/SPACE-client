const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export const Pagination = ({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: Props) => (
  <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
    {totalPages > 1 && (
      <>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', color: '#475569' }}
        >
          前へ
        </button>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{page + 1} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', color: '#475569' }}
        >
          次へ
        </button>
        <span style={{ width: '1px', height: '1rem', background: '#e2e8f0', margin: '0 0.25rem' }} />
      </>
    )}
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      style={{ padding: '0.3rem 0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}
    >
      {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}件</option>)}
    </select>
  </div>
);
