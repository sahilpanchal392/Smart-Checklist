import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import logo from "../assets/images/POLYCOML_LOGO.png";

import API_URL from "../api";
const RED = "#E8001C";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// Resize + compress image to max 300x300, quality 0.7 — keeps base64 under ~80KB
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

export default function ProfilePage() {
  const navigate  = useNavigate();
  const [user, setUser]     = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm]     = useState({});
  const [pwForm, setPwForm] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [msg, setMsg]       = useState("");
  const [err, setErr]       = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [tab, setTab]       = useState("profile");
  const fileRef             = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    axios.get(`${API_URL}/profile/me`, { headers: authHeader() })
      .then(r => { setUser(r.data); setForm(r.data); })
      .catch(e => {
        if (e.response?.status === 401) navigate("/auth");
        else setLoadErr("Could not reach the server. Check your connection or try again.");
      });
  }, [navigate]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Avatar upload — saves immediately to DB without requiring edit mode
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarSaving(true);
    try {
      const avatarData = await compressImage(file);
      const { data } = await axios.put(`${API_URL}/profile/me`, { avatar: avatarData }, { headers: authHeader() });
      setUser(data.user);
      setForm(p => ({ ...p, avatar: data.user.avatar }));
      localStorage.setItem("user", JSON.stringify({ id: data.user._id, name: data.user.name, email: data.user.email, role: data.user.role, avatar: data.user.avatar }));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to upload photo.");
    }
    setAvatarSaving(false);
  };

  const saveProfile = async () => {
    setErr(""); setMsg(""); setSaving(true);
    try {
      const { data } = await axios.put(`${API_URL}/profile/me`, form, { headers: authHeader() });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify({ id: data.user._id, name: data.user.name, email: data.user.email, role: data.user.role, avatar: data.user.avatar }));
      setMsg("Profile updated successfully.");
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || "Unable to save. Please check your connection and try again.");
    }
    setSaving(false);
  };

  const savePassword = async () => {
    setErr(""); setMsg(""); setSaving(true);
    if (pwForm.newPassword !== pwForm.confirmPassword) { setErr("New passwords do not match."); setSaving(false); return; }
    try {
      await axios.put(`${API_URL}/profile/me`, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, { headers: authHeader() });
      setMsg("Password changed successfully.");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (e) {
      const msg = e.response?.data?.message;
      setErr(msg || "Unable to update password. Please try again.");
    }
    setSaving(false);
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/auth"); };

  if (!user) return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      {!loadErr && <div style={{ width:32, height:32, border:"3px solid #1a1a1a", borderTop:`3px solid ${RED}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />}
      {loadErr && (
        <div style={{ color:"#ff6b6b", fontSize:13, textAlign:"center", maxWidth:360, padding:"0 24px" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
          <div style={{ color:"#fff", fontWeight:700, marginBottom:8 }}>Cannot Load Profile</div>
          {loadErr}
          <div style={{ marginTop:20, display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={()=>window.location.reload()} style={{ background:"#1a1a1a", border:"1px solid #333", color:"#fff", padding:"8px 20px", cursor:"pointer", fontSize:12 }}>Retry</button>
            <button onClick={()=>navigate("/auth")} style={{ background:RED, border:"none", color:"#fff", padding:"8px 20px", cursor:"pointer", fontSize:12 }}>Go to Login</button>
          </div>
        </div>
      )}
    </div>
  );

  const initials = user.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const roleColor = user.role === "customer" ? RED : "#4F46E5";

  return (
    <div style={S.root}>
      {/* Faded logo watermark */}
      <img src={logo} alt="" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"55vw", maxWidth:600, opacity:0.12, userSelect:"none", pointerEvents:"none", zIndex:2 }} />
      {/* Topbar */}
      <div style={S.topbar} className="profile-topbar">
        <button onClick={() => navigate(`/${user.role}`)} style={S.backBtn} className="profile-back-btn">
          ← Back
        </button>
        <div style={S.logoRow}>
          <img src={logo} alt="Polycom Innovation" style={S.logoImg} className="profile-topbar-logo" />
        </div>
        <button onClick={logout} style={S.logoutBtn} className="profile-logout-btn">Sign Out</button>
      </div>

      <div style={S.page} className="profile-page">
        {/* Left — Profile card */}
        <motion.div style={S.sidebar} className="profile-sidebar" initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}>

          {/* Avatar */}
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ position:"relative", display:"inline-block" }}>
              <div style={{ ...S.avatar, background: user.avatar ? "transparent" : `linear-gradient(135deg, ${RED}, #ff4d6d)` }}>
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize:32, fontWeight:900, color:"#fff" }}>{initials}</span>}
              </div>
              <button onClick={()=>fileRef.current.click()} disabled={avatarSaving} style={{ ...S.avatarEdit, opacity: avatarSaving ? 0.5 : 1 }} title="Change photo">
                {avatarSaving ? "⏳" : "📷"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:"none" }} />
            </div>
            <div style={{ color:"#fff", fontSize:20, fontWeight:800, marginTop:14, letterSpacing:"-0.3px" }}>{user.name}</div>
            <div style={{ display:"inline-block", background: roleColor, color:"#fff", fontSize:10, fontWeight:700, letterSpacing:"2px", padding:"3px 12px", marginTop:6, textTransform:"uppercase" }}>
              {user.role}
            </div>
            {user.company && <div style={{ color:"#555", fontSize:13, marginTop:8 }}>{user.company}</div>}
            {user.city && <div style={{ color:"#444", fontSize:12, marginTop:4 }}>📍 {user.city}</div>}
          </div>

          <div style={S.divider} />

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, marginBottom:24 }}>
            {[
              ["Member Since", new Date(user.createdAt).getFullYear()],
              ["Role", user.role === "customer" ? "Customer" : "Employee"],
              user.role === "customer" ? ["Company", user.company || "—"] : ["Dept.", user.department || "—"],
              user.role === "customer" ? ["Phone", user.phone || "—"] : ["Emp. ID", user.employeeId || "—"],
            ].map(([l,v]) => (
              <div key={l} style={S.statBox}>
                <div style={{ color:"#444", fontSize:10, letterSpacing:"1px", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ color:"#fff", fontSize:13, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>

          {user.bio && (
            <>
              <div style={S.divider} />
              <div style={{ color:"#444", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", marginBottom:8 }}>About</div>
              <div style={{ color:"#888", fontSize:13, lineHeight:1.7 }}>{user.bio}</div>
            </>
          )}

          {user.website && (
            <div style={{ marginTop:16 }}>
              <a href={user.website} target="_blank" rel="noreferrer" style={{ color:RED, fontSize:12, fontWeight:600 }}>🔗 {user.website}</a>
            </div>
          )}
        </motion.div>

        {/* Right — Edit / Details */}
        <motion.div style={S.main} className="profile-main" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>

          {/* Tabs */}
          <div style={S.tabs}>
            {[["profile","Profile Details"],["security","Password & Security"]].map(([t,l])=>(
              <button key={t} onClick={()=>{ setTab(t); setMsg(""); setErr(""); }} style={{ ...S.tab, borderBottom: tab===t ? `2px solid ${RED}` : "2px solid transparent", color: tab===t ? "#fff" : "#444" }}>
                {l}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "profile" && (
              <motion.div key="profile" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.25 }}>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                  <div>
                    <div style={{ color:"#fff", fontSize:18, fontWeight:800, letterSpacing:"-0.3px" }}>
                      {editing ? "Edit Profile" : "Profile Details"}
                    </div>
                    <div style={{ color:"#444", fontSize:12, marginTop:2 }}>
                      {editing ? "Update your personal information" : "Your account information"}
                    </div>
                  </div>
                  {!editing && (
                    <button onClick={()=>{ setEditing(true); setForm({...user}); }} style={S.editBtn}>Edit Profile</button>
                  )}
                </div>

                {/* Fields */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }} className="profile-fields-grid">
                  <Field label="FULL NAME" value={editing?form.name:user.name} onChange={v=>set("name",v)} editing={editing} />
                  <Field label="EMAIL ADDRESS" value={editing?form.email:user.email} onChange={v=>set("email",v)} editing={editing} type="email" />

                  {user.role === "customer" ? (
                    <>
                      <Field label="COMPANY" value={editing?form.company:user.company} onChange={v=>set("company",v)} editing={editing} />
                      <Field label="PHONE" value={editing?form.phone:user.phone} onChange={v=>set("phone",v)} editing={editing} type="tel" />
                    </>
                  ) : (
                    <>
                      <Field label="EMPLOYEE ID" value={editing?form.employeeId:user.employeeId} onChange={v=>set("employeeId",v)} editing={editing} />
                      <Field label="DEPARTMENT" value={editing?form.department:user.department} onChange={v=>set("department",v)} editing={editing} />
                      <Field label="DESIGNATION" value={editing?form.designation:user.designation} onChange={v=>set("designation",v)} editing={editing} />
                    </>
                  )}

                  <Field label="CITY" value={editing?form.city:user.city} onChange={v=>set("city",v)} editing={editing} />
                  <Field label="WEBSITE" value={editing?form.website:user.website} onChange={v=>set("website",v)} editing={editing} />
                </div>

                <div style={{ marginTop:16 }}>
                  <div style={{ color:"#444", fontSize:10, fontWeight:700, letterSpacing:"1.5px", marginBottom:6 }}>BIO</div>
                  {editing
                    ? <textarea value={form.bio||""} onChange={e=>set("bio",e.target.value)} placeholder="Tell us about yourself..." style={{ ...S.input, minHeight:80, resize:"vertical" }} />
                    : <div style={{ color: user.bio ? "#888" : "#333", fontSize:13, lineHeight:1.7, padding:"12px 0" }}>{user.bio || "No bio added yet."}</div>}
                </div>

                {msg && <div style={S.success}>{msg}</div>}
                {err && <div style={S.error}>{err}</div>}

                {editing && (
                  <div style={{ display:"flex", gap:12, marginTop:24 }} className="profile-save-row">
                    <button onClick={saveProfile} disabled={saving} style={{ ...S.saveBtn, opacity:saving?0.7:1 }} className="profile-save-btn">
                      {saving ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                    <button onClick={()=>{ setEditing(false); setErr(""); setMsg(""); }} style={S.cancelBtn} className="profile-cancel-btn">CANCEL</button>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "security" && (
              <motion.div key="security" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.25 }}>
                <div style={{ color:"#fff", fontSize:18, fontWeight:800, marginBottom:4 }}>Password & Security</div>
                <div style={{ color:"#444", fontSize:12, marginBottom:24 }}>Change your account password</div>

                <div style={{ maxWidth:420 }}>
                  {[["CURRENT PASSWORD","currentPassword","password"],["NEW PASSWORD","newPassword","password"],["CONFIRM NEW PASSWORD","confirmPassword","password"]].map(([l,k,t])=>(
                    <div key={k} style={{ marginBottom:16 }}>
                      <div style={{ color:"#444", fontSize:10, fontWeight:700, letterSpacing:"1.5px", marginBottom:6 }}>{l}</div>
                      <input type={t} value={pwForm[k]} onChange={e=>setPwForm(p=>({...p,[k]:e.target.value}))} style={S.input} placeholder="••••••••" />
                    </div>
                  ))}

                  {msg && <div style={S.success}>{msg}</div>}
                  {err && <div style={S.error}>{err}</div>}

                  <button onClick={savePassword} disabled={saving} style={{ ...S.saveBtn, marginTop:8, opacity:saving?0.7:1 }}>
                    {saving ? "UPDATING..." : "UPDATE PASSWORD"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, editing, type="text" }) {
  return (
    <div>
      <div style={{ color:"#444", fontSize:10, fontWeight:700, letterSpacing:"1.5px", marginBottom:6 }}>{label}</div>
      {editing
        ? <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} style={S.input} />
        : <div style={{ color: value ? "#ccc" : "#333", fontSize:13.5, padding:"11px 0", borderBottom:"1px solid #1a1a1a" }}>{value || "—"}</div>}
    </div>
  );
}

const S = {
  root:    { background:"#0a0a0a", minHeight:"100vh", fontFamily:"'Inter',-apple-system,sans-serif" },
  topbar:  { background:"#0d0d0d", borderBottom:"1px solid #1a1a1a", padding:"0 16px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, gap:8 },
  backBtn: { background:"none", border:"1px solid #1e1e1e", color:"#555", cursor:"pointer", fontSize:12, fontWeight:600, letterSpacing:"0.5px", padding:"7px 12px", flexShrink:0, whiteSpace:"nowrap" },
  logoRow: { display:"flex", alignItems:"center", flex:1, justifyContent:"center", minWidth:0 },
  logoImg: { height:40, maxWidth:"30vw", objectFit:"contain", display:"block" },
  logoutBtn:{ background:"#E8001C", border:"none", color:"#fff", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"1px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap" },
  page:    { maxWidth:1100, margin:"0 auto", padding:"24px 16px", display:"grid", gridTemplateColumns:"minmax(0,280px) 1fr", gap:20, alignItems:"start", position:"relative", zIndex:10 },
  sidebar: { background:"#0d0d0d", border:"1px solid #1a1a1a", padding:"32px 24px", position:"sticky", top:78 },
  avatar:  { width:90, height:90, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", margin:"0 auto", border:`3px solid ${RED}` },
  avatarEdit:{ position:"absolute", bottom:0, right:0, background:RED, border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12 },
  divider: { height:1, background:"#1a1a1a", margin:"20px 0" },
  statBox: { padding:"14px 12px", border:"1px solid #111", background:"#0a0a0a" },
  main:    { background:"#0d0d0d", border:"1px solid #1a1a1a", padding:"32px 32px" },
  tabs:    { display:"flex", borderBottom:"1px solid #1a1a1a", marginBottom:28 },
  tab:     { background:"none", border:"none", borderBottom:"2px solid transparent", padding:"12px 20px", cursor:"pointer", fontSize:13, fontWeight:600, letterSpacing:"0.3px", transition:"all .2s" },
  input:   { width:"100%", background:"#111", border:"1px solid #1e1e1e", color:"#fff", padding:"11px 14px", fontSize:13.5, outline:"none", fontFamily:"inherit", boxSizing:"border-box", transition:"border-color .2s" },
  editBtn: { background:"transparent", border:`1px solid ${RED}`, color:RED, cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"1.5px", padding:"8px 20px", transition:"all .2s" },
  saveBtn: { background:RED, border:"none", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:800, letterSpacing:"2px", padding:"13px 32px", transition:"opacity .15s" },
  cancelBtn:{ background:"transparent", border:"1px solid #2a2a2a", color:"#555", cursor:"pointer", fontSize:12, fontWeight:700, letterSpacing:"1px", padding:"13px 24px" },
  success: { background:"#001a0a", border:"1px solid #00c853", color:"#00c853", padding:"10px 14px", fontSize:12.5, marginTop:16 },
  error:   { background:"#1a0505", border:`1px solid ${RED}`, color:"#ff6b6b", padding:"10px 14px", fontSize:12.5, marginTop:16 },
};
