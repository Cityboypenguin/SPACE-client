import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  getAdministratorByID,
  updateAdministrator,
  deleteAdministrator,
  type Administrator,
} from '../api/administrators';
import { AdminHeader } from '../components/organisms/AdminHeader';
import styles from '../styles/AdminShared.module.css';

export const AdminAdministratorEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    getAdministratorByID(id)
      .then((data) => {
        const a = data.getAdministratorByID;
        if (!a) {
          setError('管理者が見つかりません');
          return;
        }
        setAdministrator(a);
        setName(a.name);
        setEmail(a.email);
      })
      .catch(() => setError('管理者情報の取得に失敗しました'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!id || !administrator) return;
    try {
      const updatedName = name !== administrator.name ? name : undefined;
      const updatedEmail = email !== administrator.email ? email : undefined;
      const updatedPassword = password || undefined;

      const data = await updateAdministrator(id, updatedName, updatedEmail, updatedPassword);
      setAdministrator(data.updateAdministrator);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('この管理者アカウントを削除しますか？')) return;
    try {
      await deleteAdministrator(id);
      navigate('/admin/administrators');
    } catch {
      setError('削除に失敗しました');
    }
  };

  if (!administrator) return <p className={styles.pageCentered}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>管理者アカウントの編集</h1>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}
        {success && <p className={styles.centerError} style={{ color: '#10b981' }}>{success}</p>}
        <button
            type="button"
            onClick={() => navigate('/admin/administrators')}
            className={styles.paginationButton}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 一覧に戻る
          </button>
          
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 編集フォーム */}
          <form onSubmit={handleSubmit} className={styles.tablePanelPlain} style={{ padding: '24px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                名前
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                新しいパスワード（変更する場合のみ）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="変更しない場合は空欄"
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/administrators')}
                className={styles.paginationButton}
              >
                キャンセル
              </button>
              <button type="submit" className={styles.primaryButton}>
                保存
              </button>
            </div>
          </form>

          {/* 削除エリア */}
          <div className={styles.tablePanelPlain} style={{ padding: '20px', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.95rem' }}>管理者アカウントの削除</div>
              <div style={{ fontSize: '0.8rem', color: '#9f1239', marginTop: '2px' }}>この操作は取り消せません。</div>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className={styles.primaryButton}
              style={{ backgroundColor: '#ef4444' }}
            >
              アカウントを削除
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
