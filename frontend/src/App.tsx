import React, { useState, useEffect } from "react";
import { stockAPI, portfolioAPI } from "./api";
import { LoginPage } from "./LoginPage";
import { useStockWebSocket } from "./useWebSocket";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000/api/v1" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==================== THEME ====================
const themes = {
  dark: {
    bg: "bg-slate-900",
    card: "bg-slate-800",
    border: "border-slate-700",
    text: "text-white",
    subtext: "text-slate-400",
    input: "bg-slate-700",
    nav: "bg-slate-800 border-slate-700",
    header: "bg-slate-900 border-slate-800",
  },
  light: {
    bg: "bg-gray-100",
    card: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    subtext: "text-gray-500",
    input: "bg-gray-100",
    nav: "bg-white border-gray-200",
    header: "bg-white border-gray-200",
  }
};

// ==================== STOCK CARD ====================
function StockCard({ symbol, wsPrice, onClick, active, theme }: { symbol: string; wsPrice?: any; onClick: () => void; active: boolean; theme: any }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { stockAPI.getStock(symbol).then((r) => setData(r.data)).catch(() => {}); }, [symbol]);
  useEffect(() => {
    if (wsPrice && data) setData((prev: any) => ({ ...prev, current_price: wsPrice.price, change: wsPrice.change, change_percent: wsPrice.change_percent }));
  }, [wsPrice]);
  if (!data) return <div className={`${theme.card} p-3 rounded-xl border ${theme.border} animate-pulse h-20`} />;
  const isUp = data.change >= 0;
  return (
    <div onClick={onClick} className={`cursor-pointer p-3 rounded-xl border transition active:scale-95 ${active ? "border-yellow-500" : theme.border} ${theme.card}`}>
      <div className="flex justify-between items-start">
        <p className={`${theme.subtext} text-xs font-medium`}>{symbol}</p>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{isUp ? "+" : ""}{data.change_percent}</span>
      </div>
      <p className={`text-lg font-bold ${theme.text} mt-1`}>${data.current_price}</p>
      <p className={`${theme.subtext} text-xs`}>H:${data.high_price} L:${data.low_price}</p>
    </div>
  );
}

// ==================== CHART ====================
function StockChart({ symbol, theme, chartType }: { symbol: string; theme: any; chartType: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    stockAPI.getHistory(symbol).then((r) => { setHistory(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [symbol]);

  const gridColor = chartType === "dark" ? "#334155" : "#e5e7eb";
  const textColor = chartType === "dark" ? "#94a3b8" : "#6b7280";

  return (
    <div className={`${theme.card} p-4 rounded-xl border ${theme.border}`}>
      <h3 className={`${theme.text} font-bold mb-3 text-sm`}>Chart - {symbol} 1 Month</h3>
      {loading ? (
        <div className="h-40 flex items-center justify-center"><p className={`${theme.subtext} text-xs`}>Loading...</p></div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={[...history].reverse()}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 9 }} tickFormatter={(v) => v.slice(5)} interval={4} />
            <YAxis tick={{ fill: textColor, fontSize: 9 }} domain={["auto", "auto"]} width={50} />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "white" }} />
            <Area type="monotone" dataKey="close" stroke="#f59e0b" fill="url(#colorClose)" strokeWidth={2} dot={false} name="Close" />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Volume Chart */}
      {!loading && history.length > 0 && (
        <>
          <h3 className={`${theme.text} font-bold mb-2 mt-4 text-sm`}>Volume</h3>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={[...history].reverse()}>
              <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 8 }} tickFormatter={(v) => v.slice(5)} interval={4} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: "11px", color: "white" }} formatter={(v: any) => [v.toLocaleString(), "Volume"]} />
              <Bar dataKey="volume" fill="#f59e0b" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

// ==================== NEWS FEED ====================
function NewsFeed({ symbol, theme }: { symbol: string; theme: any }) {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    API.get(`/news/?symbol=${symbol}`).then((r) => setNews(r.data.news)).catch(() => {});
  }, [symbol]);

  return (
    <div className={`${theme.card} p-4 rounded-xl border ${theme.border}`}>
      <h3 className={`${theme.text} font-bold mb-3 text-sm`}>Latest News - {symbol}</h3>
      <div className="space-y-2">
        {news.map((n, i) => (
          <div key={i} className={`p-3 rounded-lg border ${theme.border} ${theme.input}`}>
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs font-medium ${n.sentiment === "positive" ? "text-green-500" : "text-red-500"}`}>
                {n.sentiment === "positive" ? "? Bullish" : "? Bearish"}
              </span>
              <span className={`text-xs ${theme.subtext}`}>{n.time}</span>
            </div>
            <p className={`text-sm font-medium ${theme.text}`}>{n.title}</p>
            <p className={`text-xs ${theme.subtext} mt-1`}>{n.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== AI PREDICTION ====================
function AIPrediction({ symbol, theme }: { symbol: string; theme: any }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { API.get(`/ai/predict/${symbol}`).then((r) => setData(r.data)).catch(() => {}); }, [symbol]);
  if (!data || data.error) return null;
  const signalColor = data.signal === "BUY" ? "text-green-500 bg-green-100" : data.signal === "SELL" ? "text-red-500 bg-red-100" : "text-yellow-500 bg-yellow-100";
  return (
    <div className={`${theme.card} p-4 rounded-xl border ${theme.border}`}>
      <h3 className={`${theme.text} font-bold mb-3 text-sm`}>AI Prediction - {symbol}</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-3 rounded-xl text-center ${signalColor}`}>
          <p className="text-xs opacity-70">Signal</p>
          <p className="font-bold text-xl">{data.signal}</p>
          <p className="text-xs opacity-70">{data.signal_strength}</p>
        </div>
        <div className={`${theme.input} p-3 rounded-xl text-center`}>
          <p className={`${theme.subtext} text-xs`}>Trend</p>
          <p className={`font-bold text-xl ${data.trend >= 0 ? "text-green-500" : "text-red-500"}`}>{data.trend >= 0 ? "+" : ""}{data.trend}%</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className={`${theme.input} p-2 rounded-lg text-center`}><p className={`${theme.subtext} text-xs`}>Support</p><p className={`${theme.text} text-xs font-bold`}>${data.support}</p></div>
        <div className={`${theme.input} p-2 rounded-lg text-center`}><p className={`${theme.subtext} text-xs`}>Resistance</p><p className={`${theme.text} text-xs font-bold`}>${data.resistance}</p></div>
        <div className={`${theme.input} p-2 rounded-lg text-center`}><p className={`${theme.subtext} text-xs`}>Volatility</p><p className={`${theme.text} text-xs font-bold`}>{data.volatility}%</p></div>
      </div>
      <p className={`${theme.subtext} text-xs mb-2`}>7 Days Forecast:</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data.predicted_7day}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border === "border-slate-700" ? "#334155" : "#e5e7eb"} />
          <XAxis dataKey="day" tick={{ fill: theme.subtext === "text-slate-400" ? "#94a3b8" : "#6b7280", fontSize: 9 }} tickFormatter={(v) => `D${v}`} />
          <YAxis tick={{ fill: theme.subtext === "text-slate-400" ? "#94a3b8" : "#6b7280", fontSize: 9 }} domain={["auto", "auto"]} width={45} />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", fontSize: "11px", color: "white" }} />
          <Line type="monotone" dataKey="predicted_price" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==================== PORTFOLIO ====================
function PortfolioSection({ theme }: { theme: any }) {
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
      setMsg(`${symbol.toUpperCase()} added to portfolio!`);
      setSymbol(""); setQuantity(""); setBuyPrice("");
      fetchPortfolio();
    } catch { setMsg("Error occurred!"); }
  };
  return (
    <div className="space-y-3">
      <div className={`${theme.card} p-4 rounded-xl border ${theme.border}`}>
        <h3 className={`${theme.text} font-bold mb-3 text-sm`}>Buy Stock</h3>
        <div className="space-y-2">
          <input className={`w-full ${theme.input} ${theme.text} p-2.5 rounded-xl outline-none text-sm border ${theme.border}`} placeholder="Symbol (AAPL)" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          <div className="flex gap-2">
            <input className={`flex-1 ${theme.input} ${theme.text} p-2.5 rounded-xl outline-none text-sm border ${theme.border}`} placeholder="Qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <input className={`flex-1 ${theme.input} ${theme.text} p-2.5 rounded-xl outline-none text-sm border ${theme.border}`} placeholder="Price" type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
          </div>
          <button onClick={handleBuy} className="w-full font-bold p-2.5 rounded-xl text-sm transition-all active:scale-95 text-white" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>Buy</button>
        </div>
        {msg && <p className="text-yellow-500 text-xs mt-2">{msg}</p>}
      </div>
      {portfolio && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className={`${theme.card} p-3 rounded-xl text-center border ${theme.border}`}><p className={`${theme.subtext} text-xs`}>Invested</p><p className={`${theme.text} font-bold text-sm`}>${portfolio.total_invested}</p></div>
            <div className={`${theme.card} p-3 rounded-xl text-center border ${theme.border}`}><p className={`${theme.subtext} text-xs`}>Value</p><p className={`${theme.text} font-bold text-sm`}>${portfolio.total_current_value}</p></div>
            <div className={`${theme.card} p-3 rounded-xl text-center border ${theme.border}`}><p className={`${theme.subtext} text-xs`}>P&L</p><p className={`font-bold text-sm ${portfolio.total_profit_loss >= 0 ? "text-green-500" : "text-red-500"}`}>{portfolio.total_profit_loss >= 0 ? "+" : ""}${portfolio.total_profit_loss}</p></div>
          </div>
          <div className="space-y-2">
            {portfolio.holdings.map((h: any) => (
              <div key={h.id} className={`${theme.card} p-3 rounded-xl border ${theme.border}`}>
                <div className="flex justify-between items-center">
                  <div><span className={`${theme.text} font-bold`}>{h.symbol}</span><span className={`${theme.subtext} text-xs ml-2`}>{h.quantity} shares</span></div>
                  <button onClick={async () => { await portfolioAPI.sellStock(h.id); fetchPortfolio(); }} className="bg-red-500 active:bg-red-700 active:scale-95 text-white text-xs px-2.5 py-1 rounded-lg transition-all">Sell</button>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className={theme.subtext}>Buy: <span className={theme.text}>${h.buy_price}</span></span>
                  <span className={theme.subtext}>Now: <span className={theme.text}>${h.current_price}</span></span>
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

// ==================== BOTTOM NAV ====================
function BottomNav({ active, onChange, theme }: { active: string; onChange: (tab: string) => void; theme: any }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 ${theme.nav} border-t flex z-50`}>
      {[{ id: "market", icon: "M", label: "Market" }, { id: "news", icon: "N", label: "News" }, { id: "portfolio", icon: "P", label: "Portfolio" }].map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition active:scale-95 ${active === tab.id ? "text-yellow-500" : theme.subtext}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active === tab.id ? "bg-yellow-500 text-white" : ""}`}>{tab.icon}</span>
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("market");
  const [chartSymbol, setChartSymbol] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [isDark, setIsDark] = useState(true);
  const { prices, connected } = useStockWebSocket();
  const watchlist = ["AAPL", "TSLA", "MSFT", "NVDA"];
  const theme = isDark ? themes.dark : themes.light;

  return (
    <div className={`min-h-screen ${theme.bg} pb-20`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${theme.header} border-b px-4 py-3 flex justify-between items-center`}>
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
          {/* Dark/Light Toggle */}
          <button onClick={() => setIsDark(!isDark)}
            className={`w-10 h-6 rounded-full transition-all duration-300 relative ${isDark ? "bg-yellow-500" : "bg-gray-300"}`}>
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${isDark ? "left-5" : "left-1"}`} />
          </button>
          <button onClick={onLogout} className={`${theme.subtext} text-xs ${theme.card} px-3 py-1.5 rounded-lg active:scale-95 transition-all border ${theme.border}`}>Logout</button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {activeTab === "market" && (
          <>
            <div>
              <p className={`${theme.subtext} text-xs uppercase tracking-wider mb-2`}>
                Watchlist {connected && <span className="text-yellow-500">? Live</span>}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {watchlist.map((s) => <StockCard key={s} symbol={s} wsPrice={prices[s]} onClick={() => setChartSymbol(s)} active={chartSymbol === s} theme={theme} />)}
              </div>
            </div>
            <div className="flex gap-2">
              <input className={`flex-1 ${theme.input} ${theme.text} p-2.5 rounded-xl outline-none border ${theme.border} text-sm`} placeholder="Search symbol..." value={searchInput} onChange={(e) => setSearchInput(e.target.value.toUpperCase())} />
              <button onClick={() => setChartSymbol(searchInput)} className="text-white px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>Go</button>
            </div>
            <StockChart symbol={chartSymbol} theme={theme} chartType={isDark ? "dark" : "light"} />
            <AIPrediction symbol={chartSymbol} theme={theme} />
          </>
        )}
        {activeTab === "news" && <NewsFeed symbol={chartSymbol} theme={theme} />}
        {activeTab === "portfolio" && <PortfolioSection theme={theme} />}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} theme={theme} />
    </div>
  );
}

// ==================== ROOT ====================
export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  return loggedIn ? (
    <Dashboard onLogout={() => { localStorage.removeItem("token"); setLoggedIn(false); }} />
  ) : (
    <LoginPage onLogin={() => setLoggedIn(true)} />
  );
}
