import React from "react";

// Bọc ngoài toàn bộ app: nếu có lỗi JS không lường trước ở bất kỳ trang nào,
// hiển thị màn hình báo lỗi thân thiện thay vì trang trắng hoàn toàn.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <div className="empty-state">
            <p style={{ marginBottom: 16, fontWeight: 700 }}>
              Đã có lỗi xảy ra khi hiển thị trang.
            </p>
            <button
              className="btn-primary"
              style={{ width: "auto", margin: "0 auto" }}
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
