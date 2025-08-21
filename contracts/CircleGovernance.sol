// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IBadgeSystem.sol";
import "./interfaces/ICircleFactory.sol";

contract CircleGovernance is Ownable {
    enum ProposalType { WITHDRAWAL, DONATION, PARAM_CHANGE }
    
    struct Proposal {
        uint256 id;
        ProposalType pType;
        string title;
        string description;
        uint256 amount;
        address recipient;
        address proposer;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => bool) voted;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    uint256 public votingPeriod = 3 days;
    uint256 public constant EXECUTION_DELAY = 1 days;
    
    address public factory;
    address public badgeSystem;
    uint256 public circleId;
    
    event ProposalCreated(uint256 id, address indexed proposer, ProposalType pType, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 id, bool result);
    
    constructor(address initialOwner, address _factoryAddress) Ownable(initialOwner) {
        factory = _factoryAddress;
    }

    function setDependencies(uint256 _circleId, address _badgeSystem) external onlyOwner {
        require(circleId == 0, "Dependencies already set");
        circleId = _circleId;
        badgeSystem = _badgeSystem;
    }

    function acceptOwnership() external {
        _transferOwnership(msg.sender);
    }
    
    function createProposal(
        ProposalType pType,
        string memory title,
        string memory description,
        uint256 amount,
        address recipient
    ) external {
        require(ICircleFactory(factory).isCircleMember(circleId, msg.sender), "Not a circle member");
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.pType = pType;
        p.title = title;
        p.description = description;
        p.amount = amount;
        p.recipient = recipient;
        p.proposer = msg.sender;
        p.deadline = block.timestamp + votingPeriod;
        
        emit ProposalCreated(proposalCount, msg.sender, pType, title);
    }

    function getProposal(uint256 id) external view returns (uint256, ProposalType, string memory, string memory, uint256, address, address, uint256, uint256, uint256, bool) {
        Proposal storage p = proposals[id];
        return (p.id, p.pType, p.title, p.description, p.amount, p.recipient, p.proposer, p.deadline, p.yesVotes, p.noVotes, p.executed);
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp <= p.deadline, "Voting ended");
        require(!p.voted[msg.sender], "Already voted");
        require(ICircleFactory(factory).isCircleMember(circleId, msg.sender), "Not a circle member");
        
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
        require(block.timestamp > p.deadline + EXECUTION_DELAY, "Timelock active");
        require(!p.executed, "Already executed");
        
        p.executed = true;
        bool passed = p.yesVotes > p.noVotes;

        if (passed) {
            require(badgeSystem != address(0), "Badge system not set");
            IBadgeSystem(badgeSystem).mintBadge(circleId, p.proposer, 3);
        }
        
        emit ProposalExecuted(proposalId, passed);
    }
}