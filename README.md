# API Key Marketplace

A decentralized API monetization platform where developers can register APIs and users pay per call using crypto.

---

## Overview

This platform enables:

- Trustless payments using smart contracts
- Transparent API usage tracking
- Direct revenue for developers without intermediaries

---

## Architecture

## Architecture Diagram

![Architecture](./images/architecture%20of%20api%20key%20marketplace.png)

## Flow Diagrams

![Flow](./images/mermaid-diagram%20(1).png)

![Flow 2](./images/mermaid-diagram%20(2).png)

---

## Tech Stack

### Blockchain
- Solidity
- Hardhat v3 (Ignition + viem)

### Frontend
- React

### Network
- Hardhat Local Network
- Sepolia Testnet

---

## Features

- API registration
- Credit-based payment system
- Usage tracking
- Secure withdrawal for developers

---



```bash
API_KEY_MARKETPLACE/
│
├── contracts/
│   └── APIRegistry.sol
│
├── ignition/
│   └── modules/
│       └── deploy.ts
│
├── frontend/
│
├
│
└── README.md
```

---

## Smart Contract

### APIRegistry.sol

Handles:

- API registration
- Credit purchase
- Usage tracking
- Withdrawal

---

## Setup

### Clone

```bash
git clone https://github.com/Brahmagithubrit/API_KEY_MARKETPLACE.git
cd API_KEY_MARKETPLACE
```

---

### Install

```bash
npm install
```

---

## Compile

```bash
npx hardhat compile
```

---

## Local Deployment

```bash
npx hardhat node
npx hardhat ignition deploy ignition/modules/deploy.ts --network localhost
```

---

## Testnet Deployment (Sepolia)

```bash
SEPOLIA_RPC_URL=<your_rpc_url>
PRIVATE_KEY=<your_wallet_private_key>
```

```bash
npx hardhat ignition deploy ignition/modules/deploy.ts --network sepolia
```

---

## Usage Flow

```bash
1. Deploy contract
2. Register API
3. Purchase credits
4. Call API
5. Credits deducted
6. Withdraw earnings
```

---

