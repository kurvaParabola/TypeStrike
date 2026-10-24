# ⚔️ TypeStrike (BlockTypeDuel) - Smart Contracts

Real-time 1v1 PvP Typing Duel Escrow on **Monad**.

Players stake native `MON` tokens in high-stakes typing duels. An authoritative game server (WebSocket) tracks keystrokes, calculates WPM, and submits hits off-chain. The first player to reach **7 hits** (PRD Rule #6) wins the match, and the smart contract trustlessly disburses the entire prize pool (`wagerAmount * 2`) to the winner.

---

## 🚀 Deployed Contract (Monad Testnet)

| Parameter | Value |
|---|---|
| **Contract Name** | `BlockTypeDuelEscrow` |
| **Contract Address** | [`0x54dF67541a74121e0C6179757d22Ea466DdcA994`](https://testnet.monadexplorer.com/address/0x54dF67541a74121e0C6179757d22Ea466DdcA994) |
| **Network** | Monad Testnet |
| **Chain ID** | `10143` |
| **Native Token** | `MON` |
| **RPC Endpoint** | `https://testnet-rpc.monad.xyz` |
| **Explorer** | [Monad Explorer](https://testnet.monadexplorer.com/address/0x54dF67541a74121e0C6179757d22Ea466DdcA994) |
| **ABI File** | [`abi/BlockTypeDuelEscrow.json`](./abi/BlockTypeDuelEscrow.json) |

---

## 🛠 For Frontend Developers

### 1. Contract ABI
Import the ABI directly from [`abi/BlockTypeDuelEscrow.json`](./abi/BlockTypeDuelEscrow.json):
```typescript
import BlockTypeDuelABI from './abi/BlockTypeDuelEscrow.json';
const ESCROW_ADDRESS = '0x54dF67541a74121e0C6179757d22Ea466DdcA994';
```

### 2. Key Player Functions

#### A. Player 1: Create a Match Room
Deposits native MON to create a room.
```solidity
function createRoom(bytes32 roomId) external payable
```
- `roomId`: 32-byte unique ID (e.g. `ethers.keccak256(ethers.toUtf8Bytes("ROOM_NAME_OR_TIMESTAMP"))` or `viem.keccak256(stringToHex("ROOM_123"))`)
- `msg.value`: Wager amount in MON (e.g. `1 ether`)

#### B. Player 2: Join Match Room
Matches the exact wager deposited by Player 1.
```solidity
function joinRoom(bytes32 roomId) external payable
```
- `roomId`: The 32-byte ID of the room.
- `msg.value`: Must match `room.wagerAmount` exactly.

#### C. Player 1: Cancel Unmatched Room
Reclaims wager if no opponent joins.
```solidity
function cancelRoom(bytes32 roomId) external
```

#### D. Read Room Data
```solidity
function getRoom(bytes32 roomId) external view returns (MatchRoom memory)
```
Returns:
- `player1` (address)
- `player2` (address)
- `wagerAmount` (uint256)
- `status` (`0: WAITING`, `1: IN_PROGRESS`, `2: FINISHED`)
- `winner` (address)
- `p1Hits` (uint8)
- `p2Hits` (uint8)

---

## 📡 Events (For WebSocket / Indexer / UI Listener)

```solidity
event RoomCreated(bytes32 indexed roomId, address indexed player1, uint256 wagerAmount);
event RoomJoined(bytes32 indexed roomId, address indexed player2, uint256 wagerAmount);
event HitRecorded(bytes32 indexed roomId, address indexed striker, uint8 newHits);
event MatchSettled(bytes32 indexed roomId, address indexed winner, uint256 totalPrize);
event RoomCancelled(bytes32 indexed roomId, address indexed player1, uint256 refundAmount);
```

---

## 💻 Local Development & Testing

```bash
# Build contracts
forge build

# Run all 19 test cases
forge test -vv

# Gas profiling report
forge test --gas-report
```
