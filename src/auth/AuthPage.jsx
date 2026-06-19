import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import API_URL from "../api";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import logo from "../assets/images/POLYCOML_LOGO.png";

const RED = "#E8001C";

/* ── Forgot Password Modal ──────────────────────────────────────────────── */
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset email. Try again.");
    }
    setLoading(false);
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={FM.overlay}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        style={FM.card}
      >
        <button onClick={onClose} style={FM.closeBtn}>✕</button>

        {sent ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <div style={FM.title}>Check Your Email</div>
            <p style={FM.sub}>
              We've sent a password reset link to <strong style={{ color: "#fff" }}>{email}</strong>.
              Check your inbox (and spam folder).
            </p>
            <button onClick={onClose} style={FM.btn}>Done</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <div style={FM.title}>Forgot Password?</div>
            <p style={FM.sub}>Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14, textAlign: "left" }}>
                <label style={FM.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={FM.input}
                  autoFocus
                />
              </div>
              {error && <div style={FM.error}>{error}</div>}
              <button type="submit" disabled={loading} style={{ ...FM.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

const FM = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  card: {
    background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "36px 32px",
    maxWidth: 420, width: "100%", textAlign: "center", position: "relative",
  },
  closeBtn: {
    position: "absolute", top: 12, right: 14, background: "none", border: "none",
    color: "#555", fontSize: 16, cursor: "pointer",
  },
  title: { fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 },
  sub: { fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.6 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 13px", background: "#141414", border: "1.5px solid #222",
    color: "#fff", fontSize: 13.5, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color .2s",
  },
  error: { background: "#1a0505", border: `1px solid ${RED}`, color: "#ff6b6b", padding: "9px 13px", fontSize: 12, marginBottom: 14, textAlign: "left" },
  btn: {
    width: "100%", padding: "13px 0", background: RED, color: "#fff", border: "none",
    fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "opacity .15s",
  },
};

/* ── Brand Panel (desktop left/right) ───────────────────────────────────── */
function BrandPanel({ mode, onSwitch }) {
  return (
    <div style={S.brand}>
      <div style={S.gridOverlay} />
      <div style={S.brandInner}>
        <div>
          <img src={logo} alt="Polycom Innovation" style={S.logoImg} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.tagline}>DESIGNED FOR PERFORMANCE. ENGINEERED TO LAST.</div>
          <div style={S.heroH1}>
            <span style={{ color: "#fff" }}>ADVANCED</span><br />
            <span style={{ color: RED }}>POLYMER</span><br />
            <span style={{ color: "#fff" }}>ENGINEERING</span>
          </div>
        </div>
        <div style={S.statsGrid}>
          {[["350+","Customized Formulations"],["24/7","Operational Capability"],["17+","Years Experience"],["120+","Trusted Clients Globally"]].map(([n, l]) => (
            <div key={n} style={S.statBox}>
              <div style={S.statNum}>{n}</div>
              <div style={S.statLabel}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <div style={{ color: "#444", fontSize: 12, marginBottom: 10 }}>
            {mode === "login" ? "New to Polycom?" : "Already have an account?"}
          </div>
          <button onClick={onSwitch} style={S.switchCta}>
            {mode === "login" ? "Create an account →" : "← Back to Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Form Panel (desktop right/left) ────────────────────────────────────── */
function FormPanel({ mode, role, setRole, onSwitch, onForgotPassword }) {
  return (
    <div style={S.formPanel}>
      <div style={S.formInner}>
        <div style={{ marginBottom: 24 }}>
          <div style={S.formTitle}>
            {mode === "login"
              ? (role === "customer" ? "Welcome back" : "Employee Portal")
              : "Create your account"}
          </div>
          <div style={S.formSub}>
            {mode === "login"
              ? "Sign in to your Polycom account"
              : "Fill in your details to get started. (For Customers Only)"}
          </div>
        </div>
        {mode === "login" && (
          <div style={S.roleRow}>
            {[["customer", "👤 Customer"], ["employee", "🏢 Employee"]].map(([r, label]) => (
              <button key={r} onClick={() => setRole(r)} style={{
                ...S.roleBtn,
                background: role === r ? RED : "transparent",
                color: role === r ? "#fff" : "#555",
                border: `1.5px solid ${role === r ? RED : "#222"}`,
              }}>{label}</button>
            ))}
          </div>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode + role}
            initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: "100%" }}
          >
            {mode === "login"
              ? <LoginForm role={role} onForgotPassword={onForgotPassword} />
              : <SignupForm role="customer" />}
          </motion.div>
        </AnimatePresence>
        <p style={S.switchRow}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button style={S.switchLink} onClick={onSwitch}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── Sparkle particles (mobile only) ────────────────────────────────────── */
function Sparkles() {
  const particles = useMemo(() => {
    // Theme-matched colors: deep reds, crimson glows, subtle warm whites
    const colors = [
      "rgba(232,0,28,0.6)",   // brand red
      "rgba(180,0,20,0.5)",   // deep crimson
      "rgba(255,60,60,0.35)", // soft red
      "rgba(255,255,255,0.2)",// faint white
      "rgba(232,0,28,0.35)",  // muted red
      "rgba(255,120,100,0.3)",// warm coral
    ];
    // Bottom-rising particles
    const rising = Array.from({ length: 14 }, (_, i) => ({
      id: `r${i}`,
      left: `${Math.random() * 100}%`,
      bottom: `${-5 - Math.random() * 15}%`,
      size: 2 + Math.random() * 4,
      color: colors[i % colors.length],
      duration: 7 + Math.random() * 10,
      delay: Math.random() * 8,
      pulseDuration: 1.5 + Math.random() * 2,
      direction: "up",
    }));
    // Top-falling particles
    const falling = Array.from({ length: 10 }, (_, i) => ({
      id: `f${i}`,
      left: `${Math.random() * 100}%`,
      top: `${-5 - Math.random() * 10}%`,
      size: 1.5 + Math.random() * 3,
      color: colors[(i + 2) % colors.length],
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      pulseDuration: 2 + Math.random() * 2,
      direction: "down",
    }));
    return [...rising, ...falling];
  }, []);
  return (
    <div className="auth-sparkles">
      {particles.map(p => (
        <div key={p.id} className={`spark ${p.direction === "down" ? "spark-fall" : ""}`} style={{
          left: p.left,
          ...(p.direction === "up" ? { bottom: p.bottom } : { top: p.top }),
          width: p.size, height: p.size,
          background: p.color,
          animationDuration: `${p.duration}s, ${p.pulseDuration}s`,
          animationDelay: `${p.delay}s, ${p.delay * 0.5}s`,
        }} />
      ))}
    </div>
  );
}

/* ── Mobile-only single-screen layout ───────────────────────────────────── */
function MobileLayout({ mode, role, setRole, toggle, onForgotPassword }) {
  return (
    <div style={SM.root}>
      <Sparkles />
      <div style={SM.gridOverlay} />

      <div style={SM.centerWrap}>
        {/* Top: logo + brand info */}
        <div style={SM.top}>
          <img src={logo} alt="Polycom Innovation" style={SM.logoImg} />
          <div style={SM.tagline}>DESIGNED FOR PERFORMANCE. ENGINEERED TO LAST.</div>
          <div style={SM.heroText}>
            <span style={{ color: "#fff" }}>ADVANCED </span>
            <span style={{ color: RED }}>POLYMER </span>
            <span style={{ color: "#fff" }}>ENGINEERING</span>
          </div>
        </div>

        {/* Sign In / Sign Up tabs */}
        <div style={SM.tabs}>
          {[["login", "Sign In"], ["signup", "Sign Up"]].map(([m, label]) => (
            <button key={m} onClick={() => toggle(m)} style={{
              ...SM.tab,
              background: mode === m ? RED : "transparent",
              color: mode === m ? "#fff" : "#555",
              borderBottom: `2px solid ${mode === m ? RED : "transparent"}`,
            }}>{label}</button>
          ))}
        </div>

        {/* Role selector (login only) */}
        {mode === "login" && (
          <div style={SM.roleRow}>
            {[["customer", "👤 Customer"], ["employee", "🏢 Employee"]].map(([r, label]) => (
              <button key={r} onClick={() => setRole(r)} style={{
                ...SM.roleBtn,
                background: role === r ? RED : "transparent",
                color: role === r ? "#fff" : "#555",
                border: `1.5px solid ${role === r ? RED : "#222"}`,
              }}>{label}</button>
            ))}
          </div>
        )}

        {/* Form */}
        <div style={SM.formWrap}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode + (mode === "signup" ? "customer" : role)}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              style={{ width: "100%" }}
            >
              {mode === "login"
                ? <LoginForm role={role} onForgotPassword={onForgotPassword} />
                : <SignupForm role="customer" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");
  const [showForgot, setShowForgot] = useState(false);

  const toggle = (m) => {
    const nextMode = typeof m === "string" ? m : (mode === "login" ? "signup" : "login");
    setMode(nextMode);
    if (nextMode === "signup") {
      setRole("customer");
    }
  };
  const spring = { type: "spring", stiffness: 320, damping: 32 };

  return (
    <>
      {/* ── Desktop / Tablet (≥ 769px): sliding panels ── */}
      <div style={S.root} className="auth-desktop">
        <motion.div layout transition={spring} style={{
          position: "absolute", top: 0, bottom: 0, width: "50%",
          left: mode === "login" ? "0%" : "50%", zIndex: 2, overflow: "hidden",
        }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={"brand-" + mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ width: "100%", height: "100%" }}>
              <BrandPanel mode={mode} onSwitch={() => toggle()} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div layout transition={spring} style={{
          position: "absolute", top: 0, bottom: 0, width: "50%",
          left: mode === "login" ? "50%" : "0%", zIndex: 2, overflow: "hidden",
        }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={"form-" + mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ width: "100%", height: "100%" }}>
              <FormPanel mode={mode} role={role} setRole={setRole} onSwitch={() => toggle()} onForgotPassword={() => setShowForgot(true)} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Mobile (≤ 768px): single compact screen ── */}
      <div className="auth-mobile">
        <MobileLayout mode={mode} role={role} setRole={setRole} toggle={toggle} onForgotPassword={() => setShowForgot(true)} />
      </div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ── Desktop styles ─────────────────────────────────────────────────────── */
const S = {
  root: {
    position: "relative", height: "100vh", width: "100vw",
    overflow: "hidden", background: "#0a0a0a",
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  },
  brand: {
    width: "100%", height: "100%", background: "#0d0d0d",
    position: "relative", display: "flex", flexDirection: "column",
    overflow: "hidden", borderRight: "1px solid #1a1a1a",
  },
  gridOverlay: {
    position: "absolute", inset: 0, zIndex: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
  },
  brandInner: {
    position: "relative", zIndex: 1, padding: "32px 44px",
    display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box",
  },
  logoImg: { height: 100, width: 240, objectFit: "cover", objectPosition: "center center", display: "block" },
  tagline: { color: "#333", fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 },
  heroH1: { fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-1px" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, border: "1px solid #1a1a1a" },
  statBox: { padding: "14px 16px", borderRight: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" },
  statNum: { color: RED, fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" },
  statLabel: { color: "#444", fontSize: 10, marginTop: 3, letterSpacing: "0.3px" },
  switchCta: {
    background: "transparent", border: `1.5px solid ${RED}`, color: RED,
    cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "10px 0", width: "100%",
  },
  formPanel: {
    width: "100%", height: "100%", background: "#0f0f0f",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    overflowY: "auto", overflowX: "hidden", padding: "32px 24px", boxSizing: "border-box",
  },
  formInner: { width: "100%", maxWidth: 400, margin: "auto", display: "flex", flexDirection: "column", paddingTop: 16, paddingBottom: 16 },
  formTitle: { fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 4 },
  formSub: { fontSize: 13, color: "#555" },
  roleRow: { display: "flex", gap: 8, marginBottom: 20 },
  roleBtn: { flex: 1, padding: "9px 0", cursor: "pointer", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", transition: "all .2s" },
  switchRow: { fontSize: 13, color: "#555", textAlign: "center", marginTop: 16 },
  switchLink: { background: "none", border: "none", cursor: "pointer", color: RED, fontWeight: 700, fontSize: 13, textDecoration: "underline", padding: 0 },
};

/* ── Mobile styles ──────────────────────────────────────────────────────── */
const SM = {
  root: {
    minHeight: "100vh", width: "100vw", background: "#0a0a0a",
    fontFamily: "'Inter',-apple-system,sans-serif",
    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
    position: "relative", overflowX: "hidden",
  },
  gridOverlay: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
    backgroundSize: "32px 32px",
  },
  centerWrap: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: "100%",
    display: "flex", flexDirection: "column",
    padding: "24px 0", boxSizing: "border-box",
  },
  top: {
    position: "relative", zIndex: 1,
    background: "#0d0d0d", borderBottom: "1px solid #1a1a1a",
    padding: "20px 20px 16px", textAlign: "center", width: "100%", boxSizing: "border-box",
  },
  logoImg: { height: 100, width: "auto", maxWidth: "80%", objectFit: "contain", display: "block", margin: "0 auto 12px" },
  tagline: { color: "#444", fontSize: 9, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 },
  heroText: { fontSize: 24, fontWeight: 900, lineHeight: 1.25, letterSpacing: "-0.5px" },
  tabs: {
    position: "relative", zIndex: 1,
    display: "flex", background: "#0d0d0d",
    borderBottom: "1px solid #1a1a1a", width: "100%", boxSizing: "border-box",
  },
  tab: {
    flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 700, letterSpacing: "0.5px", transition: "all .2s",
  },
  roleRow: {
    position: "relative", zIndex: 1,
    display: "flex", gap: 8, padding: "12px 0px",
    background: "#0a0a0a", borderBottom: "1px solid #111", width: "100%", boxSizing: "border-box",
  },
  roleBtn: {
    flex: 1, padding: "8px 0", cursor: "pointer",
    fontSize: 12, fontWeight: 600, transition: "all .2s",
  },
  formWrap: {
    position: "relative", zIndex: 1,
    padding: "16px 0px 24px", background: "#0a0a0a", width: "100%", boxSizing: "border-box",
  },
};
