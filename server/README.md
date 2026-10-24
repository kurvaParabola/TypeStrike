# 🎮 TypeStrike (BlockTypeDuel) - Authoritative Game Server

Authoritative WebSocket backend server that powers real-time 1v1 typing duels and trustlessly settles winners on the **Monad Testnet**.

---

## ⚡ Features
- **Authoritative Anti-Cheat**: Validates exact character inputs and WPM off-chain.
- **Real-Time WebSocket Protocol**: Sub-second synchronization of keystrokes, combos, and health/hit bars.
- **PRD Rule #6**: The first player to score **7 hits** wins the duel.
- **On-Chain Settlement**: Automatically signs and submits `settleMatch(roomId, winner)` to the `BlockTypeDuelEscrow` contract (`0x54dF67541a74121e0C6179757d22Ea466DdcA994`) on Monad Testnet, delivering instant payouts to the winner!

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
The server reads `.env` from either `server/.env` or the root `.env`:
```env
PORT=4000
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=0x54dF67541a74121e0C6179757d22Ea466DdcA994
PRIVATE_KEY=0x_your_server_private_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

Server endpoints:
- **HTTP Healthcheck**: `http://localhost:4000/health`
- **WebSocket Gateway**: `ws://localhost:4000`

---

## 📡 WebSocket Protocol for Frontend Developers

Connect to `ws://localhost:4000`.

### Messages from Frontend to Server:

#### 1. Join Match Room
Send immediately when entering a duel room:
```json
{
  "type": "JOIN_ROOM",
  "roomId": "0x123456...32bytes",
  "playerAddress": "0xYourWalletAddress"
}
```

#### 2. Streaming Typing Progress
Send on keystrokes so the opponent sees your live typing progress:
```json
{
  "type": "TYPING_PROGRESS",
  "roomId": "0x123456...32bytes",
  "playerAddress": "0xYourWalletAddress",
  "currentInput": "Monad executes ten...",
  "progressPercent": 65,
  "currentWpm": 84
}
```

#### 3. Submit Completed Sentence
Send when you finish typing the target sentence:
```json
{
  "type": "SUBMIT_SENTENCE",
  "roomId": "0x123456...32bytes",
  "playerAddress": "0xYourWalletAddress",
  "typedText": "Monad executes ten thousand transactions per second with parallel pipelining.",
  "timeTakenMs": 4200
}
```

---

### Messages from Server to Frontend:

- **`ROOM_STATE`**: Current room details, player addresses, and escrowed MON wager.
- **`COUNTDOWN`**: Match countdown `3`, `2`, `1`.
- **`ROUND_START`**: New round begins with target sentence and current hit scores.
- **`OPPONENT_PROGRESS`**: Real-time progress and WPM of your opponent.
- **`HIT_SCORED`**: A player successfully landed an attack combo.
- **`MATCH_SETTLING`**: A player reached 7 hits; on-chain transaction is being submitted to Monad.
- **`MATCH_FINISHED`**: Winner declared, including Monad `txHash` and explorer URL.
