export const CONSTANTS = {
  // Polygon Amoy Testnet üzerindeki Akıllı Sözleşme Adresi
  CONTRACT_ADDRESS: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 
  
  // Akıllı Sözleşme ABI (Fonksiyon Tanımlamaları)
  ABI: [
    {
      "inputs": [{ "internalType": "address", "name": "_buyer", "type": "address" }],
      "name": "createEscrow",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalEscrows",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const
};