export interface BerryTypeInfo {
  id: string;
  name: string;
  viName: string;
  color: string;
  desc: string;
}

export const BERRY_ROSTER: BerryTypeInfo[] = [
  {
    id: 'ORANBERRY',
    name: 'Oran Berry',
    viName: 'Quả Oran',
    color: '#3b82f6',
    desc: 'Hồi 10 HP thể lực',
  },
  {
    id: 'CHERIBERRY',
    name: 'Cheri Berry',
    viName: 'Quả Cheri',
    color: '#ef4444',
    desc: 'Chữa tê liệt',
  },
  {
    id: 'CHESTOBERRY',
    name: 'Chesto Berry',
    viName: 'Quả Chesto',
    color: '#8b5cf6',
    desc: 'Đánh thức buồn ngủ',
  },
  {
    id: 'PECHABERRY',
    name: 'Pecha Berry',
    viName: 'Quả Pecha',
    color: '#ec4899',
    desc: 'Giải độc tính',
  },
  {
    id: 'RAWSTBERRY',
    name: 'Rawst Berry',
    viName: 'Quả Rawst',
    color: '#06b6d4',
    desc: 'Làm dịu vết bỏng',
  },
  {
    id: 'ASPEARBERRY',
    name: 'Aspear Berry',
    viName: 'Quả Aspear',
    color: '#eab308',
    desc: 'Làm tan băng đông',
  },
  {
    id: 'LEPPABERRY',
    name: 'Leppa Berry',
    viName: 'Quả Leppa',
    color: '#f43f5e',
    desc: 'Hồi phục 10 điểm PP',
  },
  {
    id: 'PERSIMBERRY',
    name: 'Persim Berry',
    viName: 'Quả Persim',
    color: '#f97316',
    desc: 'Xóa tan bối rối',
  },
  {
    id: 'LUMBERRY',
    name: 'Lum Berry',
    viName: 'Quả Lum',
    color: '#84cc16',
    desc: 'Chữa mọi trạng thái xấu',
  },
  {
    id: 'SITRUSBERRY',
    name: 'Sitrus Berry',
    viName: 'Quả Sitrus',
    color: '#facc15',
    desc: 'Hồi phục 25% máu',
  },
  {
    id: 'RAZZBERRY',
    name: 'Razz Berry',
    viName: 'Quả Razz',
    color: '#e11d48',
    desc: 'Dễ thu phục Pokémon',
  },
  {
    id: 'BLUKBERRY',
    name: 'Bluk Berry',
    viName: 'Quả Bluk',
    color: '#6366f1',
    desc: 'Làm bánh Poffin',
  },
  {
    id: 'NANABBERRY',
    name: 'Nanab Berry',
    viName: 'Quả Nanab',
    color: '#f59e0b',
    desc: 'Làm dịu Pokémon',
  },
  {
    id: 'WEPEARBERRY',
    name: 'Wepear Berry',
    viName: 'Quả Wepear',
    color: '#14b8a6',
    desc: 'Hương vị chua thanh',
  },
  {
    id: 'PINAPBERRY',
    name: 'Pinap Berry',
    viName: 'Quả Pinap',
    color: '#eab308',
    desc: 'Nhân đôi kẹo thưởng',
  },
  {
    id: 'MAGOBERRY',
    name: 'Mago Berry',
    viName: 'Quả Mago',
    color: '#d946ef',
    desc: 'Vị ngọt mọng nước',
  },
];

export interface BerryStageInfo {
  stage: 0 | 1 | 2 | 3;
  name: string;
  enName: string;
  icon: string;
  desc: string;
}

export const BERRY_STAGES: BerryStageInfo[] = [
  {
    stage: 0,
    name: 'Mầm non',
    enName: 'Sprout',
    icon: '🌱',
    desc: 'Mầm xanh vừa nhú khỏi lòng đất màu mỡ',
  },
  {
    stage: 1,
    name: 'Cây non',
    enName: 'Growing',
    icon: '🌿',
    desc: 'Thân cành vươn cao, tán lá xanh tốt',
  },
  { stage: 2, name: 'Ra hoa', enName: 'Bloom', icon: '🌸', desc: 'Hoa nở rực rỡ chuẩn bị kết quả' },
  {
    stage: 3,
    name: 'Trái chín',
    enName: 'Ripe',
    icon: '🫐',
    desc: 'Quả mọng trĩu cành sẵn sàng thu hoạch!',
  },
];

export function getBerryStage(
  plantedAt: number,
  cycleSeconds: number,
  overrideStage: number | null = null
): 0 | 1 | 2 | 3 {
  if (overrideStage !== null) {
    return Math.max(0, Math.min(3, overrideStage)) as 0 | 1 | 2 | 3;
  }
  const cycleMs = cycleSeconds * 1000;
  const now = Date.now();
  const elapsedMs = (((now - plantedAt) % cycleMs) + cycleMs) % cycleMs;
  const progress = elapsedMs / cycleMs;
  return Math.min(3, Math.floor(progress * 4)) as 0 | 1 | 2 | 3;
}
