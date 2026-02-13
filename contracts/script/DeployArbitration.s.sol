// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Arbitration.sol";

contract DeployArbitration is Script {
    function run() external {
        vm.startBroadcast();

        new Arbitration();

        vm.stopBroadcast();
    }
}
