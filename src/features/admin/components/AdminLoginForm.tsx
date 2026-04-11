import { useState } from 'react';
import { loginAdmin } from '../api/auth';

export const AdminLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. APIを呼び出す
      const data = await loginAdmin(email, password);
      
      // 2. 取得したトークンを localStorage に保存する
      // schemaによれば AdministratorAuthPayload から token が返ってくる
      localStorage.setItem('space_admin_token', data.loginAdministrator.token);
      
      alert('ログイン成功！');
      window.location.href = '/admin/dashboard'; // ログイン後の画面へ
    } catch (err) {
      alert('ログインに失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">管理者ログイン</button>
    </form>
  );
};