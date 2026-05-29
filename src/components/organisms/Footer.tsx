import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid #e2e8f0',
      padding: '1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#64748b',
      marginTop: 'auto',
    }}>
      <Link to="/inquiry" style={{ color: '#64748b', textDecoration: 'underline' }}>
        お問い合わせ
      </Link>
    </footer>
  );
};
