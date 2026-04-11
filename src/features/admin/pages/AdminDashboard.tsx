import { AdminHeader } from '../components/AdminHeader';

export const AdminDashboard = () => {
  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>ダッシュボード</h1>
        <p>管理画面へようこそ。</p>
      </main>
    </div>
  );
};
