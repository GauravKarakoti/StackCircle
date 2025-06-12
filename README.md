# StackCircle : Decentralized Bitcoin Stacking Groups

[![Citrea Testnet](https://img.shields.io/badge/Bitcoin-L2%20Rollup-orange)](https://citrea.xyz)

## Overview
Social savings dApp where communities pool BTC toward shared goals with:
- ✅ ZK-verified contributions
- 🏆 NFT achievement badges
- 🛡️ Non-custodial fund management
- 🌱 Built on Citrea (Bitcoin's first zk-rollup)

## Live Demo
https://stackcircle.vercel.app  
Testnet Wallet: `0xA292c308Bf0054c0c8b85bA5872499533343483a` (Request BTC via [faucet](https://citrea.xyz/faucet))

## Features
- Create circles with custom goals (e.g., "100k sats/day for Turkey relief")
- Automated recurring contributions
- On-chain voting for fund usage
- Leaderboards and streak tracking
- Privacy-preserving balance checks

## Development
### Prerequisites
- Node.js v18+
- Citrea Testnet Wallet
- NFT.Storage API Key

### Installation
```bash
git clone https://github.com/GauravKarakotio/stackcircle
cd stackcircle
npm install
cp .env.example .env
```

### Smart Contracts
```bash
npx hardhat compile
npx hardhat deploy --network citrea
```

### Frontend
```bash
cd frontend
npm run dev
```

## Citrea Integration Points
1. `contracts/Verifier.sol`: Uses Citrea's zkEVM opcodes
2. `scripts/deploy.js`: Testnet deployment via Citrea RPC
3. `src/providers/CitreaProvider.js`: Wallet connection handler
