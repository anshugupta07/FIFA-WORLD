import numpy as np
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from detector import compute_density, detect_people_hog


class TestComputeDensity:
    def test_low_density(self):
        result = compute_density(10, 100)
        assert result["level"] == "low"
        assert result["ratio"] == 0.1

    def test_medium_density(self):
        result = compute_density(45, 100)
        assert result["level"] == "medium"

    def test_high_density(self):
        result = compute_density(75, 100)
        assert result["level"] == "high"

    def test_critical_density(self):
        result = compute_density(95, 100)
        assert result["level"] == "critical"

    def test_boundary_at_exactly_40_percent(self):
        result = compute_density(40, 100)
        assert result["level"] == "medium"

    def test_zero_count_is_low(self):
        result = compute_density(0, 100)
        assert result["level"] == "low"
        assert result["ratio"] == 0.0

    def test_raises_on_zero_capacity(self):
        with pytest.raises(ValueError):
            compute_density(10, 0)

    def test_raises_on_negative_capacity(self):
        with pytest.raises(ValueError):
            compute_density(10, -5)


class TestDetectPeopleHog:
    def test_raises_on_none_image(self):
        with pytest.raises(ValueError):
            detect_people_hog(None)

    def test_blank_image_returns_list(self):
        # A blank/black image should not crash and should return an
        # empty (or near-empty) list of detections.
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        boxes = detect_people_hog(blank)
        assert isinstance(boxes, list)
        assert len(boxes) == 0

    def test_handles_small_image(self):
        small = np.zeros((100, 100, 3), dtype=np.uint8)
        boxes = detect_people_hog(small)
        assert isinstance(boxes, list)
