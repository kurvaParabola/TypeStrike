import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { CONFIG } from "./config.js";
import { gameManager } from "./gameManager.js";
import type { ClientMessage } from "./types.js";

// HTTP Server for basic health checks
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        game: "TypeStrike (BlockTypeDuel)",
        network: "Monad Testnet",
        chainId: CONFIG.CHAIN.id,
        contract: CONFIG.CONTRACT_ADDRESS,
        winningHits: CONFIG.WINNING_HITS,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("BlockTypeDuel Authoritative WebSocket Game Server is running!");
});

// WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("⚡ New client connected via WebSocket");

  ws.on("message", (data: string) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());

      switch (msg.type) {
        case "JOIN_ROOM":
          gameManager.handleJoinRoom(msg.roomId, msg.playerAddress, ws);
          break;

        case "TYPING_PROGRESS":
          gameManager.handleTypingProgress(
            msg.roomId,
            msg.playerAddress,
            msg.progressPercent,
            msg.currentWpm
          );
          break;

        case "SUBMIT_SENTENCE":
          gameManager.handleSubmitSentence(
            msg.roomId,
            msg.playerAddress,
            msg.typedText,
            msg.timeTakenMs
          );
          break;

        case "PING":
          ws.send(JSON.stringify({ type: "PONG" }));
          break;

        default:
          console.warn("Unknown message received:", msg);
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Invalid JSON format",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    gameManager.handleDisconnect(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket client error:", err);
    gameManager.handleDisconnect(ws);
  });
});

server.listen(CONFIG.PORT, () => {
  console.log("==================================================");
  console.log("🎮 TypeStrike (BlockTypeDuel) Authoritative Game Server");
  console.log(`🌐 HTTP Port: http://localhost:${CONFIG.PORT}`);
  console.log(`⚡ WebSocket: ws://localhost:${CONFIG.PORT}`);
  console.log(`🔗 Monad RPC: ${CONFIG.RPC_URL}`);
  console.log(`📜 Contract : ${CONFIG.CONTRACT_ADDRESS}`);
  console.log(`🎯 Win Rules: First to ${CONFIG.WINNING_HITS} hits wins!`);
  console.log("==================================================");
});
