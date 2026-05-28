import { useEffect, useState, useRef } from 'react';
import { Avatar } from '../../../../components/atoms/Avatar';
import { RoleBadge } from '../atoms/RoleBadge';
import {
  getCommunityMembers,
  updateCommunityInfo,
  kickUserFromCommunity,
  promoteToCommunityOwner,
  demoteFromCommunityOwner,
  getPresignedCommunityIconUploadUrl,
  type Community,
  type CommunityMember,
} from '../../api/community';
import { uploadAvatarToStorage } from '../../api/profile';
import { storageUrl } from '../../../../lib/storage';

type Props = {
  community: Community;
  onClose: () => void;
  onUpdated: (updated: Community) => void;
};

const ROLE_OWNER = 'owner';

export const CommunitySettingsModal = ({ community, onClose, onUpdated }: Props) => {
  const [tab, setTab] = useState<'info' | 'members'>('info');
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const [membersError, setMembersError] = useState('');
  const isInitialNone = !community.avatarURL || community.avatarURL === 'none' || community.avatarURL === '';
  const hasValidAvatar = 
    community.avatarURL && 
    community.avatarURL !== '' && 
    !community.avatarURL.includes('none');
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    hasValidAvatar ? (storageUrl(community.avatarURL) || null) : null
  );
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isIconDeleted, setIsIconDeleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCommunityMembers(community.ID)
      .then(setMembers)
      .catch(() => setMembersError('メンバー一覧の取得に失敗しました'));
  }, [community.ID]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsIconDeleted(false);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');
    setSaving(true);

    try {
      let newAvatarKey: string | undefined = undefined;
      if (selectedFile) {
        const response = await getPresignedCommunityIconUploadUrl(selectedFile.type);
        const { uploadUrl, objectKey } = response.presignedCommunityIconUploadUrl;
        await uploadAvatarToStorage(uploadUrl, selectedFile);
        newAvatarKey = objectKey;
      } else if (isIconDeleted) {
        newAvatarKey = 'none';
      }

      const input: { name?: string; description?: string; avatarKey?: string } = {};
      if (name !== community.name) input.name = name;
      if (description !== community.description) input.description = description;
      if (newAvatarKey !== undefined) {
        input.avatarKey = newAvatarKey;
      }
      
      const updated = await updateCommunityInfo(community.ID, input);
      setInfoSuccess('更新しました');
      onUpdated(updated);
      setSelectedFile(null);
    } catch (err) {
      setInfoError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleKick = async (member: CommunityMember) => {
    if (!window.confirm(`${member.user.name} をコミュニティから削除しますか？`)) return;
    try {
      await kickUserFromCommunity(community.ID, member.user.ID);
      setMembers((prev) => prev.filter((m) => m.user.ID !== member.user.ID));
    } catch {
      setMembersError('キックに失敗しました');
    }
  };

  const handlePromote = async (member: CommunityMember) => {
    if (!window.confirm(`${member.user.name} をオーナーに昇格しますか？`)) return;
    try {
      await promoteToCommunityOwner(community.ID, member.user.ID);
      setMembers((prev) =>
        prev.map((m) => (m.user.ID === member.user.ID ? { ...m, role: ROLE_OWNER } : m)),
      );
    } catch {
      setMembersError('昇格に失敗しました');
    }
  };

  const handleDemote = async (member: CommunityMember) => {
    if (!window.confirm(`${member.user.name} をメンバーに降格しますか？`)) return;
    try {
      await demoteFromCommunityOwner(community.ID, member.user.ID);
      setMembers((prev) =>
        prev.map((m) => (m.user.ID === member.user.ID ? { ...m, role: 'member' } : m)),
      );
    } catch {
      setMembersError('降格に失敗しました');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 12, width: '90%', maxWidth: 520,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>コミュニティ設定</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {(['info', 'members'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                background: tab === t ? '#f8faff' : 'transparent',
                borderBottom: tab === t ? '2px solid #646cff' : '2px solid transparent',
                color: tab === t ? '#646cff' : '#64748b',
                fontWeight: tab === t ? 600 : 400,
              }}
            >
              {t === 'info' ? 'コミュニティ情報' : 'メンバー管理'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {tab === 'info' && (
            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {infoError && <p style={{ color: 'red', margin: 0 }}>{infoError}</p>}
              {infoSuccess && <p style={{ color: '#16a34a', margin: 0 }}>{infoSuccess}</p>}
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                  title="クリックして画像を変更"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Avatar name={name} size={120} />
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', padding: '2px 0' }}>
                    変更
                  </div>
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setIsIconDeleted(true);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#ef4444', 
                      fontSize: '0.8rem', cursor: 'pointer', padding: '4px 8px',
                      textDecoration: 'underline'
                    }}
                  >
                    画像を削除する
                  </button>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>コミュニティ名</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                style={{ alignSelf: 'flex-end', padding: '0.5rem 1.5rem', borderRadius: 8, background: saving ? '#94a3b8' : '#646cff', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          )}

          {tab === 'members' && (
            <div>
              {membersError && <p style={{ color: 'red', margin: '0 0 0.75rem' }}>{membersError}</p>}
              {members.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>メンバーがいません</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {members.map((m) => (
                    <li
                      key={m.user.ID}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0',
                      }}
                    >
                      <Avatar name={m.user.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>
                          {m.role === ROLE_OWNER && (
                            <span style={{ marginRight: 4 }} title="オーナー"></span>
                          )}
                          {m.user.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>@{m.user.accountID}</div>
                      </div>
                      <RoleBadge role={m.role} />
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        {m.role === ROLE_OWNER ? (
                          <button
                            onClick={() => handleDemote(m)}
                            style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#64748b' }}
                          >
                            降格
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromote(m)}
                            style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, border: '1px solid #a78bfa', background: '#fff', cursor: 'pointer', color: '#7c3aed' }}
                          >
                            オーナーにする
                          </button>
                        )}
                        <button
                          onClick={() => handleKick(m)}
                          style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', cursor: 'pointer', color: '#ef4444' }}
                        >
                          キック
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
