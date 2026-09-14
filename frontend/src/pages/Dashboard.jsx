import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { ScoreRing } from "../components/ScoreBadge.jsx";
import LeadForm, { INDUSTRIES, STATUSES } from "../components/LeadForm.jsx";
import { SearchIcon, PlusIcon, LogoutIcon } from "../components/icons.jsx";

const PAGE_SIZE = 20;

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industryFilter, setIndustryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const requestId = useRef(0);

  // Debounce ô tìm kiếm 350ms trước khi gửi lên server, tránh gọi API liên tục khi gõ.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function fetchPage(pageToLoad, { append } = {}) {
    const myRequest = ++requestId.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = { page: pageToLoad, page_size: PAGE_SIZE };
      if (industryFilter) params.industry = industryFilter;
      if (statusFilter) params.status_filter = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get("/leads", { params });
      if (myRequest !== requestId.current) return; // kết quả cũ, bỏ qua
      setTotal(data.total);
      setPage(data.page);
      setLeads((prev) => (append ? [...prev, ...data.items] : data.items));
    } finally {
      if (myRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  // Đổi filter/search -> nạp lại từ trang 1.
  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryFilter, statusFilter, search]);

  const hasMore = leads.length < total;

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await api.post("/leads", payload);
      setShowForm(false);
      await fetchPage(1);
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="pill-group">
          <button
            className={`pill${statusFilter === "" ? " active" : ""}`}
            onClick={() => setStatusFilter("")}
          >
            Tất cả
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`pill${statusFilter === s ? " active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          className="select-pill"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="">Tất cả ngành</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton-list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <p className="empty-state">
          {total === 0 && !search && !industryFilter && !statusFilter
            ? 'Chưa có lead nào. Bấm "Thêm lead" để bắt đầu.'
            : "Không tìm thấy lead phù hợp."}
        </p>
      ) : (
        <>
          <div className="lead-list">
            {leads.map((lead, idx) => (
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

          <div className="load-more-row">
            <span className="lead-count-hint">
              Đang hiển thị {leads.length}/{total} lead
            </span>
            {hasMore && (
              <button
                className="btn-secondary"
                onClick={() => fetchPage(page + 1, { append: true })}
                disabled={loadingMore}
              >
                {loadingMore ? "Đang tải..." : "Tải thêm"}
              </button>
            )}
          </div>
        </>
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
