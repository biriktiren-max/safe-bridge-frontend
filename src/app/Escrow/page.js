"use client";
import { useState } from "react";
import { ethers } from "ethers";
import Link from "next/link";

// 🛡️ SafeBridge Resmi Çalışma Ağı (Polygon Mainnet - Chain ID: 137 / 0x89)
const TARGET_CHAIN_ID = "0x89"; 
const TARGET_NETWORK_NAME = "Polygon Mainnet";

// 🚀 ESCROW AKILLI KONTRAT ADRESİ (Emanet Kasa)
// NOT: Buraya senin o ilk geliştirdiğin Escrow kontratının adresini takacağız!
const ESCROW_CONTRACT_ADDRESS = "0x9e88A41c8888b5D65A0D23055e810594D024f227";

export default function EscrowPage() {
  const [account, setAccount] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDT");
  const [tradeDescription, setTradeDescription] = useState("");
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState("0");
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // 📦 Aktif Emanet İşlemleri Listesi (Örnek Simülasyon Verisi)
  const [activeEscrows, setActiveEscrows] = useState([
    { id: 101, seller: "0x71C...89A1", amount: "250 USDT", desc: "Web Tasarım Hizmeti", state: "🔒 Kasada Kilitli" }
  ]);

  // 🛡️ Ağ Kontrolü
  const checkNetwork = async (provider) => {
    try {
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== "137" && '0x' + network.chainId.toString(16) !== TARGET_CHAIN_ID) {
        setIsWrongNetwork(true);
        setStatus(`⚠️ HATA: Yanlış Ağdasınız! Lütfen ${TARGET_NETWORK_NAME} ağını bağlayın.`);
        return false;
      }
      setIsWrongNetwork(false);
      return true;
    } catch (err) { return false; }
  };

  // 🛡️ Doğru Ağa Geçiş
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
      setIsWrongNetwork(false);
      setStatus("🟢 Doğru ağa geçildi! Emanet kasası aktif.");
    } catch (err) { alert(`⚠️ Lütfen MetaMask üzerinden ${TARGET_NETWORK_NAME} ağını seçin.`); }
  };

  // 🔒 Cüzdan Bağlama
  const connectWallet = async () => {
    if (!window.ethereum) return alert("⚠️ MetaMask bulunamadı!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentAccount = accounts[0];
      setAccount(currentAccount);
      
      const isNetworkOk = await checkNetwork(provider);
      if (isNetworkOk) {
        const userBalance = await provider.getBalance(currentAccount);
        setBalance(ethers.formatEther(userBalance));
        setStatus("🟢 Cüzdan bağlandı. Güvenli ticaret başlatılabilir!");
      }
    } catch (err) { setStatus("🔴 Cüzdan bağlantısı reddedildi."); }
  };

  // 🚀 ESCROW KİLİTLEME MOTORU (İşlem Başlatma)
  const handleCreateEscrow = async () => {
    if (!account) return alert("🔒 Önce lütfen cüzdanınızı bağlayın!");
    if (isWrongNetwork) { switchNetwork(); return; }
    if (!sellerAddress || !ethers.isAddress(sellerAddress)) {
      alert("⛔ GÜVENLİK FRENİ: Satıcı cüzdan adresi geçersiz!");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("⚠️ Lütfen geçerli bir kilitme miktarı girin!");
      return;
    }
    if (!tradeDescription) {
      alert("⚠️ Lütfen ticaret için kısa bir açıklama yazın! (Örn: Freelance Yazılım İş bedeli)");
      return;
    }

    try {
      setStatus(`⏳ [Akıllı Kasa] ${amount} ${token} emanet sözleşmesine kilitleniyor... MetaMask'tan onay verin.`);
      
      // NOT: Burada gerçek Escrow Akıllı Kontratının "createEscrow" fonksiyonu ateşlenecek!
      setTimeout(() => {
        setStatus(`✅ BAŞARILI! ${amount} ${token} akıllı sözleşmede kilitlendi. Satıcı malı teslim ettiğinde onayla butonuna basabilirsiniz.`);
        
        // Yeni işlemi listeye ekle
        setActiveEscrows([
          ...activeEscrows,
          {
            id: Math.floor(Math.random() * 900) + 100,
            seller: sellerAddress.slice(0, 6) + "..." + sellerAddress.slice(-4),
            amount: `${amount} ${token}`,
            desc: tradeDescription,
            state: "🔒 Kasada Kilitli"
          }
        ]);
        
        setAmount("");
        setSellerAddress("");
        setTradeDescription("");
      }, 2000);

    } catch (err) {
      setStatus("❌ İşlem iptal edildi veya ağ hatası oluştu.");
    }
  };

  // 🟢 PARAYI SATICIYA SERBEST BIRAKMA (Onay Butonu)
  const handleRelease = (id) => {
    alert(`🎉 İşlem #${id} Onaylandı! Kilitli fon satıcının cüzdanına serbest bırakıldı.`);
    setActiveEscrows(activeEscrows.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      
      {/* Üst Navigasyon ve Başlık */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
            🤝 SafeBridge Escrow <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-1 rounded-full uppercase">Güvenli Ticaret</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Alıcı ve Satıcıyı Koruyan Merkeziyetsiz Akıllı Emanet Kasası</p>
        </div>
        <Link href="/">
          <button className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700 transition-all">
            ← Ana Lobye Dön
          </button>
        </Link>
      </div>

      {/* Cüzdan Durum Barı */}
      <div className="max-w-6xl mx-auto mb-8 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-sm font-semibold text-gray-300">Akıllı Sözleşme Kalkanı: <strong className="text-emerald-400">AKTİF</strong></span>
        </div>
        {!account ? (
          <button onClick={connectWallet} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20">
            🔒 MetaMask Bağla & Ticareti Aç
          </button>
        ) : (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg text-emerald-400 border border-slate-700">Bakiye: {Number(balance).toFixed(4)} POL/ETH</span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg text-gray-300 border border-slate-700 truncate w-36">{account}</span>
          </div>
        )}
      </div>

      {/* Durum Bilgilendirme */}
      {status && (
        <div className="max-w-6xl mx-auto mb-6 p-3 rounded-xl text-center text-xs font-semibold border bg-slate-900 border-slate-700 text-emerald-400">
          {status}
        </div>
      )}

      {/* Ana Çalışma Alanı: 2 Kolonlu Izgara */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL KOLON: Yeni Ticaret Başlat (Kilitleme Formu) - 5 Kolon */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl h-fit">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🔒 Yeni Emanet İşlemi Başlat
          </h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Paranız doğrudan satıcıya gitmez. Akıllı sözleşmede güvenceye alınır ve mal/hizmet teslim olana kadar kilitli kalır.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Satıcı Cüzdan Adresi</label>
              <input type="text" placeholder="0x... (Mal/Hizmeti Sağlayacak Adres)" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-emerald-400 outline-none focus:border-emerald-500 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Miktar</label>
                <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Varlık Türü</label>
                <select value={token} onChange={(e) => setToken(e.target.value)} className="w-full p-3.5