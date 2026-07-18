import React, { useState, useEffect, useRef } from "react";
import { stockAPI, portfolioAPI } from "./api";
import { LoginPage } from "./LoginPage";
import { LandingPage } from "./LandingPage";
import { useStockWebSocket } from "./useWebSocket";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, Scatter } from "recharts";
import axios from "axios";

const API = axios.create({ baseURL: "https://stock-analytics-production-3827.up.railway.app/api/v1" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STOCK_LIST = [
  { symbol: "AAPL", name: "Apple Inc" },
  { symbol: "TSLA", name: "Tesla Inc" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "WIPRO.NS", name: "Wipro" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
  { symbol: "ZOMATO.NS", name: "Zomato" },
];

// ==================== STOCK SEARCH ====================
function StockSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("recentSearches") || "[]"); } catch { return []; }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("watchlist") || '["AAPL","TSLA","MSFT","NVDA"]'); } catch { return ["AAPL","TSLA","MSFT","NVDA"]; }
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = STOCK_LIST.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(query.length === 0 && recentSearches.length > 0);
    }
  }, [query]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery(symbol);
    setShowDropdown(false);
    const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const addToWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!watchlist.includes(symbol)) {
      const updated = [...watchlist, symbol];
      setWatchlist(updated);
      localStorage.setItem("watchlist", JSON.stringify(updated));
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-slate-800 text-white p-2.5 rounded-xl outline-none border border-slate-700 text-sm"
          placeholder="Search stocks... (AAPL, Tesla, Reliance)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        <button onClick={() => { if(query) handleSelect(query.toUpperCase()); }} className="text-white px-4 py-2.5 rounded-xl text-sm font-bold" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>Go</button>
      </div>

      {showDropdown && (
        <div style={{
          position: "absolute", top: "110%", left: 0, right: 0, zIndex: 50,
          background: "#1e293b", border: "1px solid #334155", borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)", overflow: "hidden",
        }}>
          {query.length === 0 && recentSearches.length > 0 && (
            <div>
              <p style={{ color: "#64748b", fontSize: "11px", padding: "8px 12px 4px" }}>Recent Searches</p>
              {recentSearches.map((s) => (
                <div key={s} onClick={() => handleSelect(s)} style={{ padding: "10px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  className="hover:bg-slate-700">
                  <span style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>{s}</span>
                  <span style={{ color: "#64748b", fontSize: "11px" }}>Recent</span>
                </div>
              ))}
            </div>
          )}
          {suggestions.map((s) => (
            <div key={s.symbol} onClick={() => handleSelect(s.symbol)} style={{ padding: "10px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              className="hover:bg-slate-700">
              <div>
                <span style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "700" }}>{s.symbol}</span>
                <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "8px" }}>{s.name}</span>
              </div>
              <button onClick={(e) => addToWatchlist(s.symbol, e)} style={{
                background: watchlist.includes(s.symbol) ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                color: watchlist.includes(s.symbol) ? "#22c55e" : "#f59e0b",
                border: "none", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", cursor: "pointer",
              }}>
                {watchlist.includes(s.symbol) ? "Added" : "+ Watchlist"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADVANCED CHART ====================
function AdvancedChart({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"area" | "line" | "bar">("area");
  const [period, setPeriod] = useState("1mo");

  const periods = [
    { label: "1D", value: "1d" },
    { label: "1W", value: "5d" },
    { label: "1M", value: "1mo" },
    { label: "1Y", value: "12mo" },
  ];

  useEffect(() => {
    setLoading(true);
    stockAPI.getHistory(symbol, period).then((r) => { setHistory(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [symbol, period]);

  const chartData = [...history].reverse();

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-sm">{symbol} Chart</h3>
        <div className="flex gap-1">
          {["area", "line", "bar"].map((t) => (
            <button key={t} onClick={() => setChartType(t as any)} style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
              background: chartType === t ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.05)",
              color: chartType === t ? "white" : "#94a3b8", border: "none",
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {periods.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)} style={{
            padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
            background: period === p.value ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.05)",
            color: period === p.value ? "white" : "#94a3b8", border: "none",
          }}>{p.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center"><p className="text-slate-400 text-xs">Loading...</p></div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => v.slice(5)} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} domain={["auto", "auto"]} width={50} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "white" }} />
              <Area type="monotone" dataKey="close" stroke="#f59e0b" fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => v.slice(5)} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} domain={["auto", "auto"]} width={50} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "white" }} />
              <Line type="monotone" dataKey="close" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="open" stroke="#64748b" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => v.slice(5)} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} domain={["auto", "auto"]} width={50} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "white" }} />
              <Bar dataKey="close" fill="#f59e0b" opacity={0.8} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}

      {/* Volume */}
      {!loading && chartData.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Volume</p>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={chartData}>
              <Bar dataKey="volume" fill="#334155" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", fontSize: "11px", color: "white" }} formatter={(v: any) => [v.toLocaleString(), "Volume"]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ==================== AI ANALYSIS ====================
function AIAnalysis({ symbol }: { symbol: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`/ai/analyze/${symbol}`),
      API.get(`/ai/predict/${symbol}`),
    ]).then(([a, p]) => {
      setAnalysis(a.data);
      setPrediction(p.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-32 flex items-center justify-center">
      <p className="text-slate-400 text-sm">AI analyzing {symbol}...</p>
    </div>
  );

  if (!analysis) return null;

  const trendColor = analysis.trend_color === "green" ? "#22c55e" : analysis.trend_color === "red" ? "#ef4444" : "#f59e0b";
  const suggColor = analysis.suggestion === "Buy" ? "#22c55e" : analysis.suggestion === "Sell" ? "#ef4444" : "#f59e0b";

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-white font-bold mb-3 text-sm">AI Analysis - {symbol}</h3>

      <div className="flex gap-1 mb-3">
        {["analysis", "prediction", "sentiment"].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
            background: activeTab === t ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.05)",
            color: activeTab === t ? "white" : "#94a3b8", border: "none", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {activeTab === "analysis" && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div style={{ background: `${trendColor}20`, border: `1px solid ${trendColor}40`, borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: "11px", margin: "0 0 4px" }}>Trend</p>
              <p style={{ color: trendColor, fontWeight: "700", fontSize: "18px", margin: 0 }}>{analysis.trend_label}</p>
            </div>
            <div style={{ background: `${suggColor}20`, border: `1px solid ${suggColor}40`, borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: "11px", margin: "0 0 4px" }}>Suggestion</p>
              <p style={{ color: suggColor, fontWeight: "700", fontSize: "18px", margin: 0 }}>{analysis.suggestion}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">Risk</p><p className="text-white text-xs font-bold">{analysis.risk}</p></div>
            <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">Support</p><p className="text-white text-xs font-bold">${analysis.support}</p></div>
            <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">Resistance</p><p className="text-white text-xs font-bold">${analysis.resistance}</p></div>
            <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">RSI</p><p className="text-white text-xs font-bold">{analysis.rsi}</p></div>
            <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">MA5</p><p className="text-white text-xs font-bold">${analysis.ma5}</p></div>
            <div className="bg-slate-700 p-2 rounded-lg text-center"><p className="text-slate-400 text-xs">MA20</p><p className="text-white text-xs font-bold">${analysis.ma20}</p></div>
          </div>
        </>
      )}

      {activeTab === "prediction" && prediction && !prediction.error && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-700 p-3 rounded-xl text-center">
              <p className="text-slate-400 text-xs">Signal</p>
              <p className={`font-bold text-lg ${prediction.signal === "BUY" ? "text-green-500" : prediction.signal === "SELL" ? "text-red-500" : "text-yellow-500"}`}>{prediction.signal}</p>
            </div>
            <div className="bg-slate-700 p-3 rounded-xl text-center">
              <p className="text-slate-400 text-xs">Trend</p>
              <p className={`font-bold text-lg ${prediction.trend >= 0 ? "text-green-500" : "text-red-500"}`}>{prediction.trend >= 0 ? "+" : ""}{prediction.trend}%</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs mb-2">7 Days Forecast:</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={prediction.predicted_7day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v) => `D${v}`} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} domain={["auto", "auto"]} width={50} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", fontSize: "11px", color: "white" }} />
              <Line type="monotone" dataKey="predicted_price" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {prediction.predicted_7day.filter((_: any, i: number) => [0,2,6].includes(i)).map((d: any) => (
              <div key={d.day} className="bg-slate-700 p-2 rounded-lg text-center">
                <p className="text-slate-400 text-xs">Day {d.day}</p>
                <p className="text-white text-xs font-bold">${d.predicted_price}</p>
                <p className="text-slate-500 text-xs">{d.confidence}%</p>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "sentiment" && analysis.sentiment && (
        <div>
          <div style={{
            background: analysis.sentiment.overall === "Bullish" || analysis.sentiment.overall === "Very Bullish" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${analysis.sentiment.overall === "Bullish" || analysis.sentiment.overall === "Very Bullish" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: "12px", padding: "12px", textAlign: "center", marginBottom: "12px",
          }}>
            <p className="text-slate-400 text-xs mb-1">Overall Sentiment</p>
            <p style={{ color: analysis.sentiment.overall === "Bullish" || analysis.sentiment.overall === "Very Bullish" ? "#22c55e" : "#ef4444", fontWeight: "700", fontSize: "20px" }}>
              {analysis.sentiment.overall}
            </p>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-500 font-medium">Positive</span>
                <span className="text-green-500">{analysis.sentiment.positive}%</span>
              </div>
              <div style={{ background: "#334155", borderRadius: "4px", height: "8px" }}>
                <div style={{ background: "#22c55e", width: `${analysis.sentiment.positive}%`, height: "100%", borderRadius: "4px" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-500 font-medium">Negative</span>
                <span className="text-red-500">{analysis.sentiment.negative}%</span>
              </div>
              <div style={{ background: "#334155", borderRadius: "4px", height: "8px" }}>
                <div style={{ background: "#ef4444", width: `${analysis.sentiment.negative}%`, height: "100%", borderRadius: "4px" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Neutral</span>
                <span className="text-slate-400">{analysis.sentiment.neutral}%</span>
              </div>
              <div style={{ background: "#334155", borderRadius: "4px", height: "8px" }}>
                <div style={{ background: "#64748b", width: `${analysis.sentiment.neutral}%`, height: "100%", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STOCK SCREENER ====================
function StockScreener({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [filters, setFilters] = useState({ min_market_cap: 0, max_pe: 999, min_growth: 0, min_dividend: 0, sector: "" });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runScreener = async () => {
    setLoading(true);
    try {
      const r = await API.get("/ai/screener", { params: filters });
      setResults(r.data.results);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { runScreener(); }, []);

  return (
    <div className="space-y-3">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h3 className="text-white font-bold mb-3 text-sm">Stock Screener</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-slate-400 text-xs mb-1">Min Market Cap (B)</p>
            <input type="number" className="w-full bg-slate-700 text-white p-2 rounded-lg text-xs border border-slate-600 outline-none"
              value={filters.min_market_cap} onChange={(e) => setFilters({...filters, min_market_cap: +e.target.value})} placeholder="0" />
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Max P/E Ratio</p>
            <input type="number" className="w-full bg-slate-700 text-white p-2 rounded-lg text-xs border border-slate-600 outline-none"
              value={filters.max_pe === 999 ? "" : filters.max_pe} onChange={(e) => setFilters({...filters, max_pe: +e.target.value || 999})} placeholder="Any" />
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Min Growth %</p>
            <input type="number" className="w-full bg-slate-700 text-white p-2 rounded-lg text-xs border border-slate-600 outline-none"
              value={filters.min_growth} onChange={(e) => setFilters({...filters, min_growth: +e.target.value})} placeholder="0" />
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Min Dividend %</p>
            <input type="number" className="w-full bg-slate-700 text-white p-2 rounded-lg text-xs border border-slate-600 outline-none"
              value={filters.min_dividend} onChange={(e) => setFilters({...filters, min_dividend: +e.target.value})} placeholder="0" />
          </div>
        </div>
        <select className="w-full bg-slate-700 text-white p-2 rounded-lg text-xs border border-slate-600 outline-none mb-3"
          value={filters.sector} onChange={(e) => setFilters({...filters, sector: e.target.value})}>
          <option value="">All Sectors</option>
          <option value="Technology">Technology</option>
          <option value="Banking">Banking</option>
          <option value="IT Services">IT Services</option>
          <option value="Automotive">Automotive</option>
          <option value="Conglomerate">Conglomerate</option>
        </select>
        <button onClick={runScreener} className="w-full font-bold p-2.5 rounded-xl text-sm text-white" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>
          {loading ? "Screening..." : "Run Screener"}
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-700">
          <p className="text-white font-bold text-sm">{results.length} Stocks Found</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-2 text-left text-slate-300">Symbol</th>
                <th className="p-2 text-right text-slate-300">Price</th>
                <th className="p-2 text-right text-slate-300">P/E</th>
                <th className="p-2 text-right text-slate-300">Growth</th>
                <th className="p-2 text-right text-slate-300">Div</th>
              </tr>
            </thead>
            <tbody>
              {results.map((s) => (
                <tr key={s.symbol} onClick={() => onSelect(s.symbol)} className="border-t border-slate-700 cursor-pointer hover:bg-slate-700">
                  <td className="p-2">
                    <p style={{ color: "#f59e0b", fontWeight: "700" }}>{s.symbol}</p>
                    <p className="text-slate-500">{s.name.split(" ")[0]}</p>
                  </td>
                  <td className="p-2 text-right text-white">${s.price}</td>
                  <td className="p-2 text-right text-slate-300">{s.pe_ratio}</td>
                  <td className="p-2 text-right text-green-500">+{s.growth}%</td>
                  <td className="p-2 text-right text-blue-400">{s.dividend}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== STOCK CARD ====================
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

// ==================== NOTIFICATION BELL ====================
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
            r.data.notifications.forEach((n: any) => { new Notification("StockAI Alert!", { body: n.message }); });
          }
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { if ("Notification" in window) Notification.requestPermission(); }, []);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setShow(!show)} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "6px 10px", color: "#f59e0b", cursor: "pointer", position: "relative" }}>
        Bell {notifications.length > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>{notifications.length}</span>}
      </button>
      {show && (
        <div style={{ position: "absolute", top: "110%", right: 0, width: "260px", background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "12px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <p style={{ color: "white", fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>Notifications</p>
          {notifications.length === 0 ? <p style={{ color: "#64748b", fontSize: "12px" }}>No alerts yet</p> :
            notifications.map((n, i) => (
              <div key={i} style={{ background: "rgba(245,158,11,0.1)", borderRadius: "8px", padding: "8px", marginBottom: "6px" }}>
                <p style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "600", margin: "0 0 2px" }}>{n.symbol}</p>
                <p style={{ color: "#94a3b8", fontSize: "11px", margin: 0 }}>{n.message}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ==================== PORTFOLIO ====================
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
          <button onClick={handleBuy} className="w-full font-bold p-2.5 rounded-xl text-sm active:scale-95 text-white" style={{background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>Buy</button>
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
                  <button onClick={async () => { await portfolioAPI.sellStock(h.id); fetchPortfolio(); }} className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-lg">Sell</button>
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

// ==================== BOTTOM NAV ====================
function BottomNav({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const tabs = [
    { id: "market", label: "Market" },
    { id: "screener", label: "Screener" },
    { id: "portfolio", label: "Portfolio" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex z-50">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex-1 py-3 flex flex-col items-center transition active:scale-95 ${active === tab.id ? "text-yellow-500" : "text-slate-400"}`}>
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
  const { prices, connected } = useStockWebSocket();
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("watchlist") || '["AAPL","TSLA","RELIANCE.NS","TCS.NS"]'); } catch { return ["AAPL","TSLA","RELIANCE.NS","TCS.NS"]; }
  });

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
                {watchlist.slice(0,4).map((s) => <StockCard key={s} symbol={s} wsPrice={prices[s]} onClick={() => setChartSymbol(s)} active={chartSymbol === s} />)}
              </div>
            </div>
            <StockSearch onSelect={(s) => setChartSymbol(s)} />
            <AdvancedChart symbol={chartSymbol} />
            <AIAnalysis symbol={chartSymbol} />
          </>
        )}
        {activeTab === "screener" && <StockScreener onSelect={(s) => { setChartSymbol(s); setActiveTab("market"); }} />}
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




