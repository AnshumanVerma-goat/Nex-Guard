from __future__ import annotations

import numpy as np


def normalize_windows(X: np.ndarray) -> np.ndarray:
    """
    Normalizes time-series windows per channel.
    Input shape: (N, 100, 7)
    Output shape: (N, 100, 7)
    """
    N, W, C = X.shape
    X_norm = np.zeros_like(X, dtype=np.float32)
    for c in range(C):
        mean = np.mean(X[:, :, c])
        std = np.std(X[:, :, c]) + 1e-8
        X_norm[:, :, c] = (X[:, :, c] - mean) / std
    return X_norm


def extract_statistical_features(X: np.ndarray) -> np.ndarray:
    """
    Extracts engineered summary features for decision trees / AdaBoost.
    Input shape: (N, 100, 7)
    Output shape: (N, 10)
    Features:
      0: max accel magnitude
      1: mean accel magnitude
      2: std accel magnitude
      3: max gyro magnitude
      4: std gyro magnitude
      5: min altitude delta
      6: max altitude delta
      7: impact ratio (max_accel / mean_accel)
      8: accel z min
      9: accel z max
    """
    N, W, C = X.shape
    features = np.zeros((N, 10), dtype=np.float32)

    for i in range(N):
        window = X[i]
        accel_mag = np.linalg.norm(window[:, :3], axis=1)
        gyro_mag = np.linalg.norm(window[:, 3:6], axis=1)
        alt = window[:, 6]

        max_acc = np.max(accel_mag)
        mean_acc = np.mean(accel_mag) + 1e-8

        features[i, 0] = max_acc
        features[i, 1] = mean_acc
        features[i, 2] = np.std(accel_mag)
        features[i, 3] = np.max(gyro_mag)
        features[i, 4] = np.std(gyro_mag)
        features[i, 5] = np.min(alt)
        features[i, 6] = np.max(alt)
        features[i, 7] = max_acc / mean_acc
        features[i, 8] = np.min(window[:, 2])
        features[i, 9] = np.max(window[:, 2])

    return features
