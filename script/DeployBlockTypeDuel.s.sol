// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BlockTypeDuelEscrow} from "../src/BlockTypeDuelEscrow.sol";

contract DeployBlockTypeDuel is Script {
    function run() external returns (BlockTypeDuelEscrow escrow) {
        // Read private key or deployer credentials
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey != 0 ? vm.addr(deployerPrivateKey) : msg.sender;

        // Read trusted game server address from env, or default to deployer
        address trustedServer = vm.envOr("TRUSTED_SERVER_ADDRESS", deployer);

        console.log("--------------------------------------------------");
        console.log("Deploying BlockTypeDuelEscrow to Monad Testnet...");
        console.log("Deployer Address      :", deployer);
        console.log("Trusted Server Address:", trustedServer);
        console.log("Chain ID              :", block.chainid);
        console.log("--------------------------------------------------");

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        escrow = new BlockTypeDuelEscrow(trustedServer);

        vm.stopBroadcast();

        console.log("--------------------------------------------------");
        console.log("BlockTypeDuelEscrow Deployed Successfully!");
        console.log("Contract Address      :", address(escrow));
        console.log("--------------------------------------------------");
    }
}
