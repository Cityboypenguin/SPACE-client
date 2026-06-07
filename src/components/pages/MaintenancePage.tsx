export const MaintenancePage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>メンテナンス中</h1>
      <p style={{ fontSize: '1.1rem', color: '#555', maxWidth: '480px' }}>
        現在、システムメンテナンスを実施しています。<br />
        ご不便をおかけして申し訳ございません。<br />
        メンテナンス終了後、改めてアクセスしてください。
      </p>
    </div>
  );
};
