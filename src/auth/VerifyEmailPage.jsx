import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../api";
import logo from "../assets/images/POLYCOML_LOGO.png";

const RED = "#E8001C";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [email] = useState(() => sessionStorage.getItem("verify_email") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/auth");
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      refs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/verify-email`, { email, otp: code });
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("tokenExpiry", String(Date.now() + data.expiresIn));
      localStorage.removeItem("pa6_data");
      sessionStorage.removeItem("verify_email");
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(""); setMsg("");
    try {
      const { data } = await axios.post(`${API_URL}/auth/resend-otp`, { email });
      setMsg(data.message);
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend. Please try again.");
    }
  };

  return (
    <div style={S.root}>
      <div style={S.gridOverlay} />
      <div style={S.card}>
        <img src={logo} alt="Polycom Innovation" style={S.logo} />
        <div style={S.title}>Verify Your Email</div>
        <p style={S.sub}>
          We've sent a 6-digit code to <strong style={{ color: "#fff" }}>{email}</strong>
        </p>

        <div className="otp-row" style={S.otpRow} onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="otp-input"
              style={{ ...S.otpInput, borderColor: d ? RED : "#222" }}
            />
          ))}
        </div>

        {error && <div style={S.error}>{error}</div>}
        {msg && <div style={S.success}>{msg}</div>}

        <button onClick={handleVerify} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div style={S.resendRow}>
          <span style={{ color: "#555" }}>Didn't receive the code?</span>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{ ...S.resendBtn, opacity: resendCooldown > 0 ? 0.5 : 1 }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </div>

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
  sub: { fontSize: 13, color: "#666", marginBottom: 28, lineHeight: 1.6 },
  otpRow: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 },
  otpInput: {
    width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 800,
    background: "#111", border: "1.5px solid #222", color: "#fff", outline: "none",
    fontFamily: "inherit", transition: "border-color .2s",
  },
  error: { background: "#1a0505", border: `1px solid ${RED}`, color: "#ff6b6b", padding: "9px 13px", fontSize: 12, marginBottom: 14 },
  success: { background: "#001a0a", border: "1px solid #00c853", color: "#00c853", padding: "9px 13px", fontSize: 12, marginBottom: 14 },
  btn: {
    width: "100%", padding: "14px 0", background: RED, color: "#fff", border: "none",
    fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "opacity .15s", marginBottom: 20,
  },
  resendRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, fontSize: 12 },
  resendBtn: { background: "none", border: "none", color: RED, fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 },
  backBtn: { background: "none", border: "1px solid #1e1e1e", color: "#555", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "8px 20px", width: "100%" },
};
