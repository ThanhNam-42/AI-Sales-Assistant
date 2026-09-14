import React, { useState } from "react";
import Field from "./Field.jsx";

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

function SelectField({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`field has-value${focused ? "" : ""}`}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <label>{label}</label>
    </div>
  );
}

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

        <Field
          label="Tên khách hàng"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />

        <Field
          label="Công ty"
          required
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
        />

        <div className="form-row">
          <SelectField
            label="Ngành"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            options={INDUSTRIES}
          />
          <SelectField
            label="Nguồn lead"
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
            options={SOURCES}
          />
        </div>

        <div className="form-row">
          <Field
            label="Quy mô deal ($)"
            type="number"
            min="0"
            value={form.deal_size}
            onChange={(e) => update("deal_size", e.target.value)}
          />
          <Field
            label="Số lần liên hệ (30 ngày qua)"
            type="number"
            min="0"
            value={form.contact_frequency}
            onChange={(e) => update("contact_frequency", e.target.value)}
          />
        </div>

        <div className="form-row">
          <Field
            label="Số ngày từ lần liên hệ cuối"
            type="number"
            min="0"
            value={form.days_since_last_contact}
            onChange={(e) => update("days_since_last_contact", e.target.value)}
          />
          <Field
            label="Tỉ lệ phản hồi (0-1)"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={form.response_rate}
            onChange={(e) => update("response_rate", e.target.value)}
          />
        </div>

        <SelectField
          label="Trạng thái"
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
          options={STATUSES}
        />

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
