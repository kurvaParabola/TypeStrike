import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { defineChain } from "viem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory first, fallback to root project directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: [process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: [process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadExplorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const CONFIG = {
  PORT: Number(process.env.PORT || 4000),
  RPC_URL: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
  CHAIN: monadTestnet,
  CONTRACT_ADDRESS: (process.env.CONTRACT_ADDRESS ||
    "0x54dF67541a74121e0C6179757d22Ea466DdcA994") as `0x${string}`,
  PRIVATE_KEY: (process.env.PRIVATE_KEY?.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`) as `0x${string}`,
  WINNING_HITS: 7, // PRD Rule #6
};
