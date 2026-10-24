import { Peer, type DataConnection } from 'peerjs';
import type { Player, CombatWord } from '../types';

export type P2PMessage =
  | { type: 'GUEST_JOINED'; player: Player }
  | { type: 'HOST_ACCEPT'; player: Player }
  | { type: 'START_MATCH'; initialWord: CombatWord }
  | { type: 'ATTACK'; damage: number; char: string; buffType?: string; isCrit?: boolean; isFinisher?: boolean }
  | { type: 'REMATCH_OFFER' }
  | { type: 'REMATCH_ACCEPT' };

export class P2PService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  public isHost: boolean = false;
  public isConnected: boolean = false;
  public opponent: Player | null = null;
  private onMessageCallback: ((msg: P2PMessage) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  /**
   * Helper to format a clean peer ID from room code (e.g. "MON-4582" -> "typestrike-mon-4582")
   */
  public getPeerId(roomCode: string): string {
    const clean = roomCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `typestrike-v1-${clean}`;
  }

  /**
   * Initialize as Host (Room Master). Listens for a guest connecting with the room code.
   */
  public initHost(
    roomCode: string,
    hostPlayer: Player,
    onGuestConnected: (guest: Player) => void,
    onMessage: (msg: P2PMessage) => void,
    onError: (err: string) => void
  ) {
    this.cleanup();
    this.isHost = true;
    this.onMessageCallback = onMessage;

    const peerId = this.getPeerId(roomCode);

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
      });

      this.peer.on('open', () => {
        console.log(`[P2P Host] Room ready on peer ID: ${peerId}`);
      });

      this.peer.on('connection', (connection) => {
        console.log('[P2P Host] Incoming guest connection!');
        this.conn = connection;
        this.setupConnection(hostPlayer, onGuestConnected);
      });

      this.peer.on('error', (err: any) => {
        console.error('[P2P Host error]', err);
        if (err.type === 'unavailable-id') {
          onError('Kode room ini sedang dipakai oleh player lain. Silakan acak kode baru.');
        } else {
          onError(`Gagal membuat room P2P: ${err.message || 'Koneksi error'}`);
        }
      });
    } catch (e: any) {
      onError(`Error inisialisasi P2P: ${e.message}`);
    }
  }

  /**
   * Initialize as Guest. Connects to the host's peer ID.
   */
  public connectGuest(
    roomCode: string,
    guestPlayer: Player,
    onConnected: (host: Player) => void,
    onMessage: (msg: P2PMessage) => void,
    onError: (err: string) => void
  ) {
    this.cleanup();
    this.isHost = false;
    this.onMessageCallback = onMessage;

    const hostPeerId = this.getPeerId(roomCode);

    try {
      // Guest creates an anonymous peer then connects to host
      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', () => {
        console.log(`[P2P Guest] Connected to signaling, dialing host: ${hostPeerId}`);
        const connection = this.peer!.connect(hostPeerId, {
          reliable: true,
        });

        this.conn = connection;

        connection.on('open', () => {
          console.log('[P2P Guest] DataChannel open! Sending guest info...');
          this.isConnected = true;
          // Send guest player details to host
          connection.send({
            type: 'GUEST_JOINED',
            player: guestPlayer,
          });
        });

        connection.on('data', (data: any) => {
          const msg = data as P2PMessage;
          if (msg.type === 'HOST_ACCEPT') {
            this.opponent = msg.player;
            onConnected(msg.player);
          } else if (this.onMessageCallback) {
            this.onMessageCallback(msg);
          }
        });

        connection.on('close', () => {
          this.isConnected = false;
          if (this.onDisconnectCallback) this.onDisconnectCallback();
        });

        connection.on('error', (connErr) => {
          console.error('[P2P Guest Conn Error]', connErr);
          onError('Gagal terhubung ke Host. Pastikan kode room benar dan Host sedang menunggu.');
        });
      });

      this.peer.on('error', (err: any) => {
        console.error('[P2P Guest Error]', err);
        if (err.type === 'peer-unavailable') {
          onError('Room tidak ditemukan. Pastikan Host sudah mengklik "Buat Room" dan kode sesuai.');
        } else {
          onError(`Error koneksi: ${err.message || 'Tidak dapat terhubung'}`);
        }
      });
    } catch (e: any) {
      onError(`Gagal menghubungkan ke room: ${e.message}`);
    }
  }

  /**
   * Internal connection listener setup for Host
   */
  private setupConnection(
    hostPlayer: Player,
    onGuestConnected: (guest: Player) => void
  ) {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.isConnected = true;
      console.log('[P2P Host] DataChannel opened with guest.');
    });

    this.conn.on('data', (data: any) => {
      const msg = data as P2PMessage;
      if (msg.type === 'GUEST_JOINED') {
        this.opponent = msg.player;
        // Reply with host player details
        this.send({
          type: 'HOST_ACCEPT',
          player: hostPlayer,
        });
        onGuestConnected(msg.player);
      } else if (this.onMessageCallback) {
        this.onMessageCallback(msg);
      }
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      this.opponent = null;
      if (this.onDisconnectCallback) this.onDisconnectCallback();
    });
  }

  /**
   * Send a message to the connected peer
   */
  public send(msg: P2PMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  }

  /**
   * Set callback for incoming P2P messages
   */
  public onMessage(cb: (msg: any) => void) {
    this.onMessageCallback = cb;
  }

  /**
   * Set callback for when opponent disconnects
   */
  public onDisconnect(cb: () => void) {
    this.onDisconnectCallback = cb;
  }

  /**
   * Disconnect and clean up peer connections
   */
  public cleanup() {
    if (this.conn) {
      try {
        this.conn.close();
      } catch {
        // Ignored
      }
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignored
      }
      this.peer = null;
    }
    this.isConnected = false;
    this.opponent = null;
    this.onMessageCallback = null;
    this.onDisconnectCallback = null;
  }
}

export const p2p = new P2PService();
