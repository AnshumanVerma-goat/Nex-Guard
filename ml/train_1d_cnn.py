from __future__ import annotations

import os
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from ml.preprocess import normalize_windows, extract_statistical_features


class Embedded1DCNNModel:
    """
    Lightweight 1D CNN / Neural Classifier exportable directly to C header for ESP32-S3.
    """

    def __init__(self):
        self.clf = MLPClassifier(
            hidden_layer_sizes=(16, 8),
            max_iter=300,
            random_state=42,
            activation="relu",
            solver="adam",
        )
        self.is_trained = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        # Flattened normalized time-series windows or feature maps
        N = X.shape[0]
        X_flat = X.reshape(N, -1)
        self.clf.fit(X_flat, y)
        self.is_trained = True

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        N = X.shape[0]
        X_flat = X.reshape(N, -1)
        return self.clf.predict_proba(X_flat)[:, 1]

    def predict(self, X: np.ndarray) -> np.ndarray:
        return (self.predict_proba(X) >= 0.5).astype(int)

    def export_c_header(self, output_path: str):
        """
        Exports the model weights into an embedded C header file for ESP32-S3.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        coefs = self.clf.coefs_
        intercepts = self.clf.intercepts_

        with open(output_path, "w") as f:
            f.write("/* Auto-generated Nex Guard 1D CNN Model Header */\n")
            f.write("#ifndef FALL_DETECTION_MODEL_H\n")
            f.write("#define FALL_DETECTION_MODEL_H\n\n")
            f.write("#include <math.h>\n\n")
            f.write("#define MODEL_INPUT_SAMPLES 100\n")
            f.write("#define MODEL_INPUT_CHANNELS 7\n")
            f.write(f"#define MODEL_FEATURE_SIZE {coefs[0].shape[0]}\n\n")

            # Layer 1 Weights & Biases
            w1 = coefs[0]
            b1 = intercepts[0]
            f.write(f"static const float W1[{w1.shape[0]}][{w1.shape[1]}] = {{\n")
            for i in range(w1.shape[0]):
                row_str = ", ".join(f"{val:.6f}f" for val in w1[i])
                f.write(f"  {{ {row_str} }},\n")
            f.write("};\n\n")

            f.write(f"static const float B1[{b1.shape[0]}] = {{\n  ")
            f.write(", ".join(f"{val:.6f}f" for val in b1))
            f.write("\n};\n\n")

            # Layer 2 Weights & Biases
            w2 = coefs[1]
            b2 = intercepts[1]
            f.write(f"static const float W2[{w2.shape[0]}][{w2.shape[1]}] = {{\n")
            for i in range(w2.shape[0]):
                row_str = ", ".join(f"{val:.6f}f" for val in w2[i])
                f.write(f"  {{ {row_str} }},\n")
            f.write("};\n\n")

            f.write(f"static const float B2[{b2.shape[0]}] = {{\n  ")
            f.write(", ".join(f"{val:.6f}f" for val in b2))
            f.write("\n};\n\n")

            # Layer 3 Weights & Biases
            w3 = coefs[2]
            b3 = intercepts[2]
            f.write(f"static const float W3[{w3.shape[0]}][{w3.shape[1]}] = {{\n")
            for i in range(w3.shape[0]):
                row_str = ", ".join(f"{val:.6f}f" for val in w3[i])
                f.write(f"  {{ {row_str} }},\n")
            f.write("};\n\n")

            f.write(f"static const float B3[{b3.shape[0]}] = {{\n  ")
            f.write(", ".join(f"{val:.6f}f" for val in b3))
            f.write("\n};\n\n")

            # Inference C Function
            f.write("""
static inline float relu_act(float x) {
    return x > 0.0f ? x : 0.0f;
}

static inline float sigmoid_act(float x) {
    return 1.0f / (1.0f + expf(-x));
}

static inline float run_1d_cnn_inference(const float input[MODEL_INPUT_SAMPLES][MODEL_INPUT_CHANNELS]) {
    // 1. Extract statistical summary features
    float features[10] = {0};
    float max_acc = 0.0f, sum_acc = 0.0f, max_gyro = 0.0f;
    for (int i = 0; i < MODEL_INPUT_SAMPLES; i++) {
        float ax = input[i][0], ay = input[i][1], az = input[i][2];
        float gx = input[i][3], gy = input[i][4], gz = input[i][5];
        float amag = sqrtf(ax*ax + ay*ay + az*az);
        float gmag = sqrtf(gx*gx + gy*gy + gz*gz);
        if (amag > max_acc) max_acc = amag;
        if (gmag > max_gyro) max_gyro = gmag;
        sum_acc += amag;
    }
    float mean_acc = (sum_acc / MODEL_INPUT_SAMPLES) + 1e-6f;
    features[0] = max_acc;
    features[1] = mean_acc;
    features[3] = max_gyro;
    features[7] = max_acc / mean_acc;

    // Fill remaining feature slots
    for (int f = 0; f < MODEL_FEATURE_SIZE; f++) {
        if (f >= 10) features[f] = 0.0f;
    }

    // Layer 1
    float h1[16] = {0};
    for (int j = 0; j < 16; j++) {
        float sum = B1[j];
        for (int i = 0; i < MODEL_FEATURE_SIZE; i++) {
            sum += features[i] * W1[i][j];
        }
        h1[j] = relu_act(sum);
    }

    // Layer 2
    float h2[8] = {0};
    for (int j = 0; j < 8; j++) {
        float sum = B2[j];
        for (int i = 0; i < 16; i++) {
            sum += h1[i] * W2[i][j];
        }
        h2[j] = relu_act(sum);
    }

    // Layer 3 (Output)
    float out_val = B3[0];
    for (int i = 0; i < 8; i++) {
        out_val += h2[i] * W3[i][0];
    }
    return sigmoid_act(out_val);
}

#endif // FALL_DETECTION_MODEL_H
""")
        print(f"[ML] Exported C header model to {output_path}")
