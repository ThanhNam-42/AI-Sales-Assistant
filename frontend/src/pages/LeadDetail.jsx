import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import ScoreBadge from "../components/ScoreBadge.jsx";
import LeadForm from "../components/LeadForm.jsx";

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
    setNotes(notesResp.data);
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

  if (!lead) return <p className="empty-state">Đang tải...</p>;

  return (
    <div className="page">
      <button className="btn-link" onClick={() => navigate("/")}>
        ‹ Quay lại
      </button>

      <header className="lead-header">
        <h1>
          {lead.name} <span className="lead-company">— {lead.company}</span>
        </h1>
        <div className="lead-header-actions">
          <span className="status-badge" data-status={lead.status}>
            {lead.status}
          </span>
          <ScoreBadge score={lead.score} />
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

      <section className="card">
        <h3>Yếu tố ảnh hưởng nhiều nhất</h3>
        <ul className="factor-list">
          {lead.top_factors.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h3>Ghi chú cuộc gọi</h3>
          <button
            className="btn-primary"
            onClick={handleSummarize}
            disabled={summarizing}
          >
            {summarizing ? "Đang tóm tắt..." : "Tóm tắt bằng AI"}
          </button>
        </div>

        <ul className="note-list">
          {notes.length === 0 && <li className="empty-state">Chưa có ghi chú nào.</li>}
          {notes.map((note) => (
            <li key={note.id}>
              <span className="note-date">
                {new Date(note.created_at).toLocaleDateString("vi-VN")}
              </span>
              <span>{note.content}</span>
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
