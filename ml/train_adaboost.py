from __future__ import annotations

import numpy as np
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier
from ml.preprocess import extract_statistical_features


class AdaBoostFallClassifier:
    """
    AdaBoost classifier operating on extracted statistical features.
    """

    def __init__(self, n_estimators: int = 50, learning_rate: float = 1.0):
        self.clf = AdaBoostClassifier(
            estimator=DecisionTreeClassifier(max_depth=2),
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            random_state=42,
        )

    def fit(self, X: np.ndarray, y: np.ndarray):
        features = extract_statistical_features(X)
        self.clf.fit(features, y)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        features = extract_statistical_features(X)
        return self.clf.predict_proba(features)[:, 1]

    def predict(self, X: np.ndarray) -> np.ndarray:
        features = extract_statistical_features(X)
        return self.clf.predict(features)
