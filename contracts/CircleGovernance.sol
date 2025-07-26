// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CircleGovernance is Ownable {
    enum ProposalType { WITHDRAWAL, DONATION, PARAM_CHANGE }
    
    struct Proposal {
        uint256 id;
        ProposalType pType;
        string title;
        string description;
        uint256 amount;
        address recipient;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => bool) voted;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    uint256 public votingPeriod = 3 days;
    address public factory;
    
    event ProposalCreated(uint256 id, ProposalType pType, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 id, bool result);
    
    constructor(address initialOwner, address _factoryAddress) Ownable(initialOwner) {
        factory = _factoryAddress;
    }
    
    function createProposal(
        ProposalType pType,
        string memory title,
        string memory description,
        uint256 amount,
        address recipient
    ) external {
        require(msg.sender == factory || msg.sender == owner(), "Not authorized");
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.pType = pType;
        p.title = title;
        p.description = description;
        p.amount = amount;
        p.recipient = recipient;
        p.deadline = block.timestamp + votingPeriod;
        
        emit ProposalCreated(proposalCount, pType, title);
    }

    function getProposal(uint256 id) external view returns (
        uint256, 
        ProposalType, 
        string memory, 
        string memory, 
        uint256, 
        address, 
        uint256, 
        uint256, 
        uint256, 
        bool
    ) {
        Proposal storage p = proposals[id];
        return (
            p.id,
            p.pType,
            p.title,
            p.description,
            p.amount,
            p.recipient,
            p.deadline,
            p.yesVotes,
            p.noVotes,
            p.executed
        );
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp <= p.deadline, "Voting ended");
        require(!p.voted[msg.sender], "Already voted");
        
        p.voted[msg.sender] = true;
        if (support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }
        emit Voted(proposalId, msg.sender, support);
    }
    
    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.deadline, "Voting ongoing");
        require(!p.executed, "Already executed");
        
        p.executed = true;
        bool passed = p.yesVotes > p.noVotes;
        
        if (passed) {
            // Treasury transfer would happen here
        }
        
        emit ProposalExecuted(proposalId, passed);
    }
}