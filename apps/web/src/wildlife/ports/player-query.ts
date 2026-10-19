export interface PlayerQuery {
  position(): { gx: number; gy: number };
  isRunning(): boolean;
  inTallGrass(): boolean;
  referenceLevel(): number;
}
