import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONFIG } from "./config.js";

// Minimal ABI containing functions used by the Authoritative Server
export const ESCROW_ABI = [
  {
    type: "function",
    name: "getRoom",
    inputs: [{ name: "roomId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "player1", type: "address" },
          { name: "player2", type: "address" },
          { name: "wagerAmount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "winner", type: "address" },
          { name: "p1Hits", type: "uint8" },
          { name: "p2Hits", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recordHit",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "striker", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settleMatch",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export class BlockchainService {
  public publicClient;
  public walletClient;
  public serverAccount;

  constructor() {
    this.publicClient = createPublicClient({
      chain: CONFIG.CHAIN,
      transport: http(CONFIG.RPC_URL),
    });

    if (!CONFIG.PRIVATE_KEY || CONFIG.PRIVATE_KEY.length !== 66) {
      console.warn(
        "⚠️ Warning: Valid PRIVATE_KEY not found in environment. Onchain transactions will run in simulation mode."
      );
      this.serverAccount = null;
      this.walletClient = null;
    } else {
      this.serverAccount = privateKeyToAccount(CONFIG.PRIVATE_KEY);
      this.walletClient = createWalletClient({
        account: this.serverAccount,
        chain: CONFIG.CHAIN,
        transport: http(CONFIG.RPC_URL),
      });

      console.log(
        `🔗 BlockchainService initialized with Server Wallet: ${this.serverAccount.address}`
      );
    }
  }

  /**
   * Reads on-chain room data from BlockTypeDuelEscrow contract.
   */
  async getRoomOnchain(roomId: `0x${string}`) {
    try {
      const room = await this.publicClient.readContract({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "getRoom",
        args: [roomId],
      });

      return {
        player1: room.player1,
        player2: room.player2,
        wagerAmount: formatEther(room.wagerAmount),
        status: Number(room.status),
        winner: room.winner,
        p1Hits: room.p1Hits,
        p2Hits: room.p2Hits,
      };
    } catch (error) {
      console.error(`Failed to read room ${roomId} onchain:`, error);
      return null;
    }
  }

  /**
   * Calls settleMatch on BlockTypeDuelEscrow to disburse (wager * 2) to the winner.
   */
  async settleMatchOnchain(
    roomId: `0x${string}`,
    winnerAddress: `0x${string}`
  ): Promise<Hash> {
    if (!this.walletClient || !this.serverAccount) {
      throw new Error("Server wallet client not initialized with private key");
    }

    console.log(
      `⚡ Settling match on Monad for room ${roomId} | Winner: ${winnerAddress}...`
    );

    const hash = await this.walletClient.writeContract({
      address: CONFIG.CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "settleMatch",
      args: [roomId, winnerAddress],
    });

    console.log(`📤 Settle tx broadcasted! Hash: ${hash}`);

    // Wait for sub-second Monad receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
    });

    console.log(
      `✅ Match settled successfully on Monad! Block: ${receipt.blockNumber} | Status: ${receipt.status}`
    );

    return hash;
  }
}

export const blockchain = new BlockchainService();
