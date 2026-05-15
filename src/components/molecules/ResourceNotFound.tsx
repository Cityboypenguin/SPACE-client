import { ErrorCard } from './ErrorCard';

type Props = {
  message?: string;
  onBack?: () => void;
};

export const ResourceNotFound = ({ message, onBack }: Props) => (
  <ErrorCard
    iconType="not-found"
    title="データが見つかりません"
    description={message ?? 'このデータは存在しないか、削除された可能性があります。'}
    actions={
      onBack ? [{ label: '一覧に戻る', onClick: onBack, variant: 'secondary' }] : undefined
    }
    compact
  />
);
