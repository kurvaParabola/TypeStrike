import type { WebSocket } from "ws";

export enum MatchStatus {
  WAITING = "WAITING",
  COUNTDOWN = "COUNTDOWN",
  IN_PROGRESS = "IN_PROGRESS",
  SETTLING = "SETTLING",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export interface PlayerSession {
  address: string;
  ws: WebSocket;
  hits: number;
  wpm: number;
  accuracy: number;
  typedChars: number;
  isReady: boolean;
}

export interface MatchRoomState {
  roomId: string;
  status: MatchStatus;
  player1?: PlayerSession;
  player2?: PlayerSession;
  wagerAmount?: string;
  currentSentence: string;
  sentenceStartTime: number;
  round: number;
  winner?: string;
  settleTxHash?: string;
}

// Client to Server WebSocket Messages
export type ClientMessage =
  | { type: "JOIN_ROOM"; roomId: string; playerAddress: string }
  | { type: "PLAYER_READY"; roomId: string; playerAddress: string }
  | {
      type: "TYPING_PROGRESS";
      roomId: string;
      playerAddress: string;
      currentInput: string;
      progressPercent: number;
      currentWpm: number;
    }
  | {
      type: "SUBMIT_SENTENCE";
      roomId: string;
      playerAddress: string;
      typedText: string;
      timeTakenMs: number;
    }
  | { type: "PING" };

// Server to Client WebSocket Messages
export type ServerMessage =
  | {
      type: "ROOM_STATE";
      roomId: string;
      status: MatchStatus;
      player1?: { address: string; hits: number; wpm: number };
      player2?: { address: string; hits: number; wpm: number };
      wagerAmount?: string;
    }
  | { type: "COUNTDOWN"; seconds: number }
  | {
      type: "ROUND_START";
      round: number;
      sentence: string;
      p1Hits: number;
      p2Hits: number;
    }
  | {
      type: "OPPONENT_PROGRESS";
      opponentAddress: string;
      progressPercent: number;
      wpm: number;
    }
  | {
      type: "HIT_SCORED";
      striker: string;
      p1Hits: number;
      p2Hits: number;
      nextSentence: string;
      message: string;
    }
  | {
      type: "MATCH_SETTLING";
      winner: string;
      message: string;
    }
  | {
      type: "MATCH_FINISHED";
      winner: string;
      p1Hits: number;
      p2Hits: number;
      txHash?: string;
      explorerUrl?: string;
    }
  | { type: "ERROR"; message: string }
  | { type: "PONG" };
