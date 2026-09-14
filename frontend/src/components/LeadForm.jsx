import React, { useState } from "react";

const INDUSTRIES = ["Retail", "Finance", "Tech", "Manufacturing", "Education", "Healthcare"];
const SOURCES = ["Referral", "Cold Call", "Website", "Event", "Social Media"];
export const STATUSES = ["Mới", "Đang đàm phán", "Đã chốt", "Không quan tâm"];

const EMPTY_FORM = {
  name: "",
  company: "",
  industry: INDUSTRIES[0],
  source: SOURCES[0],
  deal_size: 5000,
  contact_frequency: 1,
  days_since_last_contact: 3,
  response_rate: 0.5,
  status: STATUSES[0],
};

export default function LeadForm({ initial, onCancel, onSubmit, submitting }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name,
          company: initial.company,
          industry: initial.industry,
          source: initial.source,
          deal_size: initial.deal_size,
          contact_frequency: initial.contact_frequency,
          days_since_last_contact: initial.days_since_last_contact,
          response_rate: initial.response_rate,
          status: initial.status,
        }
      : EMPTY_FORM
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      deal_size: Number(form.deal_size),
      contact_frequency: Number(form.contact_frequency),
      days_since_last_contact: Number(form.days_since_last_contact),
      response_rate: Number(form.response_rate),
    });
  }

  return (
    <div className="modal-overlay">
      <form className="modal-card" onSubmit={handleSubmit}>
        <h2>{isEdit ? "Chỉnh sửa lead" : "Thêm lead mới"}</h2>

        <label>
          Tên khách hàng
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>

        <label>
          Công ty
          <input
            required
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </label>

        <div className="form-row">
          <label>
            Ngành
            <select
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nguồn lead
            <select
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Quy mô deal ($)
            <input
              type="number"
              min="0"
              value={form.deal_size}
              onChange={(e) => update("deal_size", e.target.value)}
            />
          </label>
          <label>
            Số lần liên hệ (30 ngày qua)
            <input
              type="number"
              min="0"
              value={form.contact_frequency}
              onChange={(e) => update("contact_frequency", e.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Số ngày từ lần liên hệ cuối
            <input
              type="number"
              min="0"
              value={form.days_since_last_contact}
              onChange={(e) => update("days_since_last_contact", e.target.value)}
            />
          </label>
          <label>
            Tỉ lệ phản hồi (0-1)
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={form.response_rate}
              onChange={(e) => update("response_rate", e.target.value)}
            />
          </label>
        </div>

        <label>
          Trạng thái
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Huỷ
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? "Đang lưu..."
              : isEdit
              ? "Lưu thay đổi"
              : "Lưu & Chấm điểm"}
          </button>
        </div>
      </form>
    </div>
  );
}
