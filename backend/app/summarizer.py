"""
Module tóm tắt ghi chú cuộc gọi (call notes summarization).

Mặc định dùng thuật toán extractive summarization tự viết (không phụ thuộc
model nặng / API trả phí) để dự án chạy được ngay cả khi không có API key.

Nếu biến môi trường OPENAI_API_KEY được set, chuyển sang dùng OpenAI API
để có bản tóm tắt tự nhiên hơn (fallback về rule-based nếu gọi API lỗi).
"""
from __future__ import annotations

import os
import re
from collections import Counter

STOPWORDS_VI = {
    "và", "là", "của", "có", "cho", "được", "này", "đã", "khách", "hàng",
    "sẽ", "với", "một", "các", "để", "ra", "về", "khi", "thì", "đang",
    "không", "còn", "nên", "rất", "trong", "vào", "ở", "the", "a", "an",
    "to", "of", "and", "is", "are", "in", "on", "for",
}


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?…])\s+|\n+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _extractive_summary(notes: list[str], max_sentences: int = 2) -> str:
    full_text = " ".join(notes)
    sentences = _split_sentences(full_text)
    if not sentences:
        return "Chưa có đủ nội dung để tóm tắt."
    if len(sentences) <= max_sentences:
        return " ".join(sentences)

    words = re.findall(r"[\wÀ-ỹ]+", full_text.lower())
    freq = Counter(w for w in words if w not in STOPWORDS_VI and len(w) > 1)

    scored = []
    for idx, sent in enumerate(sentences):
        sent_words = re.findall(r"[\wÀ-ỹ]+", sent.lower())
        score = sum(freq.get(w, 0) for w in sent_words)
        # ưu tiên nhẹ các câu gần cuối (thường là cập nhật mới nhất)
        score += idx * 0.5
        scored.append((score, idx, sent))

    top = sorted(scored, key=lambda x: x[0], reverse=True)[:max_sentences]
    top_sorted_by_position = sorted(top, key=lambda x: x[1])
    return " ".join(s for _, _, s in top_sorted_by_position)


def _suggest_next_action(notes: list[str]) -> str:
    text = " ".join(notes).lower()
    if any(k in text for k in ["báo giá", "ngân sách", "duyệt"]):
        return "Theo dõi tiến độ duyệt ngân sách, gọi lại để chốt báo giá."
    if any(k in text for k in ["hẹn gọi lại", "gọi lại", "callback"]):
        return "Gọi lại đúng lịch hẹn với khách hàng."
    if any(k in text for k in ["không quan tâm", "từ chối", "không có nhu cầu"]):
        return "Đưa lead vào danh sách chăm sóc dài hạn (nurture), giảm tần suất liên hệ."
    if any(k in text for k in ["quan tâm", "muốn dùng thử", "demo"]):
        return "Sắp xếp buổi demo/dùng thử sản phẩm trong tuần này."
    return "Tiếp tục theo dõi và liên hệ theo chu kỳ chăm sóc tiêu chuẩn."


def _try_openai_summary(notes: list[str]) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        joined = "\n".join(f"- {n}" for n in notes)
        prompt = (
            "Bạn là trợ lý sales. Tóm tắt các ghi chú cuộc gọi sau thành "
            "2-3 câu ngắn gọn bằng tiếng Việt, và đề xuất 1 hành động tiếp theo:\n"
            f"{joined}"
        )
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        # Fallback im lặng về rule-based nếu API lỗi/timeout/hết quota
        return None


def summarize_notes(notes: list[str]) -> dict:
    if not notes:
        return {
            "summary": "Chưa có ghi chú nào cho lead này.",
            "next_action": "Liên hệ lần đầu để thu thập thông tin.",
            "method": "none",
        }

    llm_summary = _try_openai_summary(notes)
    if llm_summary:
        return {"summary": llm_summary, "next_action": None, "method": "openai"}

    return {
        "summary": _extractive_summary(notes),
        "next_action": _suggest_next_action(notes),
        "method": "rule_based",
    }
