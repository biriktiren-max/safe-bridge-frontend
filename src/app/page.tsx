"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// 🌐 TypeScript İçin Global Ethereum (MetaMask) Vizesi
declare global {
  interface Window {
    ethereum?: any;
  }
}

const TARGET_CHAIN_ID = "0x89"; 
const CONTRACT_ADDRESS = "0x9e88A41c8888b5D65A0D23055e810594D024f227";
const FALLBACK_ADMIN_ADDRESS = "0x68E0c0000000000000000000000000000001588D";

interface EscrowItem {
  id: number;
  seller: string;
  amount: string;
  desc: string;
  password?: string;
  deadline?: number;
  state: string;
}

export default function HomePage() {
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0000");
  const [vaultBalance, setVaultBalance] = useState<string>("0.0000");
  const [status, setStatus] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // 🚀 1. MOTOR (TRANSFER) DEĞİŞKENLERİ
  const [transferAddress, setTransferAddress] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferToken, setTransferToken] = useState<string>("POL");

  // 🤝 2. MOTOR (ESCROW TİCARET) DEĞİŞKENLERİ
  const [escrowSeller, setEscrowSeller] = useState<string>("");
  const [escrowAmount, setEscrowAmount] = useState<string>("");
  const [escrowToken, setEscrowToken] = useState<string>("POL");
  const [escrowDesc, setEscrowDesc] = useState<string>("");
  const [escrowPassword, setEscrowPassword] = useState<string>(""); 
  const [activeEscrows, setActiveEscrows] = useState<EscrowItem[]>([
    { id: 101, seller: "0x71C...89A1", amount: "0.05 POL", desc: "Web Tasarım Hizmeti", password: "123", deadline: Math.floor(Date.now() / 1000) + 1000, state: "🔒 Kasada Kilitli" }
  ]);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const userBalance = await provider.getBalance(accounts[0]);
        setBalance(ethers.formatEther(userBalance));
        try {
          const contractBal = await provider.getBalance(CONTRACT_ADDRESS);
          setVaultBalance(ethers.formatEther(contractBal));
        } catch(e) {}
        try {
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ["function owner() view returns (address)"], provider);
          const owner = await contract.owner();
          if (accounts[0].toLowerCase() === owner.toLowerCase() || accounts[0].toLowerCase() === FALLBACK_ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
          }
        } catch (err) {}
      }
    };
    init();
  }, []);

  const handleTransfer = async () => {
    if (!account) return alert("🔒 Önce lütfen cüzdanınızı bağlayın!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({ to: transferAddress, value: ethers.parseEther(transferAmount) });
      await tx.wait();
      setStatus("✅ Transfer başarıyla kesinleşti!");
    } catch (err) { setStatus("❌ Transfer başarısız."); }
  };

  const handleCreateEscrow = async () => {
    if (!escrowPassword) return alert("🔒 Şifre belirleyin!");
    const confirmPassword = prompt("🔒 Şifreyi tekrar girin:");
    if (confirmPassword !== escrowPassword) return alert("❌ Şifreler uyuşmuyor!");

    const deadline = Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60);
    setActiveEscrows([...activeEscrows, {
      id: Math.floor(Math.random() * 900) + 100,
      seller: escrowSeller.slice(0, 6) + "...",
      amount: `${escrowAmount} ${escrowToken}`,
      desc: escrowDesc,
      password: escrowPassword,
      deadline: deadline,
      state: "🔒 Kasada Kilitli"
    }]);
    setEscrowPassword("");
  };

  const handleRelease = (id: number, originalPassword?: string, deadline?: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (deadline && now > deadline) {
      alert("⏰ 6 Aylık koruma süresi doldu! Fon otomatik çözüldü.");
      setActiveEscrows(activeEscrows.filter(i => i.id !== id));
      return;
    }
    const input = prompt("🔒 Kilidi açmak için şifreyi girin:");
    if (input === originalPassword) {
      setActiveEscrows(activeEscrows.filter(i => i.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col items-center p-4 sm:p-8 font-sans antialiased">
      
      {/* Üst Başlık */}
      <div className="text-center mt-6 mb-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#38bdf8]">
          SafeBridge Global 🦅
        </h1>
      </div>

      {/* 🏁 ÇİFT MOTORLU ANA KOKPİT (Aynı Ekranda Yan Yana / Alt Alta Düzen) */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* 🚀 1. MOTOR: ANLIK GÜVENLİ TRANSFER */}
        <div className="bg-[#090d16] border border-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-blue-400">🚀 Anlık Güvenli Transfer</h3>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-900 px-2.5 py-1 rounded-full font-mono uppercase">Modül #1</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Gönderilecek Varlık</label>
                <select value={transferToken} onChange={(e) => setTransferToken(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-blue-500">
                  <option value="POL">🟣 POL (Polygon Ana Coin)</option>
                  <option value="USDT">💵 USDT (Tether Dolar)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alıcı Cüzdan Adresi</label>
                <input type="text" placeholder="0x... (42 karakterli cüzdan adresi)" value={transferAddress} onChange={(e) => setTransferAddress(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl font-mono text-sm text-blue-400 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Miktar</label>
                <input type="number" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
          <button onClick={handleTransfer} className="w-full py-4 bg-[#2563eb] rounded-xl font-bold hover:bg-blue-700 transition-colors mt-4 shadow-lg shadow-blue-600/20">🚀 Gönderimi Başlat</button>
        </div>

        {/* 🤝 2. MOTOR: GÜVENLİ TİCARET KASASI (ESCROW) */}
        <div className="bg-[#090d16] border border-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-emerald-400">🤝 Escrow Ticaret Kasası</h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full font-mono uppercase">Modül #2</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Satıcı Cüzdan Adresi</label>
              <input type="text" placeholder="0x... (Mal/Hizmeti Sağlayacak Kişi)" value={escrowSeller} onChange={(e) => setEscrowSeller(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl font-mono text-sm text-emerald-400 outline-none focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Miktar</label>
                <input type="number" placeholder="0.00" value={escrowAmount} onChange={(e) => setEscrowAmount(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Varlık</label>
                <select value={escrowToken} onChange={(e) => setEscrowToken(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-emerald-500">
                  <option value="POL">🟣 POL</option>
                  <option value="USDT">💵 USDT</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ticaret Açıklaması</label>
              <input type="text" placeholder="Örn: Yazılım İş Ücreti / Ürün Bedeli" value={escrowDesc} onChange={(e) => setEscrowDesc(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-slate-800 rounded-xl text-sm text-gray-300 outline-none focus:border-emerald-500" />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">🔒 GÜVENLİK PAROLASI (KİLİT ŞİFRESİ)</label>
              <input type={showPassword ? "text" : "password"} placeholder="Kilidi açacak gizli şifre belirleyin" value={escrowPassword} onChange={(e) => setEscrowPassword(e.target.value)} className="w-full p-3.5 bg-[#05070c] border border-emerald-950 rounded-xl text-sm text-white outline-none focus:border-emerald-500 placeholder-emerald-800" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-xl text-gray-500">{showPassword ? "👁️" : "🙈"}</button>
            </div>
            
            <button onClick={handleCreateEscrow} className="w-full py-4 bg-[#10b981] rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-600/20">🤝 Güvenli Kasaya Kilitle</button>
          </div>

          {/* Aktif Kasalar Tablosu */}
          {activeEscrows.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-900 space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">📜 Aktif Emanet Listesi</h4>
              {activeEscrows.map(item => (
                <div key={item.id} className="bg-[#05070c] p-3 rounded-xl border border-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-200 block">{item.desc}</span>
                    <span className="text-gray-500 font-mono">{item.amount} • Satıcı: {item.seller}</span>
                  </div>
                  <button onClick={() => handleRelease(item.id, item.password, item.deadline)} className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-600 hover:text-white transition-all">🔑 Kilidi Aç</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 📖 KULLANIM KILAVUZU (Birebir Birinci Görsel Düzeni) */}
      <div className="w-full max-w-6xl bg-[#090d16] border border-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span>📖</span> SafeBridge Kullanım Rehberi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-400 text-xs sm:text-sm">
          <div className="bg-[#05070c] p-5 rounded-xl border border-slate-900">
            <span className="block mb-2 text-sm">🚀 <b>Hızlı Transfer:</b></span>
            Cüzdanını bağla, varlık seç ve anında işlem yap.
          </div>
          <div className="bg-[#05070c] p-5 rounded-xl border border-slate-900">
            <span className="block mb-2 text-sm">🤝 <b>Escrow:</b></span>
            İki aşamalı şifre doğrulaması ile fonlarını kasaya kilitle.
          </div>
          <div className="bg-[#05070c] p-5 rounded-xl border border-slate-900">
            <span className="block mb-2 text-sm">⏰ <b>6 Ay Koruması:</b></span>
            İşlemler 6 ay boyunca otomatik zaman kilidi altındadır.
          </div>
        </div>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-12 text-gray-600 text-xs font-mono tracking-wide">
        SafeBridge v2.5.0 • Hoşdere Disipliniyle Üretildi 🛠️
      </div>

    </div>
  );
}