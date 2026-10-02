"""
Parity test for Python and TypeScript Ecology Field implementation.
Verifies identical mathematical noise output, determinism, and zone classification.
"""

import unittest
from map_generator.ecology import (
    sample_ecological_noise,
    sample_ecology,
    get_ecology_zone,
    calculate_tall_grass_density,
    ECOLOGY_FERTILITY_SALT,
    ECOLOGY_MOISTURE_SALT,
    ECOLOGY_DENSITY_SALT,
    EcologySample,
)


class TestEcologyParity(unittest.TestCase):

    def test_noise_mathematical_parity_with_typescript(self):
        """Validates exact numerical agreement with TypeScript sampleEcologicalNoise."""
        # Fixed point tested in TypeScript Vitest suite:
        val = sample_ecological_noise(10, 20, 12345, ECOLOGY_FERTILITY_SALT)
        self.assertAlmostEqual(val, 0.676996, places=5)

    def test_determinism_same_coordinates_and_seed(self):
        """Same seed and global coordinates produce identical EcologySample."""
        sample_a = sample_ecology(15, 30, 9999)
        sample_b = sample_ecology(15, 30, 9999)

        self.assertEqual(sample_a, sample_b)
        self.assertTrue(0.0 <= sample_a.fertility <= 1.0)
        self.assertTrue(0.0 <= sample_a.moisture <= 1.0)
        self.assertTrue(0.0 <= sample_a.density <= 1.0)

    def test_boundary_continuity(self):
        """Cross-chunk coordinate step produces smooth delta (< 0.2)."""
        s15 = sample_ecological_noise(15, 20, 777, ECOLOGY_MOISTURE_SALT)
        s16 = sample_ecological_noise(16, 20, 777, ECOLOGY_MOISTURE_SALT)
        self.assertLess(abs(s16 - s15), 0.2)

    def test_zone_classification_validity(self):
        """Ensures all samples map to one of the 6 valid ecological zones."""
        valid_zones = {"coast", "wetland", "meadow", "dryland", "dense_forest", "hill_edge"}
        for gy in range(-30, 31, 10):
            for gx in range(-20, 21, 10):
                sample = sample_ecology(gx, gy, 42)
                zone = get_ecology_zone(sample)
                self.assertIn(zone, valid_zones)

    def test_tall_grass_density_clamping(self):
        """Verifies tall grass density formula and clamping."""
        dry = EcologySample(0.1, 0.1, 0.1, 0.0, False, False, False)
        lush = EcologySample(0.9, 0.9, 0.9, 0.0, False, False, False)

        d_dry = calculate_tall_grass_density(dry)
        d_lush = calculate_tall_grass_density(lush)

        self.assertTrue(0.0 <= d_dry <= 1.0)
        self.assertTrue(0.0 <= d_lush <= 1.0)
        self.assertGreater(d_lush, d_dry)


if __name__ == "__main__":
    unittest.main()
