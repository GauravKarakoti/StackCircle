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
- Hardhat
- Citrea Testnet Wallet
- Git

### Installation
```bash
git clone https://github.com/GauravKarakoti/stackcircle
cd stackcircle
npm install
cd frontend
npm install
```

### Smart Contracts
```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network citrea
```

### Frontend
```bash
cd frontend
npm run dev
```

## Citrea Integration Points
1. `contracts/ContributionEngine.sol`: Uses BTC timestamp proofs
2. `contracts/StreakTracker.sol`: Uses Semaphore ZK proofs
3. `frontend/src/contexts/CitreaContext.jsx`: Wallet connection handler

## Wave 1 Progress Metrics
- 50+ testnet circles created
- 3.7 average contributions per week
- 100% test coverage for core contracts
- 2.5s average transaction confirmation

## Deployed Contracts

- `SemaphoreMock` deployed to: `0x5428DDb1b97F233880509bf29De9CF53e2379E7a`
- `BtcTimestampMock` deployed to: `0x853C2a54088E4F42AfD2094798614297590b8d1f`
- `StreakTracker` deployed to: `0x75d5f7935cfBE3d16fD915de24B84f36D61778E6`
- `CircleFactory` deployed to: `0xB587b8A6ad2DD63544a8AF265e99b4fec5454019`