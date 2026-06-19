import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../api";

const RED = "#E8001C";

export default function LoginForm({ role, onForgotPassword }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { ...form, role, rememberMe });

      // If email not verified, redirect to verification
      if (data.needsVerification) {
        sessionStorage.setItem("verify_email", data.email);
        navigate("/verify-email");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("tokenExpiry", String(Date.now() + data.expiresIn));
      localStorage.removeItem("pa6_data"); // Clear any existing checklist data
      if (rememberMe) localStorage.setItem("rememberMe", "true");
      else localStorage.removeItem("rememberMe");
      navigate(`/${data.user.role}`);
    } catch (err) {
      // Handle unverified email from 403
      if (err.response?.data?.needsVerification) {
        sessionStorage.setItem("verify_email", err.response.data.email);
        navigate("/verify-email");
        return;
      }
      setError(err.response?.data?.message || "Unable to connect. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {role === "employee" && (
        <div style={S.badge}>🏢 Restricted — employee credentials only</div>
      )}

      <Field label="Email address" type="email" value={form.email}
        onChange={v => set("email", v)} placeholder="you@example.com" />

      <Field label="Password" type={show ? "text" : "password"} value={form.password}
        onChange={v => set("password", v)} placeholder="Enter your password" 
        rightElement={
          <button type="button" onClick={() => setShow(s => !s)} style={S.eye}>
            {show ? "🙈" : "👁"}
          </button>
        }
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: -4 }}>
        <label style={S.rememberRow}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={S.checkbox}
          />
          <span style={{ fontSize: 12, color: "#666" }}>Remember me</span>
        </label>
        {role === "customer" && (
          <button type="button" style={S.forgot} onClick={onForgotPassword}>Forgot password?</button>
        )}
      </div>

      {error && <div style={S.error}>{error}</div>}

      <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Field({ label, type, value, onChange, placeholder, rightElement }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...S.input, borderColor: focused ? RED : "#222", paddingRight: rightElement ? 40 : 13 }}
        />
        {rightElement}
      </div>
    </div>
  );
}

const S = {
  badge:  { background: "#1a0a0a", border: "1px solid #3a0a0a", padding: "7px 12px", fontSize: 11, color: RED, marginBottom: 14, letterSpacing: "0.3px", fontWeight: 600 },
  label:  { display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 },
  input:  { width: "100%", padding: "11px 13px", background: "#141414", border: "1.5px solid #222", color: "#fff", fontSize: 13.5, outline: "none", boxSizing: "border-box", fontFamily: "inherit", borderRadius: 0, transition: "border-color .2s" },
  eye:    { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#444" },
  forgot: { background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#555", padding: 0, textDecoration: "underline" },
  error:  { background: "#1a0505", border: `1px solid ${RED}`, color: "#ff6b6b", padding: "9px 13px", fontSize: 12, marginBottom: 14, borderRadius: 0 },
  btn:    { width: "100%", padding: "13px 0", background: RED, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer", display: "block", transition: "opacity .15s" },
  rememberRow: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer" },
  checkbox: { accentColor: RED, width: 14, height: 14, cursor: "pointer" },
};
