import { useState, useEffect, useRef } from "react";

interface StockPrice {
  price: number;
  change: number;
  change_percent: string;
}

interface PriceData {
  [symbol: string]: StockPrice;
}

export function useStockWebSocket() {
  const [prices, setPrices] = useState<PriceData>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8000/ws/stocks");
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected!");
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "price_update") {
          setPrices(msg.data);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { prices, connected };
}
