import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api/auth';

export const AdminLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginAdmin(email, password);
      localStorage.setItem('space_admin_token', data.loginAdministrator.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>管理者ログイン</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">ログイン</button>
    </form>
  );
};