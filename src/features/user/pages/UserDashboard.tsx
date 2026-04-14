import { UserHeader } from '../components/UserHeader';

export const UserDashboard = () => {
  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <h1>マイページ</h1>
        <p>ようこそ！</p>
      </main>
    </div>
  );
};
