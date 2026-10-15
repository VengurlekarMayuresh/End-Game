"""
dlib-based eye tracker — port of your standalone script, wrapped to match
the proctoring engine's pupil-gaze interface.

detect(frame) returns:
    gaze_label  : "LEFT" / "RIGHT" / "UP" / "CENTER" / "UNKNOWN"
    pupil_points: [(x, y), ...] for the SHOW_GAZE_DEBUG overlay

Requirements:
    pip install dlib
    shape_predictor_68_face_landmarks.dat in this folder
    (http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2)
"""
import cv2
import numpy as np

try:
    import dlib
    DLIB_OK = True
except ImportError:
    DLIB_OK = False

LEFT_EYE  = [36, 37, 38, 39, 40, 41]
RIGHT_EYE = [42, 43, 44, 45, 46, 47]
KERNEL = np.ones((9, 9), np.uint8)
POS_LABEL = {0: "CENTER", 1: "LEFT", 2: "RIGHT", 3: "UP"}


class DlibGazeTracker:
    def __init__(self, predictor_path="shape_predictor_68_face_landmarks.dat", threshold=75):
        if not DLIB_OK:
            raise RuntimeError("dlib is not installed")
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor(predictor_path)
        self.threshold = threshold

    # ---- your original pipeline, unchanged ----
    def _eye_on_mask(self, mask, shape, side):
        points = np.array([(shape.part(i).x, shape.part(i).y) for i in side], dtype=np.int32)
        cv2.fillConvexPoly(mask, points, 255)
        l = points[0][0]
        t = (points[1][1] + points[2][1]) // 2
        r = points[3][0]
        b = (points[4][1] + points[5][1]) // 2
        return [l, t, r, b]

    def _find_eyeball_position(self, end_points, cx, cy):
        try:
            x_ratio = (end_points[0] - cx) / (cx - end_points[2])
            y_ratio = (cy - end_points[1]) / (end_points[3] - cy)
        except ZeroDivisionError:
            return 0
        if x_ratio > 3:    return 1
        if x_ratio < 0.33: return 2
        if y_ratio < 0.33: return 3
        return 0

    def _contouring(self, thresh, mid, end_points, right=False):
        result = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cnts = result[0] if len(result) == 2 else result[1]   # OpenCV 4 / 3 compat
        if not cnts:
            return None, None
        cnt = max(cnts, key=cv2.contourArea)
        M = cv2.moments(cnt)
        if M["m00"] == 0:
            return None, None
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        if right:
            cx += mid
        return self._find_eyeball_position(end_points, cx, cy), (cx, cy)

    def _process_thresh(self, thresh):
        thresh = cv2.erode(thresh, None, iterations=2)
        thresh = cv2.dilate(thresh, None, iterations=4)
        thresh = cv2.medianBlur(thresh, 3)
        return cv2.bitwise_not(thresh)

    # ---- public API ----
    def detect(self, frame):
        """frame: the (mirrored) BGR frame the proctoring loop already uses."""
        try:
            # The proctoring loop mirrors frames (cv2.flip). Your original
            # left/right logic assumes raw camera orientation, so flip back
            # here, then mirror the pupil points afterwards so the debug
            # overlay lines up with the displayed frame.
            raw = cv2.flip(frame, 1)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            faces = self.detector(gray, 0)
            if not faces:
                return "UNKNOWN", []
            face = max(faces, key=lambda f: (f.right() - f.left()) * (f.bottom() - f.top()))
            shape = self.predictor(gray, face)

            mask = np.zeros(raw.shape[:2], dtype=np.uint8)
            ep_left = self._eye_on_mask(mask, shape, LEFT_EYE)
            ep_right = self._eye_on_mask(mask, shape, RIGHT_EYE)
            mask = cv2.dilate(mask, KERNEL, iterations=5)

            eyes = cv2.bitwise_and(raw, raw, mask=mask)
            eyes[(eyes == [0, 0, 0]).all(axis=2)] = [255, 255, 255]

            mid = (shape.part(42).x + shape.part(39).x) // 2
            eyes_gray = cv2.cvtColor(eyes, cv2.COLOR_BGR2GRAY)

            _, thresh = cv2.threshold(eyes_gray, self.threshold, 255, cv2.THRESH_BINARY)
            thresh = self._process_thresh(thresh)

            code_l, c_l = self._contouring(thresh[:, 0:mid], mid, ep_left)
            code_r, c_r = self._contouring(thresh[:, mid:], mid, ep_right, right=True)

            w = raw.shape[1]
            points = []
            for p in (c_l, c_r):
                if p:
                    points.append((w - 1 - p[0], p[1]))

            # both eyes must agree (borrowed from your proctoring design)
            if code_l is None or code_r is None or code_l != code_r:
                return "UNKNOWN", points
            return POS_LABEL[code_l], points
        except Exception:
            return "UNKNOWN", []
