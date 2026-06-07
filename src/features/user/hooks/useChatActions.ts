import { useState } from 'react';
import {
  sendMessage,
  updateMessage,
  deleteMessage,
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type Message,
  type MediaInput,
} from '../api/message';
import { toUserMessage } from '../../../lib/errorMessages';

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

  const handleSend = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;
    if (!roomId) return;
    setSending(true);
    setSendError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (selectedFiles.length > 0) {
        mediaInputs = await Promise.all(
          selectedFiles.map(async (file) => {
            const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
            await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
            return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
          }),
        );
      }
      const data = await sendMessage(roomId, content.trim(), mediaInputs);
      setContent('');
      setSelectedFiles([]);
      addMessage(data.sendMessage);
    } catch (err) {
      setSendError(toUserMessage(err, 'メッセージの送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!roomId) return;
    if (!window.confirm('このメッセージを削除しますか？')) return;
    try {
      await deleteMessage(roomId, msgId);
    } catch (err) {
      setSendError(toUserMessage(err, 'メッセージの削除に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!roomId || !editContent.trim()) return;
    try {
      await updateMessage(roomId, msgId, editContent.trim());
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
    handleSend,
    handleDelete,
    handleSaveEdit,
  };
};
