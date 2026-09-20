// チャットメッセージ本文の最大文字数。
// サーバー側 usecase/message.MaxContentChars (SPACE-server) と同じ値に保つこと。
// サーバーは unicode/utf8.RuneCountInString（コードポイント数）でカウントするため、
// クライアント側でも `content.length`（UTF-16コードユニット数）ではなく
// `Array.from(content).length`（コードポイント単位）でカウントし、絵文字
// （サロゲートペア）を1文字ずつ数えてしまう不一致を避けること。
export const MAX_MESSAGE_LENGTH = 2000;

// コードポイント単位（サロゲートペア対応）でのメッセージ文字数カウント。
export const countMessageLength = (content: string): number => Array.from(content).length;
