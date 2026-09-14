import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { ScoreRing } from "../components/ScoreBadge.jsx";
import LeadForm from "../components/LeadForm.jsx";
import { SearchIcon, PlusIcon, LogoutIcon } from "../components/icons.jsx";

const AVATAR_COLORS = [
  "#4f46e5",
  "#0891b2",
  "#db2777",
  "#d97706",
  "#16a34a",
  "#7c3aed",
  "#dc2626",
  "#0d9488",
];

function avatarColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
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

  const visibleLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.trim().toLowerCase();
    return leads.filter(
      (l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)
    );
  }, [leads, search]);

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
            <PlusIcon /> Thêm lead
          </button>
          <button className="btn-secondary" onClick={handleLogout}>
            <LogoutIcon /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <SearchIcon />
          <input
            placeholder="Tìm theo tên hoặc công ty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {statuses.length > 0 && (
          <div className="pill-group">
            <button
              className={`pill${statusFilter === "" ? " active" : ""}`}
              onClick={() => setStatusFilter("")}
            >
              Tất cả
            </button>
            {statuses.map((s) => (
              <button
                key={s}
                className={`pill${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {industries.length > 0 && (
          <select
            className="select-pill"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="">Tất cả ngành</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="skeleton-list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : visibleLeads.length === 0 ? (
        <p className="empty-state">
          {leads.length === 0
            ? 'Chưa có lead nào. Bấm "Thêm lead" để bắt đầu.'
            : "Không tìm thấy lead phù hợp."}
        </p>
      ) : (
        <div className="lead-list">
          {visibleLeads.map((lead, idx) => (
            <div
              key={lead.id}
              className="lead-row"
              style={{ animationDelay: `${Math.min(idx, 8) * 0.03}s` }}
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <div
                className="lead-avatar"
                style={{ background: avatarColor(lead.industry || lead.name) }}
              >
                {initials(lead.name)}
              </div>
              <div className="lead-row-main">
                <div className="lead-row-name">
                  {lead.name}
                  <span className="status-badge" data-status={lead.status}>
                    {lead.status}
                  </span>
                </div>
                <div className="lead-row-sub">{lead.company}</div>
              </div>
              <div className="lead-row-meta">
                <span className="lead-row-industry">{lead.industry}</span>
                <ScoreRing score={lead.score} />
                <span className="row-arrow">›</span>
              </div>
            </div>
          ))}
        </div>
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
