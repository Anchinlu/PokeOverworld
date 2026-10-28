/**
 * Item Received Toast System
 * CHỈ hiển thị thông báo hộp viền pixel trên đầu màn hình khi người chơi THỰC SỰ NHẬN VẬT PHẨM.
 * Tuyệt đối không dùng cho các sự kiện khác (lưu game, thoát game, chuyển map, lỗi menu, tự đi...).
 * Tuyệt đối không chứa bất kỳ biểu tượng / emoji / icon nào.
 */

let toastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Loại bỏ triệt để mọi ký tự emoji Unicode và biểu tượng đồ họa ngoại lai.
 */
function stripAllIcons(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hiển thị thông báo nhận vật phẩm trên đầu màn hình.
 * Chỉ nhận thông điệp văn bản thuần, không icon.
 */
export function showItemToast(msg: string, color = '#facc15'): void {
  if (typeof document === 'undefined') return;
  const cleanMsg = stripAllIcons(msg);
  if (!cleanMsg) return;

  let toast = document.getElementById('berryToast') as HTMLDivElement | null;
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'berryToast';
    toast.className = 'berry-toast';
    document.body.appendChild(toast);
  }

  // Sử dụng textContent để đảm bảo an toàn tuyệt đối và không chèn HTML/icon
  toast.textContent = cleanMsg;
  toast.style.borderColor = color;
  toast.style.top = '18px';
  toast.style.bottom = 'auto';
  toast.style.transform = 'translate(-50%, 0)';
  toast.style.display = 'block';
  toast.style.opacity = '1';

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -12px)';
      setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, 250);
    }
  }, 3500);
}

/**
 * Bộ lọc Toast thông minh:
 * Theo yêu cầu: "chỉ áp dụng khi nhận vật phẩm ms hiện ko dùng cho cái gì khác và ko dc dùng icon"
 * Nếu không phải thông điệp nhận vật phẩm, tự động chặn không hiển thị popup trên đầu màn hình!
 */
export function showToast(msg: string, color = '#facc15'): void {
  const lower = msg.toLowerCase();
  const isNegative =
    lower.includes('chưa') ||
    lower.includes('không') ||
    lower.includes('thất bại') ||
    lower.includes('hủy') ||
    lower.includes('lỗi');

  const isItemAcquisition =
    !isNegative &&
    (lower.includes('nhận được') ||
      lower.includes('trao cho bạn') ||
      lower.includes('thu hoạch') ||
      lower.includes('hái được') ||
      lower.includes('nhặt được'));

  if (!isItemAcquisition) {
    // Chặn triệt để tất cả thông báo không phải nhận vật phẩm (lưu game, thoát game, di chuyển...)
    return;
  }

  showItemToast(msg, color);
}

export const showBerryToast = showToast;
export const showItemReceivedToast = showItemToast;
