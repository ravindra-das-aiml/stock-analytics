import React, { useState, useEffect } from "react";
import { authAPI } from "./api";

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/");
      onLogin();
    }
  }, [onLogin]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isRegister) {
        await authAPI.register({ email, username, password });
        setSuccess("Account created! Please sign in.");
        setIsRegister(false);
        setUsername("");
        setPassword("");
      } else {
        const res = await authAPI.login(email, password);
        localStorage.setItem("token", res.data.access_token);
        onLogin();
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong!");
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = "https://stock-analytics-production-2331.up.railway.app/api/v1/auth/google";
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(245,158,11,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        .login-card {
          animation: fadeInUp 0.6s ease forwards;
        }
        .logo-float {
          animation: float 3s ease-in-out infinite;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b, #d97706, #f59e0b);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .btn-primary {
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(245,158,11,0.5) !important;
        }
        .btn-primary:active {
          transform: scale(0.97);
        }
        .btn-google:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
        }
        .btn-google:active {
          transform: scale(0.97);
        }
        .btn-secondary:hover {
          background: rgba(245,158,11,0.1) !important;
          transform: translateY(-1px);
        }
        .input-field:focus {
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }
        .pulse-logo {
          animation: pulse-ring 2s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        padding: "16px",
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        {/* Background glow */}
        <div style={{
          position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="login-card" style={{
          width: "100%", maxWidth: "400px",
          background: "rgba(30, 27, 75, 0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1)",
        }}>

          {/* Logo */}
          <div style={{textAlign: "center", marginBottom: "32px"}}>
            <div className="logo-float pulse-logo" style={{
              width: "72px", height: "72px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px rgba(245,158,11,0.4)",
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <h1 className="shimmer-text" style={{fontSize: "32px", fontWeight: "800", margin: "0 0 4px", letterSpacing: "-0.5px"}}>
              StockAI
            </h1>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0}}>
              {isRegister ? "Create your account" : "Sign in to your account"}
            </p>
          </div>

          {/* Error/Success */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5", padding: "12px", borderRadius: "12px",
              marginBottom: "16px", textAlign: "center", fontSize: "13px",
              animation: "fadeInUp 0.3s ease",
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
              color: "#86efac", padding: "12px", borderRadius: "12px",
              marginBottom: "16px", textAlign: "center", fontSize: "13px",
              animation: "fadeInUp 0.3s ease",
            }}>{success}</div>
          )}

          {/* Google Button */}
          <button className="btn-google" onClick={handleGoogleLogin} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: "12px", background: "white", color: "#333",
            border: "none", borderRadius: "14px", padding: "14px",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            transition: "all 0.2s ease",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px"}}>
            <div style={{flex: 1, height: "1px", background: "rgba(255,255,255,0.1)"}} />
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: "12px"}}>or</span>
            <div style={{flex: 1, height: "1px", background: "rgba(255,255,255,0.1)"}} />
          </div>

          {/* Form */}
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {isRegister && (
              <div style={{animation: "fadeInUp 0.3s ease"}}>
                <label style={{color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px"}}>Username</label>
                <input className="input-field" style={{
                  width: "100%", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                  padding: "13px 16px", color: "white", fontSize: "14px",
                  outline: "none", boxSizing: "border-box", transition: "all 0.2s",
                }}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)} />
              </div>
            )}

            <div>
              <label style={{color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px"}}>Email Address</label>
              <input className="input-field" style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                padding: "13px 16px", color: "white", fontSize: "14px",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s",
              }}
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label style={{color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px"}}>Password</label>
              <input className="input-field" style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                padding: "13px 16px", color: "white", fontSize: "14px",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s",
              }}
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "none", borderRadius: "14px",
              color: loading ? "rgba(255,255,255,0.3)" : "white",
              fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(245,158,11,0.4)",
              marginTop: "4px", letterSpacing: "0.3px",
            }}>
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </div>

          {/* Divider */}
          <div style={{display: "flex", alignItems: "center", gap: "12px", margin: "20px 0"}}>
            <div style={{flex: 1, height: "1px", background: "rgba(255,255,255,0.1)"}} />
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: "12px"}}>or</span>
            <div style={{flex: 1, height: "1px", background: "rgba(255,255,255,0.1)"}} />
          </div>

          <button className="btn-secondary" onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }} style={{
            width: "100%", padding: "13px",
            background: "transparent",
            border: "1px solid rgba(245,158,11,0.3)", borderRadius: "14px",
            color: "#f59e0b", fontSize: "13px", fontWeight: "500",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register"}
          </button>

          <p style={{textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "11px", marginTop: "24px", marginBottom: 0}}>
            StockAI - Premium Market Analytics
          </p>
        </div>
      </div>
    </>
  );
}

