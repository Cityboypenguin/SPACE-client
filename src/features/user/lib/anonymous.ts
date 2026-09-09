// 授業内チャットの匿名投稿者（room_anonymous_identities 由来の User）は
// accountID が空文字で返る（graph/presenter.go:toGraphAnonymousUser）。
// これを判定基準にする。
export const isAnonymousUser = (user: { accountID?: string }): boolean => !user.accountID;
