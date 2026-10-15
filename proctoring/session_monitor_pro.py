import os
import sys
import time
import math
import csv
import queue
import threading
import random
import string
from datetime import datetime
from collections import defaultdict
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from pupil import Pupil

# =====================================================================
# Feature-availability detection
# =====================================================================
WINDOW_TRACKING = False
try:
    import pygetwindow as gw

    gw.getActiveWindow()
    WINDOW_TRACKING = True
except Exception:
    pass

AUDIO_AVAILABLE = False
try:
    import sounddevice as sd
    from faster_whisper import WhisperModel

    AUDIO_AVAILABLE = True
except Exception as e:
    print(f"Audio libraries unavailable. Captioning disabled. Error: {e}")

YOLO_AVAILABLE = False
try:
    from ultralytics import YOLO

    YOLO_AVAILABLE = True
except Exception:
    pass

TARGET_OBJECTS = {"cell phone", "laptop"}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIR_PERSON_SS = os.path.join(BASE_DIR, "person_screenshots")
DIR_OBJ_SS = os.path.join(BASE_DIR, "obj_screenshots")

# =====================================================================
# Aggregation Engine Configuration
# =====================================================================
BASE_WEIGHTS = {
    "LOOKING_AWAY": 5,
    "PUPIL_GAZE_AWAY": 7,
    "EYE_LOOKING_LEFT": 8,
    "EYE_LOOKING_RIGHT": 8,
    "NO_FACE": 12,
    "TAB_SWITCH": 8,
    "MULTIPLE_FACES": 15,
    "OBJECT": 15,
}

MAX_CATEGORY_SCORE = {
    "LOOKING_AWAY": 20,
    "PUPIL_GAZE_AWAY": 25,
    "EYE_LOOKING_LEFT": 25,
    "EYE_LOOKING_RIGHT": 25,
    "NO_FACE": 25,
    "MULTIPLE_FACES": 35,
    "OBJECT": 30,
    "TAB_SWITCH": 25,
}

PERSISTENCE_THRESHOLDS = {
    "LOOKING_AWAY": 2.0,
    "PUPIL_GAZE_AWAY": 1.5,
    "EYE_LOOKING_LEFT": 10.0,
    "EYE_LOOKING_RIGHT": 10.0,
    "NO_FACE": 2.0,
    "MULTIPLE_FACES": 1.5,
    "OBJECT": 1.0,
}

ALERT_CONFIRMATION_SECONDS = 0.35
HEAD_YAW_THRESHOLD = 0.35
PUPIL_AWAY_DURATION = 0.5
PUPIL_ALERT_COOLDOWN = 3.0
PUPIL_PERSISTENT_DIRECTION_DURATION = 10.0  # Alert if looking left/right for > 10s
PUPIL_BINARY_THRESHOLD = 45
PUPIL_MIN_CONTOUR_AREA = 8
PUPIL_MAX_CONTOUR_AREA_RATIO = 0.45
PUPIL_LEFT_RATIO = 0.38
PUPIL_RIGHT_RATIO = 0.62
PUPIL_UP_RATIO = 0.38
PUPIL_HEAD_CENTER_THRESHOLD = 0.22
SHOW_GAZE_DEBUG = False


# =====================================================================
# Helpers
# =====================================================================
def init_yolo_detector():
    if not YOLO_AVAILABLE: return None
    try:
        print("  Loading YOLOv8-Nano model...")
        model = YOLO('yolov8n.pt')
        return model
    except Exception:
        return None


def format_time(seconds):
    if seconds < 0: seconds = 0
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0: return f"{h}h {m:02d}m {s:02d}s"
    if m > 0: return f"{m}m {s:02d}s"
    return f"{s}s"


def get_duration_factor(event_type, duration):
    if event_type == "TAB_SWITCH": return 1.0
    if event_type in ["EYE_LOOKING_LEFT", "EYE_LOOKING_RIGHT"]:
        if duration >= 20.0: return 2.0
        if duration >= 15.0: return 1.5
        return 1.2
    if event_type == "PUPIL_GAZE_AWAY" and duration >= PUPIL_AWAY_DURATION: return 1.0
    if duration < 2.0: return 0.0
    if duration <= 5.0: return 1.0
    if duration <= 10.0: return 1.5
    return 2.0


def get_frequency_factor(count):
    if count == 1: return 1.0
    if count == 2: return 1.5
    if count == 3: return 1.8
    if count <= 5: return 2.2
    return 2.8


def generate_session_id():
    ts = datetime.now().strftime("%Y%m%d")
    rand_str = ''.join(random.choices(string.digits, k=5))
    return f"SES-{ts}-{rand_str}"


PUPIL_THRESHOLD = 55
PUPIL_LEFT_THRESHOLD = 0.35
PUPIL_RIGHT_THRESHOLD = 0.65
PUPIL_UP_THRESHOLD = 0.35
PUPIL_DOWN_THRESHOLD = 0.65


def get_eye_crop(gray_image, lm, eye_points, frame_width, frame_height):
    points = np.array(
        [(int(lm[i].x * frame_width), int(lm[i].y * frame_height)) for i in eye_points],
        dtype=np.int32
    )

    x, y, w, h = cv2.boundingRect(points)

    pad_x = max(int(w * 0.15), 2)
    pad_y = max(int(h * 0.50), 2)

    x1 = max(x - pad_x, 0)
    y1 = max(y - pad_y, 0)
    x2 = min(x + w + pad_x, gray_image.shape[1])
    y2 = min(y + h + pad_y, gray_image.shape[0])

    if x2 <= x1 or y2 <= y1:
        return None, (x1, y1)

    eye_crop = gray_image[y1:y2, x1:x2]
    return eye_crop, (x1, y1)


def detect_pupil_gaze(gray, lm, frame_width, frame_height):
    left_eye_points = [33, 160, 158, 133, 153, 144]
    right_eye_points = [362, 385, 387, 263, 373, 380]

    left_eye, left_offset = get_eye_crop(gray, lm, left_eye_points, frame_width, frame_height)
    right_eye, right_offset = get_eye_crop(gray, lm, right_eye_points, frame_width, frame_height)

    if left_eye is None or right_eye is None:
        return "UNKNOWN", [], {}

    left_pupil = Pupil(left_eye, PUPIL_THRESHOLD)
    right_pupil = Pupil(right_eye, PUPIL_THRESHOLD)

    if left_pupil.x is None or left_pupil.y is None or right_pupil.x is None or right_pupil.y is None:
        return "UNKNOWN", [], {}

    left_x_ratio = left_pupil.x / max(left_eye.shape[1], 1)
    left_y_ratio = left_pupil.y / max(left_eye.shape[0], 1)

    right_x_ratio = right_pupil.x / max(right_eye.shape[1], 1)
    right_y_ratio = right_pupil.y / max(right_eye.shape[0], 1)

    # Average horizontal and vertical eye pupil position ratio
    avg_x_ratio = (left_x_ratio + right_x_ratio) / 2.0
    avg_y_ratio = (left_y_ratio + right_y_ratio) / 2.0

    # Classify eye movement into LEFT, RIGHT, UP, DOWN, or CENTER
    if (left_x_ratio < PUPIL_LEFT_THRESHOLD and right_x_ratio < PUPIL_LEFT_THRESHOLD) or avg_x_ratio < 0.38:
        direction = "LEFT"
    elif (left_x_ratio > PUPIL_RIGHT_THRESHOLD and right_x_ratio > PUPIL_RIGHT_THRESHOLD) or avg_x_ratio > 0.62:
        direction = "RIGHT"
    elif (left_y_ratio < PUPIL_UP_THRESHOLD and right_y_ratio < PUPIL_UP_THRESHOLD) or avg_y_ratio < 0.35:
        direction = "UP"
    elif (left_y_ratio > PUPIL_DOWN_THRESHOLD and right_y_ratio > PUPIL_DOWN_THRESHOLD) or avg_y_ratio > 0.65:
        direction = "DOWN"
    else:
        direction = "CENTER"

    pupil_data = [
        {"center": (left_offset[0] + left_pupil.x, left_offset[1] + left_pupil.y)},
        {"center": (right_offset[0] + right_pupil.x, right_offset[1] + right_pupil.y)}
    ]

    metrics = {
        "avg_x_ratio": avg_x_ratio,
        "avg_y_ratio": avg_y_ratio,
        "left_x_ratio": left_x_ratio,
        "right_x_ratio": right_x_ratio
    }
    return direction, pupil_data, metrics


# =====================================================================
# Face Tracker (Internal Use Only)
# =====================================================================
class FaceTracker:
    def __init__(self, max_dist=100):
        self.next_id = 1
        self.tracks = {}
        self.max_dist = max_dist

    def update(self, boxes, dt):
        centroids = [(x + w / 2, y + h / 2) for x, y, w, h in boxes]
        matched_ids, new_ids = [], []
        used = set()
        for cx, cy in centroids:
            best_id, best_d = None, float("inf")
            for tid, tr in self.tracks.items():
                if tid in used: continue
                d = math.hypot(cx - tr["cx"], cy - tr["cy"])
                if d < best_d and d < self.max_dist:
                    best_d, best_id = d, tid
            if best_id is not None:
                matched_ids.append(best_id)
                used.add(best_id)
                self.tracks[best_id].update(cx=cx, cy=cy, last_seen=time.time())
            else:
                nid = self.next_id
                self.next_id += 1
                self.tracks[nid] = dict(cx=cx, cy=cy, total_time=0.0, last_seen=time.time())
                matched_ids.append(nid)
                new_ids.append(nid)
        for tid in matched_ids:
            self.tracks[tid]["total_time"] += dt
        return matched_ids, new_ids, []


# =====================================================================
# Server State & HTTP Handler for Web Integration
# =====================================================================
class ProctorServerState:
    def __init__(self):
        self.start_requested = False
        self.stop_requested = False
        self.is_monitoring = False
        self.attempt_id = None
        self.stage = None
        self.events_queue = []
        self.lock = threading.Lock()
        self.summary_data = None
        self.preview_frame = None
        self.monitor = None
        self.server_mode = False


server_state = ProctorServerState()


class ProctoringHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress server logging in console to keep it clean

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/frame":
            with server_state.lock:
                frame = server_state.preview_frame
            if frame is None:
                placeholder = np.zeros((360, 640, 3), dtype=np.uint8)
                placeholder[:] = (24, 24, 30)
                status_txt = "AI PROCTOR INITIALIZING..." if server_state.is_monitoring else "PROCTOR COMPANION READY"
                cv2.putText(placeholder, status_txt, (140, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 220, 120) if server_state.is_monitoring else (180, 180, 180), 2, cv2.LINE_AA)
                cv2.putText(placeholder, "HIRESENSE INTEGRITY SYSTEM", (170, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 140, 150), 1, cv2.LINE_AA)
                _, encoded = cv2.imencode(".jpg", placeholder, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                frame = encoded.tobytes()

            self.send_response(200)
            self._set_cors_headers()
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Content-Length", str(len(frame)))
            self.end_headers()
            self.wfile.write(frame)
            return

        self.send_response(200)
        self._set_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()

        if self.path == "/status":
            with server_state.lock:
                monitor = server_state.monitor
                status_info = {
                    "status": "running" if server_state.is_monitoring else "idle",
                    "attemptId": server_state.attempt_id,
                    "stage": server_state.stage,
                    "activeAlerts": monitor.get_active_alerts() if monitor else []
                }
            self.wfile.write(json.dumps(status_info).encode("utf-8"))

        elif self.path == "/events":
            with server_state.lock:
                events = list(server_state.events_queue)
                server_state.events_queue.clear()
            self.wfile.write(json.dumps({"events": events}).encode("utf-8"))
        else:
            self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))

    def do_POST(self):
        self.send_response(200)
        self._set_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            body = json.loads(post_data)
        except Exception:
            body = {}

        if self.path == "/start":
            attempt_id = body.get("attemptId")
            stage = body.get("stage", "APTITUDE").upper()

            # Cleanly stop any existing monitor session so the camera is released
            with server_state.lock:
                if server_state.is_monitoring and server_state.monitor:
                    try:
                        server_state.monitor.running = False
                    except Exception:
                        pass
                server_state.stop_requested = True

            time.sleep(0.35)

            with server_state.lock:
                server_state.stop_requested = False
                server_state.attempt_id = attempt_id
                server_state.stage = stage
                server_state.events_queue.clear()
                server_state.summary_data = None
                server_state.preview_frame = None
                server_state.start_requested = True

            self.wfile.write(json.dumps({"status": "ok", "message": "Proctoring start requested"}).encode("utf-8"))

        elif self.path == "/stop":
            with server_state.lock:
                if server_state.monitor:
                    try:
                        server_state.monitor.running = False
                    except Exception:
                        pass
                server_state.stop_requested = True

            # Wait for monitoring loop to terminate and set summary_data
            retries = 50  # 5 seconds
            while retries > 0:
                with server_state.lock:
                    if not server_state.is_monitoring:
                        break
                time.sleep(0.1)
                retries -= 1

            with server_state.lock:
                summary = server_state.summary_data

            self.wfile.write(json.dumps({"status": "ok", "summary": summary}).encode("utf-8"))
        else:
            self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))


# =====================================================================
# Main Monitor
# =====================================================================
class SessionMonitorPro:
    def __init__(self, camera_index=0, log_file=None):
        self.camera_index = camera_index
        if log_file is None:
            self.log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "session_log.csv")
        else:
            self.log_file = log_file
        self.events = []
        self.running = False
        self.start_time = None
        self.muted = False
        self.audio_active = False
        self.session_id = generate_session_id()

        # Event State Machine
        self.active_states = {
            "LOOKING_AWAY": {"active": False, "start_time": 0, "max_conf": 0.0},
            "NO_FACE": {"active": False, "start_time": 0, "max_conf": 0.0},
            "MULTIPLE_FACES": {"active": False, "start_time": 0, "max_conf": 0.0},
            "OBJECT": {"active": False, "start_time": 0, "max_conf": 0.0},
        }

        # Aggregation metrics
        self.event_counts = defaultdict(int)
        self.category_scores = defaultdict(float)
        self.event_timeline = []
        self.critical_flags = []
        self.event_stats = defaultdict(lambda: {"count": 0, "duration": 0.0})

        # Time tracking
        self.total_on_screen_time = 0.0
        self.total_off_screen_time = 0.0  # Candidate Absence (NO_FACE)
        self.total_camera_unavailable_time = 0.0  # Camera Failure
        self.total_looking_at_screen = 0.0
        self.total_looking_away = 0.0
        self.longest_absence = 0.0
        self.longest_look_away = 0.0
        self.longest_multi_face_duration = 0.0

        self.current_absence_duration = 0.0
        self.pupil_direction = "CENTER"
        self.pupil_away_start_time = None
        self.pupil_alert_triggered = False
        self.last_pupil_alert_time = 0.0
        self.pupil_alert_visible_until = 0.0
        self.last_pupil_points = []
        self.pupil_unknown_start_time = None
        self.pupil_alert_text = "WARNING: You are looking away from the screen"

        # Dedicated Eye Movement / Pupil Position Tracker (> 10s alert)
        self.eye_state = "CENTER"
        self.eye_left_start_time = None
        self.eye_right_start_time = None
        self.eye_left_alert_triggered = False
        self.eye_right_alert_triggered = False
        self.eye_left_critical_flagged = False
        self.eye_right_critical_flagged = False
        self.total_eye_left_duration = 0.0
        self.total_eye_right_duration = 0.0
        self.longest_eye_left_duration = 0.0
        self.longest_eye_right_duration = 0.0
        self.current_eye_left_duration = 0.0
        self.current_eye_right_duration = 0.0
        self.eye_alert_visible_until = 0.0
        self.eye_alert_text = ""
        self.pupil_movement_metrics = {}

        # Monitoring Quality Metrics
        self.frames_received = 0
        self.frames_failed = 0
        self.camera_disconnects = 0
        self.camera_was_disconnected = False
        self.total_face_confidence = 0.0
        self.confidence_checks = 0

        self.face_tracker = FaceTracker()
        self.current_frame = None
        self.last_window_title = None

        # --- Detector Tier 1: Modern MediaPipe Tasks FaceLandmarker (MediaPipe 0.10.x+) ---
        self.task_landmarker = None
        task_model_path = os.path.join(BASE_DIR, "face_landmarker.task")
        if os.path.exists(task_model_path):
            try:
                base_options = python.BaseOptions(model_asset_path=task_model_path)
                options = vision.FaceLandmarkerOptions(
                    base_options=base_options,
                    output_face_blendshapes=True,
                    num_faces=5
                )
                self.task_landmarker = vision.FaceLandmarker.create_from_options(options)
                print("  MediaPipe Tasks FaceLandmarker: loaded successfully")
            except Exception as e:
                print(f"  MediaPipe Tasks FaceLandmarker load error: {e}")
                self.task_landmarker = None

        # --- Detector Tier 2: Legacy MediaPipe Solutions FaceMesh (MediaPipe < 0.10.14) ---
        try:
            mp_solutions = mp.solutions
        except (AttributeError, Exception):
            try:
                import mediapipe.python.solutions as mp_solutions
            except Exception:
                mp_solutions = None

        if mp_solutions:
            self.mp_face_det = getattr(mp_solutions, 'face_detection', None)
            self.mp_face_mesh = getattr(mp_solutions, 'face_mesh', None)
            try:
                self.face_detector = self.mp_face_det.FaceDetection(model_selection=0, min_detection_confidence=0.5) if self.mp_face_det else None
            except Exception:
                self.face_detector = None
            try:
                self.face_mesh = self.mp_face_mesh.FaceMesh(max_num_faces=5, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5) if self.mp_face_mesh else None
            except Exception:
                self.face_mesh = None
        else:
            self.mp_face_det = None
            self.mp_face_mesh = None
            self.face_detector = None
            self.face_mesh = None

        # --- Detector Tier 3: Local OpenCV Haar Cascades (Frontal, Profile Head Yaw, Eye) ---
        self.cascade_detector = None
        self.cascade_profile = None
        self.cascade_eye = None
        try:
            local_face_xml = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")
            face_xml = local_face_xml if os.path.exists(local_face_xml) else (getattr(cv2.data, 'haarcascades', '') + 'haarcascade_frontalface_default.xml')
            if os.path.exists(face_xml):
                self.cascade_detector = cv2.CascadeClassifier(face_xml)

            local_profile_xml = os.path.join(BASE_DIR, "haarcascade_profileface.xml")
            profile_xml = local_profile_xml if os.path.exists(local_profile_xml) else (getattr(cv2.data, 'haarcascades', '') + 'haarcascade_profileface.xml')
            if os.path.exists(profile_xml):
                self.cascade_profile = cv2.CascadeClassifier(profile_xml)

            local_eye_xml = os.path.join(BASE_DIR, "haarcascade_eye.xml")
            eye_xml = local_eye_xml if os.path.exists(local_eye_xml) else (getattr(cv2.data, 'haarcascades', '') + 'haarcascade_eye.xml')
            if os.path.exists(eye_xml):
                self.cascade_eye = cv2.CascadeClassifier(eye_xml)
        except Exception as e:
            print(f"  OpenCV Haar Cascade load error: {e}")
            self.cascade_detector = None
            self.cascade_profile = None
            self.cascade_eye = None

        self.yolo_model = None
        self.prev_gray = None
        self.current_motion_score = 0.0

        # --- dlib gaze tracker (optional add-on) ---
        self.dlib_gaze = None
        try:
            from gaze_fallback import DlibGazeTracker
            self.dlib_gaze = DlibGazeTracker()
            print("  dlib gaze tracker: loaded")
        except Exception as e:
            print(f"  dlib gaze tracker: unavailable ({e})")

        self.obj_flag_text = ""
        self.obj_flag_time = 0.0
        self.last_mesh_time = 0.0
        self.mesh_interval = 0.15

        # ------------------------------------------------------------------

    # Event Engine
    # ------------------------------------------------------------------
    def get_active_alerts(self):
        now = time.time()
        alerts = []

        for event_type in ("LOOKING_AWAY", "NO_FACE", "MULTIPLE_FACES", "OBJECT"):
            state = self.active_states[event_type]
            if not state["active"]:
                continue
            duration = now - state["start_time"]
            if duration >= PERSISTENCE_THRESHOLDS.get(event_type, 1.0):
                alert = {"type": event_type, "duration": duration}
                if event_type == "OBJECT" and state.get("object_name"):
                    alert["metadata"] = f"Detected {state['object_name']}"
                alerts.append(alert)

        if self.pupil_away_start_time is not None:
            duration = now - self.pupil_away_start_time
            if duration >= PUPIL_AWAY_DURATION:
                alerts.append({
                    "type": "PUPIL_GAZE_AWAY",
                    "duration": duration,
                    "direction": self.pupil_direction
                })

        if self.eye_left_start_time is not None and now - self.eye_left_start_time >= PUPIL_PERSISTENT_DIRECTION_DURATION:
            alerts.append({
                "type": "EYE_LOOKING_LEFT",
                "duration": now - self.eye_left_start_time,
                "direction": "LEFT"
            })
        if self.eye_right_start_time is not None and now - self.eye_right_start_time >= PUPIL_PERSISTENT_DIRECTION_DURATION:
            alerts.append({
                "type": "EYE_LOOKING_RIGHT",
                "duration": now - self.eye_right_start_time,
                "direction": "RIGHT"
            })

        return alerts

    def log_event(self, message, level="info"):
        ts = datetime.now().strftime("%H:%M:%S")
        self.events.append((ts, level.upper(), message))

    def update_state(self, state_name, is_detected, confidence=0.9):
        state = self.active_states[state_name]

        # Cross-event Correlation
        if state_name == "NO_FACE" and is_detected and self.active_states["LOOKING_AWAY"]["active"]:
            self.finalize_state("LOOKING_AWAY")

        if is_detected:
            if not state["active"]:
                state["active"] = True
                state["start_time"] = time.time()
                state["max_conf"] = confidence
                state["alert_emitted"] = False
                if state_name in ["MULTIPLE_FACES", "OBJECT"] and self.current_frame is not None:
                    state["screenshot_frame"] = self.current_frame.copy()
            else:
                state["max_conf"] = max(state["max_conf"], confidence)
            duration = time.time() - state["start_time"]
            if (
                state_name in ["LOOKING_AWAY", "NO_FACE", "MULTIPLE_FACES", "OBJECT"]
                and duration >= ALERT_CONFIRMATION_SECONDS
                and not state.get("alert_emitted", False)
            ):
                metadata = (
                    f"Detected {state['object_name']}"
                    if state_name == "OBJECT" and state.get("object_name")
                    else ""
                )
                self.emit_proctor_alert(state_name, duration, state["max_conf"], metadata)
                state["alert_emitted"] = True
        else:
            if state["active"]:
                state["active"] = False
                self.finalize_state(state_name)

    def finalize_state(self, state_name):
        state = self.active_states[state_name]
        duration = time.time() - state["start_time"]
        threshold = PERSISTENCE_THRESHOLDS.get(state_name, 1.0)
        if duration >= threshold or state.get("alert_emitted", False):
            metadata = (
                f"Detected {state['object_name']}"
                if state_name == "OBJECT" and state.get("object_name")
                else ""
            )
            self.register_event(
                state_name,
                duration,
                state["max_conf"],
                metadata=metadata,
                screenshot_frame=state.get("screenshot_frame"),
                notify=not state.get("alert_emitted", False)
            )
        state["screenshot_frame"] = None

    def emit_proctor_alert(self, event_type, duration, confidence, metadata=""):
        if not server_state.server_mode:
            return
        event_obj = {
            "type": event_type,
            "duration": duration,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat(),
            "severity": "CRITICAL" if event_type in ["MULTIPLE_FACES", "OBJECT"] else "WARNING",
            "metadata": metadata
        }
        with server_state.lock:
            server_state.events_queue.append(event_obj)

    def register_event(self, event_type, duration, confidence, metadata="", screenshot_frame=None, notify=True):
        self.event_counts[event_type] += 1
        count = self.event_counts[event_type]

        dur_factor = get_duration_factor(event_type, duration)
        freq_factor = get_frequency_factor(count)
        base_weight = BASE_WEIGHTS[event_type]

        event_score = base_weight * dur_factor * confidence * freq_factor
        self.category_scores[event_type] = min(MAX_CATEGORY_SCORE[event_type],
                                               self.category_scores[event_type] + event_score)

        self.event_stats[event_type]["count"] += 1
        self.event_stats[event_type]["duration"] += duration

        if event_type == "MULTIPLE_FACES":
            self.longest_multi_face_duration = max(self.longest_multi_face_duration, duration)
            if duration > 5.0:
                self.critical_flags.append(f"Multiple faces detected for {duration:.0f} seconds")
        elif event_type == "NO_FACE" and duration > 10.0:
            self.critical_flags.append(f"Extended candidate absence ({duration:.0f}s)")
        elif event_type == "OBJECT":
            self.critical_flags.append(f"Prohibited object detected")

        self.event_timeline.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "type": event_type.replace("_", " ").title(),
            "duration": duration
        })

        msg = f"EVENT: {event_type} | Dur: {duration:.1f}s | Conf: {confidence * 100:.0f}% | +{event_score:.1f} pts"
        if metadata:
            msg += f" | {metadata}"
        self.log_event(msg, "bad")

        if notify:
            self.emit_proctor_alert(event_type, duration, confidence, metadata)

        frame_to_save = screenshot_frame if screenshot_frame is not None else self.current_frame
        if frame_to_save is not None and event_type in ["MULTIPLE_FACES", "OBJECT"]:
            folder = DIR_PERSON_SS if event_type == "MULTIPLE_FACES" else DIR_OBJ_SS
            os.makedirs(folder, exist_ok=True)
            ts_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            screenshot_path = os.path.join(folder, f"{event_type}_{ts_str}.jpg")
            if not cv2.imwrite(screenshot_path, frame_to_save):
                self.log_event(f"Failed to save screenshot: {screenshot_path}", "error")
            if event_type == "OBJECT":
                self.obj_flag_text = f"FLAG: OBJECT DETECTED ({confidence * 100:.0f}%)"
                self.obj_flag_time = time.time()

    def register_instant_event(self, event_type, confidence=1.0, metadata=""):
        self.event_counts[event_type] += 1
        count = self.event_counts[event_type]
        event_score = BASE_WEIGHTS[event_type] * get_frequency_factor(count)
        self.category_scores[event_type] = min(MAX_CATEGORY_SCORE[event_type],
                                               self.category_scores[event_type] + event_score)

        self.event_stats[event_type]["count"] += 1
        self.event_timeline.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "type": event_type.replace("_", " ").title(),
            "duration": 0
        })
        self.log_event(f"EVENT: {event_type} | {metadata} | +{event_score:.1f} pts", "bad")

        if server_state.server_mode:
            event_obj = {
                "type": event_type,
                "duration": 0.0,
                "confidence": confidence,
                "timestamp": datetime.now().isoformat(),
                "severity": "WARNING" if event_type == "TAB_SWITCH" else "INFO",
                "metadata": metadata
            }
            with server_state.lock:
                server_state.events_queue.append(event_obj)

    def update_pupil_gaze_state(self, gaze_direction, now, metrics=None):
        self.pupil_direction = gaze_direction
        self.eye_state = gaze_direction
        if metrics:
            self.pupil_movement_metrics = metrics

        if gaze_direction != "UNKNOWN":
            self.pupil_unknown_start_time = None

        # --- 1. General Pupil Gaze Away Alert (cooldown/warning) ---
        if gaze_direction in ["LEFT", "RIGHT", "UP"]:
            if self.pupil_away_start_time is None:
                self.pupil_away_start_time = now

            away_duration = now - self.pupil_away_start_time
            cooldown_elapsed = now - self.last_pupil_alert_time >= PUPIL_ALERT_COOLDOWN
            if away_duration >= PUPIL_AWAY_DURATION and not self.pupil_alert_triggered and cooldown_elapsed:
                self.pupil_alert_triggered = True
                self.last_pupil_alert_time = now
                self.pupil_alert_visible_until = now + PUPIL_ALERT_COOLDOWN
                self.pupil_alert_text = f"WARNING: Pupil looking {gaze_direction}! Keep eyes on screen"
                self.register_event(
                    "PUPIL_GAZE_AWAY",
                    away_duration,
                    0.90,
                    metadata=f"Pupil looking {gaze_direction} (off-screen eye movement)"
                )
        elif gaze_direction == "CENTER":
            self.pupil_away_start_time = None
            self.pupil_alert_triggered = False

        # --- 2. Specific Eye Movement: Looking LEFT / RIGHT for > 10 Seconds ---
        if gaze_direction == "LEFT":
            if self.eye_left_start_time is None:
                self.eye_left_start_time = now
            # Reset right tracking
            self.eye_right_start_time = None
            self.eye_right_alert_triggered = False
            self.current_eye_right_duration = 0.0

            left_dur = now - self.eye_left_start_time
            self.current_eye_left_duration = left_dur
            self.longest_eye_left_duration = max(self.longest_eye_left_duration, left_dur)

            if left_dur >= ALERT_CONFIRMATION_SECONDS and not self.eye_left_alert_triggered:
                self.eye_left_alert_triggered = True
                self.eye_alert_visible_until = now + 4.0
                self.eye_alert_text = f"ALERT: Pupil looking LEFT ({left_dur:.1f}s)"
                self.emit_proctor_alert(
                    "EYE_LOOKING_LEFT",
                    left_dur,
                    0.95,
                    metadata=f"Candidate pupil positioned LEFT for {left_dur:.1f}s"
                )
            if left_dur >= PUPIL_PERSISTENT_DIRECTION_DURATION and not self.eye_left_critical_flagged:
                self.eye_left_critical_flagged = True
                self.critical_flags.append(f"Pupil positioned LEFT for prolonged period ({left_dur:.1f}s)")

        elif gaze_direction == "RIGHT":
            if self.eye_right_start_time is None:
                self.eye_right_start_time = now
            # Reset left tracking
            self.eye_left_start_time = None
            self.eye_left_alert_triggered = False
            self.current_eye_left_duration = 0.0

            right_dur = now - self.eye_right_start_time
            self.current_eye_right_duration = right_dur
            self.longest_eye_right_duration = max(self.longest_eye_right_duration, right_dur)

            if right_dur >= ALERT_CONFIRMATION_SECONDS and not self.eye_right_alert_triggered:
                self.eye_right_alert_triggered = True
                self.eye_alert_visible_until = now + 4.0
                self.eye_alert_text = f"ALERT: Pupil looking RIGHT ({right_dur:.1f}s)"
                self.emit_proctor_alert(
                    "EYE_LOOKING_RIGHT",
                    right_dur,
                    0.95,
                    metadata=f"Candidate pupil positioned RIGHT for {right_dur:.1f}s"
                )
            if right_dur >= PUPIL_PERSISTENT_DIRECTION_DURATION and not self.eye_right_critical_flagged:
                self.eye_right_critical_flagged = True
                self.critical_flags.append(f"Pupil positioned RIGHT for prolonged period ({right_dur:.1f}s)")

        elif gaze_direction == "CENTER":
            # Accumulate totals when leaving LEFT / RIGHT states
            if self.eye_left_start_time is not None:
                left_duration = now - self.eye_left_start_time
                self.total_eye_left_duration += left_duration
                if self.eye_left_alert_triggered:
                    self.register_event(
                        "EYE_LOOKING_LEFT",
                        left_duration,
                        0.95,
                        metadata=f"Candidate pupil positioned LEFT for {left_duration:.1f}s",
                        notify=False
                    )
                self.eye_left_start_time = None
                self.eye_left_alert_triggered = False
                self.eye_left_critical_flagged = False
                self.current_eye_left_duration = 0.0

            if self.eye_right_start_time is not None:
                right_duration = now - self.eye_right_start_time
                self.total_eye_right_duration += right_duration
                if self.eye_right_alert_triggered:
                    self.register_event(
                        "EYE_LOOKING_RIGHT",
                        right_duration,
                        0.95,
                        metadata=f"Candidate pupil positioned RIGHT for {right_duration:.1f}s",
                        notify=False
                    )
                self.eye_right_start_time = None
                self.eye_right_alert_triggered = False
                self.eye_right_critical_flagged = False
                self.current_eye_right_duration = 0.0
        else:
            # UNKNOWN - allow small flicker tolerance
            if self.pupil_unknown_start_time is None:
                self.pupil_unknown_start_time = now
            elif now - self.pupil_unknown_start_time > 0.8:
                self.pupil_away_start_time = None
                self.pupil_alert_triggered = False
                if self.eye_left_start_time is not None:
                    left_duration = now - self.eye_left_start_time
                    self.total_eye_left_duration += left_duration
                    if self.eye_left_alert_triggered:
                        self.register_event(
                            "EYE_LOOKING_LEFT",
                            left_duration,
                            0.95,
                            metadata=f"Candidate pupil positioned LEFT for {left_duration:.1f}s",
                            notify=False
                        )
                    self.eye_left_start_time = None
                    self.eye_left_alert_triggered = False
                    self.eye_left_critical_flagged = False
                    self.current_eye_left_duration = 0.0
                if self.eye_right_start_time is not None:
                    right_duration = now - self.eye_right_start_time
                    self.total_eye_right_duration += right_duration
                    if self.eye_right_alert_triggered:
                        self.register_event(
                            "EYE_LOOKING_RIGHT",
                            right_duration,
                            0.95,
                            metadata=f"Candidate pupil positioned RIGHT for {right_duration:.1f}s",
                            notify=False
                        )
                    self.eye_right_start_time = None
                    self.eye_right_alert_triggered = False
                    self.eye_right_critical_flagged = False
                    self.current_eye_right_duration = 0.0

    # ------------------------------------------------------------------
    # Threads & Drawing
    # ------------------------------------------------------------------
    def track_active_window(self):
        while self.running:
            if WINDOW_TRACKING:
                try:
                    win = gw.getActiveWindow()
                    title = win.title if win else None
                    if title and self.last_window_title and title != self.last_window_title:
                        self.register_instant_event("TAB_SWITCH", metadata=f"Switched to: {title}")
                    if title: self.last_window_title = title
                except Exception:
                    pass
            time.sleep(0.5)

    def audio_worker(self):
        if not self.audio_active: return
        try:
            model = WhisperModel("tiny", device="cpu", compute_type="int8")
        except Exception:
            return

        phrase_queue = queue.Queue()
        state = {'speaking': False, 'silence': 0.0, 'buffer': []}

        def audio_callback(indata, frames, time_info, status):
            if self.muted or not self.running: return
            audio_data = indata[:, 0].astype(np.float32) / 32768.0
            volume = np.sqrt(np.mean(audio_data ** 2))
            if volume > 0.015:
                state['speaking'] = True
                state['silence'] = 0.0
                state['buffer'].extend(audio_data.tolist())
            elif state['speaking']:
                state['buffer'].extend(audio_data.tolist())
                state['silence'] += frames / 16000
                if state['silence'] > 0.6:
                    if len(state['buffer']) / 16000 > 0.5:
                        phrase_queue.put(list(state['buffer']))
                    state['buffer'].clear()
                    state['speaking'] = False
                    state['silence'] = 0.0

        try:
            with sd.InputStream(samplerate=16000, blocksize=800, dtype='int16', channels=1, callback=audio_callback):
                while self.running:
                    try:
                        phrase = phrase_queue.get(timeout=1)
                    except queue.Empty:
                        continue
                    audio_np = np.array(phrase, dtype=np.float32)
                    try:
                        segments, _ = model.transcribe(audio_np, beam_size=1, language="en")
                        text = " ".join([seg.text.strip() for seg in segments]).strip()
                        if text: self.log_event(f"CAPTION: {text}", "info")
                    except Exception:
                        pass
        except Exception:
            pass

    def draw_ui(self, frame, w):
        now = time.time()
        banner_offset = 0

        # 1. Looking Away warning banner
        looking_away_state = self.active_states.get("LOOKING_AWAY", {})
        show_look_away_banner = False
        if looking_away_state.get("active", False):
            look_away_dur = now - looking_away_state.get("start_time", 0)
            if look_away_dur >= PERSISTENCE_THRESHOLDS.get("LOOKING_AWAY", 2.0):
                show_look_away_banner = True

        if show_look_away_banner:
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, 55), (0, 0, 220), -1)
            # Flashing effect
            alpha = 0.85 if int(now * 2.0) % 2 == 0 else 0.60
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
            cv2.putText(frame, "WARNING: PLEASE LOOK AT THE SCREEN!", (20, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.85,
                        (255, 255, 255), 2, cv2.LINE_AA)
            banner_offset = 55

        # 2. Eye Movement / Pupil Position Warning Banner (> 10s persistent alert)
        show_eye_10s_alert = now < self.eye_alert_visible_until
        if show_eye_10s_alert:
            overlay = frame.copy()
            y_start = banner_offset
            y_end = banner_offset + 55
            # Urgent red banner with pulsing effect
            cv2.rectangle(overlay, (0, y_start), (w, y_end), (0, 0, 255), -1)
            alpha = 0.90 if int(now * 3.0) % 2 == 0 else 0.65
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
            cv2.putText(frame, self.eye_alert_text, (20, y_start + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.78, (255, 255, 255),
                        2, cv2.LINE_AA)
            banner_offset += 55

        # 3. Off-Screen Pupil Movement Banner
        show_pupil_banner = (
                                    self.pupil_away_start_time is not None
                                    and now - self.pupil_away_start_time >= PUPIL_AWAY_DURATION
                            ) or now < self.pupil_alert_visible_until
        if show_pupil_banner and not show_eye_10s_alert:
            overlay = frame.copy()
            y_start = banner_offset
            y_end = banner_offset + 55
            cv2.rectangle(overlay, (0, y_start), (w, y_end), (0, 0, 220), -1)
            alpha = 0.85 if int(now * 2.0) % 2 == 0 else 0.60
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
            cv2.putText(frame, self.pupil_alert_text, (20, y_start + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.78,
                        (255, 255, 255), 2, cv2.LINE_AA)
            banner_offset += 55

        # 4. Multiple people warning banner
        multiple_faces_state = self.active_states.get("MULTIPLE_FACES", {})
        if (
            multiple_faces_state.get("active", False)
            and now - multiple_faces_state.get("start_time", 0)
            >= PERSISTENCE_THRESHOLDS.get("MULTIPLE_FACES", 1.0)
        ):
            overlay = frame.copy()
            y_start = banner_offset
            y_end = banner_offset + 55
            cv2.rectangle(overlay, (0, y_start), (w, y_end), (0, 0, 255), -1)
            alpha = 0.90 if int(now * 2.0) % 2 == 0 else 0.65
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
            cv2.putText(
                frame,
                "ALERT: MULTIPLE PEOPLE DETECTED!",
                (20, y_start + 38),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.85,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )
            banner_offset += 55

        # Eye Movement HUD & Pupil Tracking display in place of generic gaze
        if SHOW_GAZE_DEBUG:
            # Color code pupil classification: Green if CENTER, Yellow/Red if LEFT/RIGHT
            eye_col = (0, 255, 100) if self.pupil_direction == "CENTER" else (0, 165, 255) if self.pupil_direction in [
                "LEFT", "RIGHT"] else (200, 200, 200)

            # Display real-time measured eye movement & pupil position
            curr_dur_text = ""
            if self.pupil_direction == "LEFT" and self.eye_left_start_time:
                curr_dur_text = f" ({now - self.eye_left_start_time:.1f}s)"
            elif self.pupil_direction == "RIGHT" and self.eye_right_start_time:
                curr_dur_text = f" ({now - self.eye_right_start_time:.1f}s)"

            cv2.putText(frame, f"Eye Movement: {self.pupil_direction}{curr_dur_text}", (20, frame.shape[0] - 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, eye_col, 2, cv2.LINE_AA)

            # Draw pupil centers with crosshair
            for point in self.last_pupil_points:
                px, py = point
                cv2.circle(frame, (px, py), 4, (0, 255, 255), -1, cv2.LINE_AA)
                cv2.circle(frame, (px, py), 8, (0, 200, 255), 1, cv2.LINE_AA)

        # 5. Object detection warning banner
        if now - self.obj_flag_time < 4.0:
            alpha = max(0.0, 1.0 - (now - self.obj_flag_time) / 4.0)
            overlay = frame.copy()
            y_start = banner_offset
            y_end = banner_offset + 55
            cv2.rectangle(overlay, (0, y_start), (w, y_end), (0, 0, 220), -1)
            cv2.addWeighted(overlay, alpha * 0.85, frame, 1 - (alpha * 0.85), 0, frame)
            cv2.putText(frame, self.obj_flag_text, (20, y_start + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255),
                        2, cv2.LINE_AA)

        cx, cy = w - 40, 40
        color = (0, 200, 80) if not self.muted else (0, 0, 220)
        cv2.circle(frame, (cx, cy - 4), 10, color, 2, cv2.LINE_AA)
        cv2.ellipse(frame, (cx, cy + 2), (6, 10), 0, 180, 0, color, 2, cv2.LINE_AA)
        cv2.line(frame, (cx, cy + 12), (cx, cy + 20), color, 2, cv2.LINE_AA)
        if self.muted:
            cv2.line(frame, (cx - 14, cy - 14), (cx + 14, cy + 14), (0, 0, 255), 3, cv2.LINE_AA)
            cv2.line(frame, (cx + 14, cy - 14), (cx - 14, cy + 14), (0, 0, 255), 3, cv2.LINE_AA)
        cv2.putText(frame, "MUTED" if self.muted else "MIC ON", (cx - 26, cy + 36), cv2.FONT_HERSHEY_SIMPLEX, 0.4,
                    color, 1, cv2.LINE_AA)

    def _open_camera(self):
        # On Windows, try CAP_DSHOW first, then CAP_MSMF / default
        backends = []
        if sys.platform.startswith("win"):
            backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]
        else:
            backends = [cv2.CAP_ANY]

        indices = [self.camera_index] + [i for i in [0, 1, 2] if i != self.camera_index]
        for attempt in range(3):
            for idx in indices:
                for b in backends:
                    try:
                        c = cv2.VideoCapture(idx, b)
                        if c.isOpened():
                            ok, test_frame = c.read()
                            if ok and test_frame is not None and test_frame.size > 0:
                                print(f"  Successfully opened camera index {idx} with backend {b} (attempt {attempt + 1})")
                                self.camera_index = idx
                                return c
                        c.release()
                    except Exception:
                        pass
            time.sleep(0.35)
        return None

    # ------------------------------------------------------------------
    # Main Loop (Headless - Streams directly to website)
    # ------------------------------------------------------------------
    def run(self):
        cap = self._open_camera()
        if cap is None:
            print("Cannot access camera.")
            self.total_camera_unavailable_time += 1.0
            self.camera_disconnects += 1
            self.print_summary()
            return

        self.yolo_model = init_yolo_detector()
        os.makedirs(DIR_PERSON_SS, exist_ok=True)
        os.makedirs(DIR_OBJ_SS, exist_ok=True)

        self.running = True
        self.start_time = time.time()
        self.log_event("Interview session started", "info")

        if WINDOW_TRACKING: threading.Thread(target=self.track_active_window, daemon=True).start()
        if self.audio_active: threading.Thread(target=self.audio_worker, daemon=True).start()

        prev_time = time.time()
        obj_frame_count = 0

        try:
            while self.running:
                if server_state.server_mode:
                    with server_state.lock:
                        if server_state.stop_requested:
                            break
                ok, frame = cap.read()
                now = time.time()
                dt = now - prev_time
                prev_time = now

                # Camera Failure Detection
                if not ok:
                    self.frames_failed += 1
                    self.total_camera_unavailable_time += dt
                    if not self.camera_was_disconnected:
                        self.camera_disconnects += 1
                        self.camera_was_disconnected = True
                        self.log_event("Camera disconnected", "warn")
                        if server_state.server_mode:
                            event_obj = {
                                "type": "CAMERA_DISCONNECTED",
                                "duration": 0.0,
                                "confidence": 1.0,
                                "timestamp": datetime.now().isoformat(),
                                "severity": "CRITICAL",
                                "metadata": "Webcam disconnected"
                            }
                            with server_state.lock:
                                server_state.events_queue.append(event_obj)
                    continue

                if self.camera_was_disconnected:
                    self.camera_was_disconnected = False
                    self.log_event("Camera reconnected", "info")
                    if server_state.server_mode:
                        event_obj = {
                            "type": "CAMERA_RECONNECTED",
                            "duration": 0.0,
                            "confidence": 1.0,
                            "timestamp": datetime.now().isoformat(),
                            "severity": "INFO",
                            "metadata": "Webcam reconnected"
                        }
                        with server_state.lock:
                            server_state.events_queue.append(event_obj)

                self.frames_received += 1
                self.current_frame = cv2.flip(frame, 1)
                h, w = self.current_frame.shape[:2]
                rgb = cv2.cvtColor(self.current_frame, cv2.COLOR_BGR2RGB)
                gray = cv2.cvtColor(self.current_frame, cv2.COLOR_BGR2GRAY)

                # Physical Motion Tracking (Frame Differencing)
                if self.prev_gray is not None and self.prev_gray.shape == gray.shape:
                    diff = cv2.absdiff(self.prev_gray, gray)
                    _, m_thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
                    motion_score = np.sum(m_thresh > 0) / float(w * h)
                    self.current_motion_score = float(motion_score)
                self.prev_gray = gray.copy()

                # 1. Face Detection (Tier 1: MediaPipe Tasks FaceLandmarker, Tier 2: Solutions, Tier 3: Local Haar Cascades)
                face_count = 0
                high_conf_faces = []
                detected_boxes = []
                primary_landmarks = None

                # Tier 1: Modern MediaPipe Tasks FaceLandmarker (MediaPipe 0.10.x+)
                if self.task_landmarker is not None:
                    try:
                        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                        res = self.task_landmarker.detect(mp_img)
                        if res and res.face_landmarks:
                            face_count = len(res.face_landmarks)
                            primary_landmarks = res.face_landmarks[0]
                            for face_lms in res.face_landmarks:
                                xs = [int(p.x * w) for p in face_lms]
                                ys = [int(p.y * h) for p in face_lms]
                                bx, by = max(0, min(xs)), max(0, min(ys))
                                bw = min(w - bx, max(xs) - min(xs))
                                bh = min(h - by, max(ys) - min(ys))
                                detected_boxes.append((bx, by, bw, bh))
                    except Exception:
                        face_count = 0

                # Tier 2: Legacy MediaPipe Face Detection
                if face_count == 0 and self.face_detector is not None:
                    try:
                        det_result = self.face_detector.process(rgb)
                        faces = det_result.detections or []
                        high_conf_faces = [d for d in faces if d.score and d.score[0] > 0.50]
                        face_count = len(high_conf_faces)
                        for d in high_conf_faces:
                            bb = d.location_data.relative_bounding_box
                            bx = max(0, int(bb.xmin * w))
                            by = max(0, int(bb.ymin * h))
                            bw = int(bb.width * w)
                            bh = int(bb.height * h)
                            detected_boxes.append((bx, by, bw, bh))
                    except Exception:
                        face_count = 0

                # Tier 3: Local OpenCV Haar Cascade Fallback (Frontal + Profile Head Yaw)
                profile_detected = False
                if face_count == 0:
                    if self.cascade_detector is not None and not self.cascade_detector.empty():
                        try:
                            faces_rect = self.cascade_detector.detectMultiScale(
                                gray, scaleFactor=1.2, minNeighbors=4, minSize=(60, 60)
                            )
                            if len(faces_rect) > 0:
                                face_count = len(faces_rect)
                                detected_boxes = [tuple(r) for r in faces_rect]
                        except Exception:
                            pass

                    # Profile face cascade (detects head turned sideways)
                    if face_count == 0 and self.cascade_profile is not None and not self.cascade_profile.empty():
                        try:
                            profiles = self.cascade_profile.detectMultiScale(
                                gray, scaleFactor=1.2, minNeighbors=4, minSize=(60, 60)
                            )
                            if len(profiles) == 0:
                                gray_flip = cv2.flip(gray, 1)
                                profiles_flip = self.cascade_profile.detectMultiScale(
                                    gray_flip, scaleFactor=1.2, minNeighbors=4, minSize=(60, 60)
                                )
                                if len(profiles_flip) > 0:
                                    profiles = [(w - x - bw, y, bw, bh) for (x, y, bw, bh) in profiles_flip]
                            if len(profiles) > 0:
                                face_count = len(profiles)
                                detected_boxes = [tuple(r) for r in profiles]
                                profile_detected = True
                        except Exception:
                            pass

                if face_count > 0:
                    score = high_conf_faces[0].score[0] if high_conf_faces else 0.95
                    self.total_face_confidence += score
                    self.confidence_checks += 1

                self.update_state("NO_FACE", face_count == 0, 0.95)
                multi_score = high_conf_faces[1].score[0] if (high_conf_faces and face_count > 1) else 0.90
                self.update_state("MULTIPLE_FACES", face_count > 1, multi_score)

                # Draw bounding boxes on detected face(s)
                for (bx, by, bw, bh) in detected_boxes:
                    box_color = (0, 200, 100) if face_count == 1 else (0, 0, 255)
                    cv2.rectangle(self.current_frame, (bx, by), (bx + bw, by + bh), box_color, 2)

                # 2. Face Mesh, Head Yaw, Pitch & Independent Pupil Gaze
                if face_count == 1 and (now - self.last_mesh_time) >= self.mesh_interval:
                    self.last_mesh_time = now
                    if primary_landmarks is not None:
                        try:
                            lm = primary_landmarks
                            nose_x = lm[1].x * w
                            mid_x = (lm[33].x + lm[263].x) / 2 * w
                            span = abs(lm[263].x - lm[33].x) * w
                            yaw = (nose_x - mid_x) / span if span > 1 else 0.0

                            # Pitch calculation (looking down at notes or phone)
                            nose_y = lm[1].y * h
                            eye_mid_y = (lm[33].y + lm[263].y) / 2 * h
                            chin_y = lm[152].y * h if len(lm) > 152 else eye_mid_y + 50
                            pitch = (nose_y - eye_mid_y) / max(1.0, abs(chin_y - eye_mid_y))

                            head_away = abs(yaw) > HEAD_YAW_THRESHOLD or pitch > 0.68
                            self.update_state("LOOKING_AWAY", head_away, 0.85)

                            if abs(yaw) <= PUPIL_HEAD_CENTER_THRESHOLD and not head_away:
                                gaze_res = detect_pupil_gaze(gray, lm, w, h)
                                if len(gaze_res) == 3:
                                    gaze_direction, pupil_data, metrics = gaze_res
                                else:
                                    gaze_direction, pupil_data = gaze_res
                                    metrics = {}
                                self.last_pupil_points = [item["center"] for item in pupil_data if isinstance(item, dict) and item.get("center")]
                                self.update_pupil_gaze_state(gaze_direction, now, metrics)
                            else:
                                self.last_pupil_points = []
                                self.update_pupil_gaze_state("UNKNOWN", now)
                        except Exception:
                            self.update_state("LOOKING_AWAY", False)
                            self.last_pupil_points = []
                            self.update_pupil_gaze_state("UNKNOWN", now)
                    elif self.face_mesh is not None:
                        try:
                            mesh_result = self.face_mesh.process(rgb)
                            if mesh_result.multi_face_landmarks:
                                lm = mesh_result.multi_face_landmarks[0].landmark
                                nose_x = lm[1].x * w
                                mid_x = (lm[33].x + lm[263].x) / 2 * w
                                span = abs(lm[263].x - lm[33].x) * w
                                yaw = (nose_x - mid_x) / span if span > 1 else 0.0
                                head_away = abs(yaw) > HEAD_YAW_THRESHOLD
                                self.update_state("LOOKING_AWAY", head_away, 0.85)

                                if abs(yaw) <= PUPIL_HEAD_CENTER_THRESHOLD:
                                    gaze_res = detect_pupil_gaze(gray, lm, w, h)
                                    if len(gaze_res) == 3:
                                        gaze_direction, pupil_data, metrics = gaze_res
                                    else:
                                        gaze_direction, pupil_data = gaze_res
                                        metrics = {}
                                    self.last_pupil_points = [item["center"] for item in pupil_data if isinstance(item, dict) and item.get("center")]
                                    self.update_pupil_gaze_state(gaze_direction, now, metrics)
                                else:
                                    self.last_pupil_points = []
                                    self.update_pupil_gaze_state("UNKNOWN", now)
                            else:
                                self.update_state("LOOKING_AWAY", False)
                                self.last_pupil_points = []
                                self.update_pupil_gaze_state("UNKNOWN", now)
                        except Exception:
                            self.update_state("LOOKING_AWAY", False)
                            self.last_pupil_points = []
                            self.update_pupil_gaze_state("UNKNOWN", now)
                    else:
                        # Fallback yaw / look-away detection using profile cascade or face box center
                        if profile_detected:
                            self.update_state("LOOKING_AWAY", True, 0.85)
                        elif detected_boxes:
                            bx, by, bw, bh = detected_boxes[0]
                            face_center_x = bx + bw / 2.0
                            offset = (face_center_x - (w / 2.0)) / (w / 2.0)
                            head_away = abs(offset) > 0.45
                            self.update_state("LOOKING_AWAY", head_away, 0.80)
                        else:
                            self.update_state("LOOKING_AWAY", False)
                        self.last_pupil_points = []
                        self.update_pupil_gaze_state("UNKNOWN", now)
                elif face_count != 1:
                    self.update_state("LOOKING_AWAY", False)
                    self.last_pupil_points = []
                    self.update_pupil_gaze_state("UNKNOWN", now)

                # 3. Time Stats (Strict separation of Camera vs No Face)
                if face_count == 0:
                    self.total_off_screen_time += dt
                    self.current_absence_duration += dt
                    self.longest_absence = max(self.longest_absence, self.current_absence_duration)
                    self.current_look_away_duration = 0.0
                else:
                    if self.current_absence_duration > 0:
                        self.current_absence_duration = 0.0
                    self.total_on_screen_time += dt
                    if self.active_states["LOOKING_AWAY"]["active"]:
                        self.current_look_away_duration += dt
                        self.total_looking_away += dt
                        self.longest_look_away = max(self.longest_look_away, self.current_look_away_duration)
                    else:
                        self.total_looking_at_screen += dt
                        self.current_look_away_duration = 0.0

                # 4. YOLOv8 Object Detection
                if self.yolo_model:
                    obj_frame_count += 1
                    if obj_frame_count % 10 == 0:
                        try:
                            results = self.yolo_model(self.current_frame, verbose=False)
                            found_obj = False
                            found_obj_name = None
                            conf = 0.0
                            for r in results:
                                for box in r.boxes:
                                    conf = float(box.conf[0])
                                    name = self.yolo_model.names[int(box.cls[0])]
                                    if name in TARGET_OBJECTS and conf > 0.40:
                                        found_obj = True
                                        found_obj_name = name
                                        break
                                if found_obj: break
                            if found_obj:
                                self.active_states["OBJECT"]["object_name"] = found_obj_name
                            self.update_state("OBJECT", found_obj, conf if found_obj else 0.0)
                        except Exception:
                            pass

                # 5. Draw UI & Stream Annotated Preview to Web Client (No External Window)
                if now - getattr(self, "last_preview_time", 0) >= 0.15:
                    preview_copy = self.current_frame.copy()
                    self.draw_ui(preview_copy, w)
                    encoded, image = cv2.imencode(".jpg", preview_copy)
                    if encoded:
                        with server_state.lock:
                            server_state.preview_frame = image.tobytes()
                    self.last_preview_time = now

        finally:
            self.running = False
            for state in self.active_states:
                if self.active_states[state]["active"]:
                    self.finalize_state(state)

            ended_at = time.time()
            for direction, start_time, alert_triggered in (
                ("LEFT", self.eye_left_start_time, self.eye_left_alert_triggered),
                ("RIGHT", self.eye_right_start_time, self.eye_right_alert_triggered)
            ):
                if start_time is not None and alert_triggered:
                    duration = ended_at - start_time
                    self.register_event(
                        f"EYE_LOOKING_{direction}",
                        duration,
                        0.95,
                        metadata=f"Candidate pupil positioned {direction} for {duration:.1f}s",
                        notify=False
                    )

            cap.release()
            if not server_state.server_mode:
                cv2.destroyAllWindows()
            self.log_event("Interview session stopped", "info")
            self.save_log()
            self.print_summary()
            if server_state.server_mode:
                with server_state.lock:
                    server_state.preview_frame = None

    def save_log(self):
        try:
            with open(self.log_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["time", "level", "message"])
                writer.writerows(self.events)
        except IOError:
            pass

    # ------------------------------------------------------------------
    # Professional Reporting (5 Sections)
    # ------------------------------------------------------------------
    def print_summary(self):
        elapsed = time.time() - self.start_time
        raw_score = int(min(100, sum(self.category_scores.values())))

        if raw_score <= 19:
            risk_level = "LOW"
        elif raw_score <= 39:
            risk_level = "MEDIUM"
        elif raw_score <= 69:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        presence_pct = (self.total_on_screen_time / elapsed * 100) if elapsed > 0 else 0
        looking_pct = (
                    self.total_looking_at_screen / self.total_on_screen_time * 100) if self.total_on_screen_time > 0 else 0
        away_pct = 100 - looking_pct

        # Calculate Monitoring Quality
        avg_conf = (self.total_face_confidence / self.confidence_checks) if self.confidence_checks > 0 else 0
        if self.camera_disconnects > 0 or self.frames_failed > 10 or avg_conf < 0.60:
            mon_quality = "DEGRADED"
            mon_color = "\033[93m"  # Yellow
        else:
            mon_quality = "GOOD"
            mon_color = "\033[92m"  # Green

        print("\n" + "=" * 60)
        print("              INTERVIEW MONITORING REPORT")
        print("=" * 60)

        # Section 1: Session Overview
        print(f"  Session ID:            {self.session_id}")
        print(f"  Start Time:            {datetime.fromtimestamp(self.start_time).strftime('%H:%M:%S')}")
        print(f"  End Time:              {datetime.now().strftime('%H:%M:%S')}")
        print(f"  Duration:              {format_time(elapsed)}")
        print(f"  Monitoring Status:     COMPLETED")
        print(f"  Monitoring Quality:    {mon_color}{mon_quality}\033[0m")
        print(f"  Frames Analyzed:       {self.frames_received:,}")
        if self.camera_disconnects > 0:
            print(f"  Camera Disconnects:    {self.camera_disconnects}")
        print("=" * 60)

        # Section 2: Presence & Attention
        print("  PRESENCE & ATTENTION")
        print("-" * 60)
        print(f"  Candidate Presence       {presence_pct:.1f}%")
        print(f"  Candidate Absent         {format_time(self.total_off_screen_time)}")
        if self.total_camera_unavailable_time > 0:
            print(f"  Camera Unavailable       {format_time(self.total_camera_unavailable_time)}")
        print()
        print(f"  Looking at Screen        {looking_pct:.1f}%")
        print(f"  Looking Away             {away_pct:.1f}%")
        print()
        print(f"  Longest Absence          {format_time(self.longest_absence)}")
        print(f"  Longest Look-Away        {format_time(self.longest_look_away)}")
        print(f"  Multiple Face Events     {self.event_counts['MULTIPLE_FACES']}")
        if self.longest_multi_face_duration > 0:
            print(f"  Longest Multi-Face Dur:  {format_time(self.longest_multi_face_duration)}")
        print("=" * 60)

        # Section 3: Suspicious Events
        print("  SUSPICIOUS ACTIVITY")
        print("-" * 60)
        print(f"  {'Event':<20} {'Count':<10} {'Duration'}")
        print("  " + "-" * 45)

        event_name_map = {
            "TAB_SWITCH": "Tab Switch",
            "LOOKING_AWAY": "Looking Away",
            "PUPIL_GAZE_AWAY": "Pupil Gaze Away",
            "NO_FACE": "Candidate Absent",
            "MULTIPLE_FACES": "Multiple Faces",
            "OBJECT": "Objects Detected"
        }

        for e_type, stats in self.event_stats.items():
            name = event_name_map.get(e_type, e_type)
            dur = format_time(stats["duration"]) if stats["duration"] > 0 else "-"
            print(f"  {name:<20} {stats['count']:<10} {dur}")
        print("=" * 60)

        # Section 4: Risk Breakdown
        print("  INTEGRITY RISK")
        print("-" * 60)
        print(f"  {'Category':<25} {'Contribution'}")
        print("  " + "-" * 45)

        cat_name_map = {
            "TAB_SWITCH": "Browser Activity",
            "LOOKING_AWAY": "Head Movement",
            "PUPIL_GAZE_AWAY": "Pupil Gaze",
            "NO_FACE": "Candidate Presence",
            "MULTIPLE_FACES": "Multiple Faces",
            "OBJECT": "Object Detection"
        }

        for cat, score in self.category_scores.items():
            name = cat_name_map.get(cat, cat)
            print(f"  {name:<25} +{int(score)}")

        print("  " + "-" * 45)
        score_color = "\033[92m" if raw_score <= 19 else "\033[93m" if raw_score <= 39 else "\033[91m"
        print(f"  INTEGRITY RISK SCORE     {score_color}{raw_score} / 100\033[0m")
        print(f"  RISK LEVEL               {score_color}{risk_level}\033[0m")
        print("=" * 60)

        # Section 5: Critical Events / Timeline
        print("  IMPORTANT EVENTS TIMELINE")
        print("-" * 60)
        for evt in self.event_timeline:
            dur_str = f"{evt['duration']:.1f}s" if evt['duration'] > 0 else "-"
            print(f"  {evt['time']}   {evt['type']:<20} {dur_str}")

        if self.critical_flags:
            print("-" * 60)
            print("  REVIEW RECOMMENDED:")
            for flag in self.critical_flags:
                print(f"  \033[91m• {flag}\033[0m")
        print("=" * 60 + "\n")

        # Save summary data for HTTP API responses
        summary = {
            "elapsed": elapsed,
            "riskScore": raw_score,
            "riskLevel": risk_level,
            "presencePct": presence_pct,
            "lookingPct": looking_pct,
            "awayPct": away_pct,
            "monitoringQuality": mon_quality,
            "framesAnalyzed": self.frames_received,
            "cameraDisconnects": self.camera_disconnects,
            "timeline": self.event_timeline,
            "criticalFlags": self.critical_flags
        }
        with server_state.lock:
            server_state.summary_data = summary


# ======================================================================
if __name__ == "__main__":
    server_state.server_mode = True
    server = HTTPServer(("localhost", 8765), ProctoringHTTPHandler)
    print("=" * 60)
    print("  HIRESENSE AI PROCTORING ENGINE (HEADLESS WEB COMPANION)")
    print("  Listening on: http://localhost:8765")
    print("  Mode: Web Integrated (No external window - streams to website)")
    print("=" * 60)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    try:
        while True:
            start = False
            with server_state.lock:
                if server_state.start_requested:
                    start = True
                    server_state.start_requested = False
                    server_state.is_monitoring = True

            if start:
                print(
                    f"\n[PROCTOR ACTIVE] Attempt: {server_state.attempt_id}, Stage: {server_state.stage}")
                monitor = SessionMonitorPro(camera_index=0)
                with server_state.lock:
                    server_state.monitor = monitor
                try:
                    monitor.run()
                except Exception as ex:
                    print(f"Error in proctoring monitor loop: {ex}")
                finally:
                    with server_state.lock:
                        server_state.is_monitoring = False
                        server_state.start_requested = False
                        server_state.stop_requested = False
                        server_state.monitor = None
                        server_state.preview_frame = None
                        if server_state.summary_data is None:
                            server_state.summary_data = {"error": "Failed prematurely"}
                print("[PROCTOR STOPPED] Session completed. Statistics recorded.")

            time.sleep(0.2)
    except KeyboardInterrupt:
        print("\nShutting down Proctoring Companion Server...")
        sys.exit(0)