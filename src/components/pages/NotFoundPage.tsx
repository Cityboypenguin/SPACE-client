import { useNavigate } from 'react-router-dom';
import { ErrorCard } from '../molecules/ErrorCard';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <ErrorCard
        iconType="not-found"
        title="ページが見つかりませんでした"
        description="お探しのページは存在しないか、移動または削除された可能性があります。"
        actions={[
          { label: 'ホームに戻る', onClick: () => navigate('/mypage'), variant: 'primary' },
          { label: '前のページに戻る', onClick: () => navigate(-1), variant: 'secondary' },
        ]}
      />
    </div>
  );
};
