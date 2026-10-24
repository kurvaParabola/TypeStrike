// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BlockTypeDuelEscrow} from "../src/BlockTypeDuelEscrow.sol";

contract BlockTypeDuelTest is Test {
    BlockTypeDuelEscrow public escrow;

    address public owner = makeAddr("owner");
    address public server = makeAddr("server");
    address public player1 = makeAddr("player1");
    address public player2 = makeAddr("player2");
    address public outsider = makeAddr("outsider");

    bytes32 public roomId = keccak256("ROOM_ALPHA_001");
    uint256 public constant WAGER = 1 ether; // 1 MON token

    // Events to verify
    event RoomCreated(bytes32 indexed roomId, address indexed player1, uint256 wagerAmount);
    event RoomJoined(bytes32 indexed roomId, address indexed player2, uint256 wagerAmount);
    event HitRecorded(bytes32 indexed roomId, address indexed striker, uint8 newHits);
    event MatchSettled(bytes32 indexed roomId, address indexed winner, uint256 totalPrize);
    event RoomCancelled(bytes32 indexed roomId, address indexed player1, uint256 refundAmount);

    function setUp() public {
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        vm.deal(outsider, 10 ether);

        vm.prank(owner);
        escrow = new BlockTypeDuelEscrow(server);
    }

    // --- Creation Tests ---

    function test_CreateRoom_Success() public {
        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit RoomCreated(roomId, player1, WAGER);
        escrow.createRoom{value: WAGER}(roomId);

        BlockTypeDuelEscrow.MatchRoom memory room = escrow.getRoom(roomId);
        assertEq(room.player1, player1);
        assertEq(room.player2, address(0));
        assertEq(room.wagerAmount, WAGER);
        assertEq(uint8(room.status), uint8(BlockTypeDuelEscrow.MatchStatus.WAITING));
        assertEq(room.winner, address(0));
        assertEq(room.p1Hits, 0);
        assertEq(room.p2Hits, 0);
        assertEq(address(escrow).balance, WAGER);
    }

    function test_CreateRoom_RevertIf_ZeroWager() public {
        vm.prank(player1);
        vm.expectRevert(BlockTypeDuelEscrow.InvalidWager.selector);
        escrow.createRoom{value: 0}(roomId);
    }

    function test_CreateRoom_RevertIf_ZeroRoomId() public {
        vm.prank(player1);
        vm.expectRevert(BlockTypeDuelEscrow.InvalidRoomId.selector);
        escrow.createRoom{value: WAGER}(bytes32(0));
    }

    function test_CreateRoom_RevertIf_DuplicateRoomId() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);

        vm.prank(player2);
        vm.expectRevert(BlockTypeDuelEscrow.RoomAlreadyExists.selector);
        escrow.createRoom{value: WAGER}(roomId);
    }

    // --- Join Tests ---

    function test_JoinRoom_Success() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);

        vm.prank(player2);
        vm.expectEmit(true, true, false, true);
        emit RoomJoined(roomId, player2, WAGER);
        escrow.joinRoom{value: WAGER}(roomId);

        BlockTypeDuelEscrow.MatchRoom memory room = escrow.getRoom(roomId);
        assertEq(room.player2, player2);
        assertEq(uint8(room.status), uint8(BlockTypeDuelEscrow.MatchStatus.IN_PROGRESS));
        assertEq(address(escrow).balance, WAGER * 2);
    }

    function test_JoinRoom_RevertIf_SelfPlay() public {
        vm.startPrank(player1);
        escrow.createRoom{value: WAGER}(roomId);

        vm.expectRevert(BlockTypeDuelEscrow.CannotPlaySelf.selector);
        escrow.joinRoom{value: WAGER}(roomId);
        vm.stopPrank();
    }

    function test_JoinRoom_RevertIf_WagerMismatch() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);

        vm.prank(player2);
        vm.expectRevert(BlockTypeDuelEscrow.WagerMismatch.selector);
        escrow.joinRoom{value: WAGER + 0.5 ether}(roomId);
    }

    function test_JoinRoom_RevertIf_RoomNotFound() public {
        bytes32 nonExistentRoom = keccak256("NON_EXISTENT");
        vm.prank(player2);
        vm.expectRevert(BlockTypeDuelEscrow.RoomNotFound.selector);
        escrow.joinRoom{value: WAGER}(nonExistentRoom);
    }

    // --- Hit Recording & 7-Hit Settlement Tests ---

    function test_RecordHit_ProgressionAndAutoPayoutOn7Hits() public {
        // Setup match
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        uint256 p1BalBefore = player1.balance;

        // Player 1 scores 6 hits
        for (uint8 i = 1; i <= 6; i++) {
            vm.prank(server);
            vm.expectEmit(true, true, false, true);
            emit HitRecorded(roomId, player1, i);
            escrow.recordHit(roomId, player1);

            BlockTypeDuelEscrow.MatchRoom memory midRoom = escrow.getRoom(roomId);
            assertEq(midRoom.p1Hits, i);
            assertEq(uint8(midRoom.status), uint8(BlockTypeDuelEscrow.MatchStatus.IN_PROGRESS));
        }

        // Player 2 scores 2 hits
        for (uint8 i = 1; i <= 2; i++) {
            vm.prank(server);
            escrow.recordHit(roomId, player2);
        }

        // 7th hit by Player 1 wins the match!
        vm.prank(server);
        vm.expectEmit(true, true, false, true);
        emit HitRecorded(roomId, player1, 7);
        vm.expectEmit(true, true, false, true);
        emit MatchSettled(roomId, player1, WAGER * 2);
        escrow.recordHit(roomId, player1);

        // Check final room state
        BlockTypeDuelEscrow.MatchRoom memory finalRoom = escrow.getRoom(roomId);
        assertEq(uint8(finalRoom.status), uint8(BlockTypeDuelEscrow.MatchStatus.FINISHED));
        assertEq(finalRoom.winner, player1);
        assertEq(finalRoom.p1Hits, 7);
        assertEq(finalRoom.p2Hits, 2);

        // Check balances
        assertEq(player1.balance, p1BalBefore + (WAGER * 2));
        assertEq(address(escrow).balance, 0);
    }

    function test_RecordHit_RevertIf_NotServer() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        vm.prank(outsider);
        vm.expectRevert(BlockTypeDuelEscrow.NotServer.selector);
        escrow.recordHit(roomId, player1);
    }

    function test_RecordHit_RevertIf_InvalidStriker() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        vm.prank(server);
        vm.expectRevert(BlockTypeDuelEscrow.InvalidStriker.selector);
        escrow.recordHit(roomId, outsider);
    }

    // --- Direct Settlement (settleMatch) Tests ---

    function test_SettleMatch_DirectSuccess() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        uint256 p2BalBefore = player2.balance;

        // Server calls settleMatch directly with winner = player2
        vm.prank(server);
        vm.expectEmit(true, true, false, true);
        emit MatchSettled(roomId, player2, WAGER * 2);
        escrow.settleMatch(roomId, player2);

        BlockTypeDuelEscrow.MatchRoom memory room = escrow.getRoom(roomId);
        assertEq(uint8(room.status), uint8(BlockTypeDuelEscrow.MatchStatus.FINISHED));
        assertEq(room.winner, player2);
        assertEq(player2.balance, p2BalBefore + (WAGER * 2));
        assertEq(address(escrow).balance, 0);
    }

    function test_SettleMatch_RevertIf_InvalidWinner() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        vm.prank(server);
        vm.expectRevert(BlockTypeDuelEscrow.InvalidWinner.selector);
        escrow.settleMatch(roomId, outsider);
    }

    function test_SettleMatch_RevertIf_NotServer() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        vm.prank(outsider);
        vm.expectRevert(BlockTypeDuelEscrow.NotServer.selector);
        escrow.settleMatch(roomId, player1);
    }

    // --- Cancellation Tests ---

    function test_CancelRoom_Success() public {
        uint256 p1BalBefore = player1.balance;

        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        assertEq(player1.balance, p1BalBefore - WAGER);

        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit RoomCancelled(roomId, player1, WAGER);
        escrow.cancelRoom(roomId);

        BlockTypeDuelEscrow.MatchRoom memory room = escrow.getRoom(roomId);
        assertEq(uint8(room.status), uint8(BlockTypeDuelEscrow.MatchStatus.FINISHED));
        assertEq(room.wagerAmount, 0);
        assertEq(player1.balance, p1BalBefore);
        assertEq(address(escrow).balance, 0);
    }

    function test_CancelRoom_RevertIf_NotPlayer1() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);

        vm.prank(outsider);
        vm.expectRevert(BlockTypeDuelEscrow.NotPlayer1.selector);
        escrow.cancelRoom(roomId);
    }

    function test_CancelRoom_RevertIf_NotInWaitingStatus() public {
        vm.prank(player1);
        escrow.createRoom{value: WAGER}(roomId);
        vm.prank(player2);
        escrow.joinRoom{value: WAGER}(roomId);

        // Now in IN_PROGRESS, cannot cancel
        vm.prank(player1);
        vm.expectRevert(BlockTypeDuelEscrow.RoomNotWaiting.selector);
        escrow.cancelRoom(roomId);
    }

    // --- Admin Tests ---

    function test_SetTrustedServer_Success() public {
        address newServer = makeAddr("newServer");

        vm.prank(owner);
        escrow.setTrustedServer(newServer);
        assertEq(escrow.trustedGameServer(), newServer);
    }

    function test_SetTrustedServer_RevertIf_NotOwner() public {
        address newServer = makeAddr("newServer");

        vm.prank(outsider);
        vm.expectRevert();
        escrow.setTrustedServer(newServer);
    }
}
