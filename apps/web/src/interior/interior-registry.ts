import type { InteriorRoomConfig } from './interior-types';
import { OAK_LAB_INTERIOR_CONFIG } from './oak-lab-interior';
import { PLAYER_HOUSE_1F_CONFIG, PLAYER_HOUSE_2F_CONFIG } from './player-house-interior';

export interface InteriorBuildingMapping {
  buildingType: string;
  roomId: string;
  displayName: string;
  config: InteriorRoomConfig;
}

/**
 * Standardized Interior Registry for managing room templates, building mappings,
 * and future expansions (Player House, Rival House, Poké Mart, Pokémon Center).
 */
export class InteriorRegistry {
  private static instance: InteriorRegistry | null = null;

  public static getInstance(): InteriorRegistry {
    if (!InteriorRegistry.instance) {
      InteriorRegistry.instance = new InteriorRegistry();
    }
    return InteriorRegistry.instance;
  }

  private rooms = new Map<string, InteriorRoomConfig>();
  private buildingMappings = new Map<string, InteriorBuildingMapping>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registers default rooms and building mappings.
   */
  public registerDefaults(): void {
    // 1. Professor Oak's Research Laboratory
    this.registerRoom(OAK_LAB_INTERIOR_CONFIG);
    this.registerBuildingMapping(
      'lab_okido',
      OAK_LAB_INTERIOR_CONFIG.id,
      'Viện Nghiên Cứu Giáo Sư Oak'
    );

    // 2. Player's House (1F & 2F)
    this.registerRoom(PLAYER_HOUSE_1F_CONFIG);
    this.registerRoom(PLAYER_HOUSE_2F_CONFIG);
    this.registerBuildingMapping(
      'house_player',
      PLAYER_HOUSE_1F_CONFIG.id,
      'Nhà của Bạn (Player House)'
    );
    this.registerBuildingMapping(
      'house_red',
      PLAYER_HOUSE_1F_CONFIG.id,
      'Nhà của Red (Player House)'
    );
  }

  /**
   * Registers a room configuration by its ID.
   */
  public registerRoom(config: InteriorRoomConfig): void {
    this.rooms.set(config.id, config);
  }

  /**
   * Retrieves a room configuration by its ID.
   */
  public getRoom(roomId: string): InteriorRoomConfig | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Maps an overworld building type to an interior room ID and UI display name.
   */
  public registerBuildingMapping(
    buildingType: string,
    roomId: string,
    displayName: string
  ): void {
    const config = this.rooms.get(roomId);
    if (!config) {
      console.warn(`[InteriorRegistry] Cannot map building '${buildingType}' to unregistered room '${roomId}'.`);
      return;
    }
    this.buildingMappings.set(buildingType, {
      buildingType,
      roomId,
      displayName,
      config,
    });
  }

  /**
   * Retrieves the mapped interior configuration for a given overworld building type.
   */
  public getBuildingMapping(buildingType: string): InteriorBuildingMapping | undefined {
    return this.buildingMappings.get(buildingType);
  }

  /**
   * Checks if an overworld building type has a registered interior room.
   */
  public hasBuildingMapping(buildingType: string): boolean {
    return this.buildingMappings.has(buildingType);
  }

  /**
   * Returns all registered room configurations.
   */
  public getAllRooms(): InteriorRoomConfig[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Resets registry to default state.
   */
  public reset(): void {
    this.rooms.clear();
    this.buildingMappings.clear();
    this.registerDefaults();
  }
}
