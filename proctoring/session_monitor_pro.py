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

TARGET_OBJECTS = {"cell phone", "laptop", "book"}

DIR_PERSON_SS = "D:\\Sem7\\Final_year_proj\\Proj\\End-Game\\proctoring\\person_screenshots"
DIR_OBJ_SS = "D:\\Sem7\\Final_year_proj\\Proj\\End-Game\\proctoring\\obj_screenshots"

# =====================================================================
# Aggregation Engine Configuration
# =====================================================================
BASE_WEIGHTS = {
    "LOOKING_AWAY": 5,
    "NO_FACE": 12,
    "TAB_SWITCH": 8,
    "MULTIPLE_FACES": 15,
    "OBJECT": 15,
}

MAX_CATEGORY_SCORE = {
    "LOOKING_AWAY": 20,
    "NO_FACE": 25,
    "MULTIPLE_FACES": 35,
    "OBJECT": 30,
    "TAB_SWITCH": 25,
}

PERSISTENCE_THRESHOLDS = {
    "LOOKING_AWAY": 2.0,
    "NO_FACE": 2.0,
    "MULTIPLE_FACES": 1.5,
    "OBJECT": 1.0,
}

# =====================================================================
# Helpers
# =====================================================================
def init_yolo_detector():
    if not YOLO_AVAILABLE: return None
    try:
        print("  Loading YOLOv8-Nano model...")
        model = YOLO('yolov8n.pt')
        return model
    except Exception: return None

def format_time(seconds):
    if seconds < 0: seconds = 0
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0: return f"{h}h {m:02d}m {s:02d}s"
    if m > 0: return f"{m}m {s:02d}s"
    return f"{s}s"

def get_duration_factor(event_type, duration):
    if event_type == "TAB_SWITCH": return 1.0
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
        self.server_mode = False

server_state = ProctorServerState()

class ProctoringHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # Suppress server logging in console to keep it clean

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self._set_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()

        if self.path == "/status":
            with server_state.lock:
                status_info = {
                    "status": "running" if server_state.is_monitoring else "idle",
                    "attemptId": server_state.attempt_id,
                    "stage": server_state.stage
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
            
            with server_state.lock:
                server_state.attempt_id = attempt_id
                server_state.stage = stage
                server_state.events_queue.clear()
                server_state.summary_data = None
                server_state.start_requested = True
            
            self.wfile.write(json.dumps({"status": "ok", "message": "Proctoring start requested"}).encode("utf-8"))

        elif self.path == "/stop":
            with server_state.lock:
                server_state.stop_requested = True
            
            # Wait for monitoring loop to terminate and set summary_data
            retries = 50 # 5 seconds
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
    def __init__(self, camera_index=0, log_file="D:\\Sem7\\Final_year_proj\\Proj\\End-Game\\proctoring\\session_log.csv"):
        self.camera_index = camera_index
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
        self.current_look_away_duration = 0.0
        
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

        # MediaPipe & YOLO
        self.mp_face_det = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_detector = self.mp_face_det.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        self.face_mesh = self.mp_face_mesh.FaceMesh(max_num_faces=5, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
        self.yolo_model = None
        self.obj_flag_text = ""
        self.obj_flag_time = 0.0
        self.last_mesh_time = 0.0
        self.mesh_interval = 0.15 

    # ------------------------------------------------------------------
    # Event Engine
    # ------------------------------------------------------------------
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
            else:
                state["max_conf"] = max(state["max_conf"], confidence)
        else:
            if state["active"]:
                state["active"] = False
                self.finalize_state(state_name)

    def finalize_state(self, state_name):
        state = self.active_states[state_name]
        duration = time.time() - state["start_time"]
        threshold = PERSISTENCE_THRESHOLDS.get(state_name, 1.0)
        if duration >= threshold:
            self.register_event(state_name, duration, state["max_conf"])

    def register_event(self, event_type, duration, confidence):
        self.event_counts[event_type] += 1
        count = self.event_counts[event_type]
        
        dur_factor = get_duration_factor(event_type, duration)
        freq_factor = get_frequency_factor(count)
        base_weight = BASE_WEIGHTS[event_type]
        
        event_score = base_weight * dur_factor * confidence * freq_factor
        self.category_scores[event_type] = min(MAX_CATEGORY_SCORE[event_type], self.category_scores[event_type] + event_score)
        
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
        
        msg = f"EVENT: {event_type} | Dur: {duration:.1f}s | Conf: {confidence*100:.0f}% | +{event_score:.1f} pts"
        self.log_event(msg, "bad")

        if server_state.server_mode:
            event_obj = {
                "type": event_type,
                "duration": duration,
                "confidence": confidence,
                "timestamp": datetime.now().isoformat(),
                "severity": "CRITICAL" if event_type in ["MULTIPLE_FACES", "OBJECT"] else "WARNING",
                "metadata": ""
            }
            with server_state.lock:
                server_state.events_queue.append(event_obj)
        
        if self.current_frame is not None and event_type in ["MULTIPLE_FACES", "OBJECT"]:
            folder = DIR_PERSON_SS if event_type == "MULTIPLE_FACES" else DIR_OBJ_SS
            if not os.path.exists(folder): os.makedirs(folder)
            ts_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            cv2.imwrite(f"{folder}/{event_type}_{ts_str}.jpg", self.current_frame)
            if event_type == "OBJECT":
                self.obj_flag_text = f"FLAG: OBJECT DETECTED ({confidence*100:.0f}%)"
                self.obj_flag_time = time.time()

    def register_instant_event(self, event_type, confidence=1.0, metadata=""):
        self.event_counts[event_type] += 1
        count = self.event_counts[event_type]
        event_score = BASE_WEIGHTS[event_type] * get_frequency_factor(count)
        self.category_scores[event_type] = min(MAX_CATEGORY_SCORE[event_type], self.category_scores[event_type] + event_score)
        
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
                except Exception: pass
            time.sleep(0.5)

    def audio_worker(self):
        if not self.audio_active: return
        try:
            model = WhisperModel("tiny", device="cpu", compute_type="int8")
        except Exception: return

        phrase_queue = queue.Queue()
        state = {'speaking': False, 'silence': 0.0, 'buffer': []}

        def audio_callback(indata, frames, time_info, status):
            if self.muted or not self.running: return
            audio_data = indata[:, 0].astype(np.float32) / 32768.0
            volume = np.sqrt(np.mean(audio_data**2))
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
                    except queue.Empty: continue
                    audio_np = np.array(phrase, dtype=np.float32)
                    try:
                        segments, _ = model.transcribe(audio_np, beam_size=1, language="en")
                        text = " ".join([seg.text.strip() for seg in segments]).strip()
                        if text: self.log_event(f"CAPTION: {text}", "info")
                    except Exception: pass
        except Exception: pass

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
            cv2.putText(frame, "WARNING: PLEASE LOOK AT THE SCREEN!", (20, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
            banner_offset = 55

        # 2. Object detection warning banner
        if now - self.obj_flag_time < 4.0:
            alpha = max(0.0, 1.0 - (now - self.obj_flag_time) / 4.0)
            overlay = frame.copy()
            y_start = banner_offset
            y_end = banner_offset + 55
            cv2.rectangle(overlay, (0, y_start), (w, y_end), (0, 0, 220), -1)
            cv2.addWeighted(overlay, alpha * 0.85, frame, 1 - (alpha * 0.85), 0, frame)
            cv2.putText(frame, self.obj_flag_text, (20, y_start + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
        
        cx, cy = w - 40, 40
        color = (0, 200, 80) if not self.muted else (0, 0, 220)
        cv2.circle(frame, (cx, cy - 4), 10, color, 2, cv2.LINE_AA)
        cv2.ellipse(frame, (cx, cy + 2), (6, 10), 0, 180, 0, color, 2, cv2.LINE_AA)
        cv2.line(frame, (cx, cy + 12), (cx, cy + 20), color, 2, cv2.LINE_AA)
        if self.muted:
            cv2.line(frame, (cx - 14, cy - 14), (cx + 14, cy + 14), (0, 0, 255), 3, cv2.LINE_AA)
            cv2.line(frame, (cx + 14, cy - 14), (cx - 14, cy + 14), (0, 0, 255), 3, cv2.LINE_AA)
        cv2.putText(frame, "MUTED" if self.muted else "MIC ON", (cx - 26, cy + 36), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)

    # ------------------------------------------------------------------
    # Main Loop
    # ------------------------------------------------------------------
    def run(self):
        if not server_state.server_mode:
            print("\n" + "=" * 60)
            print("  INTERVIEW SESSION MONITOR")
            print("=" * 60)
            consent = input(" Continue? (y/n): ").strip().lower()
            if consent != "y": return

        cap = cv2.VideoCapture(self.camera_index)
        if not cap.isOpened():
            print("Cannot access camera.")
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

                # 1. Face Detection
                det_result = self.face_detector.process(rgb)
                faces = det_result.detections or []
                high_conf_faces = [d for d in faces if d.score and d.score[0] > 0.50]
                face_count = len(high_conf_faces)
                
                if face_count > 0:
                    self.total_face_confidence += high_conf_faces[0].score[0]
                    self.confidence_checks += 1

                self.update_state("NO_FACE", face_count == 0, 0.95)
                self.update_state("MULTIPLE_FACES", face_count > 1, high_conf_faces[1].score[0] if face_count > 1 else 0.9)

                # 2. Face Mesh & Yaw
                if face_count == 1 and (now - self.last_mesh_time) >= self.mesh_interval:
                    self.last_mesh_time = now
                    mesh_result = self.face_mesh.process(rgb)
                    if mesh_result.multi_face_landmarks:
                        lm = mesh_result.multi_face_landmarks[0].landmark
                        nose_x = lm[1].x * w
                        mid_x = (lm[33].x + lm[263].x) / 2 * w
                        span = abs(lm[263].x - lm[33].x) * w
                        yaw = (nose_x - mid_x) / span if span > 1 else 0.0
                        self.update_state("LOOKING_AWAY", abs(yaw) > 0.35, 0.85)
                    else:
                        self.update_state("LOOKING_AWAY", False)
                elif face_count != 1:
                    self.update_state("LOOKING_AWAY", False)

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
                            conf = 0.0
                            for r in results:
                                for box in r.boxes:
                                    conf = float(box.conf[0])
                                    name = self.yolo_model.names[int(box.cls[0])]
                                    if name in TARGET_OBJECTS and conf > 0.40:
                                        found_obj = True
                                        break
                                if found_obj: break
                            self.update_state("OBJECT", found_obj, conf if found_obj else 0.0)
                        except Exception: pass

                # 5. Draw UI
                self.draw_ui(self.current_frame, w)
                cv2.imshow("Interview Monitor  |  Q=Quit  M=Mute", self.current_frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q") or key == ord("Q"): break
                elif key == ord("m") or key == ord("M"):
                    self.muted = not self.muted

        finally:
            self.running = False
            for state in self.active_states:
                if self.active_states[state]["active"]:
                    self.finalize_state(state)
            
            cap.release()
            cv2.destroyAllWindows()
            self.log_event("Interview session stopped", "info")
            self.save_log()
            self.print_summary()

    def save_log(self):
        try:
            with open(self.log_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["time", "level", "message"])
                writer.writerows(self.events)
        except IOError: pass

    # ------------------------------------------------------------------
    # Professional Reporting (5 Sections)
    # ------------------------------------------------------------------
    def print_summary(self):
        elapsed = time.time() - self.start_time
        raw_score = int(min(100, sum(self.category_scores.values())))

        if raw_score <= 19: risk_level = "LOW"
        elif raw_score <= 39: risk_level = "MEDIUM"
        elif raw_score <= 69: risk_level = "HIGH"
        else: risk_level = "CRITICAL"

        presence_pct = (self.total_on_screen_time / elapsed * 100) if elapsed > 0 else 0
        looking_pct = (self.total_looking_at_screen / self.total_on_screen_time * 100) if self.total_on_screen_time > 0 else 0
        away_pct = 100 - looking_pct
        
        # Calculate Monitoring Quality
        avg_conf = (self.total_face_confidence / self.confidence_checks) if self.confidence_checks > 0 else 0
        if self.camera_disconnects > 0 or self.frames_failed > 10 or avg_conf < 0.60:
            mon_quality = "DEGRADED"
            mon_color = "\033[93m" # Yellow
        else:
            mon_quality = "GOOD"
            mon_color = "\033[92m" # Green

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
            "LOOKING_AWAY": "Eye/Gaze",
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
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        server_state.server_mode = True
        server = HTTPServer(("localhost", 8765), ProctoringHTTPHandler)
        print("Starting Proctoring Companion Server on http://localhost:8765...")
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
                    print(f"Starting proctoring session for Attempt: {server_state.attempt_id}, Stage: {server_state.stage}")
                    # Instantiate a fresh monitor for this session
                    monitor = SessionMonitorPro(camera_index=0)
                    try:
                        monitor.run()
                    except Exception as ex:
                        print(f"Error in proctoring monitor loop: {ex}")
                    finally:
                        with server_state.lock:
                            server_state.is_monitoring = False
                            server_state.start_requested = False
                            server_state.stop_requested = False
                            # Ensure summary is populated if run failed early
                            if server_state.summary_data is None:
                                server_state.summary_data = {"error": "Failed prematurely"}
                    print("Proctoring session stopped.")
                
                time.sleep(0.2)
        except KeyboardInterrupt:
            print("\nShutting down Proctoring Companion Server...")
            sys.exit(0)
    else:
        monitor = SessionMonitorPro(camera_index=0, log_file="D:\\Sem7\\Final_year_proj\\Proj\\End-Game\\proctoring\\session_log.csv")
        try:
            monitor.run()
        except KeyboardInterrupt:
            if monitor.running:
                monitor.running = False
                monitor.print_summary()
            sys.exit(0)