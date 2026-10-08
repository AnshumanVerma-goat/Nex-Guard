from __future__ import annotations

import os
import glob
import pandas as pd
import numpy as np

WINDOW_SAMPLES = 100
STEP_SAMPLES = 25  # 75% overlap for windowing

FALL_LABELS = {"FALL_SLIP", "FALL_TRIP", "FALL_LATERAL", "FALL"}

def ingest_raw_csv_sessions(raw_dir: str = "ml/real_dataset/raw", output_file: str = "ml/real_dataset/dataset_real.npz"):
    csv_files = glob.glob(os.path.join(raw_dir, "*.csv"))
    if not csv_files:
        print(f"[INGEST] No raw CSV session files found in {raw_dir}.")
        print("[INGEST] Create CSV session files to build real-world sensor dataset.")
        return False

    X_list, y_list, subject_list, label_list = [], [], [], []

    for file_path in csv_files:
        df = pd.read_csv(file_path)
        required_cols = {"accel_x", "accel_y", "accel_z", "gyro_x", "gyro_y", "gyro_z", "altitude_delta", "activity_label"}
        if not required_cols.issubset(df.columns):
            print(f"[INGEST SKIPPED] {file_path} missing required columns.")
            continue

        subject_id = df["subject_id"].iloc[0] if "subject_id" in df.columns else "UNKNOWN"
        activity_label = str(df["activity_label"].iloc[0]).upper()
        is_fall = 1 if any(f in activity_label for f in FALL_LABELS) else 0

        sensor_data = df[["accel_x", "accel_y", "accel_z", "gyro_x", "gyro_y", "gyro_z", "altitude_delta"]].values

        for start in range(0, len(sensor_data) - WINDOW_SAMPLES + 1, STEP_SAMPLES):
            window = sensor_data[start : start + WINDOW_SAMPLES]
            X_list.append(window)
            y_list.append(is_fall)
            subject_list.append(subject_id)
            label_list.append(activity_label)

    if not X_list:
        print("[INGEST] No valid windows extracted.")
        return False

    X_arr = np.array(X_list, dtype=np.float32)
    y_arr = np.array(y_list, dtype=np.int32)

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    np.savez_compressed(
        output_file,
        X=X_arr,
        y=y_arr,
        subject_ids=np.array(subject_list),
        activity_labels=np.array(label_list)
    )

    print(f"[INGEST SUCCESS] Processed {len(X_arr)} windows from {len(csv_files)} CSV files -> {output_file}")
    return True

if __name__ == "__main__":
    ingest_raw_csv_sessions()
