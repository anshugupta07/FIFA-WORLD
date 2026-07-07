import os
import logging
from flask import Flask, request, jsonify
import cv2
import numpy as np
import requests
from dotenv import load_dotenv

from detector import detect_people_hog, compute_density

load_dotenv()

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fansaathi-cv-service")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
MAX_UPLOAD_MB = 8
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "fansaathi-cv-service"})


@app.route("/detect-crowd/<zone_id>", methods=["POST"])
def detect_crowd(zone_id):
    """
    Accepts a multipart image upload (`frame`) plus a `capacity` form field.
    Runs HOG people detection, computes density, and (best-effort) pushes
    the result to the backend's /api/zones/:zoneId/count endpoint.
    """
    if "frame" not in request.files:
        return jsonify({"error": "Missing 'frame' file field"}), 400

    file = request.files["frame"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid or missing image file (png/jpg/jpeg only)"}), 400

    try:
        capacity = int(request.form.get("capacity", 100))
        if capacity <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "capacity must be a positive integer"}), 400

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        boxes = detect_people_hog(image)
        density = compute_density(len(boxes), capacity)
    except ValueError as e:
        logger.warning("Bad image for zone %s: %s", zone_id, e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:  # noqa: BLE001 - surface as 500 without leaking internals
        logger.exception("Detection failed for zone %s", zone_id)
        return jsonify({"error": "Detection failed"}), 500

    result = {
        "zoneId": zone_id,
        "peopleCount": density["count"],
        "capacity": density["capacity"],
        "densityLevel": density["level"],
        "ratio": density["ratio"],
    }

    # Best-effort push to backend; CV service still returns its own result
    # even if the backend is temporarily unreachable.
    try:
        requests.patch(
            f"{BACKEND_URL}/api/zones/{zone_id}/count",
            json={"currentCount": density["count"]},
            timeout=3,
        )
    except requests.RequestException as e:
        logger.warning("Could not push update to backend: %s", e)
        result["backendSyncError"] = True

    return jsonify(result), 200


if __name__ == "__main__":
    port = int(os.getenv("CV_SERVICE_PORT", 6000))
    app.run(host="0.0.0.0", port=port, debug=False)
