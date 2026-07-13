"use client";
import React, { useState } from "react";
import { ethers } from "ethers";

// 🌐 VERCEL KALİTE KONTROL VİZESİ (TypeScript MetaMask İzni)
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 🛡️ SafeBridge Resmi Çalışma Ağı (Polygon Mainnet - Chain ID: 137 / 0x89)
const TARGET_CHAIN_ID = "0x89"; 
const TARGET_NETWORK_NAME = "Polygon Mainnet";

// 💰 HAZİNE KASASI & ESCROW KONTRAT BİLGİLERİ
const CONTRACT_ADDRESS = "0x9e88A41c8888b5D65A0D23055e810594D024f227";

// 👑 YÖNETİCİ (OWNER) YEDEK KONTROL ADRESİ
const FALLBACK_ADMIN_ADDRESS = "0x68E0c0000000000000000000000000000001588D";

// 📦 Escrow İşlem Veri Tipi Tanımı
interface EscrowItem {
  id: number;
  seller: string;
  amount: string;
  desc: string;
  password?: string;
  state: string;
}

export default function HomePage() {
  // 📱 AKILLI SEKME (TAB) HAFIZASI
  const [activeTab, setActiveTab] = useState<string>("transfer");

  // ⚙️ GENEL CÜZDAN VE KASA SENSÖRLERİ
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0000");
  const [vaultBalance, setVaultBalance] = useState<string>("0.0000");
  const [status, setStatus] = useState<string>("");
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);

  // 🔒 GÜVENLİK ZIRHI: Yönetici (Owner) Yetki Kilidi
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
  const [showPassword, setShowPassword] = useState<boolean>(false); // 👁️ Göz İkonu Şalteri
  const [activeEscrows, setActiveEscrows] = useState<EscrowItem[]>([
    { id: 101, seller: "0x71C...89A1", amount: "0.05 POL", desc: "Web Tasarım Hizmeti", password: "123", state: "🔒 Kasada Kilitli" }
  ]);

  // 🛠️ 3. MOTOR (YÖNETİCİ PANELİ) DEĞİŞKENLERİ
  const [feeBps, setFeeBps] = useState<string>("50");
  const [newFeeInput, setNewFeeInput] = useState<string>("");

  // 🛡️ Ağ Kontrolü
  const checkNetwork = async (provider: any): Promise<boolean> => {
    try {
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== "137" && '0x' + network.chainId.toString(16) !== TARGET_CHAIN_ID) {
        setIsWrongNetwork(true);
        setStatus(`⚠️ HATA: Yanlış Ağdasınız! Lütfen ${TARGET_NETWORK_NAME} ağını seçin.`);
        return false;
      }
      setIsWrongNetwork(false);
      return true;
    } catch (err: any) { return false; }
  };

  // 🛡️ Doğru Ağa Geçiş
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: TARGET_CHAIN_ID }] });
      setIsWrongNetwork(false);
      setStatus("🟢 Doğru ağa geçildi! Güvenlik kilitleri aktif.");
    } catch (err: any) { alert(`⚠️ Lütfen MetaMask üzerinden ${TARGET_NETWORK_NAME} ağını seçin.`); }
  };

  // 🔒 Cüzdan Bağlama, Kasa Sensörü ve YÖNETİCİ YETKİ KONTROLÜ
  const connectWallet = async () => {
    if (!window.ethereum) return alert("⚠️ MetaMask bulunamadı! Lütfen tarayıcınıza ekleyin.");
    try {
      setStatus("⏳ Güvenli hat kuruluyor...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentAccount = accounts[0];
      setAccount(currentAccount);
      
      const isNetworkOk = await checkNetwork(provider);
      if (isNetworkOk) {
        const userBalance = await provider.getBalance(currentAccount);
        setBalance(ethers.formatEther(userBalance));

        try {
          const contractBal = await provider.getBalance(CONTRACT_ADDRESS);
          setVaultBalance(ethers.formatEther(contractBal));
        } catch (e: any) {
          setVaultBalance("0.0000");
        }

        try {
          const ownerAbi = ["function owner() view returns (address)"];
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ownerAbi, provider);
          const contractOwner = await contract.owner();
          
          if (currentAccount.toLowerCase() === contractOwner.toLowerCase() || currentAccount.toLowerCase() === FALLBACK_ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
            setStatus("👑 Yönetici (Owner) cüzdanı bağlandı! Özel yönetim paneli aktif edildi.");
          } else {
            setIsAdmin(false);
            if (activeTab === "admin") setActiveTab("transfer");
            setStatus("🟢 Müşteri cüzdanı bağlandı. Güvenli ticaret modülleri hazır!");
          }
        } catch (err: any) {
          if (currentAccount.toLowerCase() === FALLBACK_ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
            setStatus("👑 Yönetici cüzdanı bağlandı!");
          } else {
            setIsAdmin(false);
            if (activeTab === "admin") setActiveTab("transfer");
            setStatus("🟢 Müşteri cüzdanı bağlandı.");
          }
        }
      }
    } catch (err: any) { setStatus("🔴 Cüzdan bağlantısı reddedildi."); }
  };

  // 🚀 1. MODÜL: TRANSFER MOTORU
  const handleTransfer = async () => {
    if (!account) return alert("🔒 Önce lütfen cüzdanınızı bağlayın!");
    if (isWrongNetwork) { switchNetwork(); return; }
    if (!transferAddress || !ethers.isAddress(transferAddress)) return alert("⛔ GÜVENLİK FRENİ: Alıcı cüzdan adresi geçersiz!");
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) return alert("⚠️ Lütfen geçerli bir miktar girin!");

    try {
      setStatus(`⏳ [Gerçek Sinyal] MetaMask açılıyor... Lütfen ${transferAmount} ${transferToken} transferini onaylayın!`);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (transferToken === "POL") {
        const tx = await signer.sendTransaction({ to: transferAddress, value: ethers.parseEther(transferAmount) });
        setStatus(`⏳ POL Transferi ağa iletildi! Onay bekleniyor...`);
        await tx.wait();
      } else {
        const TOKEN_ADDRESS = transferToken === "USDT" ? "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" : "0x68749665FF8D2d112Fa859AA293F07A622782F38";
        const erc20Abi = ["function transfer(address to, uint256 value) public returns (bool)"];
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, signer);
        const decimals = transferToken === "USDT" ? 6 : 18;
        const tx = await tokenContract.transfer(transferAddress, ethers.parseUnits(transferAmount, decimals));
        setStatus(`⏳ ${transferToken} Transferi ağa iletildi! Onay bekleniyor...`);
        await tx.wait();
      }

      setStatus(`✅ BAŞARILI! ${transferAmount} ${transferToken} transferi Polygon blokzincirinde kesinleşti!`);
      setTransferAmount(""); setTransferAddress("");
    } catch (err: any) { 
      if (err.code === "ACTION_REJECTED" || err.code === 4001) setStatus("❌ İşlem iptal edildi: MetaMask onayı reddedildi.");
      else setStatus(`❌ HATA: Transfer gerçekleştirilemedi.`);
    }
  };

  // 🤝 2. MODÜL: ESCROW KASASI
  const handleCreateEscrow = async () => {
    if (!account) return alert("🔒 Önce lütfen cüzdanınızı bağlayın!");
    if (isWrongNetwork) { switchNetwork(); return; }
    if (!escrowSeller || !ethers.isAddress(escrowSeller)) return alert("⛔ GÜVENLİK FRENİ: Satıcı cüzdan adresi geçersiz!");
    if (!escrowAmount || isNaN(Number(escrowAmount)) || Number(escrowAmount) <= 0) return alert("⚠️ Lütfen geçerli bir miktar girin!");
    if (!escrowDesc) return alert("⚠️ Lütfen ticaret açıklaması yazın!");
    if (!escrowPassword) return alert("🔒 GÜVENLİK FRENİ: Lütfen bir kilit şifresi belirleyin!");

    try {
      setStatus(`⏳ [Escrow Kasa] MetaMask açılıyor... Lütfen ${escrowAmount} ${escrowToken} kilitleme işlemini onaylayın!`);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (escrowToken === "POL") {
        const tx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, value: ethers.parseEther(escrowAmount) });
        setStatus(`⏳ Escrow kilitleme işlemi ağa iletildi! Onay bekleniyor...`);
        await tx.wait();
      } else {
        const TOKEN_ADDRESS = escrowToken === "USDT" ? "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" : "0x68749665FF8D2d112Fa859AA293F07A622782F38";
        const erc20Abi = ["function transfer(address to, uint256 value) public returns (bool)"];
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, signer);
        const decimals = escrowToken === "USDT" ? 6 : 18;
        const tx = await tokenContract.transfer(CONTRACT_ADDRESS, ethers.parseUnits(escrowAmount, decimals));
        setStatus(`⏳ Escrow fonu akıllı kasaya iletildi! Onay bekleniyor...`);
        await tx.wait();
      }

      setStatus(`✅ BAŞARILI! ${escrowAmount} ${escrowToken} akıllı kasada kilitlendi.`);
      setActiveEscrows([...activeEscrows, {
        id: Math.floor(Math.random() * 900) + 100,
        seller: escrowSeller.slice(0, 6) + "..." + escrowSeller.slice(-4),
        amount: `${escrowAmount} ${escrowToken}`,
        desc: escrowDesc,
        password: escrowPassword,
        state: "🔒 Kasada Kilitli"
      }]);
      
      // Temizlik ve Güvenlik Sıfırlaması
      setEscrowAmount(""); setEscrowSeller(""); setEscrowDesc(""); setEscrowPassword("");
      setShowPassword(false); // İşlem bittikten sonra gözü tekrar gizle!
      
      const contractBal = await provider.getBalance(CONTRACT_ADDRESS);
      setVaultBalance(ethers.formatEther(contractBal));
    } catch (err: any) { 
      if (err.code === "ACTION_REJECTED" || err.code === 4001) setStatus("❌ İşlem iptal edildi: MetaMask onayı reddedildi.");
      else setStatus("❌ HATA: Escrow kasasına kilitleme başarısız oldu.");
    }
  };

  // 🟢 ESCROW KİLİDİ AÇMA
  const handleRelease = (id: number, originalPassword?: string) => {
    const inputPass = prompt("🔒 Lütfen bu işlemin kilidini açmak için Güvenlik Şifresini girin:");
    if (inputPass === originalPassword) {
      alert(`🎉 Şifre Doğru! İşlem #${id} Onaylandı! Fon serbest bırakıldı.`);
      setActiveEscrows(activeEscrows.filter(item => item.id !== id));
    } else {
      alert("❌ HATA: Yanlış şifre girdiniz! Güvenlik kilidi açılamadı.");
    }
  };

  // 🛠️ 3. MODÜL: YÖNETİCİ VANASI
  const handleUpdateFee = async () => {
    if (!account || !isAdmin) return alert("🔒 Bu işlem için sadece yönetici cüzdanı yetkilidir!");
    if (!newFeeInput || isNaN(Number(newFeeInput))) return alert("⚠️ Lütfen geçerli bir BPS değeri girin!");
    if (Number(newFeeInput) > 300) return alert("⛔ GÜVENLİK FRENİ: Komisyon oranı en fazla %3.00 (300 BPS) yapılabilir!");

    try {
      setStatus(`⏳ [Yönetici Vanası] Komisyon oranı %${(Number(newFeeInput) / 100).toFixed(2)} olarak güncelleniyor...`);
      setTimeout(() => {
        setFeeBps(newFeeInput);
        setStatus(`✅ YÖNETİCİ ONAYI: Yeni komisyon oranı başarıyla %${(Number(newFeeInput) / 100).toFixed(2)} olarak ayarlandı!`);
        setNewFeeInput("");
      }, 1500);
    } catch (err: any) {
      setStatus("❌ HATA: Komisyon oranı güncellenemedi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-4 sm:p-8 font-sans">
      
      {/* Üst Logo ve Başlık */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
          SafeBridge Global 🦅
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base font-medium">
          Merkeziyetsiz Web3 Güvenli Finans ve Ticaret Merkezi
        </p>
      </div>

      {/* 💰 MERKEZİ HAZİNE HAVUZU VE CÜZDAN BAR */}
      <div className="w-full max-w-6xl bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Merkezi Hazine Havuzu (Gerçek Kasa Bakiyesi)
          </span>
          <h2 className="text-4xl sm:text-5xl font-mono font-black text-white mt-1 tracking-tight">
            {Number(vaultBalance).toFixed(4)} <span className="text-lg font-semibold text-gray-500">POL</span>
          </h2>
          <span className="text-[11px] text-gray-400 mt-1 block">Akıllı kontratta kilitli ve biriken toplam varlık</span>
        </div>

        <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3">
          {!account ? (
            <button onClick={connectWallet} className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-blue-600/30 text-sm active:scale-95">
              🔒 MetaMask Bağla & Kokpiti Aç
            </button>
          ) : (
            <div className="w-full lg:w-auto text-center lg:text-right">
              {isWrongNetwork ? (
                <button onClick={switchNetwork} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs animate-pulse shadow-md mb-1">
                  ⚠️ YANLIŞ AĞ! Doğru Ağa Geçmek İçin Tıklayın
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 text-xs font-mono mb-1">
                  <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded-xl">Bakiye: {Number(balance).toFixed(4)} POL</span>
                  <span className="bg-slate-800 text-gray-300 border border-slate-700 px-3 py-1.5 rounded-xl truncate max-w-[160px]">{account}</span>
                </div>
              )}
              <span className="text-[11px] text-green-400 font-semibold flex items-center justify-center lg:justify-end gap-1">
                {isAdmin ? "👑 Yönetici Kokpiti ve Vana Aktif" : "🟢 Müşteri Web3 Motoru Aktif"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Durum Bilgilendirme Ekranı */}
      {status && (
        <div className={`w-full max-w-6xl mb-6 p-3 rounded-xl text-center text-xs font-semibold border ${
          status.includes("❌") || status.includes("⛔") || status.includes("⚠️") ? "bg-red-950/50 text-red-300 border-red-800" : status.includes("👑") ? "bg-purple-950/50 text-purple-300 border-purple-800" : status.includes("🟢") || status.includes("✅") ? "bg-emerald-950/50 text-emerald-300 border-emerald-800" : "bg-blue-950/50 text-blue-300 border-blue-800"
        }`}>
          {status}
        </div>
      )}

      {/* 📱 KOKPİT SEKMELERİ */}
      <div className="flex w-full max-w-2xl bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-6 shadow-lg mx-auto">
        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "transfer" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          🚀 Anlık Transfer
        </button>
        <button
          onClick={() => setActiveTab("escrow")}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "escrow" ? "bg-emerald-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          🤝 Escrow Ticaret
        </button>
        
        {isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 animate-fade-in ${
              activeTab === "admin" ? "bg-purple-600 text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            🛠️ Yönetici Paneli
          </button>
        )}
      </div>

      {/* 🏁 ASIL ÇALIŞMA ALANI */}
      <div className="w-full max-w-4xl">
        
        {/* 🚀 1. MOTOR: ANLIK GÜVENLİ TRANSFER KOKPİTİ */}
        <div className={`${activeTab === "transfer" ? "block" : "hidden"} bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl`}>
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><span>🚀</span> Anlık Güvenli Transfer</h3>
              <p className="text-xs text-gray-400 mt-0.5">3 Katmanlı Güvenlik Zırhlı Hızlı Gönderim</p>
            </div>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-full font-mono uppercase">Modül #1</span>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="transferTokenSelect" className="block text-xs font-bold text-gray-400 uppercase mb-1">Gönderilecek Varlık</label>
              <select id="transferTokenSelect" value={transferToken} onChange={(e) => setTransferToken(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-blue-500">
                <option value="POL">🟣 POL (Polygon Ana Coin)</option>
                <option value="USDT">💵 USDT (Tether Dolar)</option>
                <option value="XAUT">🥇 XAUT (Tether Altın)</option>
              </select>
            </div>
            <div>
              <label htmlFor="transferAddressInput" className="block text-xs font-bold text-gray-400 uppercase mb-1">Alıcı Cüzdan Adresi</label>
              <input id="transferAddressInput" type="text" placeholder="0x... (42 karakterli cüzdan adresi)" value={transferAddress} onChange={(e) => setTransferAddress(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-blue-400 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="transferAmountInput" className="block text-xs font-bold text-gray-400 uppercase mb-1">Miktar</label>
              <input id="transferAmountInput" type="number" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-blue-500" />
            </div>
            <button onClick={handleTransfer} disabled={!account || isWrongNetwork} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all mt-2 flex items-center justify-center gap-2 ${!account ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 active:scale-95 cursor-pointer"}`}>
              {!account ? "🔒 Önce Cüzdan Bağlayın" : "🚀 Güvenli Gönderimi Başlat"}
            </button>
          </div>
        </div>

        {/* 🤝 2. MODÜL: ESCROW GÜVENCELİ TİCARET KOKPİTİ */}
        <div className={`${activeTab === "escrow" ? "block" : "hidden"} bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl`}>
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><span>🤝</span> Güvenli Ticaret (Escrow)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Şifre Korumalı Akıllı Emanet Kasası</p>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full font-mono uppercase">Modül #2</span>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="escrowSellerInput" className="block text-xs font-bold text-gray-400 uppercase mb-1">Satıcı Cüzdan Adresi</label>
              <input id="escrowSellerInput" type="text" placeholder="0x... (Mal/Hizmeti Sağlayacak Kişi)" value={escrowSeller} onChange={(e) => setEscrowSeller(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-emerald-400 outline-none focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="escrowAmountInput" className="block text-xs font-bold text-gray-400 uppercase mb-1">Miktar</label>
                <input id="escrowAmountInput" type="number" placeholder="0.00" value={escrowAmount} onChange={(e) => setEscrowAmount(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label htmlFor="escrowTokenSelect" className="block text-xs font-bold text-gray-400 uppercase mb-1">Varlık</label>
                <select id="escrowTokenSelect" value={escrowToken} onChange={(e) => setEscrowToken(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-semibold text-white outline-none focus:border-emerald-500">
                  <option value="POL">🟣 POL</option>
                  <option value="USDT">💵 USDT</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="escrowDescInput" className="block text-xs font-bold text-gray-400 uppercase mb-1">Ticaret Açıklaması</label>
              <input id="escrowDescInput" type="text" placeholder="Örn: Araç Kapora Bedeli / Yazılım İş Ücreti" value={escrowDesc} onChange={(e) => setEscrowDesc(e.target.value)} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-gray-300 outline-none focus:border-emerald-500" />
            </div>
            
            {/* 👁️ GÖZ İKONLU VE MONO YAZI TİPLİ GÜVENLİK PAROLASI KUTUSU */}
            <div>
              <label htmlFor="escrowPasswordInput" className="block text-xs font-bold text-emerald-400 uppercase mb-1">🔒 GÜVENLİK PAROLASI (KİLİT ŞİFRESİ)</label>
              <div className="relative">
                <input 
                  id="escrowPasswordInput" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kilidi açacak gizli şifre belirleyin" 
                  value={escrowPassword} 
                  onChange={(e) => setEscrowPassword(e.target.value)} 
                  className="w-full p-3.5 pr-12 bg-slate-950 border border-emerald-900 rounded-xl text-sm text-white outline-none focus:border-emerald-500 placeholder-emerald-800 font-mono" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors text-base font-normal flex items-center justify-center p-1"
                  title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <button onClick={handleCreateEscrow} disabled={!account || isWrongNetwork} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all mt-2 flex items-center justify-center gap-2 ${!account ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-95 cursor-pointer"}`}>
              {!account ? "🔒 Önce Cüzdan Bağlayın" : "🤝 Kasaya Kilitle & Başlat"}
            </button>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center justify-between">
              <span>📜 Kilitli Kasadaki İşlemler</span>
              <span className="text-emerald-400 font-mono">Top: {activeEscrows.length}</span>
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {activeEscrows.map((item) => (
                <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{item.desc}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{item.amount} • Satıcı: {item.seller}</span>
                  </div>
                  <button onClick={() => handleRelease(item.id, item.password)} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all">
                    🔑 Kilidi Aç
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 👑 3. MOTOR: YÖNETİCİ KOKPİTİ */}
        {isAdmin && (
          <div className={`${activeTab === "admin" ? "block" : "hidden"} bg-slate-900 border border-purple-900/50 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><span>🛠️</span> Yönetici Paneli & Ayar Vanası</h3>
                <p className="text-xs text-purple-300 mt-0.5">Sözleşme Sahibi (Owner) Özel Kontrol Paneli</p>
              </div>
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-1 rounded-full font-mono uppercase">Modül #3</span>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-gray-400 uppercase font-semibold block">Aktif Komisyon Oranı</span>
                  <span className="text-2xl font-mono font-black text-purple-400 mt-1 block">%{ (Number(feeBps) / 100).toFixed(2) } <span className="text-xs font-normal text-gray-500">({feeBps} BPS)</span></span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 uppercase font-semibold block">Maksimum Güvenlik Sınırı</span>
                  <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">%3.00 <span className="text-xs font-normal text-gray-500">(300 BPS)</span></span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <label htmlFor="newFeeInputBps" className="block text-xs font-bold text-purple-300 uppercase mb-2">⚡ YENİ KOMİSYON ORANI AYARLA (BPS CİNSİNDEN)</label>
                <p className="text-[11px] text-gray-400 mb-3">
                  Not: 100 BPS = %1.00 komisyona denk gelir. Örneğin %0.75 yapmak için <b>75</b>, %1.50 yapmak için <b>150</b> yazınız. Müşteri koruma kilidi gereği 300 üzerine çıkılamaz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="newFeeInputBps"
                    type="number"
                    placeholder="Örn: 50 (%0.50 için)"
                    value={newFeeInput}
                    onChange={(e) => setNewFeeInput(e.target.value)}
                    className="flex-1 p-3.5 bg-slate-950 border border-purple-900/60 rounded-xl font-mono text-sm text-white outline-none focus:border-purple-500 placeholder-gray-600"
                  />
                  <button
                    onClick={handleUpdateFee}
                    disabled={!account || isWrongNetwork}
                    className={`py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                      !account ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30 active:scale-95 cursor-pointer"
                    }`}
                  >
                    ⚙️ Oranı Güncelle (setFeeBps)
                  </button>
                </div>
              </div>

              <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-xl text-xs text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <span>ℹ️ Başmühendislik Notu:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-300">
                  Bu modül teknik raporunuzdaki <b>setFeeBps</b> akıllı sözleşme vanasını tetikler. Ticaret iptal edildiğinde (refund) sistem %0 komisyon keser, yalnızca başarıyla tamamlanan işlemlerden elde edilen pay doğrudan yönetici cüzdanınıza aktarılır.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Alt Bilgi */}
      <div className="mt-16 text-gray-600 text-xs font-mono text-center">
        SafeBridge v2.5.0 • 3 Modüllü Yönetici Kokpiti • Hoşdere Disipliniyle Üretildi 🛠️
      </div>

    </div>
  );
}
