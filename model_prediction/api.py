"""
FastAPI Endpoint for AI Focus Monitoring System
Real-time video analysis for focus detection, gaze tracking, and cheating detection
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import binascii
import json
import time
import logging
import platform
from typing import Deque, Dict, List, Optional, Tuple
import asyncio
from starlette.websockets import WebSocketState
from collections import deque

try:
    import mediapipe as mp
except ImportError:  # Optional dependency
    mp = None

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

# Initialize FastAPI app
app = FastAPI(
    title="AI Focus Monitoring API",
    description="Real-time focus and attention monitoring with cheating detection",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _get_camera_backends() -> List[Tuple[str, Optional[int]]]:
    """Build a list of backend candidates ordered by platform preference."""
    system = platform.system().lower()
    backends: List[str] = []

    if system == "windows":
        backends.extend(["CAP_DSHOW", "CAP_MSMF"])
    elif system == "darwin":
        backends.extend(["CAP_AVFOUNDATION", "CAP_QT"])
    else:
        backends.extend(["CAP_V4L2", "CAP_GSTREAMER"])

    backends.append("CAP_ANY")

    resolved: List[Tuple[str, Optional[int]]] = []
    for name in backends:
        value = getattr(cv2, name, None)
        if value is not None:
            resolved.append((name, value))
    resolved.append(("default", None))
    return resolved


def _open_camera(device_index: int = 0) -> Optional[cv2.VideoCapture]:
    """Try to open the camera across different OpenCV backends."""
    tried: List[str] = []
    for name, backend in _get_camera_backends():
        if backend is None:
            camera = cv2.VideoCapture(device_index)
        else:
            camera = cv2.VideoCapture(device_index, backend)

        if camera is None:
            tried.append(name)
            continue

        if camera.isOpened():
            logger.info(f"Opened camera using backend {name}")
            return camera

        tried.append(name)
        camera.release()

    logger.error(f"Unable to open camera; tried backends: {', '.join(tried) or 'none'}")
    return None


class FocusMonitor:
    """Simplified focus monitoring without external model dependencies"""
    
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        self.profile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_profileface.xml'
        )

        self._mp_face_mesh = None
        self.face_mesh = None
        if mp is not None:
            try:
                self._mp_face_mesh = mp.solutions.face_mesh
                self.face_mesh = self._mp_face_mesh.FaceMesh(
                    static_image_mode=False,
                    max_num_faces=3,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                logger.info("MediaPipe FaceMesh initialized")
            except Exception as mesh_error:
                self.face_mesh = None
                logger.warning(f"MediaPipe FaceMesh unavailable: {mesh_error}")
        
        self.focus_score = 100.0
        self.current_state = "focused"
        self.away_timer = 0.0
        self.away_start_time = None
        self.last_status_text = ""

        # Cache for drawing overlays and temporal smoothing
        self.last_face_box: Optional[Tuple[int, int, int, int]] = None
        self.last_pupil_points: List[Tuple[int, int]] = []
        self.last_head_pose: Optional[Dict[str, object]] = None
        self.last_device_boxes: List[np.ndarray] = []
        self.last_focus_details: Dict[str, float] = {}
        self.last_additional_face_boxes: List[Tuple[int, int, int, int]] = []
        self._metric_cache: Dict[str, float] = {}
        self.device_presence_score: float = 0.0
        self.phone_model = None
        self.phone_target_classes = {"cell phone", "remote"}
        self.phone_detection_enabled = False
        self._phone_disabled_logged = False

        # Rolling frame hash history for loop detection
        self._frame_hash_history: Deque[Tuple[float, int]] = deque()
        self._loop_detection_score: float = 0.0
        self.loop_detection_state: Dict[str, object] = {
            "detected": False,
            "confidence": 0.0,
            "hash_reuse_ratio": 0.0,
            "samples_considered": 0,
            "window_seconds": 0.0,
            "dominant_cluster_frames": 0,
            "dominant_cluster_duration": 0.0,
            "unique_cluster_count": 0,
            "last_updated": 0.0,
            "last_hash": None,
        }

        if YOLO is None:
            logger.error("ultralytics is not installed. Phone detection disabled.")
        else:
            try:
                self.phone_model = YOLO("yolov8n.pt")
                model_names = {
                    name.strip().lower()
                    for _, name in self.phone_model.names.items()
                }
                dynamic_targets = {
                    name for name in model_names
                    if "phone" in name or "remote" in name
                }
                if dynamic_targets:
                    self.phone_target_classes = dynamic_targets
                logger.info(
                    "YOLO model loaded for phone detection; target classes: %s",
                    ", ".join(sorted(self.phone_target_classes))
                )
                self.phone_detection_enabled = True
            except Exception as phone_error:
                self.phone_model = None
                logger.error("Failed to initialize YOLO phone detector: %s", phone_error)
                logger.error("Phone detection disabled until dependency issue is resolved.")
        
        logger.info("FocusMonitor initialized successfully")

    def _detect_handheld_devices(self, frame: np.ndarray) -> bool:
        """Detect handheld electronic devices using the YOLO model when available."""
        if not self.phone_detection_enabled or self.phone_model is None:
            if not self._phone_disabled_logged:
                logger.warning("Phone detection disabled; YOLO unavailable.")
                self._phone_disabled_logged = True
            self.last_device_boxes = []
            self.device_presence_score = self._smooth_metric(
                "device_presence",
                0.0,
                alpha=0.2,
                max_delta=0.2
            )
            return False

        previous_boxes = list(self.last_device_boxes)
        self.last_device_boxes = []

        try:
            results = self.phone_model.predict(
                frame,
                classes=None,
                conf=0.3,
                verbose=False
            )
        except Exception as inference_error:
            logger.error("Phone detection inference failed: %s", inference_error)
            message = str(inference_error).lower()
            if "numpy is not available" in message or "numpy" in message:
                if not self._phone_disabled_logged:
                    logger.error(
                        "Disabling YOLO phone detection: dependency issue detected (%s).",
                        inference_error
                    )
                    self._phone_disabled_logged = True
                self.phone_detection_enabled = False
                self.phone_model = None
            self.last_device_boxes = []
            self.device_presence_score = self._smooth_metric(
                "device_presence",
                0.0,
                alpha=0.2,
                max_delta=0.2
            )
            return False

        detections: List[Tuple[float, np.ndarray]] = []
        for result in results:
            boxes = result.boxes if hasattr(result, "boxes") else []
            for box in boxes:
                cls_index = int(box.cls[0])
                class_name = str(result.names.get(cls_index, "")).strip().lower()
                if class_name not in self.phone_target_classes:
                    continue
                conf = float(box.conf[0])
                if conf < 0.3:
                    continue
                xyxy = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = xyxy
                rect_points = np.array(
                    [
                        [int(x1), int(y1)],
                        [int(x2), int(y1)],
                        [int(x2), int(y2)],
                        [int(x1), int(y2)],
                    ],
                    dtype=np.int32
                )
                detections.append((conf, rect_points))

        detections.sort(key=lambda item: item[0], reverse=True)

        if detections:
            self.last_device_boxes = [pts for _, pts in detections[:3]]
        elif self.device_presence_score > 0.4 and previous_boxes:
            self.last_device_boxes = previous_boxes

        raw_presence = detections[0][0] if detections else 0.0
        self.device_presence_score = self._smooth_metric(
            "device_presence",
            raw_presence,
            alpha=0.3,
            max_delta=0.3
        )

        if not detections and self.device_presence_score < 0.2:
            self.last_device_boxes = []

        return self.device_presence_score >= 0.4
    
    @staticmethod
    def _compute_frame_hash(gray_frame: np.ndarray) -> int:
        """
        Compute a perceptual hash (dHash) for a grayscale frame.
        Downscales to 9x8 and compares neighbouring pixels to capture structure.
        """
        if gray_frame is None or gray_frame.size == 0:
            return 0
        try:
            resized = cv2.resize(gray_frame, (9, 8), interpolation=cv2.INTER_AREA)
        except Exception:
            return 0
        diff = resized[:, 1:] > resized[:, :-1]
        packed = np.packbits(diff.astype(np.uint8), axis=None)
        return int.from_bytes(packed.tobytes(), byteorder="big", signed=False)

    @staticmethod
    def _hamming_distance(hash_a: int, hash_b: int) -> int:
        """Compute Hamming distance between two 64-bit hashes."""
        return int(bin(hash_a ^ hash_b).count("1"))

    def _update_loop_detector(self, gray_frame: np.ndarray) -> None:
        """
        Track frame hashes in a sliding window and estimate whether the stream is looping.
        """
        timestamp = time.time()
        frame_hash = self._compute_frame_hash(gray_frame)

        window_seconds = 12.0
        tolerance_bits = 6
        min_samples = 45

        self._frame_hash_history.append((timestamp, frame_hash))
        # Trim by time to keep only the recent window
        while self._frame_hash_history and timestamp - self._frame_hash_history[0][0] > window_seconds:
            self._frame_hash_history.popleft()

        recent_entries = list(self._frame_hash_history)
        sample_count = len(recent_entries)

        if sample_count < min_samples:
            self.loop_detection_state.update({
                "detected": False,
                "confidence": 0.0,
                "hash_reuse_ratio": 0.0,
                "samples_considered": sample_count,
                "window_seconds": window_seconds,
                "dominant_cluster_frames": 0,
                "dominant_cluster_duration": 0.0,
                "unique_cluster_count": sample_count,
                "last_updated": timestamp,
                "last_hash": frame_hash,
            })
            # Gently decay score when insufficient evidence
            self._loop_detection_score *= 0.92
            self._loop_detection_score = max(0.0, min(1.0, self._loop_detection_score))
            return

        clusters: List[Dict[str, object]] = []
        for entry_time, hash_value in recent_entries:
            matched_cluster = None
            for cluster in clusters:
                if self._hamming_distance(cluster["hash"], hash_value) <= tolerance_bits:
                    matched_cluster = cluster
                    break

            if matched_cluster is None:
                clusters.append({
                    "hash": hash_value,
                    "count": 1,
                    "first_seen": entry_time,
                    "last_seen": entry_time
                })
            else:
                matched_cluster["count"] += 1
                if entry_time < matched_cluster["first_seen"]:
                    matched_cluster["first_seen"] = entry_time
                if entry_time > matched_cluster["last_seen"]:
                    matched_cluster["last_seen"] = entry_time

        clusters.sort(key=lambda item: item["count"], reverse=True)
        dominant_cluster = clusters[0]

        reuse_ratio = dominant_cluster["count"] / float(sample_count)
        dominant_duration = float(dominant_cluster["last_seen"] - dominant_cluster["first_seen"])
        unique_cluster_count = len(clusters)

        raw_confidence = max(0.0, min(1.0, (reuse_ratio - 0.6) / 0.35))
        if dominant_duration < 3.0:
            raw_confidence = 0.0

        # Smooth confidence over time to dampen noise
        self._loop_detection_score = (
            0.85 * self._loop_detection_score + 0.15 * raw_confidence
        )
        self._loop_detection_score = max(0.0, min(1.0, self._loop_detection_score))
        stable_detected = self._loop_detection_score >= 0.6 and raw_confidence > 0.0

        self.loop_detection_state.update({
            "detected": stable_detected,
            "confidence": float(self._loop_detection_score if stable_detected else raw_confidence),
            "hash_reuse_ratio": reuse_ratio,
            "samples_considered": sample_count,
            "window_seconds": window_seconds,
            "dominant_cluster_frames": dominant_cluster["count"],
            "dominant_cluster_duration": dominant_duration,
            "unique_cluster_count": unique_cluster_count,
            "last_updated": timestamp,
            "last_hash": frame_hash,
        })

    
    def _smooth_metric(
        self,
        key: str,
        value: float,
        alpha: float = 0.3,
        max_delta: Optional[float] = None
    ) -> float:
        """Exponentially smooth noisy metric values to stabilise UI feedback."""
        if not np.isfinite(value):
            return self._metric_cache.get(key, 0.0)
        previous = self._metric_cache.get(key)
        if previous is None or not np.isfinite(previous):
            smoothed = value
        else:
            smoothed = previous + alpha * (value - previous)
            if max_delta is not None:
                delta = smoothed - previous
                if delta > max_delta:
                    smoothed = previous + max_delta
                elif delta < -max_delta:
                    smoothed = previous - max_delta
        self._metric_cache[key] = smoothed
        return smoothed

    def _reset_pose_history(self) -> None:
        """Clear cached pose/gaze metrics when tracking is unavailable."""
        for metric_key in [
            "pose_pitch",
            "pose_yaw",
            "pose_roll",
            "gaze_left_h",
            "gaze_right_h",
            "gaze_left_v",
            "gaze_right_v",
        ]:
            self._metric_cache.pop(metric_key, None)
        self.last_head_pose = None
        self.last_pupil_points = []

    @staticmethod
    def _rotation_to_euler(rotation_matrix: np.ndarray) -> Tuple[float, float, float]:
        """
        Convert a rotation matrix into pitch, yaw, roll angles in degrees.
        Pitch: positive looking down, Yaw: positive turning right, Roll: positive clockwise tilt.
        """
        r = rotation_matrix
        sy = np.sqrt(r[0, 0] ** 2 + r[1, 0] ** 2)
        singular = sy < 1e-6

        if not singular:
            pitch = np.degrees(np.arctan2(-r[2, 0], sy))
            yaw = np.degrees(np.arctan2(r[1, 0], r[0, 0]))
            roll = np.degrees(np.arctan2(r[2, 1], r[2, 2]))
        else:
            pitch = np.degrees(np.arctan2(-r[2, 0], sy))
            yaw = np.degrees(np.arctan2(-r[0, 1], r[1, 1]))
            roll = 0.0

        return pitch, yaw, roll

    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """Analyze a single frame and return focus metrics with head pose and gaze tracking."""
        if frame is None or frame.size == 0:
            return self._error_response("Invalid frame")

        self.last_face_box = None
        self.last_pupil_points = []
        self.last_head_pose = None
        self.last_focus_details = {}
        self.last_additional_face_boxes = []

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        self._update_loop_detector(gray)
        device_detected = self._detect_handheld_devices(frame)

        if self.face_mesh is not None:
            try:
                result = self._analyze_with_face_mesh(frame, device_detected)
                if result is not None:
                    return result
            except Exception as mesh_error:
                logger.error(f"Face mesh analysis failed: {mesh_error}", exc_info=True)

        return self._analyze_with_cascades(frame, gray, device_detected)

    def _analyze_with_face_mesh(
        self,
        frame: np.ndarray,
        device_detected: bool
    ) -> Optional[Dict]:
        height, width = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return None

        multi_face_boxes: List[Tuple[int, int, int, int]] = []
        primary_landmarks = None
        landmark_points = None

        face_candidates: List[Tuple[float, Tuple[int, int, int, int], np.ndarray, object]] = []

        for face_landmarks in results.multi_face_landmarks:
            points = np.array(
                [(lm.x, lm.y, lm.z) for lm in face_landmarks.landmark],
                dtype=np.float64
            )
            points[:, 0] *= width
            points[:, 1] *= height
            points[:, 2] *= width  # approximate depth scaling

            min_x = int(max(np.min(points[:, 0]), 0))
            min_y = int(max(np.min(points[:, 1]), 0))
            max_x = int(min(np.max(points[:, 0]), width - 1))
            max_y = int(min(np.max(points[:, 1]), height - 1))

            center = ((min_x + max_x) / 2.0, (min_y + max_y) / 2.0)
            frame_center = (width / 2.0, height / 2.0)
            center_distance = np.linalg.norm(np.array(center) - np.array(frame_center))

            face_area = (max_x - min_x) * (max_y - min_y)
            frame_area = width * height
            area_ratio = face_area / max(frame_area, 1)

            center_score = max(0.0, 1.0 - center_distance / max(width, height))
            area_score = min(max(area_ratio / 0.15, 0.0), 1.0)
            combined_score = 0.6 * center_score + 0.4 * area_score

            face_candidates.append((combined_score, (min_x, min_y, max_x, max_y), points, face_landmarks))

        if not face_candidates:
            return None

        face_candidates.sort(key=lambda item: item[0], reverse=True)
        best_score, best_box, best_points, best_landmarks = face_candidates[0]
        landmark_points = best_points
        primary_landmarks = best_landmarks
        self.last_face_box = best_box

        for _, box, points, landmarks in face_candidates[1:]:
            multi_face_boxes.append(box)

        if landmark_points is None:
            return None

        self.last_additional_face_boxes = multi_face_boxes

        def _pt(idx: int) -> np.ndarray:
            return landmark_points[idx, :2].copy()

        left_eye_outer = _pt(33)
        left_eye_inner = _pt(133)
        left_eye_top = _pt(159)
        left_eye_bottom = _pt(145)
        right_eye_outer = _pt(263)
        right_eye_inner = _pt(362)
        right_eye_top = _pt(386)
        right_eye_bottom = _pt(374)
        left_pupil = _pt(468)
        right_pupil = _pt(473)

        clamp_min = np.array([0, 0], dtype=int)
        clamp_max = np.array([width - 1, height - 1], dtype=int)

        left_pupil_clamped = np.clip(np.round(left_pupil).astype(int), clamp_min, clamp_max)
        right_pupil_clamped = np.clip(np.round(right_pupil).astype(int), clamp_min, clamp_max)

        self.last_pupil_points = [
            (int(left_pupil_clamped[0]), int(left_pupil_clamped[1])),
            (int(right_pupil_clamped[0]), int(right_pupil_clamped[1]))
        ]

        faces_detected = 1 + len(self.last_additional_face_boxes)

        def _ratio(center: np.ndarray, a: np.ndarray, b: np.ndarray) -> float:
            denom = (b[0] - a[0])
            if abs(denom) < 1e-3:
                return 0.5
            return float((center[0] - a[0]) / denom)

        def _vertical_ratio(center: np.ndarray, top: np.ndarray, bottom: np.ndarray) -> float:
            denom = (bottom[1] - top[1])
            if abs(denom) < 1e-3:
                return 0.5
            return float((center[1] - top[1]) / denom)

        left_horizontal_ratio = _ratio(left_pupil, left_eye_inner, left_eye_outer)
        right_horizontal_ratio = _ratio(right_pupil, right_eye_inner, right_eye_outer)
        left_vertical_ratio = _vertical_ratio(left_pupil, left_eye_top, left_eye_bottom)
        right_vertical_ratio = _vertical_ratio(right_pupil, right_eye_top, right_eye_bottom)

        left_horizontal_ratio = self._smooth_metric("gaze_left_h", left_horizontal_ratio, alpha=0.35, max_delta=0.08)
        right_horizontal_ratio = self._smooth_metric("gaze_right_h", right_horizontal_ratio, alpha=0.35, max_delta=0.08)
        left_vertical_ratio = self._smooth_metric("gaze_left_v", left_vertical_ratio, alpha=0.35, max_delta=0.08)
        right_vertical_ratio = self._smooth_metric("gaze_right_v", right_vertical_ratio, alpha=0.35, max_delta=0.08)

        pose_indices = [1, 152, 33, 263, 61, 291]
        face_3d = landmark_points[pose_indices].astype(np.float64)
        face_2d = face_3d[:, :2].astype(np.float64)

        focal_length = width
        center = (width / 2, height / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        success, rotation_vec, translation_vec = cv2.solvePnP(
            face_3d,
            face_2d,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        raw_pitch = raw_yaw = raw_roll = 0.0
        axis_points_2d: Optional[np.ndarray] = None
        origin_point: Optional[Tuple[int, int]] = None

        if success:
            rotation_matrix, _ = cv2.Rodrigues(rotation_vec)
            raw_pitch, raw_yaw, raw_roll = self._rotation_to_euler(rotation_matrix)

            nose_3d = face_3d[0]
            nose_2d = face_2d[0]

            axis = np.array([
                [0.0, 0.0, 0.0],
                [60.0, 0.0, 0.0],
                [0.0, 60.0, 0.0],
                [0.0, 0.0, 60.0]
            ], dtype=np.float64)
            axis_points, _ = cv2.projectPoints(
                axis,
                rotation_vec,
                translation_vec,
                camera_matrix,
                dist_coeffs
            )
            axis_points_2d = axis_points.reshape(-1, 2).astype(int)
            origin_point = tuple(np.clip(np.round(nose_2d).astype(int), [0, 0], [width - 1, height - 1]))
            self.last_head_pose = {
                "angles": (raw_pitch, raw_yaw, raw_roll),
                "origin": origin_point,
                "axis_points": axis_points_2d
            }
        else:
            self.last_head_pose = None

        if success:
            pitch = self._smooth_metric("pose_pitch", raw_pitch, alpha=0.2, max_delta=5.0)
            yaw = self._smooth_metric("pose_yaw", raw_yaw, alpha=0.2, max_delta=5.0)
            roll = self._smooth_metric("pose_roll", raw_roll, alpha=0.2, max_delta=5.0)
        else:
            pitch = self._metric_cache.get("pose_pitch", 0.0) * 0.9
            yaw = self._metric_cache.get("pose_yaw", 0.0) * 0.9
            roll = self._metric_cache.get("pose_roll", 0.0) * 0.9
            self._metric_cache["pose_pitch"] = pitch
            self._metric_cache["pose_yaw"] = yaw
            self._metric_cache["pose_roll"] = roll

        if self.last_head_pose is not None:
            self.last_head_pose["angles"] = (pitch, yaw, roll)

        frame_score = 100.0
        alerts: List[str] = []
        status_parts: List[str] = []
        new_state = "focused"

        if faces_detected > 1:
            alerts.append(f"multiple_faces:{faces_detected}")
            status_parts.append(f"{faces_detected} faces detected")
            frame_score = max(frame_score - min(30.0 * (faces_detected - 1), 70.0), 0.0)
            new_state = "away"

        pitch_deviation = max(0.0, abs(pitch) - 8.0)
        yaw_deviation = max(0.0, abs(yaw) - 10.0)
        roll_deviation = max(0.0, abs(roll) - 12.0)

        frame_score -= min(pitch_deviation * 1.1, 30.0)
        frame_score -= min(yaw_deviation * 1.1, 30.0)
        frame_score -= min(roll_deviation * 0.75, 18.0)

        if abs(pitch) > 28.0:
            alerts.append(f"head_pitch:{pitch:.1f}")
            status_parts.append("Head pitched")
            new_state = "away"
        if abs(yaw) > 32.0:
            alerts.append(f"head_yaw:{yaw:.1f}")
            status_parts.append("Looking sideways")
            new_state = "away"
        if abs(roll) > 28.0:
            alerts.append(f"head_roll:{roll:.1f}")
            status_parts.append("Head tilted")

        horizontal_soft_bounds = (0.34, 0.66)
        horizontal_hard_bounds = (0.27, 0.73)
        vertical_soft_bounds = (0.37, 0.63)
        vertical_hard_bounds = (0.30, 0.70)

        horizontal_soft_ok = (
            horizontal_soft_bounds[0] <= left_horizontal_ratio <= horizontal_soft_bounds[1] and
            horizontal_soft_bounds[0] <= right_horizontal_ratio <= horizontal_soft_bounds[1]
        )
        horizontal_hard_violation = (
            left_horizontal_ratio < horizontal_hard_bounds[0] or
            left_horizontal_ratio > horizontal_hard_bounds[1] or
            right_horizontal_ratio < horizontal_hard_bounds[0] or
            right_horizontal_ratio > horizontal_hard_bounds[1]
        )

        vertical_soft_ok = (
            vertical_soft_bounds[0] <= left_vertical_ratio <= vertical_soft_bounds[1] and
            vertical_soft_bounds[0] <= right_vertical_ratio <= vertical_soft_bounds[1]
        )
        vertical_hard_violation = (
            left_vertical_ratio < vertical_hard_bounds[0] or
            left_vertical_ratio > vertical_hard_bounds[1] or
            right_vertical_ratio < vertical_hard_bounds[0] or
            right_vertical_ratio > vertical_hard_bounds[1]
        )

        if horizontal_hard_violation:
            frame_score -= 22.0
            alerts.append("gaze_horizontal_off")
            status_parts.append("Eyes off-center")
            new_state = "away"
        elif not horizontal_soft_ok:
            frame_score -= 10.0
            status_parts.append("Eyes drifting sideways")

        if vertical_hard_violation:
            frame_score -= 18.0
            alerts.append("gaze_vertical_off")
            status_parts.append("Eyes off-vertical")
            new_state = "away"
        elif not vertical_soft_ok:
            frame_score -= 8.0
            status_parts.append("Eyes drifting up/down")

        gaze_ok = horizontal_soft_ok and vertical_soft_ok

        if gaze_ok and new_state == "focused" and not status_parts:
            status_parts.append("Focused on screen")
        elif not status_parts:
            status_parts.append("Analyzing")

        if device_detected:
            frame_score = max(frame_score - 40.0, 0.0)
            if "device_detected" not in alerts:
                alerts.append("device_detected")
            status_parts.append("Device detected")
            new_state = "away"

        frame_score = max(0.0, min(100.0, frame_score))
        alerts = list(dict.fromkeys(alerts))

        status_text = " | ".join(status_parts)
        status_text = f"{status_text} | pitch:{pitch:.1f}° yaw:{yaw:.1f}° roll:{roll:.1f}°"

        self.last_focus_details = {
            "pitch": pitch,
            "yaw": yaw,
            "roll": roll,
            "left_horizontal_ratio": left_horizontal_ratio,
            "right_horizontal_ratio": right_horizontal_ratio,
            "left_vertical_ratio": left_vertical_ratio,
            "right_vertical_ratio": right_vertical_ratio,
            "gaze_ok": gaze_ok,
            "device_presence": self.device_presence_score,
            "faces_detected": faces_detected,
            "multi_face_count": faces_detected
        }

        return self._finalize_result(
            frame_score=frame_score,
            status_text=status_text,
            new_state=new_state,
            alerts=alerts,
            faces_detected=faces_detected,
            eyes_detected=2
        )

    def _analyze_with_cascades(
        self,
        frame: np.ndarray,
        gray: np.ndarray,
        device_detected: bool
    ) -> Dict:
        self._reset_pose_history()

        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        additional_boxes: List[Tuple[int, int, int, int]] = []

        profile_faces_right = self.profile_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        gray_flipped = cv2.flip(gray, 1)
        profile_faces_left = self.profile_cascade.detectMultiScale(
            gray_flipped, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        profile_faces_left_adjusted = []
        for (x, y, w, h) in profile_faces_left:
            x_adjusted = frame.shape[1] - x - w
            profile_faces_left_adjusted.append((x_adjusted, y, w, h))

        frame_score = 10.0
        status_text = "No face detected"
        new_state = "away"
        alerts: List[str] = []
        eyes_detected = 0

        if len(faces) > 0:
            face_candidates: List[Tuple[float, Tuple[int, int, int, int]]] = []
            frame_center = (frame.shape[1] / 2.0, frame.shape[0] / 2.0)

            for (fx, fy, fw, fh) in faces:
                cx = fx + fw / 2.0
                cy = fy + fh / 2.0
                center_distance = np.linalg.norm(np.array([cx, cy]) - np.array(frame_center))
                face_area = fw * fh
                frame_area = frame.shape[0] * frame.shape[1]
                area_ratio = face_area / max(frame_area, 1)

                center_score = max(0.0, 1.0 - center_distance / max(frame.shape[1], frame.shape[0]))
                area_score = min(max(area_ratio / 0.15, 0.0), 1.0)
                combined_score = 0.6 * center_score + 0.4 * area_score

                face_candidates.append((combined_score, (fx, fy, fw, fh)))

            face_candidates.sort(key=lambda item: item[0], reverse=True)

            best_score, (x, y, w, h) = face_candidates[0]
            self.last_face_box = (x, y, x + w, y + h)

            for _, (fx, fy, fw, fh) in face_candidates[1:]:
                additional_boxes.append((fx, fy, fx + fw, fy + fh))

            self.last_additional_face_boxes = additional_boxes
            roi_gray = gray[y:y + h, x:x + w]

            eyes = self.eye_cascade.detectMultiScale(
                roi_gray,
                scaleFactor=1.05,
                minNeighbors=3,
                minSize=(10, 10)
            )
            eyes_detected = len(eyes)

            self.last_pupil_points = []
            for (ex, ey, ew, eh) in eyes[:2]:
                eye_center = (x + ex + ew // 2, y + ey + eh // 2)
                self.last_pupil_points.append(eye_center)

            frame_score = 65.0
            status_text = "Face detected - limited tracking"
            new_state = "focused"

            if len(eyes) >= 2:
                frame_score += 15.0
            elif len(eyes) == 1:
                frame_score += 5.0
            else:
                frame_score -= 10.0
                alerts.append("eyes_not_detected")

        elif len(profile_faces_right) > 0 or len(profile_faces_left_adjusted) > 0:
            frame_score = 15.0
            new_state = "away"
            status_text = "Profile detected - looking away"
            if len(profile_faces_right) > 0:
                alerts.append("looking_right")
            if len(profile_faces_left_adjusted) > 0:
                alerts.append("looking_left")
            self.last_additional_face_boxes = []
        else:
            alerts.append("no_face")
            self.last_additional_face_boxes = []

        faces_detected_total = max(len(faces), 0)
        if faces_detected_total > 1:
            alerts.append(f"multiple_faces:{faces_detected_total}")
            status_text = f"{faces_detected_total} faces detected"
            frame_score = max(frame_score - min(30.0 * (faces_detected_total - 1), 70.0), 0.0)
            new_state = "away"

        if device_detected:
            frame_score = max(frame_score - 35.0, 0.0)
            status_text = "Device detected"
            if "device_detected" not in alerts:
                alerts.append("device_detected")
            new_state = "away"

        frame_score = max(0.0, min(100.0, frame_score))
        alerts = list(dict.fromkeys(alerts))

        self.last_focus_details = {
            "device_presence": self.device_presence_score,
            "faces_detected": faces_detected_total,
            "eyes_detected": eyes_detected,
            "multi_face_count": faces_detected_total
        }

        return self._finalize_result(
            frame_score=frame_score,
            status_text=status_text,
            new_state=new_state,
            alerts=alerts,
            faces_detected=faces_detected_total,
            eyes_detected=eyes_detected
        )

    def _finalize_result(
        self,
        frame_score: float,
        status_text: str,
        new_state: str,
        alerts: List[str],
        faces_detected: int,
        eyes_detected: int
    ) -> Dict:
        current_time = time.time()
        if new_state == "away":
            if self.away_start_time is None:
                self.away_start_time = current_time
            self.away_timer = current_time - self.away_start_time
            if self.away_timer >= 5.0 and "away_5_seconds" not in alerts:
                alerts.append("away_5_seconds")
        else:
            self.away_start_time = None
            self.away_timer = 0.0

        alerts = list(dict.fromkeys(alerts))

        self.focus_score = 0.7 * frame_score + 0.3 * self.focus_score
        self.current_state = new_state
        self.last_status_text = status_text

        loop_state = dict(self.loop_detection_state)
        if loop_state.get("detected") and "looping_video" not in alerts:
            alerts.append("looping_video")
        alerts = list(dict.fromkeys(alerts))

        return {
            "success": True,
            "focus_score": round(self.focus_score, 2),
            "raw_frame_score": round(frame_score, 2),
            "status": status_text,
            "state": new_state,
            "away_timer": round(self.away_timer, 2),
            "alerts": alerts,
            "faces_detected": faces_detected,
            "eyes_detected": eyes_detected,
            "loop_detection": loop_state,
            "timestamp": time.time()
        }
    
    
    def _error_response(self, message: str) -> Dict:
        return {
            "success": False,
            "error": message,
            "focus_score": 0.0,
            "status": "ERROR",
            "state": "unknown",
            "timestamp": time.time()
        }


# Global monitor instance
monitor = FocusMonitor()


def _decode_base64_frame(frame_payload: str) -> np.ndarray:
    """
    Decode a base64 encoded frame string into an OpenCV BGR image.
    Raises ValueError with a clear message when decoding fails.
    """
    if frame_payload is None:
        raise ValueError("Missing frame data")
    
    base64_part = frame_payload.split(",")[-1].strip()
    if not base64_part:
        raise ValueError("Empty frame data")
    
    try:
        frame_bytes = base64.b64decode(base64_part, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 frame data") from exc
    
    if not frame_bytes:
        raise ValueError("Decoded frame is empty")
    
    nparr = np.frombuffer(frame_bytes, np.uint8)
    if nparr.size == 0:
        raise ValueError("Decoded frame buffer is empty")
    
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Failed to decode frame as image")
    
    return frame


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "AI Focus Monitoring API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze (WebSocket)",
            "webcam": "/webcam/stream"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "monitor_initialized": True,
        "timestamp": time.time()
    }


@app.websocket("/analyze")
async def websocket_analyze(websocket: WebSocket):
    """
    WebSocket endpoint for real-time frame analysis
    
    Client sends: {"frame": "base64_encoded_image"}
    Server responds: {"focus_score": float, "status": str, ...}
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    async def send_json_safe(payload: Dict) -> bool:
        if websocket.client_state != WebSocketState.CONNECTED:
            return False
        try:
            await websocket.send_json(payload)
            return True
        except RuntimeError:
            logger.info("WebSocket closed before message could be sent")
            return False
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected during send")
            return False
    
    try:
        while True:
            # Receive frame from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                frame_field = message.get("frame")
                if frame_field is None:
                    if not await send_json_safe({
                        "success": False,
                        "error": "No frame data provided"
                    }):
                        break
                    continue
                
                try:
                    frame = _decode_base64_frame(frame_field)
                except ValueError as decode_error:
                    if not await send_json_safe({
                        "success": False,
                        "error": str(decode_error)
                    }):
                        break
                    continue
                
                # Analyze frame
                result = monitor.analyze_frame(frame)
                
                # Send result back
                if not await send_json_safe(result):
                    break
                
            except json.JSONDecodeError:
                if not await send_json_safe({
                    "success": False,
                    "error": "Invalid JSON format"
                }):
                    break
            except Exception as e:
                logger.error(f"Error processing frame: {str(e)}")
                if not await send_json_safe({
                    "success": False,
                    "error": f"Processing error: {str(e)}"
                }):
                    break
    
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")


def generate_webcam_frames():
    """Generator for webcam video stream with proper cleanup"""
    camera = None
    try:
        camera = _open_camera()
        if camera is None:
            logger.error("Failed to open camera after backend probe")
            return

        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 30)
        
        logger.info("Webcam stream started")
        frame_count = 0
        
        while True:
            success, frame = camera.read()
            if not success:
                logger.warning("Failed to read frame")
                break
            
            frame_count += 1
            
            # Analyze frame every frame (no skipping)
            result = monitor.analyze_frame(frame)
            
            # Draw overlay (EXACT from main.py)
            height, width = frame.shape[:2]
            
            # Determine color based on score
            score = result["focus_score"]
            if score >= 85:
                color = (0, 255, 0)  # Green
            elif score >= 70:
                color = (0, 255, 255)  # Yellow
            elif score >= 50:
                color = (0, 165, 255)  # Orange
            else:
                color = (0, 0, 255)  # Red
            
            # Draw score
            cv2.putText(frame, f"FOCUS: {score:.0f}%", (10, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
            
            # Draw status
            cv2.putText(frame, result["status"], (10, 80),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Draw state
            cv2.putText(frame, f"State: {result['state'].upper()}", (10, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # Draw head pose axes
            pose_info = monitor.last_head_pose
            if pose_info and pose_info.get("axis_points") is not None and pose_info.get("origin") is not None:
                origin = tuple(pose_info["origin"])
                axis_points = pose_info["axis_points"]
                if axis_points is not None and len(axis_points) >= 4:
                    cv2.line(frame, origin, tuple(axis_points[1]), (0, 0, 255), 2)  # X-axis
                    cv2.line(frame, origin, tuple(axis_points[2]), (0, 255, 0), 2)  # Y-axis
                    cv2.line(frame, origin, tuple(axis_points[3]), (255, 0, 0), 2)  # Z-axis

            # Draw face bounding box
            if monitor.last_face_box:
                fx1, fy1, fx2, fy2 = monitor.last_face_box
                cv2.rectangle(frame, (fx1, fy1), (fx2, fy2), (255, 255, 0), 2)

            if monitor.last_additional_face_boxes:
                for idx, (ax1, ay1, ax2, ay2) in enumerate(monitor.last_additional_face_boxes, start=1):
                    cv2.rectangle(frame, (ax1, ay1), (ax2, ay2), (0, 0, 255), 2)
                    cv2.putText(frame, f"FACE {idx+1}", (ax1, max(ay1 - 10, 0)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            # Draw pupils
            for pupil in monitor.last_pupil_points:
                cv2.circle(frame, pupil, 4, (0, 255, 255), -1)

            # Draw detected device boxes
            if monitor.last_device_boxes:
                for box in monitor.last_device_boxes:
                    cv2.polylines(frame, [box], True, (0, 140, 255), 2)
            
            # Draw away timer if active
            if result["away_timer"] > 0:
                timer_color = (0, 165, 255) if result["away_timer"] < 5.0 else (0, 0, 255)
                cv2.putText(frame, f"Away: {result['away_timer']:.1f}s / 5.0s", 
                           (10, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, timer_color, 2)
                
                # Warning if >= 5 seconds
                if result["away_timer"] >= 5.0:
                    cv2.putText(frame, "!!! WARNING: LOOK AT SCREEN !!!", 
                               (width//2 - 300, height//2),
                               cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            
            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    except Exception as e:
        logger.error(f"Error in webcam stream: {e}")
    finally:
        if camera is not None:
            camera.release()
            logger.info("Webcam stream stopped and camera released")


@app.get("/webcam/stream")
async def webcam_stream():
    """Stream webcam with focus analysis overlay"""
    return StreamingResponse(
        generate_webcam_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/analyze-frame")
async def analyze_frame(request: dict):
    """
    POST endpoint for single frame analysis (for Next.js API integration)
    
    Request: {"frame": "base64_encoded_image"}
    Response: {"success": true, "focus_score": 85.5, ...}
    """
    try:
        frame_field = request.get("frame")
        if frame_field is None:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "No frame data provided"}
            )
        
        try:
            frame = _decode_base64_frame(frame_field)
        except ValueError as decode_error:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": str(decode_error)}
            )
        
        # Analyze frame
        result = monitor.analyze_frame(frame)
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing frame: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Processing error: {str(e)}"}
        )


@app.get("/stats")
async def get_stats():
    """Get current monitoring statistics"""
    return {
        "current_score": round(monitor.focus_score, 2),
        "current_state": monitor.current_state,
        "away_timer": round(monitor.away_timer, 2),
        "last_status": monitor.last_status_text,
        "timestamp": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting FastAPI server (HTTP mode - no SSL)")
    logger.info(f"Server will be available at http://0.0.0.0:8000")
    
    try:
        # Run without SSL for now to test basic functionality
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8080,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}", exc_info=True)
        import sys
        sys.exit(1)
