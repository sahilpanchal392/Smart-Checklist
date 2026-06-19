import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../api";
import logo from "../assets/images/POLYCOML_LOGO.png";

const RED = "#E8001C";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pw = form.password;
  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 4 : 3;
  const strColors = ["", RED, "#ff6b00", "#f0c000", "#00c853"];
  const strLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Invalid reset link. No token found."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please try again.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div style={S.root}>
        <div style={S.gridOverlay} />
        <div style={S.card}>
          <img src={logo} alt="Polycom Innovation" style={S.logo} />
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={S.title}>Invalid Reset Link</div>
          <p style={S.sub}>This password reset link is invalid or has expired.</p>
          <button onClick={() => navigate("/auth")} style={S.btn}>Go to Sign In</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={S.root}>
        <div style={S.gridOverlay} />
        <div style={S.card}>
          <img src={logo} alt="Polycom Innovation" style={S.logo} />
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={S.title}>Password Reset!</div>
          <p style={S.sub}>Your password has been reset successfully. You can now sign in with your new password.</p>
          <button onClick={() => navigate("/auth")} style={S.btn}>Go to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.gridOverlay} />
      <div style={S.card}>
        <img src={logo} alt="Polycom Innovation" style={S.logo} />
        <div style={S.title}>Reset Password</div>
        <p style={S.sub}>Enter your new password below.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14, textAlign: "left" }}>
            <label style={S.label}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 characters"
                style={S.input}
              />
              <button type="button" onClick={() => setShow(s => !s)} style={S.eye}>
                {show ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {pw.length > 0 && (
            <div style={{ marginBottom: 14, textAlign: "left" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, background: i <= strength ? strColors[strength] : "#1e1e1e", borderRadius: 2, transition: "background .3s" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: strColors[strength], fontWeight: 600, marginTop: 4 }}>
                Password strength: {strLabels[strength]}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14, textAlign: "left" }}>
            <label style={S.label}>Confirm New Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat password"
              style={S.input}
            />
          </div>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <button onClick={() => navigate("/auth")} style={S.backBtn}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: "100vh", background: "#0a0a0a", display: "flex",
    alignItems: "center", justifyContent: "center", padding: 16, position: "relative",
    fontFamily: "'Inter',-apple-system,sans-serif",
  },
  gridOverlay: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
    backgroundSize: "32px 32px",
  },
  card: {
    position: "relative", zIndex: 1, background: "#0d0d0d", border: "1px solid #1a1a1a",
    padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center",
  },
  logo: { height: 50, objectFit: "contain", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.3px" },
  sub: { fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.6 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 13px", background: "#141414", border: "1.5px solid #222",
    color: "#fff", fontSize: 13.5, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color .2s",
  },
  eye: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#444" },
  error: { background: "#1a0505", border: `1px solid ${RED}`, color: "#ff6b6b", padding: "9px 13px", fontSize: 12, marginBottom: 14, textAlign: "left" },
  btn: {
    width: "100%", padding: "14px 0", background: RED, color: "#fff", border: "none",
    fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "opacity .15s", marginBottom: 16,
  },
  backBtn: {
    background: "none", border: "1px solid #1e1e1e", color: "#555", cursor: "pointer",
    fontSize: 12, fontWeight: 600, padding: "8px 20px", width: "100%",
  },
};
