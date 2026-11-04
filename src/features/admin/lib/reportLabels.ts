export const targetTypeJa: Record<string, string> = {
  POST: '投稿',
  USER: 'ユーザー',
  COMMUNITY: 'コミュニティ',
  COMMENT: 'コメント',
  MESSAGE: 'メッセージ',
  QUESTION: '質問',
  ANSWER: '回答',
  POLL: '投票',
  THREAD: 'スレッド',
};

export const statusJa: Record<string, string> = {
  PENDING: '未対応',
  UNRESOLVED: '未対応',
  REVIEWING: '対応中',
  RESOLVED: '対応済',
  DISMISSED: '却下（問題なし）',
};

// 通報モーダル（ReportModal）の選択肢と対応する。
export const reasonJa: Record<string, string> = {
  SPAM: 'スパム / 宣伝目的',
  HARASSMENT: '嫌がらせ / 誹謗中傷',
  INAPPROPRIATE: '不適切なコンテンツ',
  COMMUNITY_VIOLATION: 'コミュニティガイドライン違反',
  OTHER: 'その他',
};
