import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AuthPage from './auth/AuthPage.jsx'
import ProfilePage from './auth/ProfilePage.jsx'
import VerifyEmailPage from './auth/VerifyEmailPage.jsx'
import ResetPasswordPage from './auth/ResetPasswordPage.jsx'

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  if (!token || !user) return <Navigate to="/auth" replace />;
  // role check only when a specific role is required
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/customer" element={<PrivateRoute role="customer"><App role="customer" /></PrivateRoute>} />
        <Route path="/employee" element={<PrivateRoute role="employee"><App role="employee" /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
