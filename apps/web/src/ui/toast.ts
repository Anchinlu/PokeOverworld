let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string, color = '#c084fc'): void {
  if (typeof document === 'undefined') return;
  let toast = document.getElementById('berryToast') as HTMLDivElement | null;
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'berryToast';
    toast.className = 'berry-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.style.borderColor = color;
  toast.style.display = 'block';
  toast.style.opacity = '1';

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, 300);
    }
  }, 3500);
}

export const showBerryToast = showToast;
