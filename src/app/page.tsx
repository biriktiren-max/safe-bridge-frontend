"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";

// 💰 HAZİNE KASASI AKILLI KONTRAT BİLGİLERİ
const CONTRACT_ADDRESS = "0x9e88A41c8888b5D65A0D23055e810594D024f227";
const CONTRACT_ABI = [
  "function getTransferHistory() view returns (tuple(uint256 timestamp, string tokenType, uint256 amount, string status)[])"
];

export default function HomePage() {
  const [account, setAccount] = useState("");
  const [vaultBalance, setVaultBalance] = useState("0.00");
  const [status, setStatus] = useState("");

  // 🔒 Kasaya Bağlanma ve Canlı Komisyon Sensörü
  const connectAndFetchVault = async () => {
    if (!window.ethereum) {
      alert("MetaMask yüklü değil! Lütfen tarayıcınıza ekleyin.");
      return;
    }
    try {
      setStatus("⏳ Güvenli hat kuruluyor...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      
      // NOT: Burada ilerleyen aşamada kontrattan komisyon bakiyesini çeken gerçek fonksiyonu tetikleyeceğiz
      // Şimdilik sistemin çalıştığını doğrulamak adına simüle bir veri okuyoruz.
      setVaultBalance("145.50"); 
      setStatus("🟢 Güvenli bağlantı sağlandı. Kasa sensörleri aktif!");
    } catch (err) {
      console.error("Bağlantı hatası:", err);
      setStatus("❌ Bağlantı reddedildi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Üst Logo ve Başlık */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          SafeBridge Global 🦅
        </h1>
        <p className="text-gray-400 mt-3 text-lg font-medium">
          Merkeziyetsiz Web3 Güvenli Finans ve Ticaret Merkezi
        </p>
      </div>

      {/* 💰 MERKEZİ HAZİNE HAVUZU (YÖNETİCİ KASASI) */}
      <div className="w-full max-w-3xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/40 p-8 rounded-3xl shadow-2xl mb-12 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Merkezi Hazine Havuzu (Toplam Komisyon)
            </span>
            <h2 className="text-5xl font-mono font-black text-white mt-2 tracking-tight">
              {vaultBalance} <span className="text-xl font-semibold text-gray-500">USDT</span>
            </h2>
          </div>
          
          <div>
            {!account ? (
              <button 
                onClick={connectAndFetchVault}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-sm active:scale-95"
              >
                🔒 Kasayı Güvenceye Al & Bağlan
              </button>
            ) : (
              <div className="text-right">
                <p className="text-xs text-green-400 font-semibold bg-green-950/50 border border-green-800/50 px-3 py-1.5 rounded-xl text-center">
                  ⚙️ Yönetici Bağlı
                </p>
                <p className="text-[10px] font-mono text-gray-400 mt-2 truncate w-40">
                  {account}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {status && (
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-slate-800 text-center font-medium">
            {status}
          </p>
        )}
      </div>

      {/* 🏛️ İKİ BÜYÜK UYGULAMA KAPISI (MODÜLLER) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        
        {/* 🚀 1. UYGULAMA: ANLIK GÜVENLİ TRANSFER */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl hover:border-blue-500/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 w-fit">🚀</div>
            <h3 className="text-2xl font-bold text-white mb-2">Anlık Güvenli Transfer</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              3 katmanlı güvenlik zırhı ile hatalı adres, yanlış ağ ve yetersiz bakiye korumalı, ışık hızında kripto varlık gönderim modülü.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/transfer">
              <span className="block w-full bg-slate-800 hover:bg-blue-600 text-center text-white font-bold py-3 px-4 rounded-xl transition-all text-sm cursor-pointer">
                Uygulamaya Giriş Yap →
              </span>
            </Link>
          </div>
        </div>

        {/* 🤝 2. UYGULAMA: ESCROW GÜVENCELİ TİCARET */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
          <div>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 w-fit">🤝</div>
            <h3 className="text-2xl font-bold text-white mb-2">Güvenli Ticaret (Escrow)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Alıcı ve satıcıyı koruyan emanet kasa sistema. Para akıllı sözleşmede kilitlenir, ticaret güvenle tamamlanınca serbest kalır.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/escrow">
              <span className="block w-full bg-slate-800 hover:bg-emerald-600 text-center text-white font-bold py-3 px-4 rounded-xl transition-all text-sm cursor-pointer">
                Uygulamaya Giriş Yap →
              </span>
            </Link>
          </div>
        </div>

      </div>

      {/* Alt Bilgi */}
      <div className="mt-16 text-gray-600 text-xs font-mono">
        SafeBridge v2.0.0 • Hoşdere Montaj Hattı Disipliniyle Üretilmiştir 🛠️
      </div>

    </div>
  );
}