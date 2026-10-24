export const ESCROW_CONTRACT_ADDRESS = '0x54dF67541a74121e0C6179757d22Ea466DdcA994';
export const MONAD_CHAIN_ID_HEX = '0x279f'; // 10143

/**
 * Converts a room code (e.g. "MON-4582") into a deterministic 32-byte hex string (bytes32).
 */
export function roomCodeToBytes32(roomCode: string): string {
  const clean = roomCode.trim().toUpperCase();
  let hex = '';
  for (let i = 0; i < clean.length; i++) {
    hex += clean.charCodeAt(i).toString(16).padStart(2, '0');
  }
  // Pad with trailing zeros to reach 32 bytes (64 hex characters)
  return '0x' + hex.padEnd(64, '0');
}

/**
 * Converts MON string (e.g. "0.05") into wei in hex format.
 */
export function monToWeiHex(monAmount: string): string {
  const floatVal = parseFloat(monAmount) || 0;
  const weiBigInt = BigInt(Math.round(floatVal * 1e18));
  return '0x' + weiBigInt.toString(16);
}

/**
 * Calls createRoom(bytes32 roomId) on the Escrow contract with msg.value = wagerAmount.
 * Returns the transaction hash.
 */
export async function createRoomOnchain(
  roomCode: string,
  wagerMon: string,
  userAddress: string
): Promise<string> {
  const ethereum = (window as unknown as { ethereum?: any }).ethereum;
  if (!ethereum) {
    throw new Error('Ekstensi wallet (MetaMask / Rabby) tidak terdeteksi.');
  }

  const roomIdBytes32 = roomCodeToBytes32(roomCode);
  const valueHex = monToWeiHex(wagerMon);

  // Function selector for createRoom(bytes32) = 0x2e1ca42a
  const data = '0x2e1ca42a' + roomIdBytes32.slice(2);

  const txHash: string = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: userAddress,
        to: ESCROW_CONTRACT_ADDRESS,
        value: valueHex,
        data: data,
      },
    ],
  });

  return txHash;
}

/**
 * Calls joinRoom(bytes32 roomId) on the Escrow contract with msg.value = wagerAmount.
 * Returns the transaction hash.
 */
export async function joinRoomOnchain(
  roomCode: string,
  wagerMon: string,
  userAddress: string
): Promise<string> {
  const ethereum = (window as unknown as { ethereum?: any }).ethereum;
  if (!ethereum) {
    throw new Error('Ekstensi wallet (MetaMask / Rabby) tidak terdeteksi.');
  }

  const roomIdBytes32 = roomCodeToBytes32(roomCode);
  const valueHex = monToWeiHex(wagerMon);

  // Function selector for joinRoom(bytes32) = 0x4b29b4c4
  const data = '0x4b29b4c4' + roomIdBytes32.slice(2);

  const txHash: string = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: userAddress,
        to: ESCROW_CONTRACT_ADDRESS,
        value: valueHex,
        data: data,
      },
    ],
  });

  return txHash;
}

/**
 * Reads room details from the Escrow contract via eth_call: getRoom(bytes32 roomId)
 */
export async function getRoomOnchain(roomCode: string): Promise<{
  player1: string;
  player2: string;
  wagerMon: string;
  status: number;
} | null> {
  const ethereum = (window as unknown as { ethereum?: any }).ethereum;
  if (!ethereum) return null;

  try {
    const roomIdBytes32 = roomCodeToBytes32(roomCode);
    // Function selector for getRoom(bytes32) = 0xad9a2866
    const callData = '0xad9a2866' + roomIdBytes32.slice(2);

    const rawResult: string = await ethereum.request({
      method: 'eth_call',
      params: [
        {
          to: ESCROW_CONTRACT_ADDRESS,
          data: callData,
        },
        'latest',
      ],
    });

    if (!rawResult || rawResult === '0x' || rawResult.length < 130) {
      return null;
    }

    // MatchRoom struct ABI layout:
    // [0..64]: player1 address
    // [64..128]: player2 address
    // [128..192]: wagerAmount (uint256 wei)
    // [192..256]: status (uint8: 0=WAITING, 1=IN_PROGRESS, 2=FINISHED)
    const p1Raw = rawResult.slice(2 + 24, 2 + 64);
    const player1 = '0x' + p1Raw;
    if (player1 === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const p2Raw = rawResult.slice(2 + 64 + 24, 2 + 128);
    const player2 = '0x' + p2Raw;

    const wagerHex = rawResult.slice(2 + 128, 2 + 192);
    const wagerWei = BigInt('0x' + wagerHex);
    const wagerMon = (Number(wagerWei) / 1e18).toFixed(2);

    const statusHex = rawResult.slice(2 + 192, 2 + 256);
    const status = parseInt(statusHex, 16) || 0;

    return {
      player1,
      player2,
      wagerMon,
      status,
    };
  } catch (err) {
    console.warn('Failed to read room onchain:', err);
    return null;
  }
}
