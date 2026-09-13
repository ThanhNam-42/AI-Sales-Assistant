"""
Module load model đã train và cung cấp hàm predict_score() dùng trong API.
Nếu model.pkl chưa tồn tại (lần chạy đầu tiên), tự động train trước khi load.
"""
from __future__ import annotations

import pathlib
from functools import lru_cache
from typing import Any

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = pathlib.Path(__file__).parent / "model.pkl"


@lru_cache(maxsize=1)
def _load_bundle() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        from app.ml.train import train_and_save

        train_and_save()
    return joblib.load(MODEL_PATH)


def get_model_metrics() -> dict:
    return _load_bundle()["metrics"]


def predict_score(lead: dict) -> dict:
    """
    lead: dict với các khoá industry, source, deal_size, contact_frequency,
          days_since_last_contact, response_rate
    Trả về: {"score": int 0-100, "top_factors": [str, ...]}
    """
    bundle = _load_bundle()
    pipeline = bundle["pipeline"]
    cat_features = bundle["categorical_features"]
    num_features = bundle["numeric_features"]

    row = pd.DataFrame([{**{f: lead.get(f) for f in cat_features + num_features}}])
    proba = pipeline.predict_proba(row)[0, 1]
    score = int(round(proba * 100))

    top_factors = _explain(lead, score)
    return {"score": score, "top_factors": top_factors}


def _explain(lead: dict, score: int) -> list[str]:
    """
    Giải thích đơn giản, dễ hiểu (không dùng SHAP để giữ dependency nhẹ),
    dựa trên các ngưỡng nghiệp vụ tương ứng với cách data được sinh ra.
    """
    factors = []
    if lead.get("contact_frequency", 0) >= 4:
        factors.append("Tần suất liên hệ gần đây cao")
    if lead.get("deal_size", 0) >= 8000:
        factors.append("Quy mô deal lớn")
    if lead.get("response_rate", 0) >= 0.6:
        factors.append("Tỉ lệ phản hồi của khách cao")
    if lead.get("source") == "Referral":
        factors.append("Lead đến từ nguồn Referral (độ tin cậy cao)")
    if lead.get("days_since_last_contact", 999) <= 7:
        factors.append("Mới liên hệ gần đây")
    if not factors:
        if lead.get("days_since_last_contact", 0) > 30:
            factors.append("Đã lâu không liên hệ, cần chăm sóc lại")
        else:
            factors.append("Chưa có yếu tố nổi bật, cần thêm dữ liệu tương tác")
    return factors[:3]


if __name__ == "__main__":
    sample = {
        "industry": "Tech",
        "source": "Referral",
        "deal_size": 12000,
        "contact_frequency": 5,
        "days_since_last_contact": 2,
        "response_rate": 0.8,
    }
    print(predict_score(sample))
