import { useState } from 'react';
import {
  sendMessage,
  updateMessage,
  deleteMessage,
  type Message,
} from '../api/message';
import { uploadMediaFiles } from '../api/media';
import { toUserMessage } from '../../../lib/errorMessages';
import { AppSwal } from '../../../lib/swal';
import { containsMentionText, type Mention, type MentionCandidate } from '../../../lib/mentions';

export const useChatActions = (
  roomId: string | undefined,
  addMessage: (msg: Message) => void,
) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  // 返信先として選択中のメッセージ。送信・キャンセルでクリアする。
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  // サジェストから選んだメンション先。コミュニティの "@表示名" は本文からは
  // 終端を決められないため、選択した相手をここに控えて送信時に渡す。
  const [pendingMentions, setPendingMentions] = useState<MentionCandidate[]>([]);

  const addPendingMention = (candidate: MentionCandidate) => {
    setPendingMentions((prev) => (
      prev.some((m) => m.ID === candidate.ID) ? prev : [...prev, candidate]
    ));
  };

  const handleSend = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    // 送信中に再度呼ばれた場合（Enter連打やダブルクリック等）は二重送信を防ぐため即returnする。
    if (sending) return;
    if (!content.trim() && selectedFiles.length === 0) return;
    if (!roomId) return;
    setSending(true);
    setSendError('');
    try {
      const mediaInputs = await uploadMediaFiles(selectedFiles);
      const trimmed = content.trim();
      // 選択後に本文を書き換えて "@表示名" が消えた相手は送らない（サーバーでも同じ検証をする）。
      const mentionUserIDs = pendingMentions
        .filter((m) => containsMentionText(trimmed, m.name))
        .map((m) => m.ID);
      const data = await sendMessage(roomId, trimmed, mediaInputs, replyTarget?.ID ?? null, mentionUserIDs);
      setContent('');
      setSelectedFiles([]);
      setReplyTarget(null);
      setPendingMentions([]);
      addMessage(data.sendMessage);
    } catch (err) {
      setSendError(toUserMessage(err, 'メッセージの送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!roomId) return;
    const result = await AppSwal.fire({
      text: 'このメッセージを削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteMessage(roomId, msgId);
    } catch (err) {
      setSendError(toUserMessage(err, 'メッセージの削除に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  // existingMentions には編集前のメッセージのメンションを渡す。
  // 編集画面にはサジェストが無いので、本文に残っている分だけをそのまま維持する。
  const handleSaveEdit = async (msgId: string, existingMentions: Mention[] = []) => {
    if (!roomId || !editContent.trim()) return;
    try {
      const trimmed = editContent.trim();
      const mentionUserIDs = existingMentions
        .filter((m) => containsMentionText(trimmed, m.text))
        .map((m) => m.user.ID);
      await updateMessage(roomId, msgId, trimmed, mentionUserIDs);
      setEditingId(null);
    } catch (err) {
      setSendError(toUserMessage(err, 'メッセージの編集に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  return {
    content,
    setContent,
    selectedFiles,
    setSelectedFiles,
    sending,
    sendError,
    editingId,
    setEditingId,
    editContent,
    setEditContent,
    replyTarget,
    setReplyTarget,
    addPendingMention,
    handleSend,
    handleDelete,
    handleSaveEdit,
  };
};
