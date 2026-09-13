from app.ml.predict import predict_score
from app.ml.train import train_and_save


def test_train_produces_reasonable_auc():
    metrics = train_and_save(n_samples=1500)
    assert metrics["roc_auc"] > 0.65


def test_predict_score_in_range():
    result = predict_score(
        {
            "industry": "Tech",
            "source": "Referral",
            "deal_size": 10000,
            "contact_frequency": 4,
            "days_since_last_contact": 3,
            "response_rate": 0.7,
        }
    )
    assert 0 <= result["score"] <= 100
    assert len(result["top_factors"]) > 0


def test_hot_lead_scores_higher_than_cold_lead():
    hot = predict_score(
        {
            "industry": "Tech",
            "source": "Referral",
            "deal_size": 15000,
            "contact_frequency": 6,
            "days_since_last_contact": 1,
            "response_rate": 0.9,
        }
    )
    cold = predict_score(
        {
            "industry": "Manufacturing",
            "source": "Cold Call",
            "deal_size": 200,
            "contact_frequency": 0,
            "days_since_last_contact": 58,
            "response_rate": 0.05,
        }
    )
    assert hot["score"] > cold["score"]
