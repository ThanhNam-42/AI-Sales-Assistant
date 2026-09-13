from app.summarizer import summarize_notes


def test_empty_notes():
    result = summarize_notes([])
    assert result["method"] == "none"
    assert "Chưa có" in result["summary"]


def test_rule_based_summary_and_next_action():
    notes = [
        "Khách quan tâm gói Enterprise, hẹn gọi lại thứ 5.",
        "Đã gửi báo giá, khách đang cân nhắc ngân sách nội bộ.",
    ]
    result = summarize_notes(notes)
    assert result["method"] == "rule_based"
    assert result["summary"]
    assert result["next_action"]


def test_next_action_detects_rejection():
    notes = ["Khách nói không có nhu cầu ở thời điểm hiện tại."]
    result = summarize_notes(notes)
    assert "chăm sóc dài hạn" in result["next_action"]
