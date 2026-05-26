"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CONSTANTS } from "../constants";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  
  // Form durumları
  const [buyer, setBuyer] = useState("");
  const [amount, setAmount] = useState("");
  const [escrowIdInput, setEscrowIdInput] = useState("");

  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Sözleşmeden veri okuma (Örnek: Toplam Escrow Sayısı)
  const { data: totalEscrows } = useReadContract({
    address: CONSTANTS.CONTRACT_ADDRESS,
    abi: CONSTANTS.ABI,
    functionName: "totalEscrows",
  });

  // Güvenli Escrow Oluşturma Fonksiyonu
  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer || !amount) return;

    try {
      writeContract({
        address: CONSTANTS.CONTRACT_ADDRESS,
        abi: CONSTANTS.ABI,
        functionName: "createEscrow",
        args: [buyer],
        value: parseUnits(amount, 18), // POL cinsinden token miktarı
      });
    } catch (err) {
      console.error("İşlem başlatılamadı:", err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Safe Bridge
          </h1>
          <p className="text-sm text-slate-400 mt-1">Merkeziyetsiz Güvenli Alışveriş Paneli</p>
        </div>
        <div>
          <w3m-button />
        </div>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sol Kolon: İşlem Yapma Formu */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Yeni Güvence (Escrow) Oluştur</h2>
          
          <form onSubmit={handleCreateEscrow} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Alıcı (Buyer) Cüzdan Adresi
              </label>
              <input
                type="text"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Güvence Miktarı (POL)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!isConnected || isConfirming}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-medium rounded-xl py-3 text-sm transition-all shadow-lg shadow-blue-500/10"
            >
              {isConfirming ? "İşlem Onaylanıyor..." : "Güvenceli Ödemeyi Başlat"}
            </button>
          </form>

          {isSuccess && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
              Sözleşme başarıyla oluşturuldu! Hash: <span className="font-mono break-all">{hash}</span>
            </div>
          )}
        </section>

        {/* Sağ Kolon: Durum Bilgileri */}
        <section className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Cüzdan Bilgileriniz</h2>
            {isConnected ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Adres:</span>
                  <span className="font-mono text-xs">{address?.slice(0,6)}...{address?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bakiye:</span>
                  <span>{balanceData ? `${Number(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : "Yükleniyor..."}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Lütfen sağ üstten cüzdanınızı bağlayın.</p>
            )}
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-3 text-slate-200">Ağ İstatistikleri</h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Toplam Escrow İşlemi:</span>
              <span className="font-bold text-blue-400">{totalEscrows ? totalEscrows.toString() : "0"}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}