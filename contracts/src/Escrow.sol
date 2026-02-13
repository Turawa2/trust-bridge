// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TrustBridge Escrow
 * @author TrustBridge Team
 * @notice Holds funds for a freelancing job until deliverables are approved.
 */
contract Escrow is Ownable, ReentrancyGuard {
    
    /* ==================== STATE VARIABLES ==================== */

    enum ContractStatus { Pending, Active, Completed, Disputed, Refunded }

    address public client;
    address public freelancer;
    address public arbiter; // The entity resolving disputes (could be a contract)
    
    uint256 public amount;
    uint256 public deadline;
    
    string public deliverableIpfs; // Link to the work on IPFS
    
    ContractStatus public status;

    /* ==================== EVENTS ==================== */

    event Deposited(address indexed client, uint256 amount);
    event WorkSubmitted(string ipfsHash);
    event Approved(uint256 amount);
    event Disputed(address initiator);
    event Refunded(uint256 amount);

    /* ==================== CONSTRUCTOR ==================== */

    constructor(
        address _client,
        address _freelancer,
        address _arbiter,
        uint256 _amount,
        uint256 _timeToDeadline
    ) payable Ownable(_client) {
        require(_client != address(0) && _freelancer != address(0), "Invalid addresses");
        
        client = _client;
        freelancer = _freelancer;
        arbiter = _arbiter;
        amount = _amount;
        deadline = block.timestamp + _timeToDeadline;
        status = ContractStatus.Pending;
    }

    /* ==================== CORE FUNCTIONS ==================== */

    /**
     * @notice Client deposits funds to activate the escrow.
     */
    function deposit() external payable nonReentrant {
        require(msg.sender == client, "Only client can deposit");
        require(msg.value == amount, "Incorrect deposit amount");
        require(status == ContractStatus.Pending, "Contract not pending");

        status = ContractStatus.Active;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Freelancer submits work (IPFS hash).
     * @param _ipfsHash The IPFS CID of the uploaded work.
     */
    function submitWork(string calldata _ipfsHash) external {
        require(msg.sender == freelancer, "Only freelancer can submit");
        require(status == ContractStatus.Active, "Contract not active");
        require(block.timestamp <= deadline, "Deadline passed");

        deliverableIpfs = _ipfsHash;
        emit WorkSubmitted(_ipfsHash);
    }

    /**
     * @notice Client approves the work and releases funds to freelancer.
     */
    function approve() external nonReentrant {
        require(msg.sender == client, "Only client can approve");
        require(status == ContractStatus.Active, "Contract not active");
        require(bytes(deliverableIpfs).length > 0, "No work submitted");

        status = ContractStatus.Completed;
        
        // Transfer funds to freelancer
        (bool success, ) = payable(freelancer).call{value: address(this).balance}("");
        require(success, "Transfer failed");

        emit Approved(amount);
    }

    /**
     * @notice Either party can raise a dispute if things go wrong.
     */
    function dispute() external {
        require(msg.sender == client || msg.sender == freelancer, "Only participants can dispute");
        require(status == ContractStatus.Active, "Contract not active");

        status = ContractStatus.Disputed;
        emit Disputed(msg.sender);
    }

    /**
     * @notice Arbiter resolves the dispute.
     * @param _releaseToFreelancer True to pay freelancer, False to refund client.
     */
    function resolveDispute(bool _releaseToFreelancer) external nonReentrant {
        require(msg.sender == arbiter, "Only arbiter");
        require(status == ContractStatus.Disputed, "Not disputed");

        if (_releaseToFreelancer) {
            status = ContractStatus.Completed;
            (bool success, ) = payable(freelancer).call{value: address(this).balance}("");
            require(success, "Transfer failed");
            emit Approved(amount);
        } else {
            status = ContractStatus.Refunded;
            (bool success, ) = payable(client).call{value: address(this).balance}("");
            require(success, "Refund failed");
            emit Refunded(amount);
        }
    }
}
