import useSWR, { mutate } from 'swr';
import { getCourseChatEnabled } from '../api/course';

const KEY = 'course-chat-enabled';

// 管理者が停止・再開したときに SSE の course_chat_status で届く。開いている画面をその場で切り替える。
export const applyCourseChatStatus = (enabled: boolean) => {
  void mutate(KEY, enabled, { revalidate: false });
};

// course_chat_status は履歴に残らないので、SSE が切れていた後は取り直す。
// まだ誰も読んでいなければ取りに行かない。
export const refreshCourseChatStatus = () => {
  void mutate(KEY);
};

/**
 * 授業チャットが使えるか。読み込み中や取得に失敗したときは使える扱いにする
 * （止まっていればサーバーが断るので、表示を隠しすぎない側に倒す）。
 */
export const useCourseChatEnabled = () => {
  const { data } = useSWR(KEY, getCourseChatEnabled);
  return data !== false;
};

/** 取りには行かず、他の画面か SSE で分かっている状態だけを返す。分からなければ undefined。 */
export const useKnownCourseChatEnabled = () => useSWR<boolean>(KEY, null).data;
