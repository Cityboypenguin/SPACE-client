export const staticCacheOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export const stableCacheOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// 現在の学期（system_settings）は管理者操作でセッション中に変わりうる値なので、
// タブ切り替え/再フォーカス時にも再検証する（他の "stable" データと違い、外部
// からの変更を取りこぼすと「学期が終了扱いで送信できない」ような UI 不整合に
// 直結するため）。
export const semesterCacheOptions = {
  revalidateOnReconnect: false,
};
