import type { WebSocket } from "ws";
import {
  MatchStatus,
  type MatchRoomState,
  type PlayerSession,
  type ServerMessage,
} from "./types.js";
import { getRandomSentence } from "./sentences.js";
import { blockchain } from "./blockchain.js";
import { CONFIG } from "./config.js";

export class GameManager {
  private rooms: Map<string, MatchRoomState> = new Map();

  /**
   * Helper to broadcast a JSON message to all connected players in a room.
   */
  private broadcast(room: MatchRoomState, message: ServerMessage) {
    const payload = JSON.stringify(message);

    if (room.player1?.ws?.readyState === 1) {
      room.player1.ws.send(payload);
    }
    if (room.player2?.ws?.readyState === 1) {
      room.player2.ws.send(payload);
    }
  }

  /**
   * Helper to send a message to a specific player websocket.
   */
  private send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handles player joining a match room via WebSocket.
   */
  public async handleJoinRoom(
    roomId: string,
    playerAddress: string,
    ws: WebSocket
  ) {
    const normAddress = playerAddress.toLowerCase();
    let room = this.rooms.get(roomId);

    if (!room) {
      // Create new room in memory
      room = {
        roomId,
        status: MatchStatus.WAITING,
        currentSentence: getRandomSentence(),
        sentenceStartTime: Date.now(),
        round: 1,
      };
      this.rooms.set(roomId, room);

      // Verify onchain wager if available
      if (roomId.startsWith("0x")) {
        const onchainData = await blockchain.getRoomOnchain(
          roomId as `0x${string}`
        );
        if (onchainData) {
          room.wagerAmount = onchainData.wagerAmount;
        }
      }
    }

    // Reconnection or assigning player 1 / player 2
    if (!room.player1 || room.player1.address === normAddress) {
      room.player1 = {
        address: normAddress,
        ws,
        hits: room.player1?.hits || 0,
        wpm: room.player1?.wpm || 0,
        accuracy: 100,
        typedChars: 0,
        isReady: true,
      };
      console.log(`[Room ${roomId}] Player 1 joined: ${normAddress}`);
    } else if (!room.player2 || room.player2.address === normAddress) {
      room.player2 = {
        address: normAddress,
        ws,
        hits: room.player2?.hits || 0,
        wpm: room.player2?.wpm || 0,
        accuracy: 100,
        typedChars: 0,
        isReady: true,
      };
      console.log(`[Room ${roomId}] Player 2 joined: ${normAddress}`);
    } else {
      this.send(ws, {
        type: "ERROR",
        message: "Room is already full with 2 players.",
      });
      return;
    }

    // Broadcast current room status
    this.broadcast(room, {
      type: "ROOM_STATE",
      roomId,
      status: room.status,
      player1: room.player1
        ? {
            address: room.player1.address,
            hits: room.player1.hits,
            wpm: room.player1.wpm,
          }
        : undefined,
      player2: room.player2
        ? {
            address: room.player2.address,
            hits: room.player2.hits,
            wpm: room.player2.wpm,
          }
        : undefined,
      wagerAmount: room.wagerAmount,
    });

    // If both players are connected and room is waiting, start match countdown
    if (room.player1 && room.player2 && room.status === MatchStatus.WAITING) {
      this.startCountdown(room);
    }
  }

  /**
   * Initiates a 3-second countdown before round 1 begins.
   */
  private startCountdown(room: MatchRoomState) {
    room.status = MatchStatus.COUNTDOWN;
    let secondsLeft = 3;

    console.log(`[Room ${room.roomId}] Starting countdown...`);
    this.broadcast(room, { type: "COUNTDOWN", seconds: secondsLeft });

    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        this.broadcast(room, { type: "COUNTDOWN", seconds: secondsLeft });
      } else {
        clearInterval(interval);
        this.startRound(room);
      }
    }, 1000);
  }

  /**
   * Starts a new typing round with a target sentence.
   */
  private startRound(room: MatchRoomState) {
    room.status = MatchStatus.IN_PROGRESS;
    room.currentSentence = getRandomSentence(room.currentSentence);
    room.sentenceStartTime = Date.now();

    console.log(
      `[Room ${room.roomId}] Round ${room.round} started! Target: "${room.currentSentence}"`
    );

    this.broadcast(room, {
      type: "ROUND_START",
      round: room.round,
      sentence: room.currentSentence,
      p1Hits: room.player1?.hits || 0,
      p2Hits: room.player2?.hits || 0,
    });
  }

  /**
   * Handles real-time typing progress updates to relay to opponent.
   */
  public handleTypingProgress(
    roomId: string,
    playerAddress: string,
    progressPercent: number,
    currentWpm: number
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== MatchStatus.IN_PROGRESS) return;

    const normAddress = playerAddress.toLowerCase();
    const opponent =
      room.player1?.address === normAddress ? room.player2 : room.player1;

    if (opponent?.ws?.readyState === 1) {
      opponent.ws.send(
        JSON.stringify({
          type: "OPPONENT_PROGRESS",
          opponentAddress: normAddress,
          progressPercent,
          wpm: currentWpm,
        })
      );
    }
  }

  /**
   * Handles sentence submission when a player finishes typing.
   */
  public async handleSubmitSentence(
    roomId: string,
    playerAddress: string,
    typedText: string,
    timeTakenMs: number
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== MatchStatus.IN_PROGRESS) return;

    const normAddress = playerAddress.toLowerCase();
    const isPlayer1 = room.player1?.address === normAddress;
    const player = isPlayer1 ? room.player1 : room.player2;

    if (!player) return;

    // Authoritative verification: Check exact sentence match
    if (typedText.trim() !== room.currentSentence.trim()) {
      this.send(player.ws, {
        type: "ERROR",
        message: "Sentence does not match target. Keep typing!",
      });
      return;
    }

    // Calculate WPM: (words) / (timeTakenMinutes)
    const wordsCount = room.currentSentence.split(" ").length;
    const timeMinutes = Math.max(timeTakenMs / 1000 / 60, 0.01);
    const calculatedWpm = Math.round(wordsCount / timeMinutes);
    player.wpm = calculatedWpm;

    // Increment player's hit score
    player.hits += 1;
    room.round += 1;

    console.log(
      `💥 [Room ${roomId}] HIT! ${normAddress} landed a hit! Total: ${player.hits}/${CONFIG.WINNING_HITS} (WPM: ${calculatedWpm})`
    );

    // Check Win Condition (PRD Rule #6: First to 7 hits wins)
    if (player.hits >= CONFIG.WINNING_HITS) {
      await this.handleMatchVictory(room, normAddress);
      return;
    }

    // Pick next sentence and broadcast hit scored
    const nextSentence = getRandomSentence(room.currentSentence);
    room.currentSentence = nextSentence;
    room.sentenceStartTime = Date.now();

    this.broadcast(room, {
      type: "HIT_SCORED",
      striker: normAddress,
      p1Hits: room.player1?.hits || 0,
      p2Hits: room.player2?.hits || 0,
      nextSentence,
      message: `${normAddress.slice(0, 6)}... scored a hit! (${player.hits}/${CONFIG.WINNING_HITS})`,
    });
  }

  /**
   * Triggered when a player reaches 7 hits. Executes onchain settlement on Monad.
   */
  private async handleMatchVictory(
    room: MatchRoomState,
    winnerAddress: string
  ) {
    room.status = MatchStatus.SETTLING;
    room.winner = winnerAddress;

    console.log(
      `🏆 [Room ${room.roomId}] VICTORY! Winner: ${winnerAddress}. Settling on Monad...`
    );

    this.broadcast(room, {
      type: "MATCH_SETTLING",
      winner: winnerAddress,
      message: "Match won! Submitting authoritative settlement to Monad...",
    });

    let txHash: string | undefined;

    // Settle on Monad Testnet if roomId is bytes32 hex
    if (room.roomId.startsWith("0x") && room.roomId.length === 66) {
      try {
        const hash = await blockchain.settleMatchOnchain(
          room.roomId as `0x${string}`,
          winnerAddress as `0x${string}`
        );
        txHash = hash;
        room.settleTxHash = hash;
      } catch (error) {
        console.error(
          `[Room ${room.roomId}] Onchain settlement error:`,
          error
        );
      }
    } else {
      console.log(
        `[Room ${room.roomId}] Non-hex room ID, simulating instant settlement.`
      );
    }

    room.status = MatchStatus.FINISHED;

    this.broadcast(room, {
      type: "MATCH_FINISHED",
      winner: winnerAddress,
      p1Hits: room.player1?.hits || 0,
      p2Hits: room.player2?.hits || 0,
      txHash,
      explorerUrl: txHash
        ? `https://testnet.monadexplorer.com/tx/${txHash}`
        : undefined,
    });
  }

  /**
   * Handle player disconnects.
   */
  public handleDisconnect(ws: WebSocket) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.player1?.ws === ws) {
        console.log(`[Room ${roomId}] Player 1 disconnected.`);
        room.player1 = undefined;
      } else if (room.player2?.ws === ws) {
        console.log(`[Room ${roomId}] Player 2 disconnected.`);
        room.player2 = undefined;
      }

      // If both disconnected and room is empty, cleanup room
      if (!room.player1 && !room.player2) {
        this.rooms.delete(roomId);
      }
    }
  }
}

export const gameManager = new GameManager();
