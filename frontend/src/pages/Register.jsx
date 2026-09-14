import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
      });
      localStorage.setItem("token", data.access_token);
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Tạo tài khoản</h1>
        <p className="subtitle">
          Đăng ký để có danh sách lead riêng, lưu lại theo tài khoản của bạn
        </p>

        <label>
          Họ tên
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>

        <p className="hint">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
