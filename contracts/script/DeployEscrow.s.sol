// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MilestoneEscrow} from "../src/MilestoneEscrow.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * Deploy MilestoneEscrow. OWNER-PROVISIONED (SDD 03 §7): John deploys/funds; until then the
 * client escrow rail is feature-flagged off and degrades to book-a-call (FR-032). Reads its
 * inputs from env so no address is hardcoded:
 *   USDC_ADDRESS  — Base USDC (mainnet 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) or a
 *                   Base-Sepolia test USDC.
 *   ESCROW_OWNER  — the arbiter/owner wallet (defaults to the broadcasting deployer).
 *
 * Dry-run:  forge script script/DeployEscrow.s.sol --rpc-url <base> --sender <addr>
 * Broadcast: add --broadcast --private-key <key>  (John, at deal close)
 */
contract DeployEscrow is Script {
    function run() external returns (MilestoneEscrow escrow) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address owner = vm.envOr("ESCROW_OWNER", msg.sender);

        vm.startBroadcast();
        escrow = new MilestoneEscrow(IERC20(usdc), owner);
        vm.stopBroadcast();

        console2.log("MilestoneEscrow:", address(escrow));
        console2.log("USDC:", usdc);
        console2.log("owner/arbiter:", owner);
    }
}
