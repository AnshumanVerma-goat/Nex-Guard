from __future__ import annotations

import json
import time
import urllib.request
import numpy as np

from ml.dataset import generate_synthetic_sensor_window
from ml.preprocess import normalize_windows
from ml.train_1d_cnn import Embedded1DCNNModel


class ESP32FirmwareSimulator:
    """
    Firmware simulation harness executing identical state machine,
    TinyML inference, and HTTP payload generation as target ESP32-S3 C firmware.
    """

    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.device_id = "nex-guard-001"
        self.state = "NORMAL"
        self.fall_confidence = 0.0
        self.latitude = 22.7196
        self.longitude = 75.8577
        self.battery_level = 84

        # Load trained 1D CNN model
        self.cnn_model = Embedded1DCNNModel()
        # Train lightweight model weights if needed for simulation
        X_dummy = np.random.randn(100, 100, 7).astype(np.float32)
        y_dummy = np.array([1 if i % 2 == 1 else 0 for i in range(100)])
        self.cnn_model.fit(X_dummy, y_dummy)

    def run_simulation_step(self, trigger_fall: bool = False, press_cancel: bool = False):
        print(f"\n--- [ESP32 FIRMWARE TICK] Current State: {self.state} ---")

        # 1. Collect synchronized 2-sec 50Hz window (100x7)
        window = generate_synthetic_sensor_window(is_fall=trigger_fall, seed=int(time.time()))
        window_norm = normalize_windows(np.expand_dims(window, axis=0))

        # 2. Motion Gate Check
        max_accel = np.max(np.linalg.norm(window[:, :3], axis=1))
        print(f"[FIRMWARE] Sensor Window Sampled: Max Accel = {max_accel:.2f}g")

        if self.state == "NORMAL":
            if max_accel >= 2.5:
                self.state = "POSSIBLE_FALL"
                print(f"[STATE MACHINE] NORMAL -> POSSIBLE_FALL (Motion gate tripped at {max_accel:.2f}g)")

        if self.state == "POSSIBLE_FALL":
            # 3. TinyML 1D CNN Inference
            score = float(self.cnn_model.predict_proba(window_norm)[0])
            print(f"[TINYML INFERENCE] 1D CNN Fall Score = {score:.2f}")

            if score >= 0.50:
                self.state = "USER_CONFIRMATION"
                self.fall_confidence = score
                print(f"[STATE MACHINE] POSSIBLE_FALL -> USER_CONFIRMATION (High fall score: {score:.2f})")
            else:
                self.state = "NORMAL"
                print("[STATE MACHINE] POSSIBLE_FALL -> NORMAL (False alarm)")

        if self.state == "USER_CONFIRMATION":
            print("[LOCAL ALERT] Vibration Motor: ACTIVE | Active Buzzer: BEEPING")
            if press_cancel:
                self.state = "CANCELLED"
                print("[STATE MACHINE] USER_CONFIRMATION -> CANCELLED (Physical cancel button pressed)")
            else:
                print("[LOCAL ALERT] Confirmation timer (15s) expired without button press.")
                self.state = "CONFIRMED_FALL"
                print("[STATE MACHINE] USER_CONFIRMATION -> CONFIRMED_FALL")

        if self.state == "CANCELLED":
            time.sleep(0.5)
            self.state = "NORMAL"
            print("[STATE MACHINE] CANCELLED -> NORMAL (Alert cleared locally)")

        if self.state == "CONFIRMED_FALL":
            self.state = "LOCATING"
            print(f"[GPS DRIVER] GNSS Fix Acquired: Lat={self.latitude}, Lon={self.longitude}")
            self.state = "ALERTING"

        if self.state == "ALERTING":
            payload = {
                "device_id": self.device_id,
                "event_type": "FALL_DETECTED",
                "occurred_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "confidence": self.fall_confidence if self.fall_confidence > 0 else 0.94,
                "latitude": self.latitude,
                "longitude": self.longitude,
                "location_accuracy": 2.5,
                "detection_model": "1d_cnn",
                "confirmation_status": "confirmed",
                "communication_path": "wifi",
                "battery_level": self.battery_level,
            }
            print(f"[NETWORK] Transmitting HTTP POST /api/v1/events/fall payload:\n{payload}")
            try:
                req_data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    f"{self.backend_url}/api/v1/events/fall",
                    data=req_data,
                    headers={"Content-Type": "application/json"},
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = json.loads(response.read().decode())
                    print(f"[NETWORK RESPONSE] Status {response.status}: {res_body}")
                    self.state = "ACKNOWLEDGED"
            except Exception as e:
                print(f"[NETWORK SIMULATION] Local simulation tick processed without active server connection: {e}")
                self.state = "ALERTING"


        return self.state


if __name__ == "__main__":
    sim = ESP32FirmwareSimulator()
    sim.run_simulation_step(trigger_fall=True, press_cancel=False)
