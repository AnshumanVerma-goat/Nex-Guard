from __future__ import annotations

import os
from typing import Tuple
import numpy as np

# Configurable Sensor Window Parameters
SAMPLING_RATE_HZ = 50
WINDOW_DURATION_SEC = 2
WINDOW_SIZE = SAMPLING_RATE_HZ * WINDOW_DURATION_SEC  # 100 samples
NUM_CHANNELS = 7  # accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, altitude_delta


def generate_synthetic_sensor_window(is_fall: bool = False, seed: int = 42) -> np.ndarray:
    """
    Generates a 100x7 sensor time-series window.
    Channels: [accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, altitude_delta]
    NOTE: Synthetic data is strictly for pipeline, preprocessing, export, and firmware verification.
    """
    rng = np.random.default_rng(seed)
    t = np.linspace(0, WINDOW_DURATION_SEC, WINDOW_SIZE)

    # Base gravity + normal walking motion
    accel_x = 0.1 * np.sin(2 * np.pi * 1.5 * t) + rng.normal(0, 0.05, WINDOW_SIZE)
    accel_y = 0.1 * np.cos(2 * np.pi * 1.5 * t) + rng.normal(0, 0.05, WINDOW_SIZE)
    accel_z = 1.0 + 0.15 * np.sin(2 * np.pi * 3.0 * t) + rng.normal(0, 0.05, WINDOW_SIZE)

    gyro_x = rng.normal(0, 0.1, WINDOW_SIZE)
    gyro_y = rng.normal(0, 0.1, WINDOW_SIZE)
    gyro_z = rng.normal(0, 0.1, WINDOW_SIZE)
    altitude_delta = rng.normal(0, 0.02, WINDOW_SIZE)

    if is_fall:
        # Simulate high-g impact spike around middle of window (t ~ 1.0s)
        impact_idx = WINDOW_SIZE // 2
        impact_len = 10
        start = max(0, impact_idx - impact_len // 2)
        end = min(WINDOW_SIZE, impact_idx + impact_len // 2)

        accel_x[start:end] += rng.uniform(2.5, 4.5, end - start)
        accel_y[start:end] += rng.uniform(2.0, 4.0, end - start)
        accel_z[start:end] += rng.uniform(3.5, 6.0, end - start)

        gyro_x[start:end] += rng.uniform(2.0, 5.0, end - start)
        gyro_y[start:end] += rng.uniform(2.0, 5.0, end - start)
        gyro_z[start:end] += rng.uniform(1.5, 4.0, end - start)

        # Altitude drop during fall
        altitude_delta[impact_idx:] -= 0.5

    return np.column_stack([accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, altitude_delta])


def load_dataset(
    real_dataset_path: str | None = None,
    num_synthetic_samples: int = 500
) -> Tuple[np.ndarray, np.ndarray, bool]:
    """
    Loads real labeled dataset if available at real_dataset_path (numpy .npz format).
    Otherwise generates pipeline verification windows.
    Returns: (X, y, is_real_dataset)
    """
    if real_dataset_path and os.path.exists(real_dataset_path):
        data = np.load(real_dataset_path)
        X, y = data["X"], data["y"]
        return X, y, True

    # Fallback to pipeline verification synthetic generation
    X_list, y_list = [], []
    for i in range(num_synthetic_samples):
        is_fall = i % 2 == 1
        window = generate_synthetic_sensor_window(is_fall=is_fall, seed=i)
        X_list.append(window)
        y_list.append(1 if is_fall else 0)

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32), False
