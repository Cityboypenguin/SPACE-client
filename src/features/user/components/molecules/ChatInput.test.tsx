import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ChatInput } from './ChatInput';
import { ThemeContext } from '../../../../context/themeContextValue';
import { MAX_MESSAGE_LENGTH } from '../../constants/chat';

// ChatInput は useTheme() 経由で ThemeContext を必須で参照するため、テストでは
// 常に軽量なダミー値を注入する。
const withTheme = (ui: ReactElement) => (
  <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
    {ui}
  </ThemeContext.Provider>
);

type RenderOverrides = Partial<{
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  disabled: boolean;
  isBlocked: boolean;
}>;

// ChatInput は selectedFiles からプレビューURLを作るuseEffect内でPromiseベースの
// 状態更新（setPreviewUrls）を1マイクロタスク遅延させて行っているため、
// render直後にそのマイクロタスクをact()内でflushしてから各テストのアサーションに入る。
const renderChatInput = async (overrides: RenderOverrides = {}) => {
  const onChange = overrides.onChange ?? vi.fn();
  const onSubmit = overrides.onSubmit ?? vi.fn();
  const onFileSelect = overrides.onFileSelect ?? vi.fn();

  await act(async () => {
    render(
      withTheme(
        <ChatInput
          value={overrides.value ?? ''}
          onChange={onChange}
          onSubmit={onSubmit}
          onFileSelect={onFileSelect}
          selectedFiles={overrides.selectedFiles ?? []}
          disabled={overrides.disabled}
          isBlocked={overrides.isBlocked}
        />,
      ),
    );
    await Promise.resolve();
  });

  return { onChange, onSubmit, onFileSelect };
};

const getSendButton = () => screen.getByRole('button', { name: '送信' });
const getTextarea = () => screen.getByRole('textbox');

describe('ChatInput', () => {
  it('空文字のときは送信ボタンが無効になる', async () => {
    await renderChatInput({ value: '' });
    expect(getSendButton()).toBeDisabled();
  });

  it('スペースのみのときは送信ボタンが無効になる', async () => {
    await renderChatInput({ value: '   ' });
    expect(getSendButton()).toBeDisabled();
  });

  it('最大文字数（2000文字）ちょうどのときは送信できる', async () => {
    await renderChatInput({ value: 'あ'.repeat(MAX_MESSAGE_LENGTH) });
    expect(getSendButton()).toBeEnabled();
  });

  it('最大文字数を1文字超過すると送信できない', async () => {
    await renderChatInput({ value: 'あ'.repeat(MAX_MESSAGE_LENGTH + 1) });
    expect(getSendButton()).toBeDisabled();
    // 超過時は文字数カウンタも赤字（over用クラス）で表示される
    expect(screen.getByText(`${MAX_MESSAGE_LENGTH + 1}/${MAX_MESSAGE_LENGTH}`)).toBeInTheDocument();
  });

  it('絵文字（サロゲートペア）はコードポイント単位でカウントされ、2000個ちょうどなら送信できる', async () => {
    // 😀 (U+1F600) はUTF-16では2コードユニットになる絵文字。
    // content.length（UTF-16コードユニット数）でカウントすると4000相当になり誤って
    // 超過扱いになってしまうが、Array.from(content).length（コードポイント数）なら
    // 正しく2000として扱われ、送信可能であるべき。
    const emojiContent = '😀'.repeat(MAX_MESSAGE_LENGTH);
    expect(emojiContent.length).toBe(MAX_MESSAGE_LENGTH * 2); // UTF-16基準では誤って超過扱いになりうることの確認
    await renderChatInput({ value: emojiContent });
    expect(getSendButton()).toBeEnabled();
    expect(screen.getByText(`${MAX_MESSAGE_LENGTH}/${MAX_MESSAGE_LENGTH}`)).toBeInTheDocument();
  });

  it('絵文字（サロゲートペア）を含み、コードポイント単位で2001個になる場合は送信できない', async () => {
    const emojiContent = '😀'.repeat(MAX_MESSAGE_LENGTH + 1);
    await renderChatInput({ value: emojiContent });
    expect(getSendButton()).toBeDisabled();
  });

  it('通常文字と絵文字が混在していてもコードポイント単位で境界値を正しく判定する', async () => {
    // 通常文字1999文字 + 絵文字1個 = コードポイント数2000（ちょうど上限）
    const mixedContent = 'あ'.repeat(MAX_MESSAGE_LENGTH - 1) + '😀';
    await renderChatInput({ value: mixedContent });
    expect(getSendButton()).toBeEnabled();
  });

  it('disabled=trueのとき、Enterキー押下ではonSubmitが呼ばれない', async () => {
    const { onSubmit } = await renderChatInput({ value: '送信中のテスト', disabled: true });
    fireEvent.keyDown(getTextarea(), { key: 'Enter', shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disabled=trueのとき、フォームをsubmitしてもonSubmitが呼ばれない', async () => {
    const { onSubmit } = await renderChatInput({ value: '送信中のテスト', disabled: true });
    const form = getTextarea().closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disabled=trueのとき、送信ボタン自体も無効になる', async () => {
    await renderChatInput({ value: '送信中のテスト', disabled: true });
    expect(getSendButton()).toBeDisabled();
  });

  it('通常時はEnterキー押下でonSubmitが呼ばれる', async () => {
    const { onSubmit } = await renderChatInput({ value: '通常メッセージ' });
    fireEvent.keyDown(getTextarea(), { key: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
