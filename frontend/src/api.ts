import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://stock-analytics-20si.onrender.com";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: any) => API.post("/auth/register", data),
  login: (email: string, password: string) => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    return API.post("/auth/login", form);
  },
};

export const stockAPI = {
  getStock: (symbol: string) => API.get(`/stocks/${symbol}`),
  getHistory: (symbol: string, period: string = "1mo") =>
    API.get(`/stocks/${symbol}/history?period=${period}`),
  search: (q: string) => API.get(`/stocks/search?q=${q}`),
};

export const portfolioAPI = {
  getPortfolio: () => API.get("/portfolio/"),
  buyStock: (data: any) => API.post("/portfolio/buy", data),
  sellStock: (id: number) => API.delete(`/portfolio/${id}`),
};

export default API;

