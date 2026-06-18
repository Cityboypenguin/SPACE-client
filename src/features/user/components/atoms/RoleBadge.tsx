type Props = {
  role: string;
  onClick?: () => void;
};

export const RoleBadge = ({ role, onClick }: Props) => {
  const isOwner = role === 'owner';
  return (
    <span
      onClick={onClick}
      style={{
        fontSize: '0.72rem',
        padding: '2px 8px',
        borderRadius: 20,
        background: isOwner ? '#ede9fe' : '#f1f5f9',
        color: isOwner ? '#7c3aed' : '#64748b',
        fontWeight: 600,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {isOwner ? 'オーナー' : 'メンバー'}
    </span>
  );
};
