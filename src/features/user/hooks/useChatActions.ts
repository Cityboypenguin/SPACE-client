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

export const useChatActions = (
  roomId: string | undefined,
  addMessage: (msg: Message) => void,
) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSend = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;
    if (!roomId) return;
    setSending(true);
    setSendError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (selectedFile) {
        const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(selectedFile.type);
        await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, selectedFile);
        mediaInputs = [{ objectKey: presignedMediaUploadUrl.objectKey, contentType: selectedFile.type }];
      }
      const data = await sendMessage(roomId, content.trim(), mediaInputs);
      setContent('');
      setSelectedFile(null);
      addMessage(data.sendMessage);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!roomId) return;
    try {
      await deleteMessage(roomId, msgId);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの削除に失敗しました');
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!roomId || !editContent.trim()) return;
    try {
      await updateMessage(roomId, msgId, editContent.trim());
      setEditingId(null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの編集に失敗しました');
    }
  };

  return {
    content,
    setContent,
    selectedFile,
    setSelectedFile,
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
