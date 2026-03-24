# API Key Marketplace

A decentralized API monetization platform where developers can register APIs and users pay per call using crypto.

## Tech Stack
- Solidity
- Hardhat v3 (Ignition + viem)
- React (frontend)

## Features
- API registration
- Credit-based payment system
- Usage tracking
- Owner withdrawal

## Deployment

### Compile
npx hardhat compile

### Local Deployment
npx hardhat node
npx hardhat ignition deploy ignition/modules/deploy.ts --network localhost

### Testnet Deployment (Sepolia)
npx hardhat ignition deploy ignition/modules/deploy.ts --network localhost

## Contract
APIRegistry.sol handles:
- API registration
- credit purchase
- usage tracking
- withdrawal

