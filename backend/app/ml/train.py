"""
Huấn luyện mô hình Lead Scoring (RandomForestClassifier) từ dữ liệu synthetic.
Lưu model đã train + danh sách feature vào backend/app/ml/model.pkl

Chạy: python -m app.ml.train  (từ thư mục backend/)
"""
from __future__ import annotations

import pathlib

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from app.ml.data_gen import generate_leads

MODEL_PATH = pathlib.Path(__file__).parent / "model.pkl"

NUMERIC_FEATURES = [
    "deal_size",
    "contact_frequency",
    "days_since_last_contact",
    "response_rate",
]
CATEGORICAL_FEATURES = ["industry", "source"]


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ],
        remainder="passthrough",
    )
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=6,
        random_state=42,
        class_weight="balanced",
    )
    pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", model)])
    return pipeline


def train_and_save(n_samples: int = 4000) -> dict:
    df = generate_leads(n_samples)
    X = df[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
    y = df["converted"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
    }

    joblib.dump(
        {
            "pipeline": pipeline,
            "categorical_features": CATEGORICAL_FEATURES,
            "numeric_features": NUMERIC_FEATURES,
            "metrics": metrics,
        },
        MODEL_PATH,
    )
    return metrics


if __name__ == "__main__":
    result = train_and_save()
    print("Model trained & saved to", MODEL_PATH)
    print("Metrics:", result)
