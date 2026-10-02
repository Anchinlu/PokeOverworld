import type { EcologyZone } from './ecology/ecology-profile';

export type BerryRarity = 'common' | 'uncommon' | 'rare';
export type BerryHabitat = 'wet' | 'dry' | 'neutral';

export interface BerrySpawnProfile {
  rarity: BerryRarity;
  habitat: BerryHabitat;
  weight: number;
  enabled: boolean;
}

export interface BerryTypeInfo {
  id: string;
  name: string;
  viName: string;
  color: string;
  desc: string;
  spawnProfile: BerrySpawnProfile;
}

export const BERRY_ROSTER: BerryTypeInfo[] = [
  {
    id: 'ORANBERRY',
    name: 'Oran Berry',
    viName: 'Quả Oran',
    color: '#3b82f6',
    desc: 'Hồi 10 HP thể lực',
    spawnProfile: { rarity: 'common', habitat: 'neutral', weight: 100, enabled: true },
  },
  {
    id: 'CHERIBERRY',
    name: 'Cheri Berry',
    viName: 'Quả Cheri',
    color: '#ef4444',
    desc: 'Chữa tê liệt',
    spawnProfile: { rarity: 'common', habitat: 'dry', weight: 90, enabled: true },
  },
  {
    id: 'CHESTOBERRY',
    name: 'Chesto Berry',
    viName: 'Quả Chesto',
    color: '#8b5cf6',
    desc: 'Đánh thức buồn ngủ',
    spawnProfile: { rarity: 'common', habitat: 'neutral', weight: 80, enabled: true },
  },
  {
    id: 'PECHABERRY',
    name: 'Pecha Berry',
    viName: 'Quả Pecha',
    color: '#ec4899',
    desc: 'Giải độc tính',
    spawnProfile: { rarity: 'common', habitat: 'wet', weight: 90, enabled: true },
  },
  {
    id: 'RAWSTBERRY',
    name: 'Rawst Berry',
    viName: 'Quả Rawst',
    color: '#06b6d4',
    desc: 'Làm dịu vết bỏng',
    spawnProfile: { rarity: 'common', habitat: 'wet', weight: 80, enabled: true },
  },
  {
    id: 'ASPEARBERRY',
    name: 'Aspear Berry',
    viName: 'Quả Aspear',
    color: '#eab308',
    desc: 'Làm tan băng đông',
    spawnProfile: { rarity: 'common', habitat: 'dry', weight: 80, enabled: true },
  },
  {
    id: 'LEPPABERRY',
    name: 'Leppa Berry',
    viName: 'Quả Leppa',
    color: '#f43f5e',
    desc: 'Hồi phục 10 điểm PP',
    spawnProfile: { rarity: 'uncommon', habitat: 'neutral', weight: 45, enabled: true },
  },
  {
    id: 'PERSIMBERRY',
    name: 'Persim Berry',
    viName: 'Quả Persim',
    color: '#f97316',
    desc: 'Xóa tan bối rối',
    spawnProfile: { rarity: 'uncommon', habitat: 'dry', weight: 50, enabled: true },
  },
  {
    id: 'LUMBERRY',
    name: 'Lum Berry',
    viName: 'Quả Lum',
    color: '#84cc16',
    desc: 'Chữa mọi trạng thái xấu',
    spawnProfile: { rarity: 'rare', habitat: 'neutral', weight: 15, enabled: true },
  },
  {
    id: 'SITRUSBERRY',
    name: 'Sitrus Berry',
    viName: 'Quả Sitrus',
    color: '#facc15',
    desc: 'Hồi phục 25% máu',
    spawnProfile: { rarity: 'rare', habitat: 'neutral', weight: 15, enabled: true },
  },
  {
    id: 'RAZZBERRY',
    name: 'Razz Berry',
    viName: 'Quả Razz',
    color: '#e11d48',
    desc: 'Dễ thu phục Pokémon',
    spawnProfile: { rarity: 'uncommon', habitat: 'neutral', weight: 40, enabled: true },
  },
  {
    id: 'BLUKBERRY',
    name: 'Bluk Berry',
    viName: 'Quả Bluk',
    color: '#6366f1',
    desc: 'Làm bánh Poffin',
    spawnProfile: { rarity: 'uncommon', habitat: 'wet', weight: 40, enabled: true },
  },
  {
    id: 'NANABBERRY',
    name: 'Nanab Berry',
    viName: 'Quả Nanab',
    color: '#f59e0b',
    desc: 'Làm dịu Pokémon',
    spawnProfile: { rarity: 'uncommon', habitat: 'neutral', weight: 35, enabled: true },
  },
  {
    id: 'WEPEARBERRY',
    name: 'Wepear Berry',
    viName: 'Quả Wepear',
    color: '#14b8a6',
    desc: 'Hương vị chua thanh',
    spawnProfile: { rarity: 'uncommon', habitat: 'wet', weight: 35, enabled: true },
  },
  {
    id: 'PINAPBERRY',
    name: 'Pinap Berry',
    viName: 'Quả Pinap',
    color: '#eab308',
    desc: 'Nhân đôi kẹo thưởng',
    spawnProfile: { rarity: 'uncommon', habitat: 'dry', weight: 35, enabled: true },
  },
  {
    id: 'MAGOBERRY',
    name: 'Mago Berry',
    viName: 'Quả Mago',
    color: '#d946ef',
    desc: 'Vị ngọt mọng nước',
    spawnProfile: { rarity: 'uncommon', habitat: 'wet', weight: 30, enabled: true },
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

/**
 * Deterministically picks a berry bush based on the ecological zone and roll [0..1).
 * Respects rarity weights (rare Lum/Sitrus much rarer) and zone habitat preferences:
 * - wetland/coast: prioritizes 'wet' berries
 * - dryland: prioritizes 'dry' berries
 * - meadow/dense_forest: prioritizes 'neutral' and common berries
 */
export function pickBerryForEcology(zone: EcologyZone, roll: number): BerryTypeInfo {
  const eligible = BERRY_ROSTER.filter((b) => b.spawnProfile?.enabled);
  if (eligible.length === 0) return BERRY_ROSTER[0];

  let totalWeight = 0;
  const weightedList: Array<{ berry: BerryTypeInfo; weight: number }> = [];

  for (const berry of eligible) {
    let w = berry.spawnProfile.weight;
    const habitat = berry.spawnProfile.habitat;

    if (zone === 'wetland' || zone === 'coast') {
      if (habitat === 'wet') w *= 3.0;
      else if (habitat === 'dry') w *= 0.25;
      else w *= 1.0;
    } else if (zone === 'dryland') {
      if (habitat === 'dry') w *= 3.0;
      else if (habitat === 'wet') w *= 0.25;
      else w *= 1.0;
    } else {
      // meadow, dense_forest, hill_edge
      if (habitat === 'neutral') w *= 2.0;
      else w *= 1.0;
    }

    weightedList.push({ berry, weight: w });
    totalWeight += w;
  }

  const target = (roll % 1) * totalWeight;
  let accum = 0;
  for (const item of weightedList) {
    accum += item.weight;
    if (accum >= target) {
      return item.berry;
    }
  }

  return weightedList[weightedList.length - 1].berry;
}
