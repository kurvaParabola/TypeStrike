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
  blockExplorerUrls: ['https://testnet.monadvision.com'],
};

export async function connectMonadWallet(): Promise<{ address: string; balance: string }> {
  const ethereum = (window as unknown as { ethereum?: any }).ethereum;

  if (!ethereum) {
    throw new Error('Ekstensi wallet (MetaMask / Rabby / Phantom) tidak terdeteksi di browser.');
  }

  // 1. Request accounts
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Tidak ada akun wallet yang dipilih.');
  }

  const address = accounts[0];

  // 2. Check if current chain is already Monad Testnet (0x279f)
  try {
    const currentChainId: string = await ethereum.request({ method: 'eth_chainId' });
    if (currentChainId?.toLowerCase() !== MONAD_TESTNET_CONFIG.chainId.toLowerCase()) {
      // Try to switch first
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // If chain has not been added to wallet (4902), prompt to add it
        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MONAD_TESTNET_CONFIG],
          });
        }
      }
    }
  } catch (chainErr) {
    console.warn('Chain switch check bypassed:', chainErr);
  }

  // 3. Fetch latest MON balance
  let balance = '0.00';
  try {
    const rawBalance: string = await ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    const parsed = parseInt(rawBalance, 16) / 1e18;
    balance = parsed.toFixed(2);
  } catch {
    balance = '0.00';
  }

  return { address, balance };
}

