/**
 * サーバーから返される英語エラーメッセージを
 * ユーザー向け日本語メッセージに変換するユーティリティ
 *
 * 「時間をおいてから再度お試しください」は、待つことで解決しうる
 * 一時的なサーバーエラーのみに付与する。
 * 権限・ビジネスロジックエラーには付与しない。
 */
const SERVER_ERROR_MAP: Array<[string, string]> = [
  // --- 入力値エラー ---
  ['content cannot be empty', '内容を入力してください。'],

  // --- 権限エラー ---
  ['forbidden: can only delete your own posts', '自分の投稿のみ削除できます。'],
  ['forbidden: can only update your own posts', '自分の投稿のみ編集できます。'],
  ['forbidden: can only join community as yourself', '他のユーザーとしてコミュニティに参加することはできません。'],
  ['forbidden: can only remove yourself from a room', '自分以外を退出させることはできません。'],
  ['forbidden: not a member of this room', 'このチャットルームのメンバーではありません。'],
  ['forbidden: only community owners or administrators can update the community', 'コミュニティのオーナーまたは管理者のみ更新できます。'],
  ['forbidden: only community owners or administrators can kick members', 'コミュニティのオーナーまたは管理者のみメンバーを削除できます。'],
  ['cannot kick yourself', '自分自身をキックすることはできません。退出するには「退出」ボタンをご利用ください。'],
  ['cannot kick the last owner', '最後のオーナーはキックできません。先に別のメンバーをオーナーに昇格させてください。'],
  ['cannot delete user', '他のメンバーがいるコミュニティのオーナーのため削除できません。先にオーナーを引き継いでください。'],

  // --- 重複登録エラー ---
  ['account_id is already taken', 'このユーザーIDはすでに使用されています。別のIDをお試しください。'],

  // --- メール変更エラー（詳細は開示しない）---
  ['email update failed', 'メールアドレスを変更できませんでした。入力内容をご確認ください。'],

  // --- リソース未発見エラー ---
  ['post not found', '投稿が見つかりませんでした。削除された可能性があります。'],
  ['room not found', 'チャットルームが見つかりませんでした。'],
  ['community not found', 'コミュニティが見つかりませんでした。'],

  // --- アカウント状態エラー ---
  ['account is frozen', 'このアカウントは現在停止されています。お心当たりがある場合は管理者にお問い合わせください。'],

  // --- サーバー一時エラー（時間をおいてから） ---
  ['failed to get post', 'データの取得中にエラーが発生しました。時間をおいてから再度お試しください。'],
  ['failed to get room', 'データの取得中にエラーが発生しました。時間をおいてから再度お試しください。'],
  ['failed to load room members', 'メンバー情報の取得中にエラーが発生しました。時間をおいてから再度お試しください。'],
  ['failed to verify room membership', 'メンバーシップの確認中にエラーが発生しました。時間をおいてから再度お試しください。'],
  ['failed to check block status', 'データの取得中にエラーが発生しました。時間をおいてから再度お試しください。'],
  ['failed to transfer ownership', 'オーナーの引き継ぎに失敗しました。時間をおいてから再度お試しください。'],

  // --- 無効な入力値 ---
  ['invalid user id', '無効なデータが指定されました。ページを再読み込みしてください。'],
  ['invalid post id', '無効なデータが指定されました。ページを再読み込みしてください。'],
  ['invalid room id', '無効なデータが指定されました。ページを再読み込みしてください。'],
  ['invalid community id', '無効なデータが指定されました。ページを再読み込みしてください。'],
  ['invalid administrator id', '無効なデータが指定されました。ページを再読み込みしてください。'],
  ['invalid parent post id', '無効なデータが指定されました。ページを再読み込みしてください。'],
  ['invalid target user id', '無効なデータが指定されました。ページを再読み込みしてください。'],

  // --- 通信エラー ---
  ['Network response was not ok', 'サーバーとの通信でエラーが発生しました。しばらく時間をおいてから再度お試しください。'],

  // --- 認証エラー（最後に照合）---
  ['forbidden', 'この操作を行う権限がありません。'],
  ['unauthorized', 'ログインが必要です。再度ログインしてください。'],
  ['Unauthorized', 'ログインが必要です。再度ログインしてください。'],
];

/**
 * エラーオブジェクトをユーザー向け日本語メッセージに変換する
 * @param err - catch ブロックで捕捉したエラー
 * @param fallback - マッピングが見つからない場合のデフォルトメッセージ
 */
export const toUserMessage = (err: unknown, fallback: string): string => {
  if (!(err instanceof Error)) return fallback;
  const msg = err.message;
  for (const [pattern, label] of SERVER_ERROR_MAP) {
    if (msg.includes(pattern)) return label;
  }
  return fallback;
};
