import { describe, it, expect, beforeEach } from 'vitest';
import { showToast, showItemToast } from '../src/ui/toast';

describe('Item Received Toast Gatekeeper', () => {
  let mockElements: Record<string, any> = {};

  beforeEach(() => {
    mockElements = {};
    const mockDocument: any = {
      getElementById: (id: string) => mockElements[id] ?? null,
      createElement: (tag: string) => {
        const el: any = {
          tagName: tag,
          id: '',
          className: '',
          textContent: '',
          style: {},
          appendChild: (_child: any) => {},
        };
        return el;
      },
      body: {
        appendChild: (child: any) => {
          if (child.id) {
            mockElements[child.id] = child;
          }
        },
      },
    };
    (globalThis as any).document = mockDocument;
  });

  it('strictly suppresses non-item toasts (save, quit, auto-walk, status)', () => {
    // Attempting to show save game toast
    showToast('💾 Đã lưu tiến trình thế giới (Slot 1)!');
    expect(mockElements['berryToast']).toBeUndefined();

    // Attempting to show quit to title toast
    showToast('🚪 Đã lưu tiến trình và quay về màn hình chờ!');
    expect(mockElements['berryToast']).toBeUndefined();

    // Attempting to show locked feature toast
    showToast('📘 Bạn chưa nhận được Pokémon Zukan!');
    expect(mockElements['berryToast']).toBeUndefined();
  });

  it('only displays when receiving items, and strips all emoji icons', () => {
    // When player receives Pokédex & Pokéballs
    showToast('📘 Bạn nhận được POKÉMON ZUKAN & 5x POKÉ BALL từ Giáo Sư Okido!', '#3b82f6');
    const toast = mockElements['berryToast'];
    expect(toast).toBeDefined();
    expect(toast.style.display).toBe('block');
    // Emoji '📘' MUST be completely stripped!
    expect(toast.textContent).toBe('Bạn nhận được POKÉMON ZUKAN & 5x POKÉ BALL từ Giáo Sư Okido!');
    expect(toast.textContent).not.toContain('📘');
  });

  it('strips any emojis even when calling showItemToast directly', () => {
    showItemToast('🎒 Mẹ đã trao cho bạn: Balo du hành & Giày chạy bộ!');
    const toast = mockElements['berryToast'];
    expect(toast.textContent).toBe('Mẹ đã trao cho bạn: Balo du hành & Giày chạy bộ!');
    expect(toast.textContent).not.toContain('🎒');
  });
});
