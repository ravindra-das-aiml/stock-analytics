import React, { useEffect, useState } from "react";
import { transactionAPI } from "../api";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const res = await transactionAPI.getTransactions();
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <p className="text-slate-400">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h2 className="text-white font-bold text-lg mb-4">
        Transaction History
      </h2>

      {transactions.length === 0 ? (
        <p className="text-slate-400">No transactions found.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t: any) => (
            <div
              key={t.id}
              className="flex justify-between items-center bg-slate-700 rounded-lg p-3"
            >
              <div>
                <p className="text-white font-semibold">{t.symbol}</p>

                <p className="text-slate-400 text-sm">
                  {t.transaction_type.toUpperCase()}
                </p>

                <p className="text-slate-500 text-xs">
                  {new Date(t.created_at).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-white">
                  {t.quantity} Shares
                </p>

                <p className="text-yellow-400">
                  ₹{t.price}
                </p>

                <p className="text-green-400 font-bold">
                  ₹{t.total}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}