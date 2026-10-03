import type { BattleMove } from '../../battle/types';

export const MOVE_CATEGORY_LABELS: Record<string, string> = {
  physical: 'Vật lí',
  special: 'Đặc biệt',
  status: 'Trạng thái',
};

export function getMoveCategoryLabel(category?: string): string {
  const catKey = (category || 'physical').toLowerCase();
  return MOVE_CATEGORY_LABELS[catKey] ?? 'Vật lí';
}

export function filterMoves(moves: BattleMove[], query: string): BattleMove[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...moves];
  }
  return moves.filter((m) => {
    const nameVi = (m.nameVi || '').toLowerCase();
    const nameEn = (m.nameEn || m.name || '').toLowerCase();
    const type = (m.type || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    return nameVi.includes(q) || nameEn.includes(q) || type.includes(q) || cat.includes(q);
  });
}
