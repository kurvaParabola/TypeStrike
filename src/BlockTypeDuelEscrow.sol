// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockTypeDuelEscrow
 * @author Monad Blitz Hackathon Developer
 * @notice Production-grade 1v1 PvP typing duel escrow contract built for Monad.
 * @dev Handles escrowed MON wagers, off-chain authoritative server hit recordings,
 *      and instant trustless settlement upon reaching the 7-hit win threshold.
 */
contract BlockTypeDuelEscrow is ReentrancyGuard, Ownable {
    // --- Constants ---

    /// @notice Target hits required to win a typing match as specified in PRD rule #6.
    uint8 public constant WINNING_HITS = 7;

    // --- Enums & Structs ---

    enum MatchStatus {
        WAITING,
        IN_PROGRESS,
        FINISHED
    }

    struct MatchRoom {
        address player1;
        address player2;
        uint256 wagerAmount;
        MatchStatus status;
        address winner;
        uint8 p1Hits;
        uint8 p2Hits;
    }

    // --- State Variables ---

    /// @notice Authorized game server responsible for authoritative hit & match reporting.
    address public trustedGameServer;

    /// @notice Mapping of unique room IDs to their respective match room data.
    mapping(bytes32 => MatchRoom) public rooms;

    // --- Events ---

    event RoomCreated(bytes32 indexed roomId, address indexed player1, uint256 wagerAmount);
    event RoomJoined(bytes32 indexed roomId, address indexed player2, uint256 wagerAmount);
    event HitRecorded(bytes32 indexed roomId, address indexed striker, uint8 newHits);
    event MatchSettled(bytes32 indexed roomId, address indexed winner, uint256 totalPrize);
    event RoomCancelled(bytes32 indexed roomId, address indexed player1, uint256 refundAmount);
    event TrustedServerUpdated(address indexed oldServer, address indexed newServer);

    // --- Custom Errors (Gas-Optimized for Monad) ---

    error ZeroAddress();
    error InvalidRoomId();
    error InvalidWager();
    error RoomAlreadyExists();
    error RoomNotFound();
    error RoomNotWaiting();
    error RoomNotInProgress();
    error CannotPlaySelf();
    error WagerMismatch();
    error NotServer();
    error NotPlayer1();
    error InvalidStriker();
    error InvalidWinner();
    error TransferFailed();

    // --- Modifiers ---

    /// @notice Restricts invocation to the trusted game server or the contract owner.
    modifier onlyServer() {
        _checkServer();
        _;
    }

    function _checkServer() internal view {
        if (msg.sender != trustedGameServer && msg.sender != owner()) {
            revert NotServer();
        }
    }

    // --- Constructor ---

    /**
     * @notice Initializes the escrow contract with the authorized game server address.
     * @param _trustedServer Address of the backend server relaying match events.
     */
    constructor(address _trustedServer) Ownable(msg.sender) {
        if (_trustedServer == address(0)) revert ZeroAddress();
        trustedGameServer = _trustedServer;
    }

    // --- External Functions ---

    /**
     * @notice Creates a new 1v1 match room by depositing native MON as wager.
     * @param roomId Unique 32-byte identifier for the match.
     */
    function createRoom(bytes32 roomId) external payable nonReentrant {
        if (roomId == bytes32(0)) revert InvalidRoomId();
        if (msg.value == 0) revert InvalidWager();
        if (rooms[roomId].player1 != address(0)) revert RoomAlreadyExists();

        rooms[roomId] = MatchRoom({
            player1: msg.sender,
            player2: address(0),
            wagerAmount: msg.value,
            status: MatchStatus.WAITING,
            winner: address(0),
            p1Hits: 0,
            p2Hits: 0
        });

        emit RoomCreated(roomId, msg.sender, msg.value);
    }

    /**
     * @notice Allows Player 2 to join an existing waiting match room by matching the exact wager.
     * @param roomId Unique 32-byte identifier for the match.
     */
    function joinRoom(bytes32 roomId) external payable nonReentrant {
        MatchRoom storage room = rooms[roomId];

        if (room.player1 == address(0)) revert RoomNotFound();
        if (room.status != MatchStatus.WAITING) revert RoomNotWaiting();
        if (msg.sender == room.player1) revert CannotPlaySelf();
        if (msg.value != room.wagerAmount) revert WagerMismatch();

        room.player2 = msg.sender;
        room.status = MatchStatus.IN_PROGRESS;

        emit RoomJoined(roomId, msg.sender, msg.value);
    }

    /**
     * @notice Authoritative game server increments hit count for a player.
     *         If the striker reaches 7 hits, the match is completed and prize is disbursed.
     * @param roomId Unique 32-byte identifier for the match.
     * @param striker The player address that landed a valid typing combo/hit.
     */
    function recordHit(bytes32 roomId, address striker) external onlyServer nonReentrant {
        MatchRoom storage room = rooms[roomId];

        if (room.status != MatchStatus.IN_PROGRESS) revert RoomNotInProgress();
        if (striker != room.player1 && striker != room.player2) revert InvalidStriker();

        uint8 updatedHits;
        if (striker == room.player1) {
            updatedHits = ++room.p1Hits;
        } else {
            updatedHits = ++room.p2Hits;
        }

        emit HitRecorded(roomId, striker, updatedHits);

        // Win threshold check (PRD rule #6)
        if (updatedHits >= WINNING_HITS) {
            _payout(roomId, room, striker);
        }
    }

    /**
     * @notice Direct settlement by authorized server (e.g. timeout, forfeit, or disconnect).
     * @param roomId Unique 32-byte identifier for the match.
     * @param winner The winning player address who will receive the entire prize pool.
     */
    function settleMatch(bytes32 roomId, address winner) external onlyServer nonReentrant {
        MatchRoom storage room = rooms[roomId];

        if (room.status != MatchStatus.IN_PROGRESS) revert RoomNotInProgress();
        if (winner != room.player1 && winner != room.player2) revert InvalidWinner();

        _payout(roomId, room, winner);
    }

    /**
     * @notice Allows Player 1 to cancel the match and reclaim their full wager if unmatched.
     * @param roomId Unique 32-byte identifier for the match.
     */
    function cancelRoom(bytes32 roomId) external nonReentrant {
        MatchRoom storage room = rooms[roomId];

        if (room.player1 == address(0)) revert RoomNotFound();
        if (room.status != MatchStatus.WAITING) revert RoomNotWaiting();
        if (msg.sender != room.player1) revert NotPlayer1();

        // Checks-Effects-Interactions
        room.status = MatchStatus.FINISHED;
        uint256 refund = room.wagerAmount;
        room.wagerAmount = 0;

        emit RoomCancelled(roomId, msg.sender, refund);

        (bool success, ) = msg.sender.call{value: refund}("");
        if (!success) revert TransferFailed();
    }

    // --- Admin / Configuration Functions ---

    /**
     * @notice Updates the trusted game server address.
     * @param _newServer New backend server address.
     */
    function setTrustedServer(address _newServer) external onlyOwner {
        if (_newServer == address(0)) revert ZeroAddress();
        address oldServer = trustedGameServer;
        trustedGameServer = _newServer;

        emit TrustedServerUpdated(oldServer, _newServer);
    }

    // --- View / Pure Helper Functions ---

    /**
     * @notice Returns the entire room struct for a given roomId.
     * @param roomId Unique 32-byte identifier for the match.
     */
    function getRoom(bytes32 roomId) external view returns (MatchRoom memory) {
        return rooms[roomId];
    }

    // --- Internal Functions ---

    /**
     * @dev Internal payout routine adhering strictly to Checks-Effects-Interactions.
     * @param roomId Unique 32-byte identifier for the match.
     * @param room Storage reference to the match room.
     * @param winner Address of the player winning the pot.
     */
    function _payout(bytes32 roomId, MatchRoom storage room, address winner) internal {
        room.status = MatchStatus.FINISHED;
        room.winner = winner;

        uint256 prize = room.wagerAmount * 2;
        room.wagerAmount = 0;

        emit MatchSettled(roomId, winner, prize);

        (bool success, ) = winner.call{value: prize}("");
        if (!success) revert TransferFailed();
    }
}
