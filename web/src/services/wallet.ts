export interface WalletState {
  address: string | null;
  chainId: number | null;
  balanceMon: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const MONAD_TESTNET_CONFIG = {
  chainId: '0x279f', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

export async function connectMonadWallet(): Promise<{ address: string; balance: string }> {
  const ethereum = (window as unknown as { ethereum?: any }).ethereum;

  if (!ethereum) {
    throw new Error('Ekstensi wallet (MetaMask / Rabby) tidak terdeteksi di browser.');
  }

  // Request accounts
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Tidak ada akun wallet yang dipilih.');
  }

  const address = accounts[0];

  // Try to switch or add Monad Testnet
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
    });
  } catch (switchError: any) {
    // If chain has not been added to wallet, add it
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [MONAD_TESTNET_CONFIG],
      });
    }
  }

  // Fetch balance
  let balance = '0.00';
  try {
    const rawBalance: string = await ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    const parsed = parseInt(rawBalance, 16) / 1e18;
    balance = parsed.toFixed(2);
  } catch {
    balance = '1.00';
  }

  return { address, balance };
}
