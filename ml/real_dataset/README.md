# Real Labeled Sensor Dataset Specification

This directory holds **real labeled sensor data** collected from physical ESP32-S3 wearable devices or standard benchmark fall datasets (e.g., SisFall, MobiFall).

> [!IMPORTANT]
> **Strict Separation Rule**:
> Real sensor data and synthetic pipeline verification data are stored separately.
> Real dataset samples are processed into `ml/real_dataset/dataset_real.npz`.

---

## 1. Supported Activity Categories

| Label Code | Category Name | Description | Class |
|---|---|---|---|
| `WALK` | Walking | Normal continuous gait | ADL (0) |
| `SIT` | Sitting | Transitioning to/from chair | ADL (0) |
| `STAND` | Standing | Stationary upright posture | ADL (0) |
| `LIE` | Lying | Resting horizontally | ADL (0) |
| `STAIRS` | Stairs | Ascending or descending stairs | ADL (0) |
| `BEND` | Bending | Bending down to pick up item | ADL (0) |
| `ADL` | General ADL | Daily household activities | ADL (0) |
| `FALL_SLIP` | Slip Fall | Forward or backward slip fall | FALL (1) |
| `FALL_TRIP` | Trip Fall | Forward stumble trip fall | FALL (1) |
| `FALL_LATERAL` | Sideways Fall | Lateral fall to side | FALL (1) |

---

## 2. File Format (Raw CSV Session File)

Each real recording session should be saved in `ml/real_dataset/raw/session_<subject_id>_<timestamp>.csv` with header:

```csv
timestamp_ms,subject_id,activity_label,accel_x,accel_y,accel_z,gyro_x,gyro_y,gyro_z,altitude_delta
1697000000000,SUBJ_01,WALK,0.12,0.05,0.98,0.01,-0.02,0.00,0.01
1697000000020,SUBJ_01,WALK,0.15,0.08,1.02,0.02,-0.01,0.01,0.01
...
```

---

## 3. Ingestion & Preprocessing

Run the ingestion script to slice session files into 2-second (100 samples @ 50 Hz) sliding windows:

```powershell
backend\.venv\Scripts\python -m ml.ingest_real_dataset
```

Output: `ml/real_dataset/dataset_real.npz` (Containing arrays `X`, `y`, `subject_ids`, `activity_labels`).
