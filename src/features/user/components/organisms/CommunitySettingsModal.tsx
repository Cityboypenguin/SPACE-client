import { useEffect, useState, useRef } from 'react';
import { Avatar } from '../../../../components/atoms/Avatar';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { RoleBadge } from '../atoms/RoleBadge';
import { ImageCropModal } from './ImageCropModal';
import { toUserMessage } from '../../../../lib/errorMessages';
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
import { AppSwal } from '../../../../lib/swal';
import styles from './CommunitySettingsModal.module.css';

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
  const hasValidAvatar =
    community.avatarURL && 
    community.avatarURL !== '' && 
    !community.avatarURL.includes('none');
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    hasValidAvatar ? (storageUrl(community.avatarURL) || null) : null
  );
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<{ imageSrc: string; file: File } | null>(null);
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

    if (file.type === 'image/svg+xml') {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsIconDeleted(false);
    } else {
      setCropTarget({ imageSrc: URL.createObjectURL(file), file });
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    setSelectedFile(croppedFile);
    setPreviewUrl(croppedPreviewUrl);
    setIsIconDeleted(false);
    setCropTarget(null);
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
      setInfoError(toUserMessage(err, 'コミュニティ情報の更新に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setSaving(false);
    }
  };

  const handleKick = async (member: CommunityMember) => {
    const result = await AppSwal.fire({
      text: `${member.user.name} をコミュニティから削除しますか？`,
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await kickUserFromCommunity(community.ID, member.user.ID);
      setMembers((prev) => prev.filter((m) => m.user.ID !== member.user.ID));
    } catch (err) {
      setMembersError(toUserMessage(err, 'メンバーの削除に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  const handlePromote = async (member: CommunityMember) => {
    const result = await AppSwal.fire({
      text: `${member.user.name} をオーナーに昇格しますか？`,
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await promoteToCommunityOwner(community.ID, member.user.ID);
      setMembers((prev) =>
        prev.map((m) => (m.user.ID === member.user.ID ? { ...m, role: ROLE_OWNER } : m)),
      );
    } catch (err) {
      setMembersError(toUserMessage(err, 'オーナーへの昇格に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  const handleDemote = async (member: CommunityMember) => {
    const result = await AppSwal.fire({
      text: `${member.user.name} をメンバーに降格しますか？`,
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await demoteFromCommunityOwner(community.ID, member.user.ID);
      setMembers((prev) =>
        prev.map((m) => (m.user.ID === member.user.ID ? { ...m, role: 'member' } : m)),
      );
    } catch (err) {
      setMembersError(toUserMessage(err, 'メンバーへの降格に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>コミュニティ設定</h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.tabs}>
          {(['info', 'members'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${styles.tabButton} ${tab === t ? styles.tabButtonActive : ''}`}
            >
              {t === 'info' ? 'コミュニティ情報' : 'メンバー管理'}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {tab === 'info' && (
            <form onSubmit={handleSaveInfo} className={styles.form}>
              {infoError && <p className={styles.errorText}>{infoError}</p>}
              {infoSuccess && <p className={styles.successText}>{infoSuccess}</p>}

              <div className={styles.avatarSection}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.avatarWrap}
                  title="クリックして画像を変更"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className={styles.avatarPreview} />
                  ) : (
                    <Avatar name={name} size={120} />
                  )}
                  <div className={styles.avatarEditLabel}>
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
                    className={styles.deleteImageButton}
                  >
                    画像を削除する
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className={styles.hiddenInput}
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>コミュニティ名</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.textInput}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${styles.textInput} ${styles.textarea}`}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className={`${styles.saveButton} ${saving ? styles.saveButtonDisabled : styles.saveButtonActive}`}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          )}

          {tab === 'members' && (
            <div>
              {membersError && <p className={`${styles.errorText} ${styles.errorTextSpaced}`}>{membersError}</p>}
              <div
                className={styles.membersHeaderDivider}
              >
                <span className={styles.membersHeaderLabel}>
                  現在のメンバー
                </span>
                <span className={styles.memberCountBadge}>
                  {members.length} 人
                </span>
              </div>
              {members.length === 0 ? (
                <p className={styles.emptyText}>メンバーがいません</p>
              ) : (
                <ul className={styles.memberList}>
                  {members.map((m) => (
                    <li
                      key={m.user.ID}
                      className={styles.memberItem}
                    >
                      <UserAvatar
                        userId={m.user.ID}
                        name={m.user.name}
                        avatarUrl={m.user.avatarUrl ? storageUrl(m.user.avatarUrl) : undefined}
                        size={36}
                      />
                      <div className={styles.memberText}>
                        <div className={styles.memberNameBlock}>
                          <UserNameLink userId={m.user.ID}>
                            <div className={styles.memberName}>
                              {m.user.name}
                            </div>
                          </UserNameLink>
                          <div className={styles.memberAccountId}>
                            @{m.user.accountID}
                          </div>
                        </div>
                      </div>
                      <RoleBadge role={m.role} />
                      <div className={styles.memberActions}>
                        {m.role === ROLE_OWNER ? (
                          <button
                            onClick={() => handleDemote(m)}
                            className={styles.demoteButton}
                          >
                            降格
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromote(m)}
                            className={styles.promoteButton}
                          >
                            オーナーにする
                          </button>
                        )}
                        <button
                          onClick={() => handleKick(m)}
                          className={styles.kickButton}
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

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.imageSrc}
          fileName={cropTarget.file.name}
          mimeType={cropTarget.file.type}
          onCancel={() => setCropTarget(null)}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
