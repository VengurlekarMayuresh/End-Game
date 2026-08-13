🎯 AI-Driven Interview Integrity Monitor

An enterprise-grade, background proctoring system designed to evaluate candidate integrity during online interviews or exams. Instead of aggressively blocking applications or cluttering the screen with warnings, this system runs silently in the background, analyzing webcam and microphone feeds to aggregate an **Integrity Risk Score (0–100)** based on observed suspicious behaviors.

The system generates a professional, 5-section post-session report designed for recruiter and administrator review, complete with an event timeline, critical flags, and evidence screenshots.

✨ Key Features

- **Silent Background Tracking:** Keeps the candidate's screen clean. No intrusive pop-ups or red warning boxes during the interview.
- **Advanced Event State Machine:** Uses persistence and debouncing to distinguish raw frame detections from actual suspicious *events* (e.g., a 1-frame glitch doesn't trigger a violation).
- **Time-Weighted Risk Scoring:** Uses a sophisticated formula (`base_weight × duration_factor × confidence × frequency_factor`) with diminishing returns and strict category caps so a single noisy detector can't ruin the score.
- **Camera vs. Absence Distinction:** Differentiates between a candidate leaving the room (`NO_FACE`) and the webcam disconnecting (`CAMERA_DISCONNECTED`), preventing false accusations due to hardware failure.
- **Real-Time Audio Captioning:** Uses Voice Activity Detection (VAD) and `faster-whisper` to transcribe speech locally, logging captions directly to the terminal backend.
- **Monitoring Quality Metrics:** Tracks frame drops, camera disconnects, and average detection confidence to output a `GOOD` or `DEGRADED` monitoring status.

📊 The Aggregation Architecture

The system moves away from naive "penalty per frame" logic. Instead, it uses a realistic pipeline:

1. **Raw Detections:** MediaPipe and YOLOv8 analyze frames.
2. **Persistence Layer:** Detections must sustain for `X` seconds to become an Event.
3. **Cross-Event Correlation:** If a candidate looks away and then leaves the camera, the "Looking Away" event is closed to prevent overlapping penalties.
4. **Aggregation Engine:** Applies duration severity, confidence weighting, and frequency diminishing returns.
5. **Bounded Scoring:** Scores are capped per category and bounded strictly to a 0–100 scale.

🛠️ Installation & Setup

*(Requires **Python 3.11** or **3.12**. Will not work on Python 3.13+ due to MediaPipe compatibility).*

1. **Clone or download the repository** and navigate to the project folder:
   ```powershell
   cd path/to/project/folder
   ```

2. **Create and activate a virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *(If you get a script execution error, run `Set-ExecutionPolicy Unrestricted -Scope CurrentUser` first).*

3. **Install the required dependencies:**
   ```powershell
   pip install opencv-python numpy mediapipe pygetwindow sounddevice faster-whisper ultralytics
   ```

🚀 Usage

1. Run the main script:
   ```powershell
   python session_monitor_pro.py
   ```
2. Grant camera and microphone permissions if prompted by your OS.
3. Press `y` and hit Enter to consent and start the session.
4. The system will open a clean camera window. 
   - Press **`M`** to mute/unmute the microphone.
   - Press **`Q`** to safely end the session and generate the report.

📄 The 5-Section Report

Upon ending the session, the terminal will output a comprehensive recruiter-facing report:

1. **Session Overview:** Duration, frames analyzed, and Monitoring Quality (`GOOD`/`DEGRADED`).
2. **Presence & Attention:** Candidate presence %, looking at screen vs. looking away %, and longest absences.
3. **Suspicious Activity:** A clean table showing the count and total duration of each event type (Tab Switches, Multiple Faces, Objects, etc.).
4. **Integrity Risk:** The category-by-category score contribution, resulting in the final `Integrity Risk Score (0-100)` and Risk Level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
5. **Important Events Timeline:** A chronological log of when events occurred, along with `REVIEW RECOMMENDED` critical flags (e.g., *Multiple faces detected for 15 seconds*).

*Evidence screenshots for multiple faces and detected objects are automatically saved in the `person_screenshots/` and `obj_screenshots/` folders respectively.*

⚙️ Configuration

You can easily tune the scoring system by modifying the dictionaries at the top of `session_monitor_pro.py`:

python
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
    "LOOKING_AWAY": 2.0,  # seconds needed to trigger event
    "NO_FACE": 2.0,
    "MULTIPLE_FACES": 1.5,
    "OBJECT": 1.0,
}

⚖️ Ethical AI Disclaimer

This system measures **suspicious behavioral signals**, not definitive proof of cheating. The Integrity Risk Score is intended to flag sessions for **human administrator review**. Computer vision cannot know if a candidate looked away because they were cheating, or because they were thinking deeply about a complex problem. Always use this data in conjunction with human judgment.