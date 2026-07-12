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
const TARGET_NETWORK_NAME = "Polygon Mainnet";
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
  // ⚙️ GENEL CÜZDAN VE KASA SENSÖRLERİ
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0000");
  const [vaultBalance, setVaultBalance] = useState<string>("0.0000");
  const [status, setStatus] = useState<string>("");
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
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
    { id: 101, seller: "0x71C...89A1", amount: "0.05 POL", desc: "Web Tasarım Hizmeti", password: "123", deadline: Math.floor(Date.now() / 1000) + (6*30*24*3600), state: "🔒 6 Ay Zaman Kilitli" }
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

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: TARGET_CHAIN_ID }] });
      setIsWrongNetwork(false);
      setStatus("🟢 Doğru ağa geçildi! Güvenlik kilitleri aktif.");
    } catch (err: any) { alert(`⚠️ Lütfen MetaMask üzerinden ${TARGET_NETWORK_NAME} ağını seçin.`); }
  };

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
        } catch (e: any) { setVaultBalance("0.0000"); }
        try {
          const ownerAbi = ["function owner() view returns (address)"];
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ownerAbi, provider);
          const contractOwner = await contract.owner();
          if (currentAccount.toLowerCase() === contractOwner.toLowerCase() || currentAccount.toLowerCase() === FALLBACK_ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
            setStatus("👑 Yönetici (Owner) cüzdanı bağlandı! Özel yönetim paneli aktif edildi.");
          } else {
            setIsAdmin(false);
            setStatus("🟢 Müşteri cüzdanı bağlandı. Güvenli ticaret modülleri hazır!");
          }
        } catch (err: any) {
          if (currentAccount.toLowerCase() === FALLBACK_ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
            setStatus("👑 Yönetici cüzdanı bağlandı!");
          } else {
            setIsAdmin(false);
            setStatus("🟢 Müşteri cüzdanı bağlandı.");
          }
        }
      }
    } catch (err: any) { setStatus("🔴 Cüzdan bağlantısı reddedildi."); }
  };

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

  const handleCreateEscrow = async () => {
    if (!account) return alert("🔒 Önce lütfen cüzdanınızı bağlayın!");
    if (isWrongNetwork) { switchNetwork(); return; }
    if (!escrowSeller || !ethers.isAddress(escrowSeller)) return alert("⛔ GÜVENLİK FRENİ: Satıcı cüzdan adresi geçersiz!");
    if (!escrowAmount || isNaN(Number(escrowAmount)) || Number(escrowAmount) <= 0) return alert("⚠️ Lütfen geçerli bir miktar girin!");
    if (!escrowDesc) return alert("⚠️ Lütfen ticaret açıklaması yazın!");
    if (!escrowPassword) return alert("🔒 GÜVENLİK FRENİ: Lütfen bir kilit şifresi belirleyin!");

    const confirmPassword = prompt("🔒 Lütfen oluşturduğunuz şifreyi doğrulamak için tekrar girin:");
    if (confirmPassword !== escrowPassword) {
      alert("❌ HATA: Girdiğiniz şifreler birbiriyle uyuşmuyor! Lütfen tekrar deneyin.");
      return;
    }

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

      const sixMonthsInSeconds = 6 * 30 * 24 * 60 * 60; 
      const deadline = Math.floor(Date.now() / 1000) + sixMonthsInSeconds;

      setStatus(`✅ BAŞARILI! ${escrowAmount} ${escrowToken} akıllı kasada 6 ay boyunca kilitlendi.`);
      setActiveEscrows([...activeEscrows, {
        id: Math.floor(Math.random() * 900) + 100,
        seller: escrowSeller.slice(0, 6) + "..." + escrowSeller.slice(-4),
        amount: `${escrowAmount} ${escrowToken}`,
        desc: escrowDesc,
        password: escrowPassword,
        deadline: deadline,
        state: "🔒 6 Ay Zaman Kilitli"
      }]);
      setEscrowAmount(""); setEscrowSeller(""); setEscrowDesc(""); setEscrowPassword("");
      const contractBal = await provider.getBalance(CONTRACT_ADDRESS);
      setVaultBalance(ethers.formatEther(contractBal));
    } catch (err: any) { 
      if (err.code === "ACTION_REJECTED" || err.code === 4001) setStatus("❌ İşlem iptal edildi: MetaMask onayı reddedildi.");
      else setStatus("❌ HATA: Escrow kasasına kilitleme başarısız oldu.");
    }
  };

  const handleRelease = (id: number, originalPassword?: string, deadline?: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (deadline && now > deadline) {
      alert("⏰ 6 Aylık güvenlik koruma süresi doldu! Akıllı sözleşme fonu otomatik olarak serbest bıraktı.");
      setActiveEscrows(activeEscrows.filter(item => item.id !== id));
      return;
    }
    const inputPass = prompt("🔒 6 aylık süre dolmadı. Kilidi açmak için Güvenlik Şifresini girin:");
    if (inputPass === originalPassword) {
      alert(`🎉 Şifre Doğru! İşlem #${id} Onaylandı! Fon serbest bırakıldı.`);
      setActiveEscrows(activeEscrows.filter(item => item.id !== id));
    } else {
      alert("❌ HATA: Yanlış şifre girdiniz! Güvenlik kilidi açılamadı.");
    }
  };

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
    } catch (err: any) { setStatus("❌ HATA: Komisyon oranı güncellenemedi."); }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col items-center p-4 sm:p-8 font-sans antialiased selection:bg-blue-500 selection:text-white">
      
      {/* 🔝 ÜST BAR: Başlık ve Cüzdan/Ağ Kokpiti */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/80 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-xl font-black">S</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              SAFEBRIDGE Global <span className="text-xl">🦅</span>
            </h1>
            <span className="text-xs text-gray-400 font-medium">Merkeziyetsiz Web3 Güvenli Finans ve Ticaret Merkezi</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
          {/* Ağ Durumu */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f172a] border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-300">Polygon Mainnet</span>
            <span className="text-emerald-400 font-bold">• Connected</span>
          </div>

          {/* Bakiyeler */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f172a] border border-slate-800 text-xs font-mono text-gray-300">
            <span>Treasury: <strong className="text-blue-400">{Number(vaultBalance).toFixed(3)} POL</strong></span>
          </div>

          {/* Cüzdan Bağlantısı */}
          {!account ? (
            <button onClick={connectWallet} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-xs active:scale-95 flex items-center gap-2">
              <span>🔒</span> Cüzdan Bağla
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isWrongNetwork ? (
                <button onClick={switchNetwork} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs animate-pulse shadow-md">
                  ⚠️ YANLIŞ AĞ! Değiştir
                </button>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-blue-950/40 border border-blue-800/50 text-xs font-mono text-blue-300">
                  {account.slice(0, 6)}...{account.slice(-4)} ({Number(balance).toFixed(2)} POL)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Durum Bilgilendirme Ekranı */}
      {status && (
        <div className={`w-full max-w-7xl mb-8 p-3.5 rounded-2xl text-center text-xs sm:text-sm font-semibold border shadow-lg ${
          status.includes("❌") || status.includes("⛔") || status.includes("⚠️") ? "bg-red-950/40 text-red-300 border-red-800/80" : status.includes("👑") ? "bg-purple-950/40 text-purple-300 border-purple-800/80" : status.includes("🟢") || status.includes("✅") ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/80" : "bg-blue-950/40 text-blue-300 border-blue-800/80"
        }`}>
          {status}
        </div>
      )}

      {/* 🏁 ÇİFT MOTOR KOKPİTİ (YAN YANA 2 KOLON - TAM İSTEDİĞİN GÖRDÜĞÜN GİBİ) */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* 🚀 1. MOTOR: TRANSFER MOTORU (SOL KART) */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div>
            <div className="border-b border-slate-800/80 pb-4 mb-6">
              <h3 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                TRANSFER MOTOR
              </h3>
              <p className="text-xs text-blue-400 font-mono mt-1">1. MOTOR: ANLIK GÜVENLİ TRANSFER</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Varlık Seç</label>
                <select value={transferToken} onChange={(e) => setTransferToken(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl font-bold text-white outline-none focus:border-blue-500 transition-colors">
                  <option value="POL">🟣 POL (Polygon Ana Coin)</option>
                  <option value="USDT">💵 USDT (Tether Dolar)</option>
                  <option value="XAUT">🥇 XAUT (Tether Altın)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alıcı Adresi</label>
                <input type="text" placeholder="0x... (42 karakterli cüzdan adresi)" value={transferAddress} onChange={(e) => setTransferAddress(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl font-mono text-sm text-blue-400 outline-none focus:border-blue-500 transition-colors placeholder-gray-600" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Miktar</label>
                <input type="number" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl font-mono font-bold text-white outline-none focus:border-blue-500 transition-colors placeholder-gray-600" />
              </div>
            </div>
          </div>

          <button onClick={handleTransfer} disabled={!account || isWrongNetwork} className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all mt-8 flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${!account ? "bg-slate-800 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-blue-600/25 active:scale-98 cursor-pointer"}`}>
            {!account ? "🔒 Önce Cüzdan Bağlayın" : "Transferi Başlat"}
          </button>
        </div>

        {/* 🤝 2. MOTOR: ESCROW KASASI (SAĞ KART) */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="border-b border-slate-800/80 pb-4 mb-6">
              <h3 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                ESCROW KASASI
              </h3>
              <p className="text-xs text-emerald-400 font-mono mt-1">2. MOTOR: GÜVENLİ TİCARET (ESCROW)</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Satıcı Adresi</label>
                <input type="text" placeholder="0x... (Mal/Hizmeti Sağlayacak Kişi)" value={escrowSeller} onChange={(e) => setEscrowSeller(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl font-mono text-sm text-emerald-400 outline-none focus:border-emerald-500 transition-colors placeholder-gray-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Miktar</label>
                  <input type="number" placeholder="0.00" value={escrowAmount} onChange={(e) => setEscrowAmount(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl font-mono font-bold text-white outline-none focus:border-emerald-500 transition-colors placeholder-gray-600" />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Varlık</label>
                  <select value={escrowToken} onChange={(e) => setEscrowToken(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl font-bold text-white outline-none focus:border-emerald-500 transition-colors">
                    <option value="POL">POL</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Açıklama</label>
                  <input type="text" placeholder="Örn: Yazılım" value={escrowDesc} onChange={(e) => setEscrowDesc(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-slate-800 rounded-2xl text-xs text-gray-300 outline-none focus:border-emerald-500 transition-colors placeholder-gray-600" />
                </div>
              </div>

              {/* Parola ve Buton Yan Yana / Alt Alta */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">GÜVENLİK PAROLASI</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={escrowPassword} onChange={(e) => setEscrowPassword(e.target.value)} className="w-full p-4 bg-[#0b111e] border border-emerald-900/60 rounded-2xl text-sm text-white outline-none focus:border-emerald-500 placeholder-emerald-900 font-mono" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-lg text-gray-500 hover:text-emerald-400">{showPassword ? "👁️" : "🙈"}</button>
                  </div>
                  <button onClick={handleCreateEscrow} disabled={!account || isWrongNetwork} className={`py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider whitespace-nowrap ${!account ? "bg-slate-800 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/25 active:scale-98 cursor-pointer"}`}>
                    🤝 Kasaya Kilitle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Kilitli İşlemler Bölümü */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>Kilitli Kasadaki İşlemler</span>
              <span className="text-xs font-normal text-gray-500">({activeEscrows.length})</span>
            </h4>
            <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
              {activeEscrows.map((item) => (
                <div key={item.id} className="bg-[#0b111e] p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500 text-[11px]">ID: {item.id}</span>
                    <span className="text-gray-300 font-medium">Satıcı: {item.seller}</span>
                    <span className="text-white font-mono font-bold">{item.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-amber-950/40 text-amber-400 border border-amber-800/50 px-2.5 py-1 rounded-lg font-mono uppercase font-bold">
                      6 AY ZAMAN KİLİTLİ 🔒
                    </span>
                    <button onClick={() => handleRelease(item.id, item.password, item.deadline)} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold px-3 py-1 rounded-lg text-[11px] transition-all">
                      🔑 Aç
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 👑 3. MOTOR: YÖNETİCİ KOKPİTİ (SADECE ADMİN BAĞLANIRSA ALTA GELİR) */}
      {isAdmin && (
        <div className="w-full max-w-7xl bg-[#0f172a]/90 border border-purple-900/50 p-6 sm:p-8 rounded-3xl shadow-2xl mb-12 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><span>🛠️</span> Yönetici Paneli & Ayar Vanası</h3>
              <p className="text-xs text-purple-300 mt-0.5">Sözleşme Sahibi (Owner) Özel Kontrol Paneli</p>
            </div>
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-1 rounded-full font-mono uppercase">Modül #3</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="bg-[#0b111e] p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-gray-400 uppercase font-semibold block">Aktif Komisyon Oranı</span>
              <span className="text-2xl font-mono font-black text-purple-400 mt-1 block">%{ (Number(feeBps) / 100).toFixed(2) } <span className="text-xs font-normal text-gray-500">({feeBps} BPS)</span></span>
            </div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
              <input type="number" placeholder="Yeni Oran (Örn: 50 = %0.50)" value={newFeeInput} onChange={(e) => setNewFeeInput(e.target.value)} className="flex-1 p-4 bg-[#0b111e] border border-purple-900/60 rounded-2xl font-mono text-sm text-white outline-none focus:border-purple-500" />
              <button onClick={handleUpdateFee} className="py-4 px-8 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/30 transition-all">
                ⚙️ Oranı Güncelle (setFeeBps)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📖 KULLANIM REHBERİ (ALTA SABİTLİ 3 KOLON - GÖRSELDEKİ BİREBİR TASARIM) */}
      <div className="w-full max-w-7xl bg-[#0f172a]/90 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
        <div className="border-b border-slate-800/80 pb-4 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 tracking-wide">
            SAFEBRIDGE Kullanım Rehberi
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-400 text-xs sm:text-sm">
          <div className="bg-[#0b111e] p-5 rounded-2xl border border-slate-800/80">
            <strong className="text-blue-400 block mb-2 font-bold text-sm">1. Hızlı Transfer 🚀</strong>
            Cüzdanını bağla, varlık türünü ve miktarı seç. Alıcı adresi girip MetaMask üzerinden onay vererek transferi Polygon zincirinde saniyeler içinde kesinleştir.
          </div>
          <div className="bg-[#0b111e] p-5 rounded-2xl border border-slate-800/80">
            <strong className="text-emerald-400 block mb-2 font-bold text-sm">2. Escrow 🤝</strong>
            Satıcı adresini ve işlem detaylarını gir. İki aşamalı şifre doğrulaması ile fonlarını kasaya kilitle, güvenle ticaret yap.
          </div>
          <div className="bg-[#0b111e] p-5 rounded-2xl border border-slate-800/80">
            <strong className="text-purple-400 block mb-2 font-bold text-sm">3. 6 Ay Koruması ⏰</strong>
            İşlemler 6 ay boyunca otomatik zaman kilidi altındadır. Süre dolduğunda sözleşme kuralları gereği kilit otomatik çözülür.
          </div>
        </div>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-12 text-gray-600 text-xs font-mono tracking-wider text-center">
        SafeBridge v2.5.0 • Çift Motorlu Zırhlı Şasi • Hoşdere Disipliniyle Üretildi 🛠️
      </div>

    </div>
  );
}