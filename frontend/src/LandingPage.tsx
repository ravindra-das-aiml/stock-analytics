import React, { useState, useEffect } from "react";

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: "L", title: "Live Stock Data", desc: "Real-time prices from global markets including NSE, BSE, NYSE & NASDAQ" },
    { icon: "A", title: "AI Predictions", desc: "Advanced ML models predict next 7 days price movement with confidence scores" },
    { icon: "P", title: "Portfolio Manager", desc: "Track your investments, P&L, and get risk analysis with Sharpe Ratio" },
    { icon: "N", title: "Smart Alerts", desc: "Set price alerts and get instant browser notifications when triggered" },
    { icon: "I", title: "Indian Markets", desc: "Full support for NSE & BSE stocks including Reliance, TCS, Infosys & more" },
    { icon: "W", title: "WebSocket Live", desc: "Prices update every 10 seconds via WebSocket ? no page refresh needed" },
  ];

  const stocks = [
    { symbol: "RELIANCE.NS", name: "Reliance", price: "2987.45", change: "+1.54%" },
    { symbol: "TCS.NS", name: "TCS", price: "3456.78", change: "-0.67%" },
    { symbol: "INFY.NS", name: "Infosys", price: "1567.89", change: "+0.79%" },
    { symbol: "AAPL", name: "Apple", price: "283.78", change: "+3.14%" },
    { symbol: "TSLA", name: "Tesla", price: "379.71", change: "+1.22%" },
    { symbol: "NVDA", name: "NVIDIA", price: "138.85", change: "+2.40%" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .hero-text { animation: fadeInUp 0.8s ease forwards; }
        .hero-sub { animation: fadeInUp 0.8s ease 0.2s forwards; opacity: 0; }
        .hero-btn { animation: fadeInUp 0.8s ease 0.4s forwards; opacity: 0; }
        .float-card { animation: float 4s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .ticker-wrap { overflow: hidden; }
        .ticker { display: flex; animation: ticker 30s linear infinite; width: max-content; }
        .btn-glow:hover { box-shadow: 0 0 30px rgba(245,158,11,0.6) !important; transform: translateY(-2px); }
        .feature-card:hover { transform: translateY(-5px); border-color: rgba(245,158,11,0.4) !important; }
        .feature-card { transition: all 0.3s ease; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)", fontFamily: "'Segoe UI', sans-serif", color: "white" }}>

        {/* Navbar */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: scrolled ? "rgba(15,23,42,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(245,158,11,0.1)" : "none",
          transition: "all 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <span style={{ fontSize: "20px", fontWeight: "800" }} className="shimmer-text">StockAI</span>
          </div>
          <button onClick={onGetStarted} className="btn-glow" style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            border: "none", borderRadius: "10px", padding: "10px 24px",
            color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
          }}>Get Started</button>
        </nav>

        {/* Hero Section */}
        <div style={{ paddingTop: "120px", paddingBottom: "80px", textAlign: "center", padding: "120px 32px 80px" }}>
          <div className="hero-text">
            <div style={{
              display: "inline-block", background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px",
              padding: "6px 16px", marginBottom: "24px", fontSize: "13px", color: "#f59e0b",
            }}>
              Real-Time Stock Analytics Platform
            </div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: "900", margin: "0 0 16px", lineHeight: 1.1 }}>
              <span className="shimmer-text">AI-Powered</span> Stock<br />Market Analytics
            </h1>
          </div>

          <p className="hero-sub" style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6 }}>
            Track live prices, get AI predictions, manage your portfolio, and receive instant alerts ? all in one professional platform.
          </p>

          <div className="hero-btn" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onGetStarted} className="btn-glow" style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "none", borderRadius: "14px", padding: "16px 40px",
              color: "white", fontWeight: "700", fontSize: "16px", cursor: "pointer",
              boxShadow: "0 8px 30px rgba(245,158,11,0.4)", transition: "all 0.2s ease",
            }}>Start Trading Free</button>
            <button style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "14px", padding: "16px 40px",
              color: "white", fontWeight: "600", fontSize: "16px", cursor: "pointer",
            }}>View Demo</button>
          </div>

          {/* Floating Dashboard Preview */}
          <div className="float-card" style={{
            marginTop: "60px", maxWidth: "700px", margin: "60px auto 0",
            background: "rgba(30,27,75,0.8)", borderRadius: "20px",
            border: "1px solid rgba(245,158,11,0.2)",
            padding: "24px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {stocks.slice(0, 3).map((s) => (
                <div key={s.symbol} style={{
                  background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "0 0 4px" }}>{s.name}</p>
                  <p style={{ color: "white", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{s.price}</p>
                  <p style={{ color: s.change.startsWith("+") ? "#22c55e" : "#ef4444", fontSize: "12px", margin: 0 }}>{s.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div style={{ background: "rgba(245,158,11,0.1)", borderTop: "1px solid rgba(245,158,11,0.2)", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "12px 0", overflow: "hidden" }}>
          <div className="ticker">
            {[...stocks, ...stocks].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 32px", whiteSpace: "nowrap" }}>
                <span style={{ color: "#f59e0b", fontWeight: "700", fontSize: "13px" }}>{s.symbol}</span>
                <span style={{ color: "white", fontSize: "13px" }}>{s.price}</span>
                <span style={{ color: s.change.startsWith("+") ? "#22c55e" : "#ef4444", fontSize: "13px" }}>{s.change}</span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: "80px 32px", maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "40px", fontWeight: "800", marginBottom: "48px" }}>
            Everything you need to <span className="shimmer-text">trade smart</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: "rgba(30,27,75,0.6)", borderRadius: "16px", padding: "28px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px", fontWeight: "800", fontSize: "18px",
                }}>{f.icon}</div>
                <h3 style={{ fontWeight: "700", fontSize: "18px", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Indian Stocks Section */}
        <div style={{ padding: "60px 32px", background: "rgba(245,158,11,0.05)", borderTop: "1px solid rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "12px" }}>
              Indian Markets <span className="shimmer-text">Supported</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "40px" }}>Track NSE & BSE stocks alongside global markets</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
              {stocks.map((s, i) => (
                <div key={i} style={{
                  background: "rgba(30,27,75,0.8)", borderRadius: "12px", padding: "16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <p style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "700", margin: "0 0 4px" }}>{s.symbol}</p>
                  <p style={{ color: "white", fontWeight: "700", margin: "0 0 4px" }}>{s.price}</p>
                  <p style={{ color: s.change.startsWith("+") ? "#22c55e" : "#ef4444", fontSize: "13px", margin: 0 }}>{s.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "80px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: "40px", fontWeight: "800", marginBottom: "16px" }}>
            Ready to start <span className="shimmer-text">trading smarter?</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "32px", fontSize: "18px" }}>
            Join thousands of traders using StockAI
          </p>
          <button onClick={onGetStarted} className="btn-glow" style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            border: "none", borderRadius: "14px", padding: "18px 48px",
            color: "white", fontWeight: "700", fontSize: "18px", cursor: "pointer",
            boxShadow: "0 8px 30px rgba(245,158,11,0.4)", transition: "all 0.2s ease",
          }}>Get Started Free</button>
        </div>

        {/* Footer */}
        <div style={{ padding: "24px 32px", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>
            StockAI - Real-Time Market Analytics | Built with FastAPI + React
          </p>
        </div>
      </div>
    </>
  );
}
