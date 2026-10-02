"""
Ecological field and regional distribution system for Python map generator.
Maintains exact parity with TypeScript implementation in apps/web/src/maps/ecology/.
"""

import math
from dataclasses import dataclass
from typing import Literal

from map_generator.chunk import (
    seeded_hash,
    is_near_water,
    is_hill_tile,
    is_sand_tile,
    is_near_cliff_edge,
)

ECOLOGY_FERTILITY_SALT = 0x2401
ECOLOGY_MOISTURE_SALT = 0x2402
ECOLOGY_DENSITY_SALT = 0x2403
ECOLOGY_FREQUENCY = 0.055

DENSE_FOREST_DENSITY_THRESHOLD = 0.68
DRYLAND_MOISTURE_THRESHOLD = 0.30
DRYLAND_FERTILITY_THRESHOLD = 0.30

TREE_MIN_CANDIDATES = 2
TREE_MAX_CANDIDATES = 8

TALL_GRASS_BASE_DENSITY = 0.1
TALL_GRASS_MOISTURE_WEIGHT = 0.4
TALL_GRASS_FERTILITY_WEIGHT = 0.3
TALL_GRASS_DENSITY_WEIGHT = 0.3
TALL_GRASS_MIN_DENSITY = 0.0
TALL_GRASS_MAX_DENSITY = 1.0

LEVEL_SALT = 0x7331

EcologyZone = Literal["coast", "wetland", "meadow", "dryland", "dense_forest", "hill_edge"]


def smoothstep(t: float) -> float:
    """Smoothstep function for C1 continuous bilinear interpolation."""
    return t * t * (3.0 - 2.0 * t)


def sample_ecological_noise(
    gx: int,
    gy: int,
    seed: int,
    salt: int,
    frequency: float = ECOLOGY_FREQUENCY,
) -> float:
    """
    Generates continuous 2D value noise using smoothstep bilinear interpolation.
    Matches TypeScript sampleEcologicalNoise exactly.
    """
    scaled_x = gx * frequency
    scaled_y = gy * frequency

    x0 = math.floor(scaled_x)
    y0 = math.floor(scaled_y)
    x1 = x0 + 1
    y1 = y0 + 1

    fx = scaled_x - x0
    fy = scaled_y - y0

    combined_seed = (seed + salt) & 0xFFFFFFFF
    v00 = seeded_hash(x0, y0, combined_seed)
    v10 = seeded_hash(x1, y0, combined_seed)
    v01 = seeded_hash(x0, y1, combined_seed)
    v11 = seeded_hash(x1, y1, combined_seed)

    wx = smoothstep(fx)
    wy = smoothstep(fy)

    top = v00 + wx * (v10 - v00)
    bottom = v01 + wx * (v11 - v01)
    val = top + wy * (bottom - top)

    return max(0.0, min(1.0, val))


@dataclass(frozen=True)
class EcologySample:
    fertility: float
    moisture: float
    density: float
    elevation: float
    near_water: bool
    near_hill: bool
    near_sand: bool


def sample_ecology(gx: int, gy: int, seed: int) -> EcologySample:
    """
    Samples all ecological dimensions for a given global coordinate (gx, gy) and seed.
    Pure, deterministic function.
    """
    fertility = sample_ecological_noise(gx, gy, seed, ECOLOGY_FERTILITY_SALT)
    moisture = sample_ecological_noise(gx, gy, seed, ECOLOGY_MOISTURE_SALT)
    density = sample_ecological_noise(gx, gy, seed, ECOLOGY_DENSITY_SALT)

    near_water = is_near_water(gx, gy, seed, dist=2)
    near_hill = is_near_cliff_edge(gx, gy, seed) or is_hill_tile(gx, gy, seed)
    near_sand = (
        is_sand_tile(gx, gy, seed)
        or is_sand_tile(gx + 1, gy, seed)
        or is_sand_tile(gx - 1, gy, seed)
        or is_sand_tile(gx, gy + 1, seed)
        or is_sand_tile(gx, gy - 1, seed)
    )
    elevation = 1.0 if is_hill_tile(gx, gy, seed) else 0.0

    return EcologySample(
        fertility=fertility,
        moisture=moisture,
        density=density,
        elevation=elevation,
        near_water=near_water,
        near_hill=near_hill,
        near_sand=near_sand,
    )


def get_ecology_zone(sample: EcologySample) -> EcologyZone:
    """
    Classifies an ecology sample into an ecological zone.
    Order per specification:
    1. Coast / Wetland
    2. Hill edge
    3. Dense Forest
    4. Dryland
    5. Meadow
    """
    if sample.near_sand:
        return "coast"
    if sample.near_water:
        return "wetland"
    if sample.near_hill:
        return "hill_edge"
    if sample.density >= DENSE_FOREST_DENSITY_THRESHOLD:
        return "dense_forest"
    if sample.moisture <= DRYLAND_MOISTURE_THRESHOLD or sample.fertility <= DRYLAND_FERTILITY_THRESHOLD:
        return "dryland"
    return "meadow"


def calculate_tall_grass_density(sample: EcologySample) -> float:
    """
    Calculates tall grass density from moisture, fertility, and density.
    Formula: clamp(baseDensity + moisture*mWeight + fertility*fWeight + density*dWeight, min, max)
    """
    raw = (
        TALL_GRASS_BASE_DENSITY
        + sample.moisture * TALL_GRASS_MOISTURE_WEIGHT
        + sample.fertility * TALL_GRASS_FERTILITY_WEIGHT
        + sample.density * TALL_GRASS_DENSITY_WEIGHT
    )
    return max(TALL_GRASS_MIN_DENSITY, min(TALL_GRASS_MAX_DENSITY, raw))
