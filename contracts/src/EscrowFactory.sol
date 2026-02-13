// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Escrow} from "./Escrow.sol";

/**
 * @title EscrowFactory
 * @notice Deploys new TrustBridge Escrow contracts and tracks them.
 */
contract EscrowFactory {
    
    // Track all escrows deployed
    Escrow[] public allEscrows;
    
    // Mapping to see which contracts a user belongs to (Client or Freelancer)
    mapping(address => Escrow[]) public userEscrows;

    event EscrowCreated(address indexed escrowAddress, address indexed client, address indexed freelancer, uint256 amount);

    /**
     * @notice Deploy a new Escrow contract.
     * @param _freelancer Address of the freelancer.
     * @param _arbiter Address of the arbitrator (or arbitration contract).
     * @param _timeToDeadline Duration in seconds until deadline.
     */
    function createEscrow(
        address _freelancer,
        address _arbiter,
        uint256 _timeToDeadline
    ) external payable returns (address) {
        require(msg.value > 0, "Deposit must be > 0");
        require(_freelancer != address(0), "Invalid freelancer");

        Escrow newEscrow = new Escrow{value: msg.value}(
            msg.sender,     // Client (whoever calls this)
            _freelancer,
            _arbiter,
            msg.value,      // Amount
            _timeToDeadline // Deadline duration
        );

        allEscrows.push(newEscrow);
        userEscrows[msg.sender].push(newEscrow);
        userEscrows[_freelancer].push(newEscrow);

        emit EscrowCreated(address(newEscrow), msg.sender, _freelancer, msg.value);

        return address(newEscrow);
    }

    /**
     * @notice Get all escrows for a specific user (either as client or freelancer).
     */
    function getUserEscrows(address _user) external view returns (Escrow[] memory) {
        return userEscrows[_user];
    }
}
