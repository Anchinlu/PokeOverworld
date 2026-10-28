export const TERRAIN = {
  EMPTY: 0,
  GRASS: 1,
  ROAD: 2,
  BEACH_SAND: 3,
  OCEAN_WATER: 4,
  // Kept at 5 for compatibility with the current Python generator and viewer.
  HILL: 5,
  DESERT: 6,
  DARK_LAND: 7,
  AUTUMN: 8,
  SNOW: 9,
  ROCKY_HIGHLAND: 10,
} as const;

export const TILE_IDS = {
  grass_01: 101,
  grass_02: 102,
  grass_03: 103,
  grass_04: 104,
  grass_variant: 105,
  dirt_pure: 200,
  path_top: 201,
  path_bot: 202,
  path_left: 203,
  path_right: 204,
  path_tl: 205,
  path_tr: 206,
  path_bl: 207,
  path_br: 208,
  path_in_tl: 209,
  path_in_tr: 210,
  path_in_bl: 211,
  path_in_br: 212,
  sand_pure: 300,
  sand_top: 301,
  sand_bot: 302,
  sand_left: 303,
  sand_right: 304,
  sand_tl: 305,
  sand_tr: 306,
  sand_bl: 307,
  sand_br: 308,
  sand_in_tl: 309,
  sand_in_tr: 310,
  sand_in_bl: 311,
  sand_in_br: 312,
  desert_pure: 350,
  desert_top: 351,
  desert_bot: 352,
  desert_left: 353,
  desert_right: 354,
  desert_tl: 355,
  desert_tr: 356,
  desert_bl: 357,
  desert_br: 358,
  desert_in_tl: 359,
  desert_in_tr: 360,
  desert_in_bl: 361,
  desert_in_br: 362,
  desert_pure_var1: 363,
  desert_pure_var2: 364,
  cliff_pure: 400,
  cliff_top: 401,
  cliff_bot: 402,
  cliff_left: 403,
  cliff_right: 404,
  cliff_tl: 405,
  cliff_tr: 406,
  cliff_bl: 407,
  cliff_br: 408,
  cliff_in_tl: 409,
  cliff_in_tr: 410,
  cliff_in_bl: 411,
  cliff_in_br: 412,
  dune_cliff_pure: 420,
  dune_cliff_top: 421,
  dune_cliff_bot: 422,
  dune_cliff_left: 423,
  dune_cliff_right: 424,
  dune_cliff_tl: 425,
  dune_cliff_tr: 426,
  dune_cliff_bl: 427,
  dune_cliff_br: 428,
  dune_cliff_in_tl: 429,
  dune_cliff_in_tr: 430,
  dune_cliff_in_bl: 431,
  dune_cliff_in_br: 432,
  dark_ground_pure: 440,
  dark_ground_top: 441,
  dark_ground_bot: 442,
  dark_ground_left: 443,
  dark_ground_right: 444,
  dark_ground_tl: 445,
  dark_ground_tr: 446,
  dark_ground_bl: 447,
  dark_ground_br: 448,
  dark_ground_in_tl: 449,
  dark_ground_in_tr: 450,
  dark_ground_in_bl: 451,
  dark_ground_in_br: 452,
  dark_ground_var1: 453,
  dark_ground_var2: 454,
  dark_ground_var3: 455,
  dark_cliff_pure: 460,
  dark_cliff_top: 461,
  dark_cliff_bot: 462,
  dark_cliff_left: 463,
  dark_cliff_right: 464,
  dark_cliff_tl: 465,
  dark_cliff_tr: 466,
  dark_cliff_bl: 467,
  dark_cliff_br: 468,
  dark_cliff_in_tl: 469,
  dark_cliff_in_tr: 470,
  dark_cliff_in_bl: 471,
  dark_cliff_in_br: 472,
  ground_autumn_pure: 480,
  ground_autumn_top: 481,
  ground_autumn_bot: 482,
  ground_autumn_left: 483,
  ground_autumn_right: 484,
  ground_autumn_tl: 485,
  ground_autumn_tr: 486,
  ground_autumn_bl: 487,
  ground_autumn_br: 488,
  ground_autumn_in_tl: 489,
  ground_autumn_in_tr: 490,
  ground_autumn_in_bl: 491,
  ground_autumn_in_br: 492,
  ground_snow_pure: 510,
  ground_snow_top: 511,
  ground_snow_bot: 512,
  ground_snow_left: 513,
  ground_snow_right: 514,
  ground_snow_tl: 515,
  ground_snow_tr: 516,
  ground_snow_bl: 517,
  ground_snow_br: 518,
  ground_snow_in_tl: 519,
  ground_snow_in_tr: 520,
  ground_snow_in_bl: 521,
  ground_snow_in_br: 522,
  cliff_snow_pure: 530,
  cliff_snow_top: 531,
  cliff_snow_bot: 532,
  cliff_snow_left: 533,
  cliff_snow_right: 534,
  cliff_snow_tl: 535,
  cliff_snow_tr: 536,
  cliff_snow_bl: 537,
  cliff_snow_br: 538,
  cliff_snow_in_tl: 539,
  cliff_snow_in_tr: 540,
  cliff_snow_in_bl: 541,
  cliff_snow_in_br: 542,
  ice_snow_pure: 550,
  ice_snow_top: 551,
  ice_snow_bot: 552,
  ice_snow_left: 553,
  ice_snow_right: 554,
  ice_snow_tl: 555,
  ice_snow_tr: 556,
  ice_snow_bl: 557,
  ice_snow_br: 558,
  ice_snow_in_tl: 559,
  ice_snow_in_tr: 560,
  ice_snow_in_bl: 561,
  ice_snow_in_br: 562,
  ground_rock_pure: 570,
  ground_rock_top: 571,
  ground_rock_bot: 572,
  ground_rock_left: 573,
  ground_rock_right: 574,
  ground_rock_tl: 575,
  ground_rock_tr: 576,
  ground_rock_bl: 577,
  ground_rock_br: 578,
  ground_rock_in_tl: 579,
  ground_rock_in_tr: 580,
  ground_rock_in_bl: 581,
  ground_rock_in_br: 582,
  cliff_rock_pure: 585,
  cliff_rock_top: 586,
  cliff_rock_bot: 587,
  cliff_rock_left: 588,
  cliff_rock_right: 589,
  cliff_rock_tl: 590,
  cliff_rock_tr: 591,
  cliff_rock_bl: 592,
  cliff_rock_br: 593,
  cliff_rock_in_tl: 594,
  cliff_rock_in_tr: 595,
  cliff_rock_in_bl: 596,
  cliff_rock_in_br: 597,
  tree_autumn: 501,
  tree_vibrant: 502,
  tree_coastal: 503,
  tree_deep: 504,
  flower_red: 601,
  flower_blue: 602,
  flower_purple: 603,
  flower_white: 604,
  plant_sprout: 605,
  tall_grass: 610,
  tall_grass_dark: 611,
  tall_grass_autumn: 612,
  tall_grass_snow: 613,
  high_cliff_rock_pure: 620,
  high_cliff_rock_top: 621,
  high_cliff_rock_bot: 622,
  high_cliff_rock_left: 623,
  high_cliff_rock_right: 624,
  high_cliff_rock_tl: 625,
  high_cliff_rock_tr: 626,
  high_cliff_rock_bl: 627,
  high_cliff_rock_br: 628,
  high_cliff_rock_bot_upper: 629,
  high_cliff_rock_bl_upper: 630,
  high_cliff_rock_br_upper: 631,
  high_cliff_rock_in_tl: 632,
  high_cliff_rock_in_tr: 633,
  high_cliff_rock_in_bl: 634,
  high_cliff_rock_in_br: 635,
  high_cliff_rock_in_bl_upper: 636,
  high_cliff_rock_in_br_upper: 637,
  water_pure: 700,
  water_top: 701,
  water_bot: 702,
  water_left: 703,
  water_right: 704,
  water_tl: 705,
  water_tr: 706,
  water_bl: 707,
  water_br: 708,
  water_in_tl: 709,
  water_in_tr: 710,
  water_in_bl: 711,
  water_in_br: 712,
  bridge_wood_h: 720,
  bridge_wood_v: 721,
  ocean_water: 730,
  shore_v: 731,
  shore_corner_in: 732,
  shore_corner_out: 733,
  shore_corner_in_flip: 734,
  shore_corner_out_flip: 735,
  shore_h: 736,
  shore_h_top: 737,
  shore_v_right: 738,
  shore_corner_in_es: 739,
  shore_corner_in_en: 740,
  shore_corner_out_se: 741,
  shore_corner_out_ne: 742,
  water_autumn_pure: 750,
  water_autumn_top: 751,
  water_autumn_bot: 752,
  water_autumn_left: 753,
  water_autumn_right: 754,
  water_autumn_tl: 755,
  water_autumn_tr: 756,
  water_autumn_bl: 757,
  water_autumn_br: 758,
  water_autumn_in_tl: 759,
  water_autumn_in_tr: 760,
  water_autumn_in_bl: 761,
  water_autumn_in_br: 762,
  water_autumn_curve: 763,
  water_snow_pure: 770,
  water_snow_top: 771,
  water_snow_bot: 772,
  water_snow_left: 773,
  water_snow_right: 774,
  water_snow_tl: 775,
  water_snow_tr: 776,
  water_snow_bl: 777,
  water_snow_br: 778,
  water_snow_in_tl: 779,
  water_snow_in_tr: 780,
  water_snow_in_bl: 781,
  water_snow_in_br: 782,
  water_snow_curve: 783,
  water_rock_pure: 785,
  water_rock_top: 786,
  water_rock_bot: 787,
  water_rock_left: 788,
  water_rock_right: 789,
  water_rock_tl: 790,
  water_rock_tr: 791,
  water_rock_bl: 792,
  water_rock_br: 793,
  water_rock_in_tl: 794,
  water_rock_in_tr: 795,
  water_rock_in_bl: 796,
  water_rock_in_br: 797,
  water_rock_curve: 798,
} as const;

export function isShoreTile(tileId: number): boolean {
  return tileId >= 731 && tileId <= 742;
}

export function isOceanOrShoreTile(tileId: number): boolean {
  return tileId >= 730 && tileId <= 742;
}

export function isBridgeTile(tileId: number): boolean {
  return tileId === TILE_IDS.bridge_wood_h || tileId === TILE_IDS.bridge_wood_v;
}

export function isFreshwaterTile(tileId: number): boolean {
  return (
    (tileId >= 700 && tileId <= 712) ||
    (tileId >= 750 && tileId <= 763) ||
    (tileId >= 770 && tileId <= 783) ||
    (tileId >= 785 && tileId <= 798)
  );
}

export function isAnimatedWaterOrShoreTile(tileId: number): boolean {
  return isFreshwaterTile(tileId) || isBridgeTile(tileId) || isOceanOrShoreTile(tileId);
}

export function isWaterTile(tileId: number): boolean {
  return isFreshwaterTile(tileId) || isOceanOrShoreTile(tileId);
}

export function isDesertTile(tileId: number): boolean {
  return (tileId >= 350 && tileId <= 364) || (tileId >= 420 && tileId <= 432);
}

export function isDarkLandTile(tileId: number): boolean {
  return (
    (tileId >= 440 && tileId <= 455) ||
    (tileId >= 460 && tileId <= 472) ||
    tileId === TILE_IDS.tall_grass_dark
  );
}

export function isAutumnTile(tileId: number): boolean {
  return (
    (tileId >= 480 && tileId <= 492) ||
    tileId === TILE_IDS.tall_grass_autumn ||
    (tileId >= 750 && tileId <= 763)
  );
}

export function isSnowTile(tileId: number): boolean {
  return (
    (tileId >= 510 && tileId <= 522) ||
    (tileId >= 530 && tileId <= 542) ||
    (tileId >= 550 && tileId <= 562) ||
    tileId === TILE_IDS.tall_grass_snow ||
    (tileId >= 770 && tileId <= 783)
  );
}

export function isRockyCliffTile(tileId: number): boolean {
  return tileId >= 585 && tileId <= 597;
}

export function isHighCliffTile(tileId: number): boolean {
  return tileId >= 620 && tileId <= 637;
}

export function isRockyHighlandTile(tileId: number): boolean {
  return (
    (tileId >= 570 && tileId <= 582) ||
    isRockyCliffTile(tileId) ||
    isHighCliffTile(tileId) ||
    (tileId >= 785 && tileId <= 798)
  );
}

export const CHUNK_SIZE = 16 as const;
export const TILE_SIZE = 32 as const;

