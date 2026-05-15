import { useNavigate } from 'react-router-dom';
import { ErrorCard } from '../molecules/ErrorCard';
import type { ErrorIconType } from '../atoms/ErrorIcon';

export type ErrorPageType = '403' | '500' | '503';

type PageConfig = {
  iconType: ErrorIconType;
  title: string;
  description: string;
  showRetry: boolean;
};

const PAGE_CONFIG: Record<ErrorPageType, PageConfig> = {
  '403': {
    iconType: 'forbidden',
    title: 'アクセスが拒否されました',
    description: 'この操作を行う権限がありません。',
    showRetry: false,
  },
  '500': {
    iconType: 'server',
    title: 'システムエラーが発生しました',
    description: 'システムに問題が発生しました。時間をおいて再度お試しください。',
    showRetry: true,
  },
  '503': {
    iconType: 'maintenance',
    title: '現在メンテナンス中です',
    description: 'ただいまシステムのメンテナンスを行っています。しばらくお待ちください。',
    showRetry: false,
  },
};

type Props = {
  type: ErrorPageType;
  errorId?: string;
  onRetry?: () => void;
};

export const ErrorPage = ({ type, errorId, onRetry }: Props) => {
  const navigate = useNavigate();
  const config = PAGE_CONFIG[type];

  const actions = [
    ...(config.showRetry && onRetry
      ? [{ label: '再試行する', onClick: onRetry, variant: 'primary' as const }]
      : []),
    { label: '前のページに戻る', onClick: () => navigate(-1), variant: 'secondary' as const },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <ErrorCard
        iconType={config.iconType}
        title={config.title}
        description={config.description}
        actions={actions}
      />
      {errorId && (
        <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
          エラーID: {errorId}
        </p>
      )}
    </div>
  );
};
