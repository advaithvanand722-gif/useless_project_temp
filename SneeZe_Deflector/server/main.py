import asyncio
from contextlib import asynccontextmanager
import logging
import math
import os
import sys
import threading
import time
from typing import Any, Dict, Optional
from fastapi import FastAPI, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Redirect stdin to devnull if disconnected/non-interactive to prevent uvicorn stdin shutdown signal
try:
    if sys.stdin is None or not sys.stdin.isatty():
        sys.stdin = open(os.devnull, 'r')
except Exception:
    pass

# Suppress OpenCV C++ level verbose log messages
os.environ["OPENCV_LOG_LEVEL"] = "OFF"
os.environ["OPENCV_VIDEOINPUT_PRIORITY_MSMF"] = "0"

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("VolatileDB")

# Try importing hardware sensor libraries with graceful fallbacks
TRY_AUDIO = True
try:
    import numpy as np
    import sounddevice as sd
except Exception as e:
    TRY_AUDIO = False
    logger.warning(f"Audio libraries (sounddevice/numpy) unavailable or restricted: {e}. Using simulated audio metrics.")

TRY_VISION = True
try:
    import cv2
    if hasattr(cv2, 'setLogLevel'):
        cv2.setLogLevel(0)
    import mediapipe as mp
except Exception as e:
    TRY_VISION = False
    logger.warning(f"Vision libraries (opencv/mediapipe) unavailable or restricted: {e}. Using simulated vision metrics.")


# ============================================================================
# STORAGE ENGINE (Thread-Safe In-Memory KV Store)
# ============================================================================
class StorageEngine:
    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._lock = threading.Lock()
        self.purged_count: int = 0

    def set(self, key: str, value: Any):
        with self._lock:
            self._store[key] = value

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            return self._store.get(key, None)

    def purge_all(self):
        with self._lock:
            count = len(self._store)
            self._store.clear()
            self.purged_count += 1
            logger.info(f"[GC_PURGE] Toxic stress detected. Purging player stage keys ({count} keys deleted). Total Purges: {self.purged_count}")

    def count(self) -> int:
        with self._lock:
            return len(self._store)


db = StorageEngine()


# ============================================================================
# SENSOR & SENTIMENT SYSTEM
# ============================================================================
class RoomSentimentMonitor:
    def __init__(self):
        self.stress_score: float = 0.15 # 0.0 to 1.0
        self.state: str = "CALM" # CALM, TENSE, RAGE
        self.latency_ms: int = 0 # 0 or 2500
        self.manual_override: Optional[float] = None
        self._running: bool = True
        self._camera_available: bool = True
        self._audio_available: bool = True
        self._thread = threading.Thread(target=self._monitor_loop, daemon=True)

    def start(self):
        self._running = True
        if not self._thread.is_alive():
            self._thread.start()

    def stop(self):
        self._running = False

    def set_override(self, score: Optional[float]):
        self.manual_override = score
        logger.info(f"Manual stress score override set to: {score}")

    def _get_audio_stress(self) -> float:
        if not TRY_AUDIO or not self._audio_available:
            return 0.15 + (math.sin(time.time() * 0.5) + 1) * 0.1

        try:
            duration = 0.1
            sample_rate = 44100
            recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
            sd.wait()
            rms = float(np.sqrt(np.mean(recording**2)))
            return min(1.0, rms * 5.0)
        except Exception as e:
            self._audio_available = False
            logger.info(f"Microphone sensor unavailable ({e}). Fallback to simulated audio sentiment.")
            return 0.15

    def _get_vision_stress(self) -> float:
        if not TRY_VISION or not self._camera_available:
            return 0.10

        try:
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW) if os.name == 'nt' else cv2.VideoCapture(0)
            if not cap.isOpened():
                self._camera_available = False
                logger.info("Webcam sensor unavailable (camera index 0 not found). Fallback to simulated vision sentiment.")
                return 0.10

            ret, frame = cap.read()
            cap.release()
            if not ret or frame is None:
                self._camera_available = False
                return 0.10
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            std_dev = float(gray.std()) / 128.0
            return min(1.0, std_dev * 0.5)
        except Exception as e:
            self._camera_available = False
            logger.info(f"Webcam sensor unavailable ({e}). Fallback to simulated vision sentiment.")
            return 0.10

    def _monitor_loop(self):
        while self._running:
            if self.manual_override is not None:
                calc_stress = self.manual_override
            else:
                a_stress = self._get_audio_stress()
                v_stress = self._get_vision_stress()
                calc_stress = (a_stress * 0.6) + (v_stress * 0.4)
                calc_stress = max(0.0, min(1.0, calc_stress))

            self.stress_score = calc_stress

            # Garbage Collector & Sentiment Threshold Logic (Every 2 Seconds)
            if self.stress_score < 0.35:
                self.state = "CALM"
                self.latency_ms = 0
            elif 0.35 <= self.stress_score < 0.70:
                self.state = "TENSE"
                self.latency_ms = 2500 # Inject 2.5s delay
            else:
                self.state = "RAGE"
                self.latency_ms = 0
                # Purge keys on rage
                db.purge_all()

            time.sleep(2.0)


monitor = RoomSentimentMonitor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    monitor.start()
    logger.info("VolatileDB Local Daemon running. Background room sentiment monitor initialized.")
    yield
    monitor.stop()


# ============================================================================
# FASTAPI APPLICATION & ENDPOINTS
# ============================================================================
app = FastAPI(
    title="VolatileDB Daemon",
    description="High-Stakes Local Key-Value Store with Stress-Based Garbage Collection",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class KeyValuePayload(BaseModel):
    key: str
    value: Any


class OverridePayload(BaseModel):
    stress_score: Optional[float]


@app.post("/set")
async def set_key(payload: KeyValuePayload):
    # Check for Tense delay
    if monitor.state == "TENSE":
        logger.info("[VOLATILE_DB] Injecting 2500ms latency due to TENSE room sentiment...")
        await asyncio.sleep(2.5)

    # Check for Rage wipe
    if monitor.state == "RAGE":
        return {
            "status": "WIPED",
            "reason": "ROOM_UNSUPPORTIVE",
            "message": "Toxic stress detected. Transaction rejected and keys purged."
        }

    db.set(payload.key, payload.value)
    return {
        "status": "OK",
        "key": payload.key,
        "value": payload.value,
        "room_state": monitor.state
    }


@app.get("/get")
async def get_key(key: str = Query(...)):
    # Check for Tense delay
    if monitor.state == "TENSE":
        logger.info("[VOLATILE_DB] Injecting 2500ms latency due to TENSE room sentiment...")
        await asyncio.sleep(2.5)

    # Check for Rage wipe
    if monitor.state == "RAGE":
        return {
            "status": "WIPED",
            "reason": "ROOM_UNSUPPORTIVE",
            "message": "Toxic stress detected. Transaction rejected and keys purged."
        }

    val = db.get(key)
    if val is None:
        return {"status": "NOT_FOUND", "key": key, "value": None}

    return {
        "status": "OK",
        "key": key,
        "value": val,
        "room_state": monitor.state
    }


@app.get("/telemetry")
async def get_telemetry():
    return {
        "state": monitor.state,
        "stress_score": round(monitor.stress_score, 3),
        "latency_ms": monitor.latency_ms,
        "purged_count": db.purged_count,
        "keys_count": db.count()
    }


@app.post("/simulate_stress")
async def simulate_stress(payload: OverridePayload):
    """
    Developer testing endpoint to simulate different stress levels (e.g. 0.2 for CALM, 0.5 for TENSE, 0.85 for RAGE).
    Pass stress_score: null to resume real sensor reading.
    """
    monitor.set_override(payload.stress_score)
    return {
        "status": "OK",
        "simulated_score": payload.stress_score,
        "current_state": monitor.state
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


