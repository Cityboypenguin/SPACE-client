import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { listMyCommunities, type Community } from '../api/community';

export const CommunityListPage = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    listMyCommunities()
      .then((data) => { if (active) setCommunities(data); })
      .catch(() => { if (active) setError('コミュニティの読み込みに失敗しました'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>コミュニティ</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/community/browse')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600 }}
            >
              コミュニティを探す
            </button>
            <button
              onClick={() => navigate('/community/create')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', background: '#646cff', border: 'none', color: '#fff', fontWeight: 600 }}
            >
              + 作成
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8' }}>読み込み中...</p>
        ) : communities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>参加しているコミュニティがありません</p>
            <button
              onClick={() => navigate('/community/browse')}
              style={{ padding: '0.6rem 1.4rem', borderRadius: '20px', background: '#646cff', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              コミュニティを探す
            </button>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {communities.map((c) => (
              <li
                key={c.ID}
                onClick={() => navigate(`/community/chat/${c.roomID}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.9rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: '#fff',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8faff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#646cff,#a78bfa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.description}
                  </div>
                </div>
                <span style={{ color: '#94a3b8' }}>›</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
