// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Escrow} from "../src/Escrow.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    
    address public client = makeAddr("client");
    address public freelancer = makeAddr("freelancer");
    address public arbiter = makeAddr("arbiter");
    
    uint256 public constant AMOUNT = 1 ether;
    uint256 public constant DEADLINE = 7 days;

    function setUp() public {
        // Fund the client
        vm.deal(client, 10 ether);
        
        // Deploy Escrow as the client
        vm.prank(client);
        escrow = new Escrow(
            client,
            freelancer,
            arbiter,
            AMOUNT,
            DEADLINE
        );
    }

    function test_Deposit() public {
        vm.prank(client);
        escrow.deposit{value: AMOUNT}();
        
        assertEq(address(escrow).balance, AMOUNT);
        assertEq(uint256(escrow.status()), 1); // 1 = Active
    }

    function test_FullWorkflow() public {
        // 1. Client deposits
        vm.prank(client);
        escrow.deposit{value: AMOUNT}();

        // 2. Freelancer submits work
        vm.prank(freelancer);
        escrow.submitWork("QmHash123");
        
        // Verify state
        assertEq(escrow.deliverableIpfs(), "QmHash123");

        // 3. Client approves
        vm.prank(client);
        escrow.approve();

        // Verify funds moved
        assertEq(address(escrow).balance, 0);
        assertEq(freelancer.balance, AMOUNT);
        assertEq(uint256(escrow.status()), 2); // 2 = Completed
    }

    function test_DisputeAndResolve() public {
        // 1. Client deposits
        vm.prank(client);
        escrow.deposit{value: AMOUNT}();

        // 2. Dispute raised by Freelancer
        vm.prank(freelancer);
        escrow.dispute();

        assertEq(uint256(escrow.status()), 3); // 3 = Disputed

        // 3. Arbiter resolves in favor of Client (Refund)
        vm.prank(arbiter);
        escrow.resolveDispute(false); // false = refund client

        // Verify funds moved back to client
        assertEq(address(escrow).balance, 0);
        assertEq(client.balance, 10 ether); // Back to original
        assertEq(uint256(escrow.status()), 4); // 4 = Refunded
    }
}
