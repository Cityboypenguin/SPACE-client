import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CompressCanceledError,
  compressVideo,
  isVideoCompressionSupported,
  precheckVideoFile,
  type CompressJob,
  type CompressPhase,
  type CompressResult,
} from '../../../lib/video/compressVideo';
import { UploadCanceledError } from '../../../lib/video/uploadWithProgress';
import type { VideoInput } from '../../../lib/video/fields';
import { uploadCompressedVideo } from '../api/video';

// 投稿・メッセージの入力欄に付ける動画1本ぶんの状態。
//
//   idle → compressing → ready → uploading → (送信が成功したら clear で idle)
//                      ↘ error
//
// 圧縮は選んだ直後に始める（送信ボタンを押す前にプレビューできるように）。
// アップロードは送信のときに行う（送らずにやめた動画を置き場へ上げないため）。
export type VideoDraftState =
  | { status: 'idle' }
  | { status: 'compressing'; phase: CompressPhase; progress: number; attempt: number }
  | { status: 'ready'; result: CompressResult; previewUrl: string; thumbnailUrl: string }
  | { status: 'uploading'; result: CompressResult; previewUrl: string; thumbnailUrl: string; progress: number }
  | { status: 'error'; message: string };

export type VideoDraftController = {
  state: VideoDraftState;
  select: (file: File) => void;
  // cancel は圧縮・アップロードを止める。止めた後は idle に戻る。
  cancel: () => void;
  // clear は動画を外し、確保したメモリ（Object URL など）を解放する。
  clear: () => void;
  // upload は圧縮済みの動画を上げ、送信に渡すキーを返す。ready でなければ null。
  upload: () => Promise<VideoInput | null>;
  hasVideo: boolean;
  // busy は圧縮中・アップロード中（送信させない）。
  busy: boolean;
};

export const useVideoDraft = (): VideoDraftController => {
  const [state, setState] = useState<VideoDraftState>({ status: 'idle' });
  const jobRef = useRef<CompressJob | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const urlsRef = useRef<string[]>([]);

  const revokeUrls = useCallback(() => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];
  }, []);

  const stopAll = useCallback(() => {
    jobRef.current?.cancel();
    jobRef.current = null;
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
  }, []);

  // 画面を離れたら Worker・通信・Object URL をすべて片付ける。
  useEffect(() => () => {
    stopAll();
    revokeUrls();
  }, [stopAll, revokeUrls]);

  const clear = useCallback(() => {
    stopAll();
    revokeUrls();
    setState({ status: 'idle' });
  }, [stopAll, revokeUrls]);

  const select = useCallback((file: File) => {
    stopAll();
    revokeUrls();
    const problem = precheckVideoFile(file);
    if (problem) {
      setState({ status: 'error', message: problem });
      return;
    }
    if (!isVideoCompressionSupported()) {
      setState({ status: 'error', message: 'このブラウザーでは動画を投稿できません。' });
      return;
    }
    setState({ status: 'compressing', phase: 'analyzing', progress: 0, attempt: 1 });
    const job = compressVideo(file, (p) => {
      setState((prev) => (prev.status === 'compressing' ? { status: 'compressing', ...p } : prev));
    });
    jobRef.current = job;
    job.promise
      .then((result) => {
        if (jobRef.current !== job) return;
        jobRef.current = null;
        const previewUrl = URL.createObjectURL(result.video);
        const thumbnailUrl = URL.createObjectURL(result.thumbnail);
        urlsRef.current = [previewUrl, thumbnailUrl];
        setState({ status: 'ready', result, previewUrl, thumbnailUrl });
      })
      .catch((err: unknown) => {
        if (jobRef.current !== job) return;
        jobRef.current = null;
        if (err instanceof CompressCanceledError) {
          setState({ status: 'idle' });
          return;
        }
        setState({ status: 'error', message: err instanceof Error ? err.message : '動画を圧縮できませんでした。' });
      });
  }, [stopAll, revokeUrls]);

  const cancel = useCallback(() => {
    if (state.status === 'uploading') {
      uploadAbortRef.current?.abort();
      return;
    }
    clear();
  }, [state.status, clear]);

  const upload = useCallback(async (): Promise<VideoInput | null> => {
    if (state.status !== 'ready') return null;
    const { result, previewUrl, thumbnailUrl } = state;
    const abort = new AbortController();
    uploadAbortRef.current = abort;
    setState({ status: 'uploading', result, previewUrl, thumbnailUrl, progress: 0 });
    try {
      const input = await uploadCompressedVideo(result, (progress) => {
        setState((prev) => (prev.status === 'uploading' ? { ...prev, progress } : prev));
      }, abort.signal);
      return input;
    } catch (err) {
      // 失敗・中止しても圧縮結果は残し、もう一度送れるようにする。
      setState({ status: 'ready', result, previewUrl, thumbnailUrl });
      if (err instanceof UploadCanceledError) throw new Error('動画のアップロードを中止しました。', { cause: err });
      throw err;
    } finally {
      if (uploadAbortRef.current === abort) uploadAbortRef.current = null;
    }
  }, [state]);

  return {
    state,
    select,
    cancel,
    clear,
    upload,
    hasVideo: state.status !== 'idle' && state.status !== 'error',
    busy: state.status === 'compressing' || state.status === 'uploading',
  };
};
