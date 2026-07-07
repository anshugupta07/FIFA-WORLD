import io
import sys
import os
from unittest.mock import patch

import numpy as np
import cv2
import pytest
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app  # noqa: E402


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def make_test_image_bytes():
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    success, buf = cv2.imencode(".jpg", img)
    assert success
    return io.BytesIO(buf.tobytes())


class TestHealth:
    def test_health_ok(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.get_json()["status"] == "ok"


class TestDetectCrowd:
    def test_missing_frame_returns_400(self, client):
        res = client.post("/detect-crowd/gate-1", data={"capacity": "100"})
        assert res.status_code == 400

    def test_invalid_extension_returns_400(self, client):
        data = {"frame": (io.BytesIO(b"not an image"), "file.txt"), "capacity": "100"}
        res = client.post("/detect-crowd/gate-1", data=data, content_type="multipart/form-data")
        assert res.status_code == 400

    def test_invalid_capacity_returns_400(self, client):
        data = {"frame": (make_test_image_bytes(), "frame.jpg"), "capacity": "-5"}
        res = client.post("/detect-crowd/gate-1", data=data, content_type="multipart/form-data")
        assert res.status_code == 400

    @patch("app.requests.patch")
    def test_valid_blank_image_returns_low_density(self, mock_patch, client):
        mock_patch.return_value = None
        data = {"frame": (make_test_image_bytes(), "frame.jpg"), "capacity": "100"}
        res = client.post("/detect-crowd/gate-1", data=data, content_type="multipart/form-data")
        assert res.status_code == 200
        body = res.get_json()
        assert body["zoneId"] == "gate-1"
        assert body["densityLevel"] == "low"
        assert body["peopleCount"] == 0

    @patch("app.requests.patch", side_effect=requests.exceptions.ConnectionError("backend down"))
    def test_backend_unreachable_still_returns_200(self, mock_patch, client):
        data = {"frame": (make_test_image_bytes(), "frame.jpg"), "capacity": "100"}
        res = client.post("/detect-crowd/gate-1", data=data, content_type="multipart/form-data")
        assert res.status_code == 200
        assert res.get_json().get("backendSyncError") is True
