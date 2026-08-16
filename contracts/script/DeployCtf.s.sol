// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ReentrantVault} from "../src/ReentrantVault.sol";

/**
 * Deploy the CTF ReentrantVault to **Base Sepolia** (SDD 03 §7). OWNER-provisioned: John
 * deploys + seeds the bounty; the deployed address is then wired to the Worker's CTF_VAULT
 * var for on-chain solve verification, and the /ctf flag flips on. The Attacker is NOT
 * deployed here — each visitor deploys their own from the browser (that IS the challenge).
 *
 * ⚠️ Base Sepolia ONLY — testnet, no real funds. Do not deploy to a mainnet.
 *
 *   SEED_WEI — optional bounty to pre-fund (plain send → un-credited prize). Default 0.
 *
 * Dry-run:  forge script script/DeployCtf.s.sol --rpc-url <base-sepolia> --sender <addr>
 * Broadcast: add --broadcast --private-key <key>  (John)
 */
contract DeployCtf is Script {
    function run() external returns (ReentrantVault vault) {
        uint256 seed = vm.envOr("SEED_WEI", uint256(0));

        vm.startBroadcast();
        vault = new ReentrantVault();
        if (seed > 0) {
            // Seed the drainable bounty via a plain send (hits receive(), credits no balance).
            (bool ok,) = address(vault).call{value: seed}("");
            require(ok, "seed failed");
        }
        vm.stopBroadcast();

        console2.log("ReentrantVault (Base Sepolia):", address(vault));
        console2.log("seeded bounty (wei):", seed);
    }
}
