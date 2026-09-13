import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import ScoreBadge from "../components/ScoreBadge.jsx";
import LeadForm from "../components/LeadForm.jsx";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  async function loadLeads() {
    setLoading(true);
    try {
      const params = {};
      if (industryFilter) params.industry = industryFilter;
      if (statusFilter) params.status_filter = statusFilter;
      const { data } = await api.get("/leads", { params });
      setLeads(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryFilter, statusFilter]);

  const industries = useMemo(
    () => Array.from(new Set(leads.map((l) => l.industry))).sort(),
    [leads]
  );
  const statuses = useMemo(
    () => Array.from(new Set(leads.map((l) => l.status))).sort(),
    [leads]
  );

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await api.post("/leads", payload);
      setShowForm(false);
      await loadLeads();
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>AI Sales Assistant</h1>
        <div className="topbar-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Thêm lead
          </button>
          <button className="btn-secondary" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="filters">
        <label>
          Ngành
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="empty-state">Đang tải...</p>
      ) : leads.length === 0 ? (
        <p className="empty-state">
          Chưa có lead nào. Bấm "Thêm lead" để bắt đầu.
        </p>
      ) : (
        <table className="lead-table">
          <thead>
            <tr>
              <th>Tên KH</th>
              <th>Công ty</th>
              <th>Ngành</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                <td>{lead.name}</td>
                <td>{lead.company}</td>
                <td>{lead.industry}</td>
                <td>
                  <ScoreBadge score={lead.score} />
                </td>
                <td>{lead.status}</td>
                <td className="row-arrow">›</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <LeadForm
          submitting={submitting}
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
