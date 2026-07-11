import React, { useState, useEffect } from "react";
import { stockAPI, portfolioAPI } from "./api";
import { LoginPage } from "./LoginPage";
import { LandingPage } from "./LandingPage";
import { useStockWebSocket } from "./useWebSocket";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8080/api/v1" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function StockCard({ symbol, wsPrice, onClick, active }: { symbol: string; wsPrice?: any; onClick: () => void; active: boolean }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { stockAPI.getStock(symbol).then((r) => setData(r.data)).catch(() => {}); }, [symbol]);
  useEffect(() => {
    if (wsPrice && data) setData((prev: any) => ({ ...prev, current_price: wsPrice.price, change: wsPrice.change, change_percent: wsPrice.change_percent }));
  }, [wsPrice]);
  if (!data) return <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 animate-pulse h-20" />;
  const isUp = data.change >= 0;
  return (
    <div onClick={onClick} className={`cursor-pointer p-3 rounded-xl border transition active:scale-95 ${active ? "border-yellow-500" : "border-slate-700 bg-slate-800"}`}>
      <div className="flex justify-between items-start">
        <p className="text-slate-300 text-xs font-medium">{symbol}</p>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{isUp ? "+" : ""}{data.change_percent}</span>
      </div>
      <p className="text-lg font-bold text-white mt-1">${data.current_price}</p>
      <p className="text-slate-500 text-xs">H:${data.high_price} L:${data.low_price}</p>
    </div>
  );
}

function StockChart({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    stockAPI.getHistory(symbol).then((r) => { setHistory(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [symbol]);
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-white font-bold mb-3 text-sm">Chart - {symbol} 1 Month</h3>
      {loading ? <div className="h-40 flex items-center justify-center"><p className="text-slate-400 text-xs">Loading...</p></div> : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={[...history].reverse()}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => v.slice(5)} interval={4} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} domain={["auto", "auto"]} width={50} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "white" }} />
            <Area type="monotone" dataKey="close" stroke="#f59e0b" fill="url(#colorClose)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function AIPrediction({ symbol }: { symbol: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { API.get(`/ai/predict/${symbol}`).then((r) => setData(r.data)).catch(() => {}); }, [symbol]);
  if (!data || data.error) return null;
  const signalColor = data.signal === "BUY" ? "text-green-500 bg-green-100" : data.signal === "SELL" ? "text-red-500 bg-red-100" : "text-yellow-500 bg-yellow-100";
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-white font-bold mb-3 text-sm">AI Prediction - {symbol}</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-3 rounded-xl text-center ${signalColor}`}>
          <p className="text-xs opacity-70">Signal</p>
          <p className="font-bold text-xl">{data.signal}</p>
          <p className="text-xs opacity-70">{data.signal_strength}</p>
        </div>
        <div className="bg-slate-700 p-3 rounded-xl text-center">
          <p className="text-slate-400 text-xs">Trend</p>
          <p className={`font-bold text-xl ${data.trend >= 0 ? "text-green-500" : "text-red-500"}`}>{data.trend >= 0 ? "+" : ""}{data.trend}%</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">Support</p><p className="text-white text-xs font-bold">${data.support}</p></div>
        <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">Resistance</p><p className="text-white text-xs font-bold">${data.resistance}</p></div>
        <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">Volatility</p><p className="text-white text-xs font-bold">{data.volatility}%</p></div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data.predicted_7day}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => `D${v}`} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} domain={["auto", "auto"]} width={45} />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", fontSize: "11px", color: "white" }} />
          <Line type="monotone" dataKey="predicted_price" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await API.get("/notifications/check-alerts");
        if (r.data.notifications.length > 0) {
          setNotifications(prev => [...r.data.notifications, ...prev].slice(0, 10));
          if ("Notification" in window && Notification.permission === "granted") {
            r.data.notifications.forEach((n: any) => {
              new Notification("StockAI Alert!", { body: n.message, icon: "/favicon.ico" });
            });
          }
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setShow(!show)} style={{
        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
        borderRadius: "10px", padding: "8px 12px", color: "#f59e0b", cursor: "pointer",
        fontSize: "16px", position: "relative",
      }}>
        N
        {notifications.length > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "#ef4444", color: "white", borderRadius: "50%",
            width: "16px", height: "16px", fontSize: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{notifications.length}</span>
        )}
      </button>
      {show && (
        <div style={{
          position: "absolute", top: "110%", right: 0, width: "280px",
          background: "#1e293b", border: "1px solid #334155", borderRadius: "12px",
          padding: "12px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}>
          <p style={{ color: "white", fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>Notifications</p>
          {notifications.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "12px" }}>No notifications yet</p>
          ) : notifications.map((n, i) => (
            <div key={i} style={{ background: "rgba(245,158,11,0.1)", borderRadius: "8px", padding: "8px", marginBottom: "6px" }}>
              <p style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "600", margin: "0 0 2px" }}>{n.symbol}</p>
              <p style={{ color: "#94a3b8", fontSize: "11px", margin: 0 }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioSection() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [msg, setMsg] = useState("");
  const fetchPortfolio = () => { portfolioAPI.getPortfolio().then((r) => setPortfolio(r.data)).catch(() => {}); };
  useEffect(() => { fetchPortfolio(); }, []);
  const handleBuy = async () => {
    try {
      await portfolioAPI.buyStock({ symbol: symbol.toUpperCase(), quantity: parseFloat(quantity), buy_price: parseFloat(buyPrice) });
      setMsg(`${symbol.toUpperCase()} added!`);
      setSymbol(""); setQuantity(""); setBuyPrice("");
      fetchPortfolio();
    } catch { setMsg("Error!"); }
  };
  return (
    <div className="space-y-3">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-white font-bold mb-3 text-sm">Buy Stock</h3>
        <div className="space-y-2">
          <input className="w-full bg-slate-700 text-white p-2.5 rounded-xl outline-none text-sm border border-slate-600" placeholder="Symbol (AAPL / RELIANCE.NS)" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          <div className="flex gap-2">
            <input className="flex-1 bg-slate-700 text-white p-2.5 rounded-xl outline-none text-sm border border-slate-600" placeholder="Qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <input className="flex-1 bg-slate-700 text-white p-2.5 rounded-xl outline-none text-sm border border-slate-600" placeholder="Price" type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
          </div>
          <button onClick={handleBuy} className="w-full font-bold p-2.5 rounded-xl text-sm transition-all active:scale-95 text-white" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>Buy</button>
        </div>
        {msg && <p className="text-yellow-500 text-xs mt-2">{msg}</p>}
      </div>
      {portfolio && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800 p-3 rounded-xl text-center border border-slate-700"><p className="text-slate-400 text-xs">Invested</p><p className="text-white font-bold text-sm">${portfolio.total_invested}</p></div>
            <div className="bg-slate-800 p-3 rounded-xl text-center border border-slate-700"><p className="text-slate-400 text-xs">Value</p><p className="text-white font-bold text-sm">${portfolio.total_current_value}</p></div>
            <div className="bg-slate-800 p-3 rounded-xl text-center border border-slate-700"><p className="text-slate-400 text-xs">P&L</p><p className={`font-bold text-sm ${portfolio.total_profit_loss >= 0 ? "text-green-500" : "text-red-500"}`}>{portfolio.total_profit_loss >= 0 ? "+" : ""}${portfolio.total_profit_loss}</p></div>
          </div>
          <div className="space-y-2">
            {portfolio.holdings.map((h: any) => (
              <div key={h.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center">
                  <div><span className="text-white font-bold">{h.symbol}</span><span className="text-slate-400 text-xs ml-2">{h.quantity} shares</span></div>
                  <button onClick={async () => { await portfolioAPI.sellStock(h.id); fetchPortfolio(); }} className="bg-red-500 active:bg-red-700 text-white text-xs px-2.5 py-1 rounded-lg">Sell</button>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-slate-400">Buy: <span className="text-white">${h.buy_price}</span></span>
                  <span className="text-slate-400">Now: <span className="text-white">${h.current_price}</span></span>
                  <span className={`font-bold ${h.profit_loss >= 0 ? "text-green-500" : "text-red-500"}`}>{h.profit_loss >= 0 ? "+" : ""}${h.profit_loss}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BottomNav({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex z-50">
      {[{ id: "market", label: "Market" }, { id: "portfolio", label: "Portfolio" }].map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition active:scale-95 ${active === tab.id ? "text-yellow-500" : "text-slate-400"}`}>
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("market");
  const [chartSymbol, setChartSymbol] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const { prices, connected } = useStockWebSocket();
  const watchlist = ["AAPL", "TSLA", "RELIANCE.NS", "TCS.NS"];

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <h1 className="text-lg font-bold" style={{color: "#f59e0b"}}>StockAI</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={onLogout} className="text-slate-400 text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">Logout</button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {activeTab === "market" && (
          <>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Watchlist {connected && <span style={{color: "#f59e0b"}}>? Live</span>}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {watchlist.map((s) => <StockCard key={s} symbol={s} wsPrice={prices[s]} onClick={() => setChartSymbol(s)} active={chartSymbol === s} />)}
              </div>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 bg-slate-800 text-white p-2.5 rounded-xl outline-none border border-slate-700 text-sm" placeholder="Search (AAPL / RELIANCE.NS / TCS.NS...)" value={searchInput} onChange={(e) => setSearchInput(e.target.value.toUpperCase())} />
              <button onClick={() => setChartSymbol(searchInput)} className="text-white px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>Go</button>
            </div>
            <StockChart symbol={chartSymbol} />
            <AIPrediction symbol={chartSymbol} />
          </>
        )}
        {activeTab === "portfolio" && <PortfolioSection />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<"landing" | "login" | "dashboard">("landing");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setPage("dashboard");
  }, []);

  if (page === "landing") return <LandingPage onGetStarted={() => setPage("login")} />;
  if (page === "login") return <LoginPage onLogin={() => setPage("dashboard")} />;
  return <Dashboard onLogout={() => { localStorage.removeItem("token"); setPage("landing"); }} />;
}
