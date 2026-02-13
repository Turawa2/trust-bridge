// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Escrow} from "./Escrow.sol";

/**
 * @title Arbitration
 * @notice Manages disputes and arbitrator selection.
 */
contract Arbitration {
    
    struct Dispute {
        address escrowAddress;
        address requester;
        uint256 votesForFreelancer;
        uint256 votesForClient;
        bool resolved;
        mapping(address => bool) hasVoted;
    }

    // Mapping from Escrow Address -> Dispute
    mapping(address => Dispute) public disputes;
    
    // List of allowed arbitrators (Simplified: Whitelist for now)
    address[] public arbitrators;
    mapping(address => bool) public isArbitrator;

    event DisputeStarted(address indexed escrow);
    event Voted(address indexed escrow, address indexed arbitrator, bool forFreelancer);
    event DisputeResolved(address indexed escrow, bool winnerFreelancer);

    constructor() {
        // Add deployer as initial arbitrator for testing
        _addArbitrator(msg.sender);
    }

    function _addArbitrator(address _arb) internal {
        if (!isArbitrator[_arb]) {
            arbitrators.push(_arb);
            isArbitrator[_arb] = true;
        }
    }

    /**
     * @notice Add a new arbitrator (Open access for demo purposes, usually restricted)
     */
    function registerAsArbitrator() external {
        _addArbitrator(msg.sender);
    }

    /**
     * @notice Cast a vote on a disputed contract.
     * @param _escrow The address of the Escrow contract.
     * @param _forFreelancer True = Pay Freelancer, False = Refund Client.
     */
    function vote(address _escrow, bool _forFreelancer) external {
        require(isArbitrator[msg.sender], "Not an arbitrator");
        
        Dispute storage d = disputes[_escrow];
        require(!d.resolved, "Already resolved");
        require(!d.hasVoted[msg.sender], "Already voted");

        d.hasVoted[msg.sender] = true;

        if (_forFreelancer) {
            d.votesForFreelancer++;
        } else {
            d.votesForClient++;
        }

        emit Voted(_escrow, msg.sender, _forFreelancer);

        // Simple Majority Check (Instant resolution for 1st vote in local verification)
        // In prod, check if votes > arbitrators.length / 2
        _resolve(_escrow, _forFreelancer); 
    }

    function _resolve(address _escrow, bool _forFreelancer) internal {
        Dispute storage d = disputes[_escrow];
        d.resolved = true;
        
        Escrow(_escrow).resolveDispute(_forFreelancer);
        
        emit DisputeResolved(_escrow, _forFreelancer);
    }
}
