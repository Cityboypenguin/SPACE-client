import { API_URL } from './graphql';
import { USER_TOKEN_KEY } from './authStorage';
import type { Media } from './media';

// 寸法を持たないメディアを、表示できた時点で埋めていくための仕組み。
//
// アップロード時にクライアントが寸法を申告するようになる前のメディアには
// 寸法が入っていない。サーバー側でファイルを読み直す手もあるが、画像形式ごとに
// デコーダを揃える必要があり、EXIF の回転のようにブラウザと解釈が食い違う余地も残る。
// 表示したブラウザ自身に測らせれば、形式に依存せず、しかも「実際に表示される寸法」が
// そのまま得られる。ブラウザが表示できない画像には、そもそも確保すべき領域がない。
//
// 全メディアが埋まったら不要になるため、この仕組みごと削除できる。

const MUTATION = `
  mutation ReportMediaDimensions($mediaID: ID!, $width: Int!, $height: Int!) {
    reportMediaDimensions(mediaID: $mediaID, width: $width, height: $height)
  }
`;

// 同じ画像が何度も描画されても送信は 1 回に抑える。
// ページを開き直せば送り直すが、サーバー側が未設定のときしか書き込まないため実害はない。
const reported = new Set<string>();

/**
 * 寸法が未取得のメディアに対して、画像の onLoad ハンドラを返す。
 * すでに寸法があるメディアには undefined を返すので、そのまま onLoad に渡せる。
 */
export const reportDimensionsOnLoad = (media: Media) => {
  if (media.width && media.height) return undefined;

  return (event: { currentTarget: HTMLImageElement }) => {
    if (reported.has(media.ID)) return;

    // naturalWidth / naturalHeight は EXIF の回転を反映した、実際に表示される向きの寸法。
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    if (!width || !height) return;

    // ログインしていなければ記録しない（管理画面など、閲覧だけの経路）。
    const token = localStorage.getItem(USER_TOKEN_KEY);
    if (!token) return;

    reported.add(media.ID);
    // 共有の request() は使わない。あれは 401 を受けるとトークン更新を試み、
    // 失敗すればアプリ全体をログアウトさせる。画像を眺めているだけの付随処理が
    // ログアウトを引き起こしてよいはずがないので、素の fetch で投げっぱなしにする。
    // 次の機会に再送できるよう、失敗時は送信済みの印を戻す。
    void fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: MUTATION, variables: { mediaID: media.ID, width, height } }),
    }).catch(() => {
      reported.delete(media.ID);
    });
  };
};
