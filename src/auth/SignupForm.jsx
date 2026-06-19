import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import API_URL from "../api";

const RED = "#E8001C";

// Resize + compress to max 300x300, JPEG 70% — keeps base64 under ~80KB
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 300;
      let { width, height } = img;
      if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; } }
      else { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; } }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = url;
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", company: "", phone: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState("");
  const fileRef = useRef();
  const navigate = useNavigate();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setAvatar(compressed);
  };

  const pw = form.password;
  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 4 : 3;
  const strColors = ["", RED, "#ff6b00", "#f0c000", "#00c853"];
  const strLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!form.name.trim()) { setError("Full name is required."); return; }
    if (form.name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (!form.email.trim()) { setError("Email address is required."); return; }
    if (!EMAIL_RE.test(form.email)) { setError("Please enter a valid email address."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (!form.company.trim()) { setError("Company name is required."); return; }

    setLoading(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), password: form.password, role: "customer" };
      if (avatar) payload.avatar = avatar;
      payload.company = form.company;
      payload.phone = form.phone;

      const { data } = await axios.post(`${API_URL}/auth/signup`, payload);

      // Redirect to email verification (fallback if somehow required)
      if (data.needsVerification) {
        sessionStorage.setItem("verify_email", data.email);
        navigate("/verify-email");
        return;
      }

      // Log in immediately
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("tokenExpiry", String(Date.now() + data.expiresIn));
      localStorage.removeItem("pa6_data"); // Clear any existing checklist data
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to connect. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>

      {/* Avatar row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div
          onClick={() => fileRef.current.click()}
          style={{ width: 54, height: 54, borderRadius: "50%", background: avatar ? "transparent" : "#1a1a1a", border: `2px solid ${avatar ? RED : "#2a2a2a"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}
        >
          {avatar
            ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 20, color: "#444" }}>📷</span>}
        </div>
        <div>
          <button type="button" onClick={() => fileRef.current.click()} style={S.addPicBtn}>
            {avatar ? "Change photo" : "Add profile photo"}
          </button>
          {avatar && (
            <button type="button" onClick={() => setAvatar("")} style={S.removeBtn}>Remove</button>
          )}
          <div style={{ color: "#444", fontSize: 11, marginTop: 3 }}>Optional — you can add it later</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
      </div>

      {/* Name + email */}
      <div style={S.row2} className="signup-row2">
        <Field label="Full name *" type="text" value={form.name} onChange={v => set("name", v)} placeholder="Your name" />
        <Field label="Email address *" type="email" value={form.email} onChange={v => set("email", v)} placeholder="you@example.com" />
      </div>

      {/* Customer-specific */}
      <div style={S.row2} className="signup-row2">
        <Field label="Company *" type="text" value={form.company} onChange={v => set("company", v)} placeholder="Company name" />
        <Field label="Phone number" type="tel" value={form.phone} onChange={v => set("phone", v)} placeholder="+91 XXXXX" />
      </div>

      {/* Password row */}
      <div style={S.row2} className="signup-row2">
        <Field label="Password *" type={show ? "text" : "password"} value={form.password} onChange={v => set("password", v)} placeholder="Min. 6 characters" 
          rightElement={
            <button type="button" onClick={() => setShow(s => !s)} style={S.eye}>{show ? "🙈" : "👁"}</button>
          }
        />
        <Field label="Confirm password *" type="password" value={form.confirm} onChange={v => set("confirm", v)} placeholder="Repeat password" />
      </div>

      {/* Strength */}
      {pw.length > 0 && (
        <div style={{ marginBottom: 12, marginTop: -6 }}>
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

      {error && <div style={S.error}>{error}</div>}

      <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p style={S.terms}>
        By signing up you agree to Polycom's <a href="#" style={{ color: RED, fontWeight: 600 }}>Terms of Service</a>
      </p>
    </form>
  );
}

function Field({ label, type, value, onChange, placeholder, rightElement }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...S.input, borderColor: focused ? RED : "#222", paddingRight: rightElement ? 40 : 12 }}
        />
        {rightElement}
      </div>
    </div>
  );
}

const S = {
  row2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label:     { display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 5 },
  input:     { width: "100%", padding: "10px 12px", background: "#141414", border: "1.5px solid #222", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s" },
  eye:       { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#444" },
  addPicBtn: { background: "none", border: "1px solid #2a2a2a", color: "#aaa", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "5px 12px", marginRight: 6 },
  removeBtn: { background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 11, textDecoration: "underline", padding: 0 },
  error:     { background: "#1a0505", border: `1px solid ${RED}`, color: "#ff6b6b", padding: "9px 13px", fontSize: 12, marginBottom: 14 },
  btn:       { width: "100%", padding: "13px 0", background: RED, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer", display: "block", transition: "opacity .15s" },
  terms:     { fontSize: 11, color: "#444", textAlign: "center", marginTop: 10 },
};
