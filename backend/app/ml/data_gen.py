"""
Sinh dữ liệu lead tổng hợp (synthetic) mô phỏng hành vi sales thực tế,
dùng để train mô hình lead-scoring khi chưa có dữ liệu doanh nghiệp thật.

Quy tắc mô phỏng (heuristic, có nhiễu ngẫu nhiên) được thiết kế dựa trên
kinh nghiệm sales thực tế: deal lớn + liên hệ gần đây + nguồn referral
+ tần suất liên hệ cao => xác suất chốt cao hơn.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

INDUSTRIES = ["Retail", "Finance", "Tech", "Manufacturing", "Education", "Healthcare"]
SOURCES = ["Referral", "Cold Call", "Website", "Event", "Social Media"]

RNG = np.random.default_rng(42)


def generate_leads(n: int = 2000) -> pd.DataFrame:
    industry = RNG.choice(INDUSTRIES, size=n)
    source = RNG.choice(SOURCES, size=n, p=[0.25, 0.2, 0.25, 0.15, 0.15])
    deal_size = RNG.gamma(shape=2.0, scale=5000, size=n).round(0)
    contact_frequency = RNG.poisson(lam=3, size=n)  # số lần liên hệ trong 30 ngày qua
    days_since_last_contact = RNG.integers(0, 60, size=n)
    response_rate = RNG.uniform(0, 1, size=n)  # tỉ lệ khách phản hồi khi được liên hệ

    source_weight = {
        "Referral": 0.35,
        "Event": 0.2,
        "Website": 0.1,
        "Cold Call": -0.15,
        "Social Media": 0.0,
    }
    industry_weight = {
        "Tech": 0.1,
        "Finance": 0.15,
        "Retail": 0.0,
        "Manufacturing": -0.05,
        "Education": -0.05,
        "Healthcare": 0.1,
    }

    # Điểm logit tổng hợp từ các yếu tố, dùng hàm sigmoid để ra xác suất chốt đơn
    logit = (
        -1.8
        + 0.00008 * deal_size
        + 0.35 * contact_frequency
        - 0.05 * days_since_last_contact
        + 2.6 * response_rate
        + 1.5 * np.array([source_weight[s] for s in source])
        + 1.5 * np.array([industry_weight[i] for i in industry])
        + RNG.normal(0, 0.35, size=n)  # nhiễu ngẫu nhiên (giảm để tín hiệu rõ hơn)
    )
    prob = 1 / (1 + np.exp(-logit))
    converted = RNG.binomial(1, prob)

    df = pd.DataFrame(
        {
            "industry": industry,
            "source": source,
            "deal_size": deal_size,
            "contact_frequency": contact_frequency,
            "days_since_last_contact": days_since_last_contact,
            "response_rate": response_rate.round(2),
            "converted": converted,
        }
    )
    return df


if __name__ == "__main__":
    data = generate_leads()
    print(data.head())
    print("Tỉ lệ chốt đơn (conversion rate):", data["converted"].mean())
