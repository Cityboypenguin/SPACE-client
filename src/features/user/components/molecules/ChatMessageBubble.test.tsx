import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { ChatMessageBubble } from './ChatMessageBubble';
import type { Message } from '../../api/message';

// ChatMessageBubble は内部で useNavigate / useLocation を無条件に呼び出すため、
// Routerコンテキストが必須。
const withRouter = (ui: ReactElement) => <MemoryRouter>{ui}</MemoryRouter>;

const baseMessage: Message = {
  ID: 'msg-1',
  roomID: 'room-1',
  user: { ID: 'user-1', name: 'テストユーザー', accountID: 'test_user' },
  content: '',
  media: [],
  createdAt: '2026-09-08T10:00:00.000Z',
  updatedAt: '2026-09-08T10:00:00.000Z',
  isMine: true,
};

type RenderOverrides = Partial<{ content: string; isMine: boolean }>;

const renderBubble = (overrides: RenderOverrides = {}) => {
  const msg: Message = { ...baseMessage, content: overrides.content ?? baseMessage.content, isMine: overrides.isMine ?? baseMessage.isMine };

  return render(
    withRouter(
      <ChatMessageBubble
        msg={msg}
        isMine={msg.isMine}
        canDelete={false}
        isEditing={false}
        editContent=""
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onEditContentChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    ),
  );
};

describe('ChatMessageBubble', () => {
  it('<script>タグを含む本文が実際のscript要素としてレンダリングされない（XSSガード）', () => {
    const malicious = '<script>alert(1)</script>危険なメッセージ';
    const { container } = renderBubble({ content: malicious });

    // 実際の <script> 要素としては存在しない
    expect(container.querySelector('script')).toBeNull();
    // テキストとしてエスケープされて画面に表示される（HTMLとして解釈されていない証拠）
    expect(container.innerHTML).toContain('&lt;script&gt;');
    expect(container.textContent).toContain(malicious);
  });

  it('<b>のようなHTMLタグを含む本文がタグとして解釈されず、生のテキストとして表示される', () => {
    const withTag = '<b>test</b>';
    const { container } = renderBubble({ content: withTag });

    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain(withTag);
  });

  it('SQLインジェクション風の文字列もそのままテキストとして表示される', () => {
    const sqlLike = "' OR '1'='1";
    const { container } = renderBubble({ content: sqlLike });

    expect(container.textContent).toContain(sqlLike);
  });

  it('改行を含む本文はCSSのwhite-space:pre-wrapに委ねる形でDOMのテキストに改行がそのまま保持される（<br>等への変換はしない）', () => {
    const multiline = '1行目\n2行目\n3行目';
    const { container } = renderBubble({ content: multiline });

    // <br> 要素へ変換されていれば textContent の改行が失われるため、
    // 生の \n がそのまま残っていることを確認する。
    expect(container.textContent).toContain(multiline);
    expect(container.querySelector('br')).toBeNull();
  });
});
