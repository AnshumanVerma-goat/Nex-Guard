# Nex Guard ML Model Evaluation Report

## Dataset Metadata
- Data Source: SYNTHETIC PIPELINE VERIFICATION DATA
- Real-World Validation Status: REAL-WORLD MODEL VALIDATION: NOT YET AVAILABLE
- Total Samples: 600
- Window Duration: 2.0 seconds (100 samples @ 50 Hz)
- Channels: 7 (Accel XYZ, Gyro XYZ, Altitude Delta)

## Benchmark Results

| Metric | 1D CNN Model (Quantized / Embedded) | AdaBoost Benchmark |
|---|---|---|
| **Precision** | 1.0000 | 1.0000 |
| **Recall** | 1.0000 | 1.0000 |
| **F1-Score** | 1.0000 | 1.0000 |
| **False Positive Rate** | 0.0000 | 0.0000 |
| **Inference Latency** | ~0.006 ms / window | ~0.050 ms / window |
| **Model Size** | ~14 KB (C Header) | ~45 KB |
| **Target Execution** | ESP32-S3 Local Edge Inference | Python / Server |

## Model Selection Decision
Selected Model for Deployment: **1D CNN Model**
- **Rationale**: The 1D CNN model compiles directly to lightweight C arrays (~14 KB flash footprint), executes in <0.2 ms per window on ESP32-S3, and handles continuous time-series feature extraction directly without requiring separate floating-point feature engineering functions.
