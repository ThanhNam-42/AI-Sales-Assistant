import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import { ScoreRing } from "../components/ScoreBadge.jsx";
import LeadForm from "../components/LeadForm.jsx";
import { ChevronLeftIcon, SparklesIcon } from "../components/icons.jsx";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    const [leadResp, notesResp] = await Promise.all([
      api.get(`/leads/${id}`),
      api.get(`/leads/${id}/notes`),
    ]);
    setLead(leadResp.data);
    setNotes(Array.isArray(notesResp.data) ? notesResp.data : []);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/leads/${id}/notes`, { content: newNote });
      setNewNote("");
      await loadAll();
    } finally {
      setAddingNote(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const { data } = await api.post(`/leads/${id}/summarize`);
      setSummary(data);
    } finally {
      setSummarizing(false);
    }
  }

  async function handleEdit(payload) {
    setEditSubmitting(true);
    try {
      await api.put(`/leads/${id}`, payload);
      setShowEditForm(false);
      await loadAll();
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Xoá lead này? Hành động không thể hoàn tác.")) return;
    setDeleting(true);
    try {
      await api.delete(`/leads/${id}`);
      navigate("/");
    } finally {
      setDeleting(false);
    }
  }

  if (!lead) {
    return (
      <div className="page">
        <div className="skeleton skeleton-row" style={{ height: 40, width: 120, marginBottom: 20 }} />
        <div className="skeleton skeleton-row" style={{ height: 120, marginBottom: 18 }} />
        <div className="skeleton skeleton-row" style={{ height: 180 }} />
      </div>
    );
  }

  return (
    <div className="page">
      <button className="btn-link" onClick={() => navigate("/")}>
        <ChevronLeftIcon /> Quay lại
      </button>

      <header className="lead-header">
        <h1>
          {lead.name} <span className="lead-company">— {lead.company}</span>
        </h1>
        <div className="lead-header-actions">
          <span className="status-badge" data-status={lead.status}>
            {lead.status}
          </span>
        </div>
      </header>

      <div className="lead-actions-row">
        <button className="btn-secondary" onClick={() => setShowEditForm(true)}>
          Sửa
        </button>
        <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Đang xoá..." : "Xoá lead"}
        </button>
      </div>

      <section className="card hero-card">
        <ScoreRing score={lead.score} size="lg" />
        <div>
          <div className="hero-score-num">{lead.score}/100</div>
          <div className="hero-score-label">Điểm ưu tiên chốt đơn</div>
        </div>
        <ul className="factor-list" style={{ flex: 1, minWidth: 200 }}>
          {lead.top_factors.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h3>Ghi chú cuộc gọi</h3>
          <button
            className={`btn-primary btn-ai${summarizing ? " loading" : ""}`}
            onClick={handleSummarize}
            disabled={summarizing}
          >
            <SparklesIcon /> {summarizing ? "Đang tóm tắt..." : "Tóm tắt bằng AI"}
          </button>
        </div>

        <ul className="timeline">
          {notes.length === 0 && <li className="empty-state">Chưa có ghi chú nào.</li>}
          {notes.map((note) => (
            <li key={note.id}>
              <span className="note-date">
                {new Date(note.created_at).toLocaleDateString("vi-VN")}
              </span>
              <span className="note-content">{note.content}</span>
            </li>
          ))}
        </ul>

        <form className="note-form" onSubmit={handleAddNote}>
          <input
            placeholder="Thêm ghi chú mới..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button type="submit" disabled={addingNote}>
            Gửi
          </button>
        </form>

        {summary && (
          <div className="summary-box">
            <strong>Tóm tắt AI:</strong> {summary.summary}
            {summary.next_action && (
              <p className="next-action">
                <strong>Đề xuất:</strong> {summary.next_action}
              </p>
            )}
          </div>
        )}
      </section>

      {showEditForm && (
        <LeadForm
          initial={lead}
          submitting={editSubmitting}
          onCancel={() => setShowEditForm(false)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
