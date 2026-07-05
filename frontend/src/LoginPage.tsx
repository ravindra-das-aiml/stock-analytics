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

  useEffect(() => {
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
    window.location.href = "http://localhost:8000/api/v1/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-700">

        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <h1 className="text-3xl font-bold" style={{color: "#f59e0b"}}>StockAI</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-500 text-red-300 text-xs p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900 border border-green-500 text-green-300 text-xs p-3 rounded-xl mb-4 text-center">
            {success}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold p-3 rounded-xl text-sm transition-all duration-150 active:scale-95 mb-4 shadow-md hover:shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="text-slate-500 text-xs">or</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        <div className="space-y-3">
          {isRegister && (
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Username</label>
              <input
                className="w-full bg-slate-700 text-white p-3 rounded-xl outline-none text-sm border border-slate-600 focus:border-yellow-500 transition"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Email Address</label>
            <input
              className="w-full bg-slate-700 text-white p-3 rounded-xl outline-none text-sm border border-slate-600 focus:border-yellow-500 transition"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Password</label>
            <input
              className="w-full bg-slate-700 text-white p-3 rounded-xl outline-none text-sm border border-slate-600 focus:border-yellow-500 transition"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-bold p-3 rounded-xl text-sm transition-all duration-150 mt-2 active:scale-95 text-white"
            style={{background: loading ? "#475569" : "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: loading ? "none" : "0 4px 15px rgba(245,158,11,0.4)"}}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="text-slate-500 text-xs">or</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        <button
          onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }}
          className="w-full p-3 rounded-xl text-sm font-medium border transition-all duration-150 active:scale-95"
          style={{borderColor: "#f59e0b", color: "#f59e0b"}}
        >
          {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register"}
        </button>

        <p className="text-center text-slate-600 text-xs mt-6">
          StockAI - Real-Time Market Analytics
        </p>
      </div>
    </div>
  );
}
